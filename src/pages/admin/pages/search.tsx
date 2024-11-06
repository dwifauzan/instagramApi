import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Row, Col, Pagination, AutoComplete, Input, Card, Spin } from 'antd'
import debounce from 'lodash.debounce'
import { PageHeaders } from '@/components/page-headers'
import Image from 'next/image'
import { useNotification } from '../crud/axios/handler/error' // Import hook
import { useRouter } from 'next/router'
import axios from 'axios'

type Users = {
    pk: number
    full_name: string
    username: string
    profile_pic_url: string
}

type Hastag = {
    id: string
    name: string
    formatted_media_count: string
}

type Location = {
    name: string
    address: string
}

type AllSearchData = {
    users: Users[]
    hastags: Hastag[]
    locations: Location[]
}

function SearchResult() {
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [allData, setAllData] = useState<AllSearchData>({
        users: [],
        hastags: [],
        locations: [],
    })
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    // Pagination states for each category
    const [currentUsers, setCurrentUsers] = useState<number>(1)
    const [currentHashtags, setCurrentHashtags] = useState<number>(1)
    const [currentLocations, setCurrentLocations] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [activeValue, setActiveValue] = useState<string>('all')

    const { openNotificationWithIcon, contextHolder } = useNotification() // Use hook
    const router = useRouter()
    const path = '/admin'

    const fetchFeeds = useCallback(async (query: string) => {
        setLoading(true)
        try {
            const chache = sessionStorage.getItem(query)
            if (chache) {
                setTimeout(() => {
                    processAllSearchData(JSON.parse(chache))
                    setLoading(false)
                    return
                }, 1000)
            }
            console.log(localStorage.key(0))
            const token = localStorage.getItem(localStorage.key(0)!)

            if (!token) {
                // Jika token tidak ditemukan, lemparkan error
                openNotificationWithIcon(
                    'error',
                    'Token tidak ditemukan',
                    'Token tidak ditemukan, harap login kembali.'
                )
                throw new Error('Token tidak ditemukan, harap login kembali.')
            }

            const response = await axios.get(
                `http://192.168.18.45:5000/api/v1/search?q=${query}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            processAllSearchData(response.data.data)
            sessionStorage.setItem(query, JSON.stringify(response.data.data))
        } catch (error: any) {
            // Tangkap dan tampilkan pesan error
            console.log(error)
            if (
                error.response &&
                error.response.data &&
                error.response.data.message.includes('Session not found')
            ) {
                localStorage.setItem(localStorage.key(1)!, 'expired')
            }
            setError(error.message || 'Error, cobalah reload halaman ini')
        } finally {
            setLoading(false)
        }
    }, [])

    const debouncedFetchFeeds = useCallback(debounce(fetchFeeds, 3000), [
        fetchFeeds,
    ])

    useEffect(() => {
        if (searchQuery) {
            debouncedFetchFeeds(searchQuery)
        } else {
            setAllData({ users: [], hastags: [], locations: [] })
        }
    }, [searchQuery, debouncedFetchFeeds])

    const onSearch = (value: string) => {
        if (value) {
        }
        setSearchQuery(value)
    }

    const processAllSearchData = (data: AllSearchData) => {
        setAllData({
            users: data.users,
            hastags: data.hastags,
            locations: data.locations,
        })
    }

    return (
        <>
            {contextHolder}
            <PageHeaders
                title="Search Result"
                className="flex justify-between items-center bg-transparent px-8 py-[18px]"
            />

            <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-8 xl:px-[15px] pb-[50px] ssm:pb-[30px]">
                <Row gutter={25}>
                    <Col xs={24}>
                        <AutoComplete
                            className="w-1/2 search-result-wrapper h-[50px]"
                            onSearch={onSearch}
                        >
                            <Input.Search
                                className="text-[15px]"
                                size="large"
                                placeholder="Type and search"
                            />
                        </AutoComplete>
                    </Col>
                    <Col xs={24}>
                        <div className="mt-[9px] py-[22px]">
                            <ul className="flex flex-wrap items-center mb-0">
                                <li className="ltr:mr-[10px] rtl:ml-[10px] mb-[10px]">
                                    <Link
                                        href="#"
                                        onClick={() => setActiveValue('all')}
                                        className={`px-[15px] py-[5px] text-13 font-medium rounded-[5px] shadow-[0_3px_6px rgba(116,116,116,0.02)] ${
                                            activeValue === 'all'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-white/[.06] text-light dark:text-white/60'
                                        }`}
                                    >
                                        All
                                    </Link>
                                </li>
                                <li className="ltr:mr-[10px] rtl:ml-[10px] mb-[10px]">
                                    <Link
                                        href="#"
                                        onClick={() => setActiveValue('tagar')}
                                        className={`px-[15px] py-[5px] text-13 font-medium rounded-[5px] shadow-[0_3px_6px rgba(116,116,116,0.02)] ${
                                            activeValue === 'tagar'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-white/[.06] text-light dark:text-white/60'
                                        }`}
                                    >
                                        Tagar
                                    </Link>
                                </li>
                                <li className="ltr:mr-[10px] rtl:ml-[10px] mb-[10px]">
                                    <Link
                                        href="#"
                                        onClick={() =>
                                            setActiveValue('location')
                                        }
                                        className={`px-[15px] py-[5px] text-13 font-medium rounded-[5px] shadow-[0_3px_6px rgba(116,116,116,0.02)] ${
                                            activeValue === 'location'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-white/[.06] text-light dark:text-white/60'
                                        }`}
                                    >
                                        Location
                                    </Link>
                                </li>
                                <li className="ltr:mr-[10px] rtl:ml-[10px] mb-[10px]">
                                    <Link
                                        href="#"
                                        onClick={() =>
                                            setActiveValue('account')
                                        }
                                        className={`px-[15px] py-[5px] text-13 font-medium rounded-[5px] shadow-[0_3px_6px rgba(116,116,116,0.02)] ${
                                            activeValue === 'account'
                                                ? 'bg-primary text-white'
                                                : 'bg-white dark:bg-white/[.06] text-light dark:text-white/60'
                                        }`}
                                    >
                                        Account
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </Col>
                    <Col xs={24}>
                        <div className="bg-white dark:bg-white/10 p-[25px] rounded-[10px]">
                            <div className="result-list-content">
                                {loading ? (
                                    <Spin tip="Loading..." />
                                ) : error ? (
                                    <p>{error}</p>
                                ) : (
                                    <Row gutter={12}>
                                        {/* Render All when 'all' is active */}
                                        {activeValue === 'all' &&
                                            [
                                                ...allData.users,
                                                ...allData.hastags,
                                                ...allData.locations,
                                            ]
                                                .slice(
                                                    (currentUsers - 1) *
                                                        pageSize,
                                                    currentUsers * pageSize
                                                )
                                                .map((item, index) => {
                                                    if ('username' in item) {
                                                        // User
                                                        return (
                                                            <Col
                                                                key={item.pk}
                                                                span={6}
                                                                className="mb-[16px]"
                                                            >
                                                                <Card>
                                                                    <div className="flex items-center space-x-4">
                                                                        <Image
                                                                            width="50"
                                                                            height="50"
                                                                            className="rounded-full"
                                                                            src={
                                                                                item.profile_pic_url
                                                                            }
                                                                            alt={
                                                                                item.username
                                                                            }
                                                                        />
                                                                        <Card.Meta
                                                                            title={
                                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                                    {
                                                                                        item.full_name
                                                                                    }
                                                                                </div>
                                                                            }
                                                                            description={`username: ${item.username}`}
                                                                        />
                                                                    </div>
                                                                </Card>
                                                            </Col>
                                                        )
                                                    } else if (
                                                        'name' in item &&
                                                        'formatted_media_count' in
                                                            item
                                                    ) {
                                                        // Hashtag
                                                        return (
                                                            <Col
                                                                key={item.id}
                                                                span={6}
                                                                className="mb-[16px]"
                                                            >
                                                                <Card>
                                                                    <div className="flex items-center space-x-4">
                                                                        <img
                                                                            width="50"
                                                                            height="50"
                                                                            className="rounded-full"
                                                                            src="/hexadash-nextjs/locate.jpg"
                                                                            alt="location image"
                                                                        />
                                                                        <Card.Meta
                                                                            title={
                                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                                    #
                                                                                    {
                                                                                        item.name
                                                                                    }
                                                                                </div>
                                                                            }
                                                                            description={`Posts: ${item.formatted_media_count}`}
                                                                        />
                                                                    </div>
                                                                </Card>
                                                            </Col>
                                                        )
                                                    } else if (
                                                        'address' in item
                                                    ) {
                                                        // Location
                                                        return (
                                                            <Col
                                                                key={item.name}
                                                                span={6}
                                                                className="mb-[16px]"
                                                            >
                                                                <Card>
                                                                    <div className="flex items-center space-x-4">
                                                                        <img
                                                                            width={
                                                                                50
                                                                            }
                                                                            height={
                                                                                50
                                                                            }
                                                                            className="rounded-full"
                                                                            src="/hexadash-nextjs/hastag.jpg"
                                                                            alt="location image"
                                                                        />
                                                                        <Card.Meta
                                                                            title={
                                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                                    {
                                                                                        item.name
                                                                                    }
                                                                                </div>
                                                                            }
                                                                            description={`Address: ${item.address}`}
                                                                        />
                                                                    </div>
                                                                </Card>
                                                            </Col>
                                                        )
                                                    }
                                                    return null
                                                })}

                                        {/* Render specific sections based on activeValue */}
                                        {activeValue === 'tagar' &&
                                            allData.hastags
                                                .slice(
                                                    (currentHashtags - 1) *
                                                        pageSize,
                                                    currentHashtags * pageSize
                                                )
                                                .map((hashtags) => (
                                                    <Col
                                                        key={hashtags.id}
                                                        span={6}
                                                        className="mb-[16px]"
                                                    >
                                                        <Link
                                                            href={`${path}/pages/blog/two?name=${hashtags.name}`}
                                                        >
                                                            <Card>
                                                                <div className="flex items-center space-x-4">
                                                                    <img
                                                                        width="50"
                                                                        height="50"
                                                                        className="rounded-full"
                                                                        src="/hexadash-nextjs/hastag.jpg"
                                                                        alt="location image"
                                                                    />
                                                                    <Card.Meta
                                                                        title={
                                                                            <div className="text-ssm font-medium text-gray-900 truncate">
                                                                                #
                                                                                {
                                                                                    hashtags.name
                                                                                }
                                                                            </div>
                                                                        }
                                                                        description={`Posts: ${hashtags.formatted_media_count}`}
                                                                    />
                                                                </div>
                                                            </Card>
                                                        </Link>
                                                    </Col>
                                                ))}

                                        {activeValue === 'location' &&
                                            allData.locations
                                                .slice(
                                                    (currentLocations - 1) *
                                                        pageSize,
                                                    currentLocations * pageSize
                                                )
                                                .map((locations) => (
                                                    <Col
                                                        key={locations.name}
                                                        span={6}
                                                        className="mb-[16px]"
                                                    >
                                                        <Card>
                                                            <div className="flex items-center space-x-4">
                                                                <img
                                                                    width={50}
                                                                    height={50}
                                                                    className="/hexadash-nextjs/locate.jpg"
                                                                    alt="location image"
                                                                />
                                                                <Card.Meta
                                                                    title={
                                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                                            {
                                                                                locations.name
                                                                            }
                                                                        </div>
                                                                    }
                                                                    description={`Address: ${
                                                                        locations.address ||
                                                                        'lokasi tidak ditemukan'
                                                                    }`}
                                                                />
                                                            </div>
                                                        </Card>
                                                    </Col>
                                                ))}

                                        {activeValue === 'account' &&
                                            allData.users
                                                .slice(
                                                    (currentUsers - 1) *
                                                        pageSize,
                                                    currentUsers * pageSize
                                                )
                                                .map((user) => (
                                                    <Col
                                                        key={user.pk}
                                                        span={6}
                                                        className="mb-[16px]"
                                                    >
                                                        <Link
                                                            href={`${path}/pages/blog/four?pk=${user.pk}`}
                                                        >
                                                            <Card>
                                                                <div className="flex items-center space-x-4">
                                                                    <Image
                                                                        width="50"
                                                                        height="50"
                                                                        className="rounded-full"
                                                                        src={
                                                                            user.profile_pic_url
                                                                        }
                                                                        alt={
                                                                            user.username
                                                                        }
                                                                    />
                                                                    <Card.Meta
                                                                        title={
                                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                                {
                                                                                    user.full_name
                                                                                }
                                                                            </div>
                                                                        }
                                                                        description={`username: ${user.username}`}
                                                                    />
                                                                </div>
                                                            </Card>
                                                        </Link>
                                                    </Col>
                                                ))}
                                    </Row>
                                )}
                            </div>
                            {/* Separate Pagination for each category */}
                            {activeValue === 'all' && (
                                <Pagination
                                    current={currentUsers}
                                    pageSize={pageSize}
                                    total={
                                        allData.users.length +
                                        allData.hastags.length +
                                        allData.locations.length
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
                                    total={allData.hastags.length}
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