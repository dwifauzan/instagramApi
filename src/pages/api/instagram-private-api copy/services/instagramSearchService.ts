// lib/instagram-private-api/services/instagramSearchService.ts
import { Services } from './services'

export class InstagramSearchService extends Services {
    private async searchLocations(query: string) {
        return await this.ig.search.location(0, 0, query)
    }

    private async searchHashtags(query: string) {
        return await this.ig.search.tags(query)
    }

    private async searchUsers(query: string) {
        return await this.ig.search.users(query)
    }

    public async searchKeyword(keyword: string, userId: number) {
        try {
            await this.serialize(userId)

            // Perform searches
            const [locations, hashtags, users] = await Promise.all([
                this.searchLocations(keyword),
                this.searchHashtags(keyword),
                this.searchUsers(keyword),
            ])

            return {
                success: true,
                data: {
                    locations,
                    hashtags,
                    users,
                },
            }
        } catch (error) {
            console.error('Search error:', error)
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Search failed. Please try again.',
            }
        }
    }
}
