import { IgApiClient } from "instagram-private-api";
import { instagramSessionService } from "./instagramSessionService";
import { Prisma, PrismaClient } from "@prisma/client";

export class Services {
    protected ig: IgApiClient
    protected prisma: Prisma.TransactionClient
    constructor(prismaTransaction?: Prisma.TransactionClient) {
        this.ig = new IgApiClient()
        this.prisma = prismaTransaction || new PrismaClient()
    }

    protected async serialize(userId: number) {
        const session = await instagramSessionService.findByUserId(userId)
            if (!session) {
                throw new Error('No active session found')
            }

            // Load session into Instagram API
            await this.ig.state.deserialize(JSON.parse(session.session))
            await this.ig.state.deserializeCookieJar(JSON.parse(session.cookieJar))
    }
}