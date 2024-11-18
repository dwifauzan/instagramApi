// lib/instagram-private-api/services/instagramAuthService.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { IgApiClient } from 'instagram-private-api'
import { instagramSessionService } from './instagramSessionService'
import { userInstagramService } from './userInstagramService'

export class InstagramAuthService {
    private ig: IgApiClient
    private prisma: Prisma.TransactionClient

    constructor(prismaTransaction?: Prisma.TransactionClient) {
        this.ig = new IgApiClient()
        this.prisma = prismaTransaction || new PrismaClient()
    }

    public async login(name: string, username: string, password: string) {
        try {
            // Check if user exists
            let user = await this.prisma.userInstagram.findUnique({
                where: { name },
                include: { session: true },
            })

            if (!user) {
                // Create new user if doesn't exist
                user = await this.prisma.userInstagram.create({
                    data: {
                        name,
                        username,
                        password,
                        status: 'pending',
                    },
                    include: { session: true },
                })
            }

            try {
                // Configure Instagram Private API
                this.ig.state.generateDevice(username)
                await this.ig.simulate.preLoginFlow()

                // Attempt login with Instagram
                const loggedInUser = await this.ig.account.login(
                    username,
                    password
                )
                const serialized = await this.ig.state.serialize()
                const cookieJar = await this.ig.state.serializeCookieJar()

                // Handle session
                const sessionData = {
                    userId: user.id,
                    session: JSON.stringify(serialized),
                    cookieJar: JSON.stringify(cookieJar),
                }

                let session
                if (user.session) {
                    session = await this.prisma.instagramSession.update({
                        where: { userId: user.id },
                        data: sessionData,
                    })
                } else {
                    session = await this.prisma.instagramSession.create({
                        data: sessionData,
                    })
                }

                // Update user status
                const updatedUser = await this.prisma.userInstagram.update({
                    where: { id: user.id },
                    data: { status: 'login' },
                    include: { session: true },
                })

                return {
                    success: true,
                    data: {
                        user: updatedUser,
                        session,
                    },
                }
            } catch (error) {
                // Update user status to reflect login failure
                await this.prisma.userInstagram.update({
                    where: { id: user.id },
                    data: { status: 'failed' },
                })
                throw error
            }
        } catch (error) {
            console.error('Login error:', error)
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Login failed. Please check your credentials.',
            }
        }
    }

    public async logout(userId: number): Promise<boolean> {
        const client = new PrismaClient()

        try {
            return await client.$transaction(async (tx) => {
                const session = await tx.instagramSession.findUnique({
                    where: { userId },
                    include: { user: true },
                })

                if (!session) {
                    throw new Error('No active session found')
                }

                // Load session into Instagram API
                this.ig.state.generateDevice(session.user.username)
                await this.ig.state.deserialize(JSON.parse(session.session))
                await this.ig.simulate.preLoginFlow()

                // Attempt to logout
                await this.ig.account.logout()

                // Delete session
                await tx.instagramSession.delete({
                    where: { userId },
                })

                // Update user status
                await tx.userInstagram.update({
                    where: { id: userId },
                    data: { status: 'logout' },
                })

                return true
            })
        } catch (error) {
            console.error('Logout error:', error)
            return false
        } finally {
            await client.$disconnect()
        }
    }

    public async checkSession(userId: number): Promise<boolean> {
        try {
            const session = await instagramSessionService.findByUserId(userId)
            if (!session) return false

            // Load session into Instagram API
            const user = await userInstagramService.findById(userId)
            if (!user) return false

            this.ig.state.generateDevice(user.username)
            await this.ig.state.deserialize(JSON.parse(session.session))

            // Try to make a simple API call to verify session
            await this.ig.account.currentUser()
            return true
        } catch (error) {
            console.error('Session check error:', error)
            return false
        }
    }
}