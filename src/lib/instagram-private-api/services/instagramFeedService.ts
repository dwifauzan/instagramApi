// lib/instagram-private-api/services/instagramSearchService.ts
import { Services } from './services'

interface MediaItem {
    mediaType: string // photo, video, or carousel
    url: string
}

interface Feed {
    id: string
    mediaItems: MediaItem[] // Multiple media items for carousel
    mediaType: number
    caption: string
    likeCount: number
    commentCount: number
    takenAt: Date
}

export class InstagramFeedService extends Services {
    public async searchLocations(query: string) {
        return await this.ig.search.location(0, 0, query)
    }

    public async searchHashtags(query: string) {
        return await this.ig.search.tags(query)
    }

    public async searchUsers(query: string) {
        return await this.ig.search.users(query)
    }

    async getFeedsByUsername(
        pk: string | number,
        userId: number,
        nextMaxId?: string // Parameter untuk pagination
    ): Promise<any> {
        try {
            await this.serialize(userId)

            const userFeed = this.ig.feed.user(pk)

            if (nextMaxId) {
                // Set nextMaxId dari pagination sebelumnya
                userFeed['nextMaxId'] = nextMaxId
            }

            const response = await userFeed.request() // Ambil seluruh respons feed
            const posts = response.items // Ambil item feed dari respons
            const nextPageMaxId = response.next_max_id // Dapatkan nextMaxId dari respons
            const result = await this.mapPosts(posts)

            return {
                success: true,
                feeds: result,
                nextMaxId: nextPageMaxId, // Return nextMaxId untuk pagination
            }
        } catch (err: any) {
            return {
                success: false,
                error:
                    err instanceof Error
                        ? err.message
                        : 'Search failed. Please try again.',
            }
        }
    }

    async getFeedsByHastag(query: string, userId: number,nextMaxId?: string): Promise<any> {
        try {
            await this.serialize(userId)

            const feeds = this.ig.feed.tags(query)

            if (nextMaxId) {
                // Set nextMaxId dari pagination sebelumnya
                feeds['nextMaxId'] = nextMaxId
            }

            const response = await feeds.request() // Ambil seluruh respons feed lokasi
            const sections = response.sections || [] // Pastikan sections adalah array, walau kosong

            // Ekstrak media dari sections
            const posts = sections.flatMap((section) => {
                // Cek apakah layout_content dan medias ada sebelum mengaksesnya
                if (section.layout_content && section.layout_content.medias) {
                    return section.layout_content.medias.map(
                        (media) => media.media
                    ) // Ekstrak media dari tiap section
                }
                return [] // Jika tidak ada layout_content atau medias, return array kosong
            })

            const nextPageMaxId = response.next_max_id || null // Dapatkan nextMaxId untuk pagination berikutnya
            const result = await this.mapPosts(posts) // Mapping postingan untuk output

            return {
                success: true,
                feeds: result,
                nextMaxId: nextPageMaxId, // Return nextMaxId untuk pagination
            }
        } catch (err: any) {
            return {
                success: false,
                error:
                    err instanceof Error
                        ? err.message
                        : 'Search failed. Please try again.',
            }
        }
    }

    async getFeedsByLocation(
        locationId: string | number,
        userId: number,
        nextMaxId?: string // Parameter untuk pagination
    ): Promise<any> {
        try {
            await this.serialize(userId)

            const locationFeed = this.ig.feed.location(locationId)

            if (nextMaxId) {
                // Set nextMaxId untuk pagination
                locationFeed['nextMaxId'] = nextMaxId
            }

            const response = await locationFeed.request() // Ambil seluruh respons feed lokasi
            const sections = response.sections || [] // Pastikan sections adalah array, walau kosong

            // Ekstrak media dari sections
            const posts = sections.flatMap((section) => {
                // Cek apakah layout_content dan medias ada sebelum mengaksesnya
                if (section.layout_content && section.layout_content.medias) {
                    return section.layout_content.medias.map(
                        (media) => media.media
                    ) // Ekstrak media dari tiap section
                }
                return [] // Jika tidak ada layout_content atau medias, return array kosong
            })

            const nextPageMaxId = response.next_max_id || null // Dapatkan nextMaxId untuk pagination berikutnya
            const result = await this.mapPosts(posts) // Mapping postingan untuk output

            return {
                success: true,
                feeds: result,
                nextMaxId: nextPageMaxId, // Return nextMaxId untuk pagination
            }
        } catch (err: any) {
            return {
                success: false,
                error:
                    err instanceof Error
                        ? err.message
                        : 'Search failed. Please try again.',
            }
        }
    }

    private async mapMediaItems(media: any): Promise<MediaItem[]> {
        const mediaItems: MediaItem[] = []
        if (media.media_type === 1) {
            // Foto tunggal
            mediaItems.push({
                mediaType: 'photo',
                url: media.image_versions2?.candidates[0]?.url || '',
            })
        } else if (media.media_type === 2) {
            // Video tunggal
            mediaItems.push({
                mediaType: 'video',
                url: media.video_versions[0]?.url || '',
            })
        } else if (media.media_type === 8) {
            // Carousel (slide)
            for (const carouselItem of media.carousel_media) {
                if (carouselItem.media_type === 1) {
                    mediaItems.push({
                        mediaType: 'photo',
                        url:
                            carouselItem.image_versions2?.candidates[0]?.url ||
                            '',
                    })
                } else if (carouselItem.media_type === 2) {
                    mediaItems.push({
                        mediaType: 'video',
                        url: carouselItem.video_versions[0]?.url || '',
                    })
                }
            }
        }
        return mediaItems
    }

    private async mapPosts(posts: any[]): Promise<Feed[]> {
        const mappedPosts = []
        for (const post of posts) {
            if (!post || !post.id) continue
            mappedPosts.push({
                id: post.id,
                mediaItems: await this.mapMediaItems(post),
                mediaType: post.media_type,
                caption: post.caption?.text || '',
                likeCount: post.like_count || 0,
                commentCount: post.comment_count || 0,
                takenAt: new Date(post.taken_at * 1000),
            })
        }
        return mappedPosts
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
