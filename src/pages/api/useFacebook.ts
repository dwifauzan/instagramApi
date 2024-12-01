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

    deleteUser: async (selectedAccountId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/delete?id=${selectedAccountId}`, {
                method: 'DELETE',
            })
            return { success: true }
        } catch (error) {
            console.log('Failed to fecth users', error)
            return { success: false, error: 'Failed to delete users' }
        }
    },

    sinkronUser: async (selectedAccountId: number) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/users/sinkronFacebook?id=${selectedAccountId}`,
                { method: 'GET' } // Gunakan GET
            );
    
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to sync user');
            }
            const sendPuppeter = await fetch(`${API_BASE_URL}/sinkronPuppeteer`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            return { success: true};
        } catch (error) {
            console.error('Failed to fetch users', error);
            return { success: false, error: 'Failed to sync users' };
        }
    }
    
}
