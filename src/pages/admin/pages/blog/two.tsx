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
import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { UilFile, UilHeart, UilRepeat } from '@iconscout/react-unicons'
import { PageHeaders } from '@/components/page-headers'
import { useNotification } from '../../crud/axios/handler/error'
import axios from 'axios'

const { Option } = Select

interface MediaItem {
    mediaType: string // photo | video
    url: string
}

interface Feed {
    id: string
    mediaItems: MediaItem[]
    mediaType: number // 1 = photo | 2 = video | 8 = carousel
    caption: string
    likeCount: number
    commentCount: number
    takenAt: Date
}

function BlogTwo() {
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
    const { openNotificationWithIcon } = useNotification()
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

    useEffect(() => {
        if (router.query.name) {
            hastagsFeeds()
        }
    }, [])

    const handleLoadMore = async () => {
        if (isLoadingMore) return
        setIsLoadingMore(true)
        try {
            const token = localStorage.getItem('defaultAccount')
            if (!token) {
                openNotificationWithIcon(
                    'error',
                    'Token tidak ditemukan',
                    'Token tidak ditemukan, harap login kembali.'
                )
                throw new Error('Token tidak ditemukan, harap login kembali.')
            }
            const getToken = localStorage.getItem(token)

            const response = await axios.get(
                `http://192.168.18.45:5000/api/v1/feeds/hastag/${router.query.name}?next_max_id=${nextMaxPage}`,
                { headers: { Authorization: `Bearer ${getToken}` } }
            )
            if (Array.isArray(response.data.data)) {
                setFeeds((prevFeeds) => [...prevFeeds, ...response.data.data])
                setNextMaxPage(response.data.next_max_id)
            } else {
                openNotificationWithIcon(
                    'error',
                    'Failed to load',
                    `${response.data.message}`
                )
            }
        } catch (err: any) {
            openNotificationWithIcon(
                'error',
                'Failed to load',
                `${err.message}`
            )
        }
        setIsLoadingMore(false)
    }

    const hastagsFeeds = async () => {
        if (loading) return
        setLoading(true)
        const cachedData = sessionStorage.getItem(`${router.query.name}-feeds`)
        if (cachedData) {
            setFeeds(JSON.parse(cachedData))
            setLoading(false)
            return 0
        }
        try {
            const token = localStorage.getItem(localStorage.key(0)!)
            if (!token) {
                openNotificationWithIcon(
                    'error',
                    'Token tidak ditemukan',
                    'Token tidak ditemukan, harap login kembali.'
                )
                throw new Error('Token tidak ditemukan, harap login kembali.')
            }

            const response = await axios.get(
                `http://192.168.18.45:5000/api/v1/feeds/hastag/${router.query.name}?next_max_id=${nextMaxPage}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (Array.isArray(response.data.data)) {
                setFeeds(response.data.data)
                setNextMaxPage(response.data.next_max_id)
                sessionStorage.setItem(
                    `${router.query.name}-feeds`,
                    JSON.stringify(response.data.data)
                )
            } else {
                openNotificationWithIcon(
                    'error',
                    'Failed to load',
                    `${response.data.message}`
                )
            }
        } catch (err: any) {
            openNotificationWithIcon(
                'error',
                'Failed to load',
                `${err.message}`
            )
        }
        setLoading(false)
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        abortController.current?.abort()
        setDownloadProgress(0)
    }

    const toggleSelectMedia = (mediaKey: string) => {
        setSelectedMedia((prevSelected) => {
            const newSelected = new Set(prevSelected)
            newSelected.has(mediaKey)
                ? newSelected.delete(mediaKey)
                : newSelected.add(mediaKey)
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
        // Show the modal to input the archive name
        setModalVisible(true) // Ensure this triggers the modal to show
        setDownloadProgress(0)

        const selectedFeeds = feeds.map((feed) => ({
            ...feed,
            mediaItems: feed.mediaItems.filter((media) =>
                selectedMedia.has(`${feed.id}-${media.url}`)
            ),
        }))

        console.log(selectedFeeds)

        const total = selectedFeeds.reduce(
            (acc, feed) => acc + feed.mediaItems.length,
            0
        )
        setTotalFiles(total)
        let downloadedFiles = 0

        abortController.current = new AbortController()
        const signal = abortController.current.signal

        try {
            for (const feed of selectedFeeds) {
                if (feed.mediaItems.length === 0) continue
                await (window as any).electron.startDownload(
                    nameArsip, // name of the archive you enter in the input field
                    feed,
                    signal
                )
                downloadedFiles += feed.mediaItems.length
                setDownloadProgress(Math.round((downloadedFiles / total) * 100))
                if (signal.aborted) break
            }
        } catch (err: any) {
            const message = signal.aborted
                ? 'Proses download telah dibatalkan'
                : `${err.message}`
            openNotificationWithIcon('error', 'Download failed', message)
        } finally {
            abortController.current?.abort()
            setNameArsip('')
        }

        setModalVisible(false) // Hide the download progress modal
        setDownloadProgress(0)
    }

    const handlerRepost = async (feed: Feed) => {
        try {
            const sendThis = {
                url: feed.mediaItems.map((media) => media.url),
                caption: feed.caption,
            }

            const response = await axios.post(
                '/hexadash-nextjs/api/repostLoad',
                sendThis
            )
            if (!response) {
                openNotificationWithIcon(
                    'error',
                    'Repost failed',
                    'Failed to send data to repost endpoint'
                )
                return
            }
            openNotificationWithIcon(
                'success',
                'Repost success',
                'success send api'
            )
            await router.push(`${path}/tables/repost`)
        } catch (err: any) {
            console.log(err)
            openNotificationWithIcon('error', 'Repost failed', err)
        }
    }

    const handleInputCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const count = parseInt(e.target.value)
        if (!isNaN(count)) {
            setInputCount(count)
        }
    }

    const handleSelectMediaBasedOnInput = () => {
        if (inputCount > 0) {
            setAllSelected(!allSelected)
            if (!allSelected) {
                const selectedFeeds = sortedFeeds.slice(0, inputCount) // Get the top `inputCount` sortedFeeds
                const selectedMediaSet = new Set(
                    selectedFeeds.flatMap((feed) =>
                        feed.mediaItems.map(
                            (media) => `${feed.id}-${media.url}`
                        )
                    )
                )
                setSelectedMedia(selectedMediaSet)
            } else {
                setSelectedMedia(new Set())
            }
        } else {
            toggleSelectAll()
        }
    }

    const filteredFeeds = useMemo(() => {
        return feeds.filter((feed) => {
            if (mediaFilter === 'all') return true
            return (
                feed.mediaType ===
                {
                    photo: 1,
                    video: 2,
                    carousel: 8,
                }[mediaFilter]
            )
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

    return (
        <div ref={scrollRef}>
            <PageHeaders
                routes={[
                    { path: 'index', breadcrumbName: 'Dashboard' },
                    { path: '', breadcrumbName: `${router.query.name}` },
                ]}
                title={`${router.query.name}`}
                className="flex justify-between items-center px-8 xl:px-[15px] pt-[18px] pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
            />

            <Spin spinning={loading} tip="Loading Feeds...">
                <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-[30px] xl:px-[15px] pb-[25px]">
                    <div className="flex items-center justify-between mb-6 bg-white/90 p-4 rounded-lg shadow">
                        <div className="flex items-center">
                            <Checkbox
                                checked={allSelected}
                                onChange={handleSelectMediaBasedOnInput}
                                className="font-medium"
                            >
                                <span className="w-max block">
                                    Select All /{' '}
                                </span>
                            </Checkbox>

                            <Input
                                type="number"
                                value={inputCount}
                                onChange={handleInputCountChange}
                                maxLength={3}
                                className="py-1.5 px-3 rounded-lg border-primary w-24"
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
                        {sortedFeeds.map((feed) => (
                            <Col sm={6} xs={8} span={8} key={feed.id}>
                                <div
                                    onClick={() =>
                                        toggleSelectMedia(
                                            `${feed.id}-${feed.mediaItems[0].url}`
                                        )
                                    }
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
                                                                toggleSelectMedia(
                                                                    `${feed.id}-${media.url}`
                                                                )
                                                            }}
                                                        />
                                                        {media.mediaType ===
                                                        'photo' ? (
                                                            <Image
                                                                src={media.url}
                                                                alt={
                                                                    media.mediaType
                                                                }
                                                                width={450}
                                                                height={550}
                                                                className="rounded w-full"
                                                            />
                                                        ) : (
                                                            <video
                                                                controls
                                                                className="rounded w-full"
                                                            >
                                                                <source
                                                                    src={
                                                                        media.url
                                                                    }
                                                                    type="video/mp4"
                                                                />
                                                            </video>
                                                        )}
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
                                                    toggleSelectMedia(
                                                        `${feed.id}-${feed.mediaItems[0].url}`
                                                    )
                                                }}
                                            />
                                            <Image
                                                src={feed.mediaItems[0].url}
                                                alt={
                                                    feed.mediaItems[0].mediaType
                                                }
                                                width={250}
                                                height={350}
                                                className="rounded-md"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Checkbox
                                                checked={selectedMedia.has(
                                                    `${feed.id}-${feed.mediaItems[0].url}`
                                                )}
                                                onChange={(e) => {
                                                    e.stopPropagation()
                                                    toggleSelectMedia(
                                                        `${feed.id}-${feed.mediaItems[0].url}`
                                                    )
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
                <div
                    className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
                    style={{ position: 'relative' }}
                >
                    {/* Title */}
                    <h2
                        id="arsip-modal-title"
                        className="text-lg font-semibold mb-4 text-center"
                    >
                        Tambah Arsip Baru
                    </h2>

                    {/* Description */}
                    <p
                        id="arsip-modal-description"
                        className="text-gray-600 text-sm text-center mb-4"
                    >
                        Masukkan nama arsip baru yang ingin ditambahkan
                    </p>

                    {/* Input Field */}
                    <input
                        type="text"
                        placeholder="Nama Arsip"
                        value={nameArsip}
                        onChange={(e) => setNameArsip(e.target.value)}
                        className="w-full h-10 px-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Buttons */}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setModalVisibleArsip(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => {
                                setModalVisibleArsip(false) // Close the modal
                                downloadAllMedia() // Trigger the download process
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

            {isLoadingMore && <Spin size="large" className="mt-4" />}
            {!isLoadingMore && (
                <Button
                    onClick={handleLoadMore}
                    className="load-more-button mt-4"
                >
                    Load More
                </Button>
            )}

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
        </div>
    )
}

export default BlogTwo
