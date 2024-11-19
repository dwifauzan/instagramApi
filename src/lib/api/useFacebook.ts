// lib/api/instagram.ts
const API_BASE_URL = '/hexadash-nextjs/api/facebook-api'

export const facebookApi = {
    getUsers: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`)
            return response.json()
        } catch (error) {
            console.error('Failed to fetch users:', error)
            return { success: false, error: 'Failed to fetch users' }
        }
    },

    deleteUser: async (id: number) => {
        try {
            const reponse = await fetch(`${API_BASE_URL}/users/delete?=${id}`, {
                method: 'DELETE',
            })
            return { success: true }
        } catch (error) {
            console.log('Failed to fecth users', error)
            return { success: false, error: 'Failed to delete users' }
        }
    },
}
