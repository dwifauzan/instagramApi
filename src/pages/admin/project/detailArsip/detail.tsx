import { useState, useEffect } from 'react'
import { Card, Col, Row, Tag, Spin } from 'antd'
import DataTable from '@/components/table/DataTable'
import Link from 'next/link'
import { UilEye, UilEdit, UilTrash } from '@iconscout/react-unicons'
import { PageHeaders } from '@/components/page-headers'
import { useData } from '@/components/table/detailProvider'

interface FolderArsip {
    id: number
    detail_content: { file_path: string; media_type: number }
    caption: string
    like: number
    coment: number
    created_at: string
    isExecuted: boolean // Assuming this field indicates execution status
}

interface TableDataItem {
    media: React.ReactNode
    caption: React.ReactNode
    like: React.ReactNode
    comment: React.ReactNode
    createAt: React.ReactNode
    status: React.ReactNode
    action: React.ReactNode
}

function ProjectDetail() {
    const { data } = useData()
    const [delayedData, setDelayedData] = useState<FolderArsip[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDelayedData(data?.folder_arsip || [])
            setLoading(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [data])

    const dataTableColumn = [
        {
            title: 'Media',
            dataIndex: 'media',
            key: 'media',
        },
        {
            title: 'Caption',
            dataIndex: 'caption',
            key: 'caption',
        },
        {
            title: 'Like',
            dataIndex: 'like',
            key: 'like',
        },
        {
            title: 'Comment',
            dataIndex: 'comment',
            key: 'comment',
        },
        {
            title: 'Created at',
            dataIndex: 'createAt',
            key: 'createAt',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            width: '90px',
        },
    ]

    const tableDataSource: TableDataItem[] = delayedData.map(
        (item: FolderArsip) => {
            const {
                caption,
                like,
                coment,
                created_at,
                detail_content,
                isExecuted,
            } = item

            const xoxo = detail_content.file_path.split('/') 
            const felepath = `${xoxo[xoxo.length-3]}/${xoxo[xoxo.length-2]}/${xoxo[xoxo.length-1]}`  
            console.log(felepath)

            const mediaElement =
                detail_content.media_type === 1 ? (
                    <img
                        src={`/hexadash-nextjs/arsip/${felepath}`}
                        alt="media"
                        className="w-[50px] h-[50px] object-cover"
                    />
                ) : (
                    <video controls className="w-[50px] h-[50px] object-cover">
                        <source
                            src={detail_content.file_path}
                            type="video/mp4"
                        />
                        Your browser does not support the video tag.
                    </video>
                )

            // Determine status
            let statusText
            let statusColor

            if (!isExecuted) {
                statusText = 'Pending'
                statusColor = 'orange' // You can change the color as needed
            } else if (like > 500) {
                statusText = 'Success'
                statusColor = 'green'
            } else {
                statusText = 'Failed'
                statusColor = 'red'
            }

            return {
                media: mediaElement,
                caption: (
                    <span className="text-body dark:text-white/60 text-[15px] font-medium">
                        {caption.length > 50
                            ? caption.slice(0, 30) + '...'
                            : caption}
                    </span>
                ),
                like: (
                    <span className="text-body dark:text-white/60 text-[15px] font-medium">
                        {like}
                    </span>
                ),
                comment: (
                    <span className="text-body dark:text-white/60 text-[15px] font-medium">
                        {coment}
                    </span>
                ),
                createAt: (
                    <span className="text-body dark:text-white/60 text-[15px] font-medium">
                        {new Date(created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                ),
                status: (
                    <Tag
                        color={statusColor}
                        className="min-h-[24px] px-3 text-xs font-medium rounded-[15px]"
                    >
                        {statusText}
                    </Tag>
                ),
                action: (
                    <div className="min-w-[150px] text-end -m-2">
                        <Link className="inline-block m-2" href="#">
                            <UilEye className="w-4 text-light-extra dark:text-white/60" />
                        </Link>
                        <Link className="inline-block m-2" href="#">
                            <UilEdit className="w-4 text-light-extra dark:text-white/60" />
                        </Link>
                        <Link className="inline-block m-2" href="#">
                            <UilTrash className="w-4 text-light-extra dark:text-white/60" />
                        </Link>
                    </div>
                ),
            }
        }
    )

    const PageRoutes = [
        {
            path: 'index',
            breadcrumbName: 'Dashboard',
        },
        {
            path: 'first',
            breadcrumbName: 'Table',
        },
    ]

    return (
        <>
            <PageHeaders
                routes={PageRoutes}
                title="Detail Arsip"
                className="flex items-center justify-between px-8 xl:px-[15px] pt-[18px] pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
            />
            <div className="min-h-[715px] lg:min-h-[580px] flex-1 h-auto px-8 xl:px-[15px] pb-[30px] bg-transparent">
                <Row gutter={15}>
                    <Col xs={24} className="mb-[25px]">
                        <div className="bg-white dark:bg-white/10 m-0 p-0 mb-[25px] rounded-10 relative">
                            <div className="p-[25px]">
                                {loading ? (
                                    <Spin size="large" tip="Loading data..." />
                                ) : (
                                    <DataTable
                                        filterOnchange
                                        filterOption
                                        tableData={tableDataSource}
                                        columns={dataTableColumn}
                                        rowSelection={false}
                                    />
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    )
}

export default ProjectDetail
