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
} from 'antd'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { UilFile, UilHeart } from '@iconscout/react-unicons'
import { PageHeaders } from '@/components/page-headers'
import { useNotification } from '../../crud/axios/handler/error'
import axios from 'axios'

const { Option } = Select

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

function BlogFour() {
    const router = useRouter()
    const [feeds, setFeeds] = useState<Feed[]>([])
    const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
    const [nextMaxPage, setNextMaxPage] = useState('')
    const [allSelected, setAllSelected] = useState(false)
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [totalFiles, setTotalFiles] = useState(0)
    const [nameArsip, setNameArsip] = useState('')
    const [modalVisibleArsip, setModalVisibleArsip] = useState(false)
    const { openNotificationWithIcon } = useNotification()
    const abortController = useRef<AbortController | null>(null)
    const [sortCriteria, setSortCriteria] = useState<
    'likes' | 'comments' | 'recent' | 'oldest' | 'trending'
>('likes')

    useEffect(() => {
        if (router.query.pk) {
            hastagsFeeds()
        }
    }, [router.query.pk])

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
                setLoading(false)
                return
            }
            const response = await axios.get(
                `http://192.168.18.45:5000/api/v1/feeds/${router.query.pk}?next_max_id=${nextMaxPage}`,
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
        abortController.current?.abort()
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
        setModalVisible(true)
        setDownloadProgress(0)
        // Melakukan set feeds yang dipilih berdasarkan checkbox
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
                    nameArsip,
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
        }

        setModalVisible(false)
        setDownloadProgress(0)
    }

    const sortedFeeds = useMemo(() => {
        return feeds.sort((a, b) => {
            switch (sortCriteria) {
                case 'likes':
                    return b.likeCount - a.likeCount // Mengurutkan berdasarkan jumlah like terbanyak
                case 'comments':
                    return b.commentCount - a.commentCount // Mengurutkan berdasarkan jumlah komentar terbanyak
                case 'recent':
                    return (
                        new Date(b.takenAt).getTime() -
                        new Date(a.takenAt).getTime()
                    ) // Mengurutkan berdasarkan postingan terbaru
                case 'oldest':
                    return (
                        new Date(a.takenAt).getTime() -
                        new Date(b.takenAt).getTime()
                    )
                case 'trending':
                    // Misalnya, gunakan kombinasi like dan comment
                    return (
                        b.likeCount +
                        b.commentCount -
                        (a.likeCount + a.commentCount)
                    )
                default:
                    return 0 // Tidak ada perubahan urutan
            }
        })
    }, [feeds, sortCriteria])

    return (
        <>
            <PageHeaders
                routes={[
                    { path: 'index', breadcrumbName: 'Dashboard' },
                    { path: '', breadcrumbName: `Account` },
                ]}
                title="Account"
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
                        <Select
                                defaultValue={sortCriteria}
                                onChange={(value) => setSortCriteria(value)}
                                style={{ marginBottom: '16px' }}
                            >
                                <Option value="likes">Most Liked</Option>
                                <Option value="comments">Most Commented</Option>
                                <Option value="recent">Most Recent</Option>
                                <Option value="oldest">Most OldDet</Option>
                                <Option value="trending">Trending</Option>
                            </Select>
                        <Button
                            type="primary"
                            onClick={() => setModalVisibleArsip(true)}
                        >
                            Download Media
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

export default BlogFour
