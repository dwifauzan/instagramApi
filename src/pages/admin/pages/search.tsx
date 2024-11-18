import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Row, Col, Pagination, AutoComplete, Input, Card, Spin } from 'antd'
import debounce from 'lodash.debounce'
import { PageHeaders } from '@/components/page-headers'
import Image from 'next/image'
import { useNotification } from '../crud/axios/handler/error'
import { useRouter } from 'next/router'
import { useInstagram } from '@/hooks/useInstagram'
import { useCache } from '@/hooks/useCache'

type User = {
    pk: number
    full_name: string
    username: string
    profile_pic_url: string
}

type Hashtag = {
    id: string
    name: string
    formatted_media_count: string
}

type Location = {
    name: string
    address: string
    external_id: string | number
}

type AllSearchData = {
    users: User[]
    hashtags: Hashtag[]
    locations: Location[]
}

function SearchResult() {
    const { getCacheItem, setCacheItem } = useCache({
        prefix: 'search_',
        ttl: 60 * 60 * 1000,
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [allData, setAllData] = useState<AllSearchData>({
        users: [],
        hashtags: [],
        locations: [],
    })
    const [activeValue, setActiveValue] = useState('all')

    const [currentUsers, setCurrentUsers] = useState(1)
    const [currentHashtags, setCurrentHashtags] = useState(1)
    const [currentLocations, setCurrentLocations] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const { openNotificationWithIcon, contextHolder } = useNotification()
    const path = '/admin'

    const { search, isLoading, error } = useInstagram()

    const fetchSearchResults = useCallback(async (query: string) => {
        try {
            const cacheKey = `search_${query}`
            const cachedData = getCacheItem<AllSearchData>(cacheKey)

            if (cachedData) {
                setAllData(cachedData)
                return
            }

            const defaultAccount = localStorage.getItem('default')
            if (!defaultAccount) {
                openNotificationWithIcon(
                    'error',
                    'User tidak ditemukan',
                    'User tidak ditemukan, harap login kembali.'
                )
                throw new Error('User tidak ditemukan, harap login kembali.')
            }

            const searchResults = await search(query, defaultAccount)
            if (error) {
                openNotificationWithIcon(
                    'error',
                    'Failed to load search results',
                    error.includes('login_required')
                        ? 'Akun terkena chalenge'
                        : error
                )
            }
            setAllData(
                searchResults || {
                    users: [],
                    hashtags: [],
                    locations: [],
                }
            )
            setCacheItem(cacheKey, searchResults)
        } catch (error) {
            console.error('Failed to load search results:', error)
            openNotificationWithIcon('error', 'Failed to load', `${error}`)
        }
    }, [])

    const debouncedFetchSearchResults = useCallback(
        debounce(fetchSearchResults, 3000),
        [fetchSearchResults]
    )

    useEffect(() => {
        if (searchQuery) {
            debouncedFetchSearchResults(searchQuery)
        }
    }, [searchQuery, debouncedFetchSearchResults])

    const onSearch = (value: string) => {
        setSearchQuery(value)
    }

    const renderItem = (item: User | Hashtag | Location) => {
        if ('username' in item) {
            return (
                <Col key={item.pk} span={6} className="mb-4">
                    <Link href={`${path}/pages/blog/four?pk=${item.pk}`}>
                        <Card>
                            <div className="flex items-center space-x-4">
                                <Image
                                    width={50}
                                    height={50}
                                    className="rounded-full"
                                    src={item.profile_pic_url}
                                    alt={item.username}
                                />
                                <Card.Meta
                                    title={
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {item.full_name}
                                        </div>
                                    }
                                    description={`username: ${item.username}`}
                                />
                            </div>
                        </Card>
                    </Link>
                </Col>
            )
        } else if ('name' in item && 'formatted_media_count' in item) {
            return (
                <Col key={item.id} span={6} className="mb-4">
                    <Link href={`${path}/pages/blog/two?name=${item.name}`}>
                        <Card>
                            <div className="flex items-center space-x-4">
                                <img
                                    width={50}
                                    height={50}
                                    className="rounded-full"
                                    src="/hexadash-nextjs/hastag.jpg"
                                    alt="hashtag"
                                />
                                <Card.Meta
                                    title={
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            #{item.name}
                                        </div>
                                    }
                                    description={`Posts: ${item.formatted_media_count}`}
                                />
                            </div>
                        </Card>
                    </Link>
                </Col>
            )
        } else if ('address' in item) {
            return (
                <Col key={item.external_id} span={6} className="mb-4">
                    <Link
                        href={`${path}/pages/blog/one?locationId=${item.external_id}`}
                    >
                        <Card>
                            <div className="flex items-center space-x-4">
                                <img
                                    width={50}
                                    height={50}
                                    className="rounded-full"
                                    src="/hexadash-nextjs/locate.jpg"
                                    alt="location"
                                />
                                <Card.Meta
                                    title={
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {item.name}
                                        </div>
                                    }
                                    description={`Address: ${
                                        item.address || 'lokasi tidak ditemukan'
                                    }`}
                                />
                            </div>
                        </Card>
                    </Link>
                </Col>
            )
        }
        return null
    }

    return (
        <>
            {contextHolder}
            <PageHeaders
                title="Search Result"
                className="flex justify-between items-center bg-transparent px-8 py-4"
            />

            <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-8 xl:px-4 pb-12 ssm:pb-8">
                <Row gutter={25}>
                    <Col xs={24}>
                        <AutoComplete
                            className="w-1/2 search-result-wrapper h-12"
                            onSearch={onSearch}
                        >
                            <Input.Search
                                className="text-base"
                                size="large"
                                placeholder="Type and search"
                            />
                        </AutoComplete>
                    </Col>
                    <Col xs={24}>
                        <div className="mt-2 py-5">
                            <ul className="flex flex-wrap items-center mb-0">
                                {['all', 'tagar', 'location', 'account'].map(
                                    (value) => (
                                        <li
                                            key={value}
                                            className="ltr:mr-2 rtl:ml-2 mb-2"
                                        >
                                            <Link
                                                href="#"
                                                onClick={() =>
                                                    setActiveValue(value)
                                                }
                                                className={`px-4 py-1 text-sm font-medium rounded-md shadow ${
                                                    activeValue === value
                                                        ? 'bg-primary text-white'
                                                        : 'bg-white dark:bg-white/[.06] text-light dark:text-white/60'
                                                }`}
                                            >
                                                {value === 'all'
                                                    ? 'All'
                                                    : value === 'tagar'
                                                    ? 'Tagar'
                                                    : value === 'location'
                                                    ? 'Location'
                                                    : 'Account'}
                                            </Link>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </Col>
                    <Col xs={24}>
                        <div className="bg-white dark:bg-white/10 p-6 rounded-lg">
                            <div className="result-list-content">
                                {isLoading ? (
                                    <Spin tip="Loading..." />
                                ) : error ? (
                                    <p>Tidak ada data</p>
                                ) : (
                                    <Row gutter={12}>
                                        {activeValue === 'all' &&
                                            [
                                                ...allData.users,
                                                ...allData.hashtags,
                                                ...allData.locations,
                                            ]
                                                .slice(
                                                    (currentUsers - 1) *
                                                        pageSize,
                                                    currentUsers * pageSize
                                                )
                                                .map(renderItem)}

                                        {activeValue === 'tagar' &&
                                            allData.hashtags
                                                .slice(
                                                    (currentHashtags - 1) *
                                                        pageSize,
                                                    currentHashtags * pageSize
                                                )
                                                .map(renderItem)}

                                        {activeValue === 'location' &&
                                            allData.locations
                                                .slice(
                                                    (currentLocations - 1) *
                                                        pageSize,
                                                    currentLocations * pageSize
                                                )
                                                .map(renderItem)}

                                        {activeValue === 'account' &&
                                            allData.users
                                                .slice(
                                                    (currentUsers - 1) *
                                                        pageSize,
                                                    currentUsers * pageSize
                                                )
                                                .map(renderItem)}
                                    </Row>
                                )}
                            </div>
                            {activeValue === 'all' && (
                                <Pagination
                                    current={currentUsers}
                                    pageSize={pageSize}
                                    total={
                                        allData?.users.length +
                                        allData?.hashtags.length +
                                        allData?.locations.length
                                    }
                                    onChange={(page) => setCurrentUsers(page)}
                                    showSizeChanger
                                    onShowSizeChange={(current, size) =>
                                        setPageSize(size)
                                    }
                                />
                            )}
                            {activeValue === 'tagar' && (
                                <Pagination
                                    current={currentHashtags}
                                    pageSize={pageSize}
                                    total={allData.hashtags.length}
                                    onChange={(page) =>
                                        setCurrentHashtags(page)
                                    }
                                    showSizeChanger
                                    onShowSizeChange={(current, size) =>
                                        setPageSize(size)
                                    }
                                />
                            )}
                            {activeValue === 'location' && (
                                <Pagination
                                    current={currentLocations}
                                    pageSize={pageSize}
                                    total={allData.locations.length}
                                    onChange={(page) =>
                                        setCurrentLocations(page)
                                    }
                                    showSizeChanger
                                    onShowSizeChange={(current, size) =>
                                        setPageSize(size)
                                    }
                                />
                            )}
                            {activeValue === 'account' && (
                                <Pagination
                                    current={currentUsers}
                                    pageSize={pageSize}
                                    total={allData.users.length}
                                    onChange={(page) => setCurrentUsers(page)}
                                    showSizeChanger
                                    onShowSizeChange={(current, size) =>
                                        setPageSize(size)
                                    }
                                />
                            )}
                        </div>
                    </Col>
                </Row>
            </main>
        </>
    )
}

export default SearchResult
