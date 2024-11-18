import { useState, useEffect, useRef } from 'react'

interface CacheOptions {
    ttl?: number // Time to live in milliseconds
    useSession?: boolean // Whether to also store in sessionStorage
    prefix?: string // Prefix for sessionStorage keys
}

interface CacheItem<T> {
    value: T
    timestamp: number
}

export class CacheService {
    private cache: Map<string, CacheItem<any>>
    private options: Required<CacheOptions>

    constructor(options: CacheOptions = {}) {
        this.cache = new Map()
        this.options = {
            ttl: options.ttl || 30 * 60 * 1000, // Default 30 minutes
            useSession: options.useSession ?? true,
            prefix: options.prefix || 'app_cache_',
        }

        // Load cache from sessionStorage on initialization
        if (this.options.useSession) {
            this.loadFromSession()
        }
    }

    // Set a value in cache
    set<T>(key: string, value: T): void {
        const item: CacheItem<T> = {
            value,
            timestamp: Date.now(),
        }

        this.cache.set(key, item)

        if (this.options.useSession) {
            try {
                sessionStorage.setItem(
                    this.options.prefix + key,
                    JSON.stringify(item)
                )
            } catch (error) {
                console.warn('Failed to save to sessionStorage:', error)
            }
        }
    }

    // Get a value from cache
    get<T>(key: string): T | null {
        const item = this.cache.get(key)

        if (!item) {
            // Try to get from sessionStorage if not in memory
            if (this.options.useSession) {
                return this.getFromSession<T>(key)
            }
            return null
        }

        // Check if cache has expired
        if (Date.now() - item.timestamp > this.options.ttl) {
            this.remove(key)
            return null
        }

        return item.value as T
    }

    // Remove a value from cache
    remove(key: string): void {
        this.cache.delete(key)
        if (this.options.useSession) {
            sessionStorage.removeItem(this.options.prefix + key)
        }
    }

    // Clear all cache
    clear(): void {
        this.cache.clear()
        if (this.options.useSession) {
            Object.keys(sessionStorage)
                .filter((key) => key.startsWith(this.options.prefix))
                .forEach((key) => sessionStorage.removeItem(key))
        }
    }

    getList(prefix: string): string[] {
        let list: string[] = []
        this.cache.forEach((_, key) => {
            if (key.startsWith(prefix)) {
                list.push(key.replace(prefix, ''))
            }
        })
        return list
    }

    // Get value from sessionStorage
    private getFromSession<T>(key: string): T | null {
        try {
            const item = sessionStorage.getItem(this.options.prefix + key)
            if (!item) return null

            const parsed = JSON.parse(item) as CacheItem<T>

            // Check if cache has expired
            if (Date.now() - parsed.timestamp > this.options.ttl) {
                this.remove(key)
                return null
            }

            // Restore to memory cache
            this.cache.set(key, parsed)
            return parsed.value
        } catch (error) {
            console.warn('Failed to read from sessionStorage:', error)
            return null
        }
    }

    // Load all valid cache from sessionStorage
    private loadFromSession(): void {
        try {
            Object.keys(sessionStorage)
                .filter((key) => key.startsWith(this.options.prefix))
                .forEach((key) => {
                    const rawItem = sessionStorage.getItem(key)
                    if (rawItem) {
                        const item = JSON.parse(rawItem) as CacheItem<any>
                        const actualKey = key.replace(this.options.prefix, '')

                        // Only load if not expired
                        if (Date.now() - item.timestamp <= this.options.ttl) {
                            this.cache.set(actualKey, item)
                        } else {
                            sessionStorage.removeItem(key)
                        }
                    }
                })
        } catch (error) {
            console.warn('Failed to load cache from sessionStorage:', error)
        }
    }
}

export function useCache(options?: CacheOptions) {
    const [cacheService] = useState(() => new CacheService(options))
    const cacheRef = useRef(cacheService)

    useEffect(() => {
        cacheRef.current = cacheService
    }, [cacheService])

    return {
        cache: cacheRef.current,

        // Wrapper methods for easier use in components
        setCacheItem: <T>(key: string, value: T) => {
            cacheRef.current.set(key, value)
        },

        getCacheItem: <T>(key: string): T | null => {
            return cacheRef.current.get<T>(key)
        },

        removeCacheItem: (key: string) => {
            cacheRef.current.remove(key)
        },

        clearCache: () => {
            cacheRef.current.clear()
        },
    }
}
