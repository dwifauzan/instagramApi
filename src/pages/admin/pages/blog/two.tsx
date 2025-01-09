import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import {
    Checkbox,
    Button,
    Carousel,
    Col,
    Modal,
    Progress,
    Row,
    Spin,
    Select,
    Input,
} from 'antd'
import { UilFile, UilHeart, UilRepeat } from '@iconscout/react-unicons'
import { PageHeaders } from '@/components/page-headers'
import useNotification from '../../crud/axios/handler/error'
import { useCache } from '@/pages/api/hooks/useCache'
const { Option } = Select

interface MediaItem {
    mediaType: string
    url: string
}

interface sendFeed {
    url: string[]
    caption: string
    username?: string
}

interface Feed {
    id: string
    mediaItems: MediaItem[]
    mediaType: number
    caption: string
    likeCount: number
    commentCount: number
    username: string
    takenAt: Date
}

const MEDIA_TYPES = {
    photo: 1,
    video: 2,
    carousel: 8,
}

const MediaRenderer = ({
    media,
    className,
}: {
    media: any
    className: string
}) => {
    if (media.mediaType === 'photo') {
        return (
            <img
                src={media.url}
                alt={media.mediaType}
                width={450}
                height={550}
                className={className}
                referrerPolicy="no-referrer" // Add this
                crossOrigin="anonymous"      // Add this
                onError={(e) => {
                    // Fallback if image fails to load
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.onerror = null; // Prevent infinite loop
                    imgElement.src = '/path/to/fallback-image.jpg'; // Add a fallback image
                }}
            />
        )
    } else {
        return (
            <video
                controls
                className={className}
            >
                <source src={media.url} type="video/mp4" />
            </video>
        )
    }
}

function BlogTwo() {
    const { getCacheItem, setCacheItem } = useCache({
        prefix: 'feeds_',
        ttl: 60 * 60 * 1000,
    })

    const router = useRouter()
    const [feeds, setFeeds] = useState<Feed[]>([])
    const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
    const [nextMaxPage, setNextMaxPage] = useState<string | null>(null)
    const [allSelected, setAllSelected] = useState(false)
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [totalFiles, setTotalFiles] = useState(0)
    const [nameArsip, setNameArsip] = useState('')
    const [modalVisibleArsip, setModalVisibleArsip] = useState(false)
    const [inputCount, setInputCount] = useState(0)
    const { openNotificationWithIcon, contextHolder } = useNotification()
    const abortController = useRef<AbortController | null>(null)
    const [sortCriteria, setSortCriteria] = useState<
        'likes' | 'comments' | 'recent' | 'oldest' | 'trending'
    >('likes')
    const [mediaFilter, setMediaFilter] = useState<
        'all' | 'photo' | 'video' | 'carousel'
    >('all')
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const path = '/admin'
    const [feed, setFeed] = useState<sendFeed | null>(null)
    const [repostModalVisible, setRepostModalVisible] = useState(false)

    const filteredFeeds = useMemo(() => {
        return feeds.filter((feed) => {
            if (mediaFilter === 'all') return true
            return feed.mediaType === MEDIA_TYPES[mediaFilter]
        })
    }, [feeds, mediaFilter])

    const sortedFeeds = useMemo(() => {
        return filteredFeeds.sort((a, b) => {
            switch (sortCriteria) {
                case 'likes':
                    return b.likeCount - a.likeCount
                case 'comments':
                    return b.commentCount - a.commentCount
                case 'recent':
                    return (
                        new Date(b.takenAt).getTime() -
                        new Date(a.takenAt).getTime()
                    )
                case 'oldest':
                    return (
                        new Date(a.takenAt).getTime() -
                        new Date(b.takenAt).getTime()
                    )
                case 'trending':
                    return (
                        b.likeCount +
                        b.commentCount -
                        (a.likeCount + a.commentCount)
                    )
                default:
                    return 0
            }
        })
    }, [filteredFeeds, sortCriteria])

    useEffect(() => {
        if (router.query.response) {
            const responseParse = JSON.parse(router.query.response as string)
            console.log('response parse   ',responseParse.data.nextMaxId)
            const cacheKey = `feeds_${router.query.response}`
            setFeeds((prevFeeds) => {
                const existingFeedIds = new Set(prevFeeds.map((feed) => feed.id))
                const newFeeds = responseParse.data.feeds.filter(
                    (feed: Feed) => !existingFeedIds.has(feed.id)
                )
                const updatedFeeds = [...prevFeeds, ...newFeeds]
                setNextMaxPage(responseParse.data.nextMaxId)
                setCacheItem(cacheKey, {
                    feeds: updatedFeeds,
                    nextMaxPage: responseParse.data.nextMaxId,
                })
                return updatedFeeds
            })
        }
    }, [router.query.response]) // Tambahkan dependency

    const fetchFeeds = async () => {
        const cacheKey = `feeds_${router.query.name}`
        try {
            setLoading(true)
            setIsLoadingMore(true)

            if (!router.query.name) {
                setLoading(true)
                return
            }

            const defaultAccount = localStorage.getItem('default')
            if (!defaultAccount) {
                openNotificationWithIcon(
                    'error',
                    'User tidak ditemukan',
                    'User tidak ditemukan, harap login kembali.'
                )
                return
            }

            if (feeds.length === 0) {
                const cachedData = getCacheItem<{
                    feeds: Feed[]
                    nextMaxPage: string
                }>(cacheKey)

                if (cachedData) {
                    setFeeds([...cachedData.feeds])
                    setNextMaxPage(cachedData.nextMaxPage)
                    setLoading(false)
                    return
                }
            }
    
            const dataHastags = {
                query: router.query.name as string,
                username: defaultAccount,
                nextMaxId: nextMaxPage ?? undefined
            }
            const response = await (window as any).electron.getFeedsByHastag(dataHastags)

            if (!response.success) {
                throw new Error(response.message || 'Error get feeds')
            }

            if (!response.data.feeds?.length) {
                openNotificationWithIcon(
                    'error',
                    'No more feeds',
                    'All feeds have been loaded'
                )
                return
            }
            console.log('ini adalah response', response.data)
            console.log('ini adalah response2', response.data.feeds)
            setFeeds((prevFeeds) => {
                const existingFeedIds = new Set(prevFeeds.map((feed) => feed.id))
                const newFeeds = response.data.feeds.filter(
                    (feed: Feed) => !existingFeedIds.has(feed.id)
                )
                const updatedFeeds = [...prevFeeds, ...newFeeds]
                setCacheItem(cacheKey, {
                    feeds: updatedFeeds,
                    nextMaxPage: response.data.nextMaxId,
                })
                return updatedFeeds
            })

            setNextMaxPage(response.data.nextMaxId)
        } catch (error: any) {
            // console.error('Failed to load feeds:', err)
            openNotificationWithIcon('error', 'Failed to load', error)
        } finally {
            setLoading(false)
            setIsLoadingMore(false)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        abortController.current?.abort()
        setDownloadProgress(0)
    }

    const toggleSelectMedia = (feed: Feed) => {
        const mediaKeys = feed.mediaItems.map(
            (media) => `${feed.id}-${media.url}`
        )

        setSelectedMedia((prevSelected) => {
            const newSelected = new Set(prevSelected)
            const allSelected = mediaKeys.every((key) => prevSelected.has(key))

            if (allSelected) {
                mediaKeys.forEach((key) => newSelected.delete(key))
            } else {
                mediaKeys.forEach((key) => newSelected.add(key))
            }

            return newSelected
        })
    }

    const toggleSelectAll = () => {
        setAllSelected(!allSelected)
        if (!allSelected) {
            const allMediaKeys = new Set(
                feeds.flatMap((feed) =>
                    feed.mediaItems.map((media) => `${feed.id}-${media.url}`)
                )
            )
            setSelectedMedia(allMediaKeys)
        } else {
            setSelectedMedia(new Set())
        }
    }

    const downloadAllMedia = async () => {
        setModalVisible(true)
        setDownloadProgress(0)
        let downloadedFiles = 0
        let failedFiles = 0

        const selectedFeeds = feeds
            .map((feed) => ({
                ...feed,
                mediaItems: feed.mediaItems.filter((media) =>
                    selectedMedia.has(`${feed.id}-${media.url}`)
                ),
                sumber: feed.username || 'unknown'
            }))
            .filter((feed) => feed.mediaItems.length > 0)

        const total = selectedFeeds.reduce(
            (acc, feed) => acc + feed.mediaItems.length,
            0
        )

        if (total === 0) {
            openNotificationWithIcon(
                'error',
                'No files selected',
                'Please select files to download'
            )
            setModalVisible(false)
            return
        }

        setTotalFiles(total)
        abortController.current = new AbortController()
        const signal = abortController.current.signal

        try {
            for (const feed of selectedFeeds) {
                if (signal.aborted) break

                try {
                    await (window as any).electron.startDownload(
                        nameArsip,
                        feed,
                        signal
                    )
                    downloadedFiles += feed.mediaItems.length
                } catch (err) {
                    failedFiles += feed.mediaItems.length
                    console.error(`Failed to download feed ${feed.id}:`, err)
                }

                setDownloadProgress(Math.round((downloadedFiles / total) * 100))
            }

            if (failedFiles > 0) {
                openNotificationWithIcon(
                    'error',
                    'Download completed with errors',
                    `${failedFiles} files failed to download`
                )
            }
        } catch (err: any) {
            const message = signal.aborted
                ? 'Download cancelled'
                : `${err.message}`
            openNotificationWithIcon('error', 'Download failed', message)
        } finally {
            abortController.current = null
            setNameArsip('')
            setModalVisible(false)
            setDownloadProgress(0)
        }
    }

    const handlerRepost = async (feed: Feed) => {
        const sendThis = {
            url: feed.mediaItems.map((media) => media.url),
            caption: feed.caption,
            username: feed.username
        }
        console.log(sendThis)
        setFeed(sendThis)
        setRepostModalVisible(true)
    }

    const handlerRepostLangsung = () => {
        setRepostModalVisible(true)
        try {
            router.push({
                pathname: `${path}/tables/schedule`,
                query: {
                    url: JSON.stringify(feed?.url),
                    caption: feed?.caption,
                    username: feed?.username
                },
            })
            openNotificationWithIcon(
                'success',
                'Repost success',
                'success send api'
            )
            setModalVisible(false)
            // await router.push(`${path}/tables/repost`)
        } catch (err: any) {
            console.error('Repost failed:', err)
            openNotificationWithIcon('error', 'Repost failed', `${err.message}`)
            setModalVisible(true)
        }
    }

    const handlerRepostSchedule = () => {
        setRepostModalVisible(true)
        try {
            router.push({
                pathname: `${path}/tables/schedulee`,
                query: {
                    url: JSON.stringify(feed?.url),
                    caption: feed?.caption,
                    username: feed?.username
                },
            })
            openNotificationWithIcon(
                'success',
                'Repost success',
                'success send api'
            )
            setModalVisible(false)
            // await router.push(`${path}/tables/repost`)
        } catch (err: any) {
            console.error('Repost failed:', err)
            openNotificationWithIcon('error', 'Repost failed', `${err.message}`)
            setModalVisible(true)
        }
    }

    const handleInputCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const count = parseInt(e.target.value)
        if (!isNaN(count)) {
            setInputCount(count)
        }
    }

    const handleSelectMediaBasedOnInput = () => {
        const newAllSelected = !allSelected
        setAllSelected(newAllSelected)

        if (newAllSelected) {
            const count = Math.max(
                0,
                Math.min(inputCount || sortedFeeds.length, sortedFeeds.length)
            )
            const selectedFeeds = sortedFeeds.slice(0, count)
            const selectedMediaSet = new Set(
                selectedFeeds.flatMap((feed) =>
                    feed.mediaItems.map((media) => `${feed.id}-${media.url}`)
                )
            )
            setSelectedMedia(selectedMediaSet)
        } else {
            setSelectedMedia(new Set())
        }
    }

    useEffect(() => {
        return () => {
            // Cleanup
            abortController.current?.abort()
            setFeeds([])
            setSelectedMedia(new Set())
            setNextMaxPage(null)
        }
    }, [])

    return (
        <div ref={scrollRef}>
            {contextHolder}
            <PageHeaders
                routes={[
                    { path: 'index', breadcrumbName: 'Dashboard' },
                    { path: '', breadcrumbName: `${router.query.name}` },
                ]}
                title={`${router.query.name}`}
                className="flex justify-between items-center px-8 xl:px-4 pt-4 pb-6 sm:pb-8 bg-transparent sm:flex-col"
            />

            <Spin spinning={loading} tip="Loading Feeds...">
                <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-8 xl:px-4 pb-6">
                    <div className="flex items-center justify-between mb-6 bg-white/90 p-4 rounded-lg shadow">
                        <div className="flex items-center">
                            <Checkbox
                                checked={allSelected}
                                onChange={handleSelectMediaBasedOnInput}
                                className="font-medium"
                            >
                                <span className="w-max block">
                                    Select All / {inputCount}
                                </span>
                            </Checkbox>

                            <Input
                                type="number"
                                value={inputCount}
                                onChange={handleInputCountChange}
                                maxLength={3}
                                className="py-1.5 px-3 rounded-lg border-primary w-24 ml-2"
                            />
                        </div>
                        <div className="space-x-4">
                            <Select
                                defaultValue={sortCriteria}
                                onChange={(value) => setSortCriteria(value)}
                                style={{ marginBottom: '16px' }}
                            >
                                <Option value="likes">Most Liked</Option>
                                <Option value="comments">Most Commented</Option>
                                <Option value="recent">Most Recent</Option>
                                <Option value="oldest">Oldest</Option>
                                <Option value="trending">Trending</Option>
                            </Select>
                            <Select
                                defaultValue="all"
                                onChange={(value: any) => setMediaFilter(value)}
                                style={{ marginBottom: '16px' }}
                            >
                                <Option value="all">All Media Types</Option>
                                <Option value="photo">Images</Option>
                                <Option value="video">Videos</Option>
                                <Option value="carousel">Carousels</Option>
                            </Select>
                            <Button onClick={() => setModalVisibleArsip(true)}>
                                Download Selected
                            </Button>
                        </div>
                    </div>

                    <Row gutter={[14, 18]}>
                        {sortedFeeds.map((feed, index) => (
                            <Col
                                sm={6}
                                xs={8}
                                span={8}
                                key={`${feed.id}-${index}`}
                            >
                                <div
                                    onClick={() => toggleSelectMedia(feed)}
                                    className="bg-white rounded-lg shadow-lg p-3 mb-6 transition-all hover:shadow-xl"
                                >
                                    {feed.mediaType === 8 ? (
                                        <Carousel>
                                            {feed.mediaItems.map(
                                                (media, index) => (
                                                    <div key={index}>
                                                        <Checkbox
                                                            checked={selectedMedia.has(
                                                                `${feed.id}-${media.url}`
                                                            )}
                                                            onChange={(e) => {
                                                                e.stopPropagation()
                                                                toggleSelectAll()
                                                            }}
                                                        />
                                                        {MediaRenderer({
                                                            media,
                                                            className:
                                                                'rounded-md',
                                                        })}
                                                    </div>
                                                )
                                            )}
                                        </Carousel>
                                    ) : feed.mediaType === 1 ? (
                                        <>
                                            <Checkbox
                                                checked={selectedMedia.has(
                                                    `${feed.id}-${feed.mediaItems[0].url}`
                                                )}
                                                onChange={(e) => {
                                                    e.stopPropagation()
                                                    toggleSelectMedia(feed)
                                                }}
                                            />
                                            <img
                                                src={feed.mediaItems[0]?.url}
                                                alt={
                                                    feed.mediaItems[0].mediaType
                                                }
                                                width={250}
                                                height={350}
                                                className="rounded-md"
                                                referrerPolicy="no-referrer"
                                                crossOrigin="anonymous"
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    const imgElement = e.target as HTMLImageElement;
                                                    imgElement.onerror = null; // Prevent infinite loop
                                                    imgElement.src = '/path/to/fallback-image.jpg'; // Add a fallback image
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Checkbox
                                                checked={selectedMedia.has(
                                                    `${feed.id}-${feed.mediaItems[0]?.url}`
                                                )}
                                                onChange={(e) => {
                                                    e.stopPropagation()
                                                    toggleSelectMedia(feed)
                                                }}
                                            />
                                            <video
                                                controls
                                                className="rounded-md"
                                            >
                                                <source
                                                    src={feed.mediaItems[0].url}
                                                    type="video/mp4"
                                                />
                                            </video>
                                        </>
                                    )}
                                    <div className="text-start mt-2">
                                        <p className="font-semibold text-gray-700 line-clamp-5">
                                            {feed.caption}
                                        </p>
                                        <div className="flex justify-between items-center mt-4 text-gray-600">
                                            <span>
                                                <UilFile className="mr-2" />{' '}
                                                {feed.commentCount} Comments
                                            </span>
                                            <span>
                                                <UilHeart className="mr-2" />{' '}
                                                {feed.likeCount} Likes
                                            </span>
                                            <Button
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    handlerRepost(feed)
                                                }
                                            >
                                                <UilRepeat className="mr-2" />{' '}
                                                Repost
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </main>
            </Spin>
                <div
                className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ${
                    modalVisibleArsip ? 'block' : 'hidden'
                }`}
                style={{ zIndex: 1000 }}
                aria-labelledby="arsip-modal-title"
                aria-describedby="arsip-modal-description"
            >
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
                    <h2
                        id="arsip-modal-title"
                        className="text-lg font-semibold mb-4 text-center"
                    >
                        Tambah Arsip Baru
                    </h2>

                    <p
                        id="arsip-modal-description"
                        className="text-gray-600 text-sm text-center mb-4"
                    >
                        Masukkan nama arsip baru yang ingin ditambahkan
                    </p>

                    <input
                        type="text"
                        placeholder="Nama Arsip"
                        value={nameArsip}
                        onChange={(e) => setNameArsip(e.target.value)}
                        className="w-full h-10 px-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setModalVisibleArsip(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => {
                                setModalVisibleArsip(false)
                                downloadAllMedia()
                            }}
                            className={`px-4 py-2 text-white rounded-md ${
                                nameArsip.trim()
                                    ? 'bg-blue-500 hover:bg-blue-600'
                                    : 'bg-blue-300'
                            }`}
                            disabled={!nameArsip.trim()}
                        >
                            Simpan
                        </button>
                    </div>
                </div>
                </div>

            <div className="mt-4 flex justify-center">
                {isLoadingMore ? (
                    <Spin size="large" />
                ) : (
                    <Button
                        onClick={fetchFeeds}
                        disabled={!nextMaxPage || loading}
                        className="load-more-button"
                    >
                        {nextMaxPage ? 'Load More' : 'No More Data'}
                    </Button>
                )}
            </div>

            <Modal
                open={modalVisible}
                onCancel={handleModalCancel}
                footer={null}
                className="p-4 bg-white shadow-lg rounded-lg w-max"
            >
                <div className="p-4">
                    <Progress
                        percent={downloadProgress}
                        status="active"
                        type="dashboard"
                        className="m-auto"
                    />
                    <p className="mt-4 text-lg text-center">
                        Mengunduh {downloadProgress}% ({totalFiles} file)
                    </p>
                </div>
            </Modal>

            {/* pop up ui repost */}
            <Modal
                open={repostModalVisible}
                onCancel={() => setRepostModalVisible(false)}
                footer={null}
                className="px-3 py-5 bg-white shadow rounded"
            >
                <div className="flex items-center gap-3">
                    <Col sm={12} xs={18} className="shadow-md">
                        <div
                            className="bg-white dark:bg-white/10 m-0 p-0 mb-[25px] rounded-10 relative"
                            onClick={handlerRepostLangsung}
                        >
                            <div className="p-[25px]">
                                <img
                                    src="https://img.freepik.com/free-vector/appointment-booking-mobile-phone-with-calendar_23-2148550000.jpg?t=st=1730102155~exp=1730105755~hmac=6702631bf2696197b5d799acb373b4f0c4b676a7c58bb97a73984cd88b735cff&w=740"
                                    width={430}
                                    height={230}
                                    alt=""
                                />
                                <h1 className="mb-0 text-lg text-dark dark:text-white/60 capitalize">
                                    repost langsung
                                </h1>
                                <span className="capitalize fs-4">
                                    hanya bisa schedule 1 postingan dan pastikan
                                    anda sudah menyiapkan postigan
                                </span>
                            </div>
                        </div>
                    </Col>
                    <Col sm={12} xs={18} className="shadow-md">
                        <div
                            onClick={handlerRepostSchedule}
                            className="bg-white dark:bg-white/10 m-0 p-0 mb-[25px] rounded-10 relative"
                        >
                            <div className="p-[25px]">
                                <img
                                    src="https://img.freepik.com/free-vector/blogging-isometric-concept-with-content-plan-making-process-3d-illustration_1284-55140.jpg?t=st=1730102135~exp=1730105735~hmac=20350ad6179fee3ee13647178630e2dfa6201ddc053b0ad78bb8955e2ca5844e&w=740"
                                    width={430}
                                    height={230}
                                    alt=""
                                />
                                <h1 className="mb-0 text-lg text-dark dark:text-white/60 capitalize">
                                    schedule repost
                                </h1>
                                <span className="capitalize fs-4">
                                    Schedule Masssal, Sebelum anda menggunakan
                                    schedule massal pastikan anda membaca tata
                                    cara menggunakannya
                                </span>
                            </div>
                        </div>
                    </Col>
                </div>
                <Button
                    className="w-full px-4 py-2 bg-blue-400 text-white"
                    onClick={() => setModalVisible(false)}
                >
                    Cancel
                </Button>
            </Modal>
        </div>
    )
}

export default BlogTwo
