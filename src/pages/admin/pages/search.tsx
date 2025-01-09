import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Row, Col, Pagination, AutoComplete, Input, Card, Spin, Modal } from 'antd'
import debounce from 'lodash.debounce'
import { PageHeaders } from '@/components/page-headers'
import Image from 'next/image'
import useNotification from '../crud/axios/handler/error'
import { useRouter } from 'next/router'

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
    const [searchQuery, setSearchQuery] = useState('')
    const [allData, setAllData] = useState<AllSearchData>({
        users: [],
        hashtags: [],
        locations: [],
    })
    const [activeValue, setActiveValue] = useState('all')
    const [nextMaxPage, setNextMaxPage] = useState<string | null>(null)
    const [currentUsers, setCurrentUsers] = useState(1)
    const [currentHashtags, setCurrentHashtags] = useState(1)
    const [currentLocations, setCurrentLocations] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [isloading, setIsLoading] = useState(false)
    const [error, setError] = useState()
    const path = '/admin'
    const router = useRouter()
    const { openNotificationWithIcon, contextHolder } = useNotification()
    const [isLoginProcessing, setIsLoginProcessing] = useState(false);

    const fetchSearchResults = useCallback(async (query: string) => {
        setIsLoading(true)
        try {
            const defaultAccount = localStorage.getItem('default')
            if (!defaultAccount) {
                openNotificationWithIcon(
                    'error',
                    'User tidak ditemukan',
                    'User tidak ditemukan, harap login kembali.'
                )
                throw new Error('User tidak ditemukan, harap login kembali.')
            }
            console.log(defaultAccount)
            const dataSearch = {
                defaultAccount,
                query
            }
            const searchResults = await (window as any).electron.search(dataSearch)
            console.log(searchResults.data)
            const sanitizedData = {
                users: Array.isArray(searchResults?.data?.users) ? searchResults.data.users : [],
                hashtags: Array.isArray(searchResults?.data?.hashtags) ? searchResults.data.hashtags : [],
                locations: Array.isArray(searchResults?.data?.locations) ? searchResults.data.locations : [],
            }
            
            console.log('Sanitized data:', sanitizedData)
            setAllData(sanitizedData)
        } catch (error) {
            console.error('Failed to load search results:', error)
            openNotificationWithIcon('error', 'Failed to load', `${error}`)
            setAllData({
                users: [],
                hashtags: [],
                locations: [],
            })
        } finally {
            setIsLoading(false)
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

    const hashtags = async (name: string) => {
        console.log('Hashtag clicked:', name) // Tambahkan log
        setIsLoginProcessing(true)
        try {
            const defaultAccount = localStorage.getItem('default')
            if (!defaultAccount) {
                openNotificationWithIcon(
                    'error',
                    'User tidak ditemukan',
                    'User tidak ditemukan, harap login kembali.'
                )
                return
            }
            const dataHastags = {
                query: name as string,
                username: defaultAccount,
                nextMaxId: nextMaxPage ?? undefined
            }
            const response = await (window as any).electron.getFeedsByHastag(dataHastags)
            const messageString = JSON.stringify(response)
            const objectMessage = JSON.parse(messageString)
            console.log('ini error response ', objectMessage);
            if (objectMessage !== 200) {
                openNotificationWithIcon(
                    'error',
                    'failed to get feeds',
                    objectMessage.error
                )
                setIsLoginProcessing(false)
            }

            if (!response.data.feeds?.length) {
                openNotificationWithIcon(
                    'error',
                    'No more feeds',
                    'All feeds have been loaded'
                )
                setIsLoginProcessing(false)
                return
            }
            console.log('ini adalah hasil riset hastags : ', response.data)
            await router.push({
                pathname: '/admin/pages/blog/two',
                query: { name, response: JSON.stringify(response) }
            })
        } catch (error) {
            console.error('Navigation error:', error)
            setIsLoginProcessing(false)
        }finally{
            setIsLoading(false)
        }
    }

    const getFeedsByUsername = async (pk: string | number, username: string) => {
        console.log('Username clicked:', pk) // Tambahkan log
        try {
            setIsLoginProcessing(true)
            const defaultAccount = localStorage.getItem('default')
            if (!defaultAccount) {
                openNotificationWithIcon(
                    'error',
                    'User tidak ditemukan',
                    'User tidak ditemukan, harap login kembali.'
                )
                return
            }
            const dataAccount = {
                pk: pk as string,
                username: defaultAccount,
                nextMaxId: nextMaxPage ?? undefined
            }
            const response = await (window as any).electron.getFeedsByUsername(dataAccount);
            const messageString = JSON.stringify(response)
            const objectMessage = JSON.parse(messageString)
            if (objectMessage !== 200) {
                openNotificationWithIcon(
                    'error',
                    'failed to get feeds',
                    objectMessage.error
                )
                setIsLoginProcessing(false)
            }

            if (!response.data.feeds?.length) {
                openNotificationWithIcon(
                    'error',
                    'No more feeds',
                    'All feeds have been loaded'
                )
                setIsLoginProcessing(false)
                return
            }
            console.log('ini adalah hasil riset hastags : ', response.data)
          
            await router.push({
                pathname: '/admin/pages/blog/four',
                query: { pk, username, response: JSON.stringify(response) }
            })
        } catch (error) {
            setIsLoginProcessing(false)
            console.error('Navigation error:', error)
        }
    }

    const getFeedsByLocation = async (locationId: string | number) => {
        console.log('Location clicked:', locationId) // Tambahkan log
        try {
            setIsLoginProcessing(true)
            const defaultAccount = localStorage.getItem('default')
            if (!defaultAccount) {
                openNotificationWithIcon(
                    'error',
                    'User tidak ditemukan',
                    'User tidak ditemukan, harap login kembali.'
                )
                return
            }
            const dataLocation = {
                locationId: locationId as string,
                username: defaultAccount,
                nextMaxId: nextMaxPage ?? undefined
            }
    
            const response = await (window as any).electron.getFeedsByLocation(dataLocation);
            const messageString = JSON.stringify(response)
            const objectMessage = JSON.parse(messageString)
            if (objectMessage !== 200) {
                openNotificationWithIcon(
                    'error',
                    'failed to get feeds',
                    objectMessage.error
                )
                setIsLoginProcessing(false)
            }

            if (!response.data.feeds?.length) {
                openNotificationWithIcon(
                    'error',
                    'No more feeds',
                    'All feeds have been loaded'
                ) 
                setIsLoginProcessing(false)
                return
            }
            console.log('ini adalah hasil riset hastags : ', response.data)
            await router.push({
                pathname: '/admin/pages/blog/one',
                query: { locationId, response: JSON.stringify(response) }
            })
        } catch (error) {
            console.error('Navigation error:', error)
        }
    }

    const renderItem = (item: User | Hashtag | Location) => {
        if ('username' in item) {
            return (
                <Col key={item.pk} span={6} className="mb-4">
                   <div className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-all" onClick={() => getFeedsByUsername(item.pk, item.username)}>
                    <div className="flex items-center space-x-4">
                        <img
                            width={50}
                            height={50}
                            className="rounded-full"
                            src={item.profile_pic_url}
                            alt={item.username}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e: any) => {
                                e.target.src = '/hexadash-nextjs/avatar-default.jpg'
                            }}
                        />
                        <div>
                            <div className="text-sm font-medium text-gray-900 truncate">
                                {item.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                                username: {item.username}
                            </div>
                        </div>
                    </div>
                </div>
                </Col>
            )
        } else if ('name' in item && 'formatted_media_count' in item) {
            return (
                <Col key={item.id} span={6} className="mb-4">
                    <div 
                        onClick={() => hashtags(item.name)}
                        className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-all"
                    >
                        <div className="flex items-center space-x-4">
                            <img
                                width={50}
                                height={50}
                                className="rounded-full"
                                src="https://img.freepik.com/free-vector/young-people-with-hashtag-symbol_23-2148115234.jpg?t=st=1733113188~exp=1733116788~hmac=9ee91fdbc9ae9b19a9a3fa9830f3ea40abfe5c400b08362962dc3371337ba6d5&w=740"
                                alt="hashtag"
                            />
                            <div>
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    #{item.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Posts: {item.formatted_media_count}
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>
            )
        } else if ('address' in item) {
            return (
                <Col key={item.external_id} span={6} className="mb-4">
                    <div className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-all" onClick={() => getFeedsByLocation(item.external_id)}>
                    <div className="flex items-center space-x-4">
                        <img
                            width={50}
                            height={50}
                            className="rounded-full"
                            src="https://img.freepik.com/free-vector/location_53876-25530.jpg?t=st=1733113216~exp=1733116816~hmac=c1660bd0992212da1728efc16ac4b49a5bbf322ab39983b9ce046bfb13370f91&w=740"
                            alt="location"
                        />
                        <div>
                            <div className="text-sm font-medium text-gray-900 truncate">
                                {item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                                Address: {item.address || 'lokasi tidak ditemukan'}
                            </div>
                        </div>
                    </div>
                </div>
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
                                {isloading ? (
                                    <Spin tip="Loading..." />
                                ) : error ? (
                                    <p>Tidak ada data</p>
                                ) : (
                                    <Row gutter={12}>
                                    {activeValue === 'all' && Array.isArray(allData.users) && Array.isArray(allData.hashtags) && Array.isArray(allData.locations) && (
                                        [...allData.users, ...allData.hashtags, ...allData.locations]
                                            .slice((currentUsers - 1) * pageSize, currentUsers * pageSize)
                                            .map(renderItem)
                                    )}
                                
                                    {activeValue === 'tagar' && Array.isArray(allData.hashtags) && (
                                        allData.hashtags
                                            .slice((currentHashtags - 1) * pageSize, currentHashtags * pageSize)
                                            .map(renderItem)
                                    )}
                                
                                    {activeValue === 'location' && Array.isArray(allData.locations) && (
                                        allData.locations
                                            .slice((currentLocations - 1) * pageSize, currentLocations * pageSize)
                                            .map(renderItem)
                                    )}
            
                                    {activeValue === 'account' && Array.isArray(allData.users) && (
                                        allData.users
                                            .slice((currentUsers - 1) * pageSize, currentUsers * pageSize)
                                            .map(renderItem)
                                    )}
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

                <Modal
                    open={isLoginProcessing}
                    footer={null}
                    closable={false}
                    centered
                    width={400}
                    className="p-0"
                >
                    <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                        <Spin size="large" className="mb-6" />
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            Processing Request
                        </h2>
                        <div className="space-y-2 text-gray-600">
                            <p className="text-base">
                                Scraper to Instagram...
                            </p>
                            <p className="text-sm">
                                Please wait while we process your request
                            </p>
                        </div>
                        <div className="mt-6 w-full max-w-xs bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </Modal>
            </main>
        </>
    )
}

export default SearchResult
