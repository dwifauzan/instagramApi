// lib/api/instagram.ts
const API_BASE_URL = '/hexadash-nextjs/api/instagram-private-api'

export const instagramApi = {
    getUsers: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`)
            return response.json()
        } catch (error) {
            console.error('Failed to fetch users:', error)
            return { success: false, error: 'Failed to fetch users' }
        }
    },

    login: async (name: string, username: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, username, password }),
        })
        return response.json()
    },

    logout: async (userId: number) => {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        })
        return response.json()
    },

    checkSession: async (userId: number) => {
        const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        })
        return response.json()
    },

    search: async (keyword: string, username: string) => {
        const response = await fetch(`${API_BASE_URL}/search/keyword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword, username }),
        })
        return response.json()
    },

    getFeedsByUsername: async (pk: string | number, username: string, nextMaxId?: string) => {
        const response = await fetch(`${API_BASE_URL}/feeds/username`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pk, nextMaxId, username }),
        })
        return response.json()
    },

    getFeedsByHashtag: async (query: string, username: string, nextMaxId?: string) => {
        const response = await fetch(`${API_BASE_URL}/feeds/hashtag`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, nextMaxId, username }),
        })
        return response.json()
    },

    getFeedsByLocation: async (
        locationId: string | number,
        username: string,
        nextMaxId?: string
    ) => {
        const response = await fetch(`${API_BASE_URL}/feeds/location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ locationId, nextMaxId, username }),
        })
        return response.json()
    },
}
