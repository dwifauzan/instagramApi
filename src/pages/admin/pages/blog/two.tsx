import { useEffect, useState } from 'react';
import { Button, Carousel, Col, Modal, Progress, Row } from 'antd';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { UilFile, UilHeart } from '@iconscout/react-unicons';
import { PageHeaders } from '@/components/page-headers';
import { useNotification } from '../../crud/axios/handler/error';

interface MediaItem {
    mediaType: string; // photo, video, or carousel
    url: string;
}

interface Feed {
    id: string;
    mediaItems: MediaItem[]; // Multiple media items for carousel
    mediaType: number;
    caption: string;
    likeCount: number;
    commentCount: number;
    takenAt: Date;
}

function BlogTwo() {
    const router = useRouter();
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [nextMaxPage, setNextMaxPage] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const { name } = router.query;
    const [modalVisible, setModalVisible] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [totalFiles, setTotalFiles] = useState(0);
    const { openNotificationWithIcon } = useNotification();

    useEffect(() => {
        if (name) {
            hastagsFeeds();
        }
    }, [name]);

    const hastagsFeeds = async () => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const token = sessionStorage.getItem(sessionStorage.key(0)!);
            if (!token) {
                openNotificationWithIcon('error', 'Missing token', 'Session hilang, silahkan login ulang');
                return;
            }
            const response = await fetch(`http://192.168.18.45:5000/api/v1/feeds/hastag/${name}?next_max_id=${nextMaxPage}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-License-Key': 'akrmxgkgfkjarhfakzmgakjherfgkaueygzamkhj',
                },
            });
            const data = await response.json();
            if (Array.isArray(data.data)) {
                setFeeds((prevFeeds) => [...prevFeeds, ...data.data]);
                setNextMaxPage(data.next_max_id || '');
                setHasMore(!!data.next_max_id);
            } else {
                setHasMore(false);
                openNotificationWithIcon('error', 'Failed to load', `${data.message}`);
            }
        } catch (err: any) {
            openNotificationWithIcon('error', 'Failed to load', `${err.message}`);
        }
        setLoading(false);
    };

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
            );
        } else if (media.mediaType === 'video') {
            return (
                <video controls className="inline-block h-96 w-full">
                    <source src={media.url} type="video/mp4" />
                </video>
            );
        }
    };

    const handleScroll = () => {
        if (
            window.innerHeight + document.documentElement.scrollTop !==
                document.documentElement.offsetHeight ||
            loading
        ) {
            return;
        }
        hastagsFeeds();
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, nextMaxPage]);

    const downloadAllMedia = async () => {
        const result = await (window as any).electron.selectDownloadDirectory();
        if (!result || result.canceled || !Array.isArray(result.filePaths) || !result.filePaths.length) return;

        const downloadPath = result.filePaths[0];
        
        setModalVisible(true);
        setDownloadProgress(0);
        const total = feeds.reduce((acc, feed) => acc + feed.mediaItems.length, 0);
        setTotalFiles(total);

        let downloadedFiles = 0;

        for (const feed of feeds) {
            for (const media of feed.mediaItems) {
                try {
                    await (window as any).electron.downloadFile(media.url, downloadPath, media.mediaType, feed.caption);
                    downloadedFiles++;
                    setDownloadProgress(Math.round((downloadedFiles / total) * 100));
                } catch (err: any) {
                    openNotificationWithIcon('error', 'Download failed', `${err.message}`);
                }
            }
        }
        setModalVisible(false);
        setDownloadProgress(0);
    };

    const PageRoutes = [
        {
            path: 'index',
            breadcrumbName: 'Dashboard',
        },
        {
            path: '',
            breadcrumbName: `${name}`,
        },
    ];

    return (
        <>
            <PageHeaders
                routes={PageRoutes}
                title={`${name}`}
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
                                            {feed.mediaItems.map((media, index) => (
                                                <div
                                                    key={index}
                                                    className="relative after:absolute after:h-0 w-full ltr:after:left-0 rtl:after:right-0 after:top-0 after:bg-[#0a0a0a15] after:rounded-10 after:transition-all after:duration-300 group-hover:after:h-full"
                                                >
                                                    {filterFeeds(media)}
                                                </div>
                                            ))}
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
                        <Col span={24} className="text-center">
                            <p>No feeds available.</p>
                        </Col>
                    )}
                </Row>
                {!hasMore && (
                    <div className="flex justify-center">
                        <p>No more feeds to load.</p>
                    </div>
                )}
                <Modal
                    title="Downloading Media"
                    open={modalVisible}
                    footer={null}
                    onCancel={() => setModalVisible(false)}
                >
                    <Progress percent={downloadProgress} />
                    <p>Downloaded {downloadProgress}% of {totalFiles} files.</p>
                </Modal>
            </main>
        </>
    );
}

export default BlogTwo;
