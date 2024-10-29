import { Row, Col, Spin, Button, Modal, Progress } from 'antd'
import { PageHeaders } from '@/components/page-headers'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { UilFile, UilHeart } from '@iconscout/react-unicons'
import { Carousel } from 'antd'
import Image from 'next/image'
import { useNotification } from '../../crud/axios/handler/error'

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

function BlogTwo() {
    const router = useRouter()
    const { pk } = router.query
    const [feeds, setFeeds] = useState<Feed[]>([])
    const [nextMaxPage, setNextMaxPage] = useState('')
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [modalVisible, setModalVisible] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [totalFiles, setTotalFiles] = useState(0)
    const { openNotificationWithIcon } = useNotification() // Use hook

    useEffect(() => {
        if (pk) {
            fetchFeeds()
        }
    }, [pk])

    const fetchFeeds = async () => {
        if (loading || !hasMore) return

        setLoading(true)
        try {
            const token = sessionStorage.getItem(sessionStorage.key(0)!)
            if (!token) {
                openNotificationWithIcon(
                    'error',
                    'error token hilang',
                    'token anda expired silahkan login ulang'
                )
                return
            }
            const pkSend = await fetch(
                `http://192.168.18.45:5000/api/v1/feeds/${pk}?next_max_id=${nextMaxPage}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-License-Key':
                            'akrmxgkgfkjarhfakzmgakjherfgkaueygzamkhj',
                    },
                }
            )

            const pkFinal = await pkSend.json()
            if (Array.isArray(pkFinal.data)) {
                setFeeds((prevFeeds) => [...prevFeeds, ...pkFinal.data])
                setNextMaxPage(pkFinal.next_max_id || '')
                setHasMore(!!pkFinal.next_max_id)
            } else {
                setHasMore(false) // No more data
                console.error('No feeds data found:', pkFinal.data)
            }
        } catch (err) {
            console.log(err)
        }
        setLoading(false)
    }

    const filterFeeds = (media: MediaItem) => {
        if (media.mediaType === 'photo') {
            return (
                <Image
                    src={media.url}
                    alt={media.mediaType}
                    width={250}
                    height={350}
                    className="inline-block w-full"
                />
            )
        } else if (media.mediaType === 'video') {
            return (
                <video controls className="inline-block">
                    <source src={media.url} type="video/mp4" />
                </video>
            )
        }
    }

    const handleScroll = () => {
        if (
            window.innerHeight + document.documentElement.scrollTop !==
                document.documentElement.offsetHeight ||
            loading
        ) {
            return
        }
        fetchFeeds() // Fetch more feeds when user scrolls to the bottom
    }

    useEffect(() => {
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [loading, nextMaxPage])

    // Function to download all media items with progress
    const downloadAllMedia = async () => {
        setModalVisible(true)
        setDownloadProgress(0)
        const total = feeds.reduce(
            (acc, feed) => acc + feed.mediaItems.length,
            0
        )
        setTotalFiles(total)

        for (const feed of feeds) {
            for (const media of feed.mediaItems) {
                try {
                    // Fetch the media file
                    const response = await fetch(media.url)

                    if (!response.ok) {
                        throw new Error(`Failed to download: ${media.url}`)
                    }

                    const arrayBuffer = await response.blob() // Fetch as ArrayBuffer
                    const blob = new Blob([arrayBuffer]) // Create a Blob from ArrayBuffer

                    const a = document.createElement('a')
                    const url = window.URL.createObjectURL(blob) // Create URL for the blob
                    a.href = url

                    // Determine file extension based on media type
                    const extension =
                        media.mediaType === 'photo' ? 'jpg' : 'mp4'
                    const sanitizedCaption = feed.caption
                        ? feed.caption.replace(/[^a-zA-Z0-9]/g, '_')
                        : 'untitled'

                    // Set the download attribute to define the filename
                    a.download = `${sanitizedCaption}.${extension}`
                    document.body.appendChild(a)
                    a.click() // Trigger the download
                    a.remove() // Clean up after download
                    window.URL.revokeObjectURL(url) // Release memory

                    // Update progress
                    setDownloadProgress((prev) => prev + 1)

                    // Pause briefly to prevent overwhelming the browser
                    await new Promise((resolve) => setTimeout(resolve, 100))
                } catch (error: any) {
                    console.error('Download error:', error)
                    openNotificationWithIcon(
                        'error',
                        'Download Error',
                        error.message
                    )
                }
            }
        }

        setModalVisible(false) // Hide modal when done
        setDownloadProgress(0) // Reset progress
    }

    const PageRoutes = [
        {
            path: 'index',
            breadcrumbName: 'Dashboard',
        },
        {
            path: '',
            breadcrumbName: `Account`,
        },
    ]

    return (
        <>
            <PageHeaders
                routes={PageRoutes}
                title={`Account`}
                className="flex justify-between items-center px-8 xl:px-[15px] pt-[18px] pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
            />
            <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-[30px] xl:px-[15px] pb-[25px]">
                <Row gutter={25} className="mt-sm-10">
                    <Button
                        onClick={downloadAllMedia}
                        type="primary"
                        style={{ marginBottom: '20px' }}
                    >
                        Download All Media
                    </Button>
                    {feeds.length > 0 ? (
                        feeds.map((feed) => (
                            <Col
                                key={feed.id}
                                xxl={6}
                                xl={8}
                                sm={12}
                                xs={24}
                                className="mb-[25px]"
                            >
                                <figure className="group p-6 mb-0 bg-white dark:bg-white/10 rounded-10 shadow-regular dark:shadow-none">
                                    {feed.mediaType === 8 ? (
                                        <Carousel autoplay>
                                            {feed.mediaItems.map(
                                                (media, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative after:absolute after:h-0 w-full ltr:after:left-0 rtl:after:right-0 after:top-0 after:bg-[#0a0a0a15] after:rounded-10 after:transition-all after:duration-300 group-hover:after:h-full"
                                                    >
                                                        {filterFeeds(media)}
                                                    </div>
                                                )
                                            )}
                                        </Carousel>
                                    ) : (
                                        filterFeeds(feed.mediaItems[0])
                                    )}
                                    <p className="mb-4 text-base text-dark dark:text-white/[.87] line-clamp-3">
                                        {feed.caption}
                                    </p>
                                    <div className="flex justify-between">
                                        <ul className="flex items-center -m-2">
                                            <li className="m-2">
                                                <span className="flex items-center leading-none gap-x-1 text-light dark:text-white/60 text-13">
                                                    <UilHeart className="w-3 h-3 text-light dark:text-white/60" />
                                                    <span className="flex items-center leading-none text-light dark:text-white/60 text-13">
                                                        {feed.likeCount}
                                                    </span>
                                                </span>
                                            </li>
                                            <li className="m-2">
                                                <span className="flex items-center leading-none gap-x-1 text-light dark:text-white/60 text-13">
                                                    <UilFile className="w-3 h-3 text-light dark:text-white/60" />
                                                    <span className="flex items-center leading-none text-light dark:text-white/60 text-13">
                                                        {feed.commentCount}
                                                    </span>
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </figure>
                            </Col>
                        ))
                    ) : (
                        <Col span={24} className="text-center"></Col>
                    )}
                </Row>
                {loading && (
                    <div className="flex justify-center">
                        <Spin />
                    </div>
                )}
                {!hasMore && (
                    <div className="flex justify-center">
                        <p>No more feeds to load.</p>
                    </div>
                )}

                {/* Modal for download progress */}
                <Modal
                    title="Downloading Media"
                    visible={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={null}
                >
                    <Progress percent={(downloadProgress / totalFiles) * 100} />
                    <p>
                        Downloading {downloadProgress} of {totalFiles} files...
                    </p>
                </Modal>
            </main>
        </>
    )
}

export default BlogTwo
