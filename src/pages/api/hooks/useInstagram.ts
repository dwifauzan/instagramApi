// hooks/useInstagram.ts
import { useState } from 'react'
import { instagramApi } from '@/pages/api/instagram'

export const useInstagram = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const login = async (name: string, username: string, password: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await instagramApi.login(name, username, password)
            if (!response.success) {
                setError(response.error)
                return null
            }
            return response.data
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'
            setError(errorMessage)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async (userId: number) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await instagramApi.logout(userId)
            return response.success
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'
            setError(errorMessage)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const checkSession = async (userId: number) => {
        try {
            const response = await instagramApi.checkSession(userId)
            return response.success && response.data?.isValid
        } catch (error) {
            console.error('Session check failed:', error)
            return false
        }
    }

    const search = async (keyword: string, username: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await instagramApi.search(keyword, username)
            if (!response.success) {
                setError(response.error)
                return null
            }
            return response.data
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'
            setError(errorMessage)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const getFeedsByUsername = async (
        pk: string | number,
        username: string,
        nextMaxId?: string
    ) => {
        try {
            const response = await instagramApi.getFeedsByUsername(
                pk,
                username,
                nextMaxId
            )
            return response
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'
            setError(errorMessage)
            return null
        }
    }

    const getFeedsByHashtag = async (
        query: string,
        username: string,
        nextMaxId?: string
    ) => {
        
        try {
            const response = await instagramApi.getFeedsByHashtag(
                query,
                username,
                nextMaxId
            )
            return response
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'
            setError(errorMessage)
            return null
        }
    }

    const getFeedsByLocation = async (
        locationId: string | number,
        username: string,
        nextMaxId?: string
    ) => {
        try {
            const response = await instagramApi.getFeedsByLocation(
                locationId,
                username,
                nextMaxId
            )
            return response
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'
            setError(errorMessage)
            return null
        }
    }

    return {
        login,
        logout,
        checkSession,
        search,
        getFeedsByUsername,
        getFeedsByHashtag,
        getFeedsByLocation,
        isLoading,
        error,
    }
}