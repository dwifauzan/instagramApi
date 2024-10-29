import {
    Checkbox,
    Button,
    Carousel,
    Col,
    Modal,
    Progress,
    Row,
    Spin,
} from 'antd'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { UilFile, UilHeart } from '@iconscout/react-unicons'
import { PageHeaders } from '@/components/page-headers'
import { useNotification } from '../../crud/axios/handler/error'
import axios from 'axios'

interface MediaItem {
    mediaType: string
    url: string
}

interface Feed {
    id: string
    mediaItems: MediaItem[]
    mediaType: number
    caption: string
    likeCount: number
    commentCount: number
    takenAt: Date
}

function BlogTwo() {
    const router = useRouter()
    const [feeds, setFeeds] = useState<Feed[]>([])
    const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
    const [nextMaxPage, setNextMaxPage] = useState('')
    const [allSelected, setAllSelected] = useState(false)
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [totalFiles, setTotalFiles] = useState(0)
    const { openNotificationWithIcon } = useNotification()
    const abortController = useRef<AbortController | null>(null)

    useEffect(() => {
        if (router.query.name) {
            hastagsFeeds()
        }
    }, [router.query.name])

    const hastagsFeeds = async () => {
        if (loading) return
        setLoading(true)
        try {
            const token = sessionStorage.getItem(sessionStorage.key(0)!)
            if (!token) {
                openNotificationWithIcon(
                    'error',
                    'Failed to load',
                    'Session expired. Please login again'
                )
                return
            }
            const response = await axios.get(
                `http://192.168.18.45:5000/api/v1/feeds/hastag/${router.query.name}?next_max_id=${nextMaxPage}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            if (Array.isArray(response.data.data)) {
                setFeeds(response.data.data)
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
        setLoading(false)
    }

    const handleModalCancel = () => {
        setModalVisible(false)
        if (abortController.current) {
            abortController.current.abort()
        }
        setDownloadProgress(0)
    }

    const toggleSelectMedia = (mediaKey: string) => {
        setSelectedMedia((prevSelected) => {
            const newSelected = new Set(prevSelected)
            if (newSelected.has(mediaKey)) {
                newSelected.delete(mediaKey)
            } else {
                newSelected.add(mediaKey)
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
        const downloadPath = await (
            window as any
        ).electron.selectDownloadDirectory()
        if (!downloadPath) return

        setModalVisible(true)
        setDownloadProgress(0)

        const selectedFeeds = feeds.map((feed) => ({
            ...feed,
            mediaItems: feed.mediaItems.filter((media) =>
                selectedMedia.has(`${feed.id}-${media.url}`)
            ),
        }))

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
                    downloadPath,
                    feed,
                    signal
                )
                downloadedFiles += feed.mediaItems.length
                setDownloadProgress(Math.round((downloadedFiles / total) * 100))

                if (signal.aborted) break
            }
        } catch (err: any) {
            if (signal.aborted) {
                openNotificationWithIcon(
                    'error',
                    'Download Cancelled',
                    'Proses download telah dibatalkan'
                )
            } else {
                openNotificationWithIcon(
                    'error',
                    'Download failed',
                    `${err.message}`
                )
            }
        }

        setModalVisible(false)
        setDownloadProgress(0)
    }

    return (
        <>
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
                        <Checkbox
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="font-medium"
                        >
                            Select All
                        </Checkbox>
                        <Button type="primary" onClick={downloadAllMedia}>
                            Download Selected Media
                        </Button>
                    </div>
                    <Row gutter={[14, 18]}>
                        {feeds.map((feed) => (
                            <Col sm={6} xs={8} span={8} key={feed.id}>
                                <div className="bg-white rounded-lg shadow-lg p-3 mb-6 transition-all hover:shadow-xl">
                                    <div className="media-content mb-4">
                                        {feed.mediaType === 8 ? (
                                            <Carousel>
                                                {feed.mediaItems.map(
                                                    (media, index) => (
                                                        <div
                                                            key={index}
                                                            className="carousel-item"
                                                        >
                                                            <Checkbox
                                                                checked={selectedMedia.has(
                                                                    `${feed.id}-${media.url}`
                                                                )}
                                                                onChange={() =>
                                                                    toggleSelectMedia(
                                                                        `${feed.id}-${media.url}`
                                                                    )
                                                                }
                                                                className="mb-2"
                                                            />
                                                            {media.mediaType ===
                                                            'photo' ? (
                                                                <Image
                                                                    src={
                                                                        media.url
                                                                    }
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
                                                    onChange={() =>
                                                        toggleSelectMedia(
                                                            `${feed.id}-${feed.mediaItems[0].url}`
                                                        )
                                                    }
                                                    className="mb-2"
                                                />
                                                <Image
                                                    src={feed.mediaItems[0].url}
                                                    alt={
                                                        feed.mediaItems[0]
                                                            .mediaType
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
                                                    onChange={() =>
                                                        toggleSelectMedia(
                                                            `${feed.id}-${feed.mediaItems[0].url}`
                                                        )
                                                    }
                                                    className="mb-2"
                                                />
                                                <video
                                                    controls
                                                    className="rounded-md"
                                                >
                                                    <source
                                                        src={
                                                            feed.mediaItems[0]
                                                                .url
                                                        }
                                                        type="video/mp4"
                                                    />
                                                </video>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-start">
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
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </main>
            </Spin>

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
        </>
    )
}

export default BlogTwo
