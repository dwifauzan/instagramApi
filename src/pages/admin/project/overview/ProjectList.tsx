import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { UilEllipsisH } from '@iconscout/react-unicons'
import {
    Row,
    Col,
    Table,
    Progress,
    Pagination,
    Tag,
    Button,
    Modal,
    Form,
    Upload,
    Input,
    Select,
} from 'antd'
import DropDown from '@/components/dropdown'
import { UploadOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import { useData } from '@/components/table/detailProvider'
import axios from 'axios'
import ScheduleModal from './Modal'

interface Project {
    id: number
    nama_arsip: string
    created_at: any
    folder_arsip: any
}

interface RootState {
    projects: {
        data: Project[]
    }
}

function ProjectList() {
    const router = useRouter()
    const path = '/admin'
    const [projects, setProjects] = useState<Project[]>([])
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
    const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [arsipIndex, setArsipIndex] = useState(0)
    const [state, setState] = useState({
        current: 1,
        pageSize: 10,
    })

    const { setData } = useData()

    useEffect(() => {
        const getArsip = async () => {
            const response = await (window as any).electron.getFeedData()
            // console.log(response)
            setProjects(response)
        }
        getArsip()
    }, [])

    const lala = (index: number) => {
        setData(projects[index])
        router.push({ pathname: `${path}/project/detailArsip/detail` })
    }

    const handleSchedule = async (i: any) => {
        const nama_arsip = projects[i].nama_arsip
        const captions = projects[i].folder_arsip.map((item: any) => {
            return item.caption
        })
        console.log(nama_arsip)
        console.log(captions)
        const schedule_massal = axios.post(
            '/hexadash-nextjs/api/schedule_arsip',
            { nama_arsip, captions }
        )
    }

    const handleScheduleSubmit = async (data: any) => {
        // await axios.post('/api/schedule_arsip', data)
        const dataSchedule = {
            ...data,
            captions: projects[arsipIndex].folder_arsip.map((item: any) => {
                return item.caption
            }),
            nama_arsip: projects[arsipIndex].nama_arsip,
        }
        console.log(dataSchedule)
    }

    const moreContent = (index: number, onDelete: () => void) => [
        {
            key: '1',
            label: (
                <Link
                    onClick={() => {
                        setIsModalVisible(true)
                        setArsipIndex(index)
                    }}
                    className="flex items-center text-theme-gray dark:text-white/60 hover:bg-gray-200 hover:text-primary dark:hover:bg-gray-700 px-3 py-1.5 text-sm active"
                    href="#"
                >
                    Schedule
                </Link>
            ),
        },
        {
            key: '2',
            label: (
                <span
                    className="flex items-center text-theme-gray dark:text-white/60 hover:bg-gray-200 hover:text-primary dark:hover:bg-gray-700 px-3 py-1.5 text-sm active cursor-pointer"
                    onClick={() => lala(index)}
                >
                    Detail
                </span>
            ),
        },
        {
            key: '3',
            label: (
                <span
                    className="flex items-center text-theme-gray dark:text-white/60 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-700 px-3 py-1.5 text-sm active cursor-pointer"
                    onClick={onDelete}
                >
                    Delete
                </span>
            ),
        },
    ]

    const showDeleteConfirm = (id: number) => {
        setDeleteProjectId(id)
        setIsDeleteModalVisible(true)
    }

    const confirmDelete = () => {
        console.log(`Project with id ${deleteProjectId} deleted`)
        setDeleteProjectId(null)
        setIsDeleteModalVisible(false)
    }

    const cancelDelete = () => {
        setDeleteProjectId(null)
        setIsDeleteModalVisible(false)
    }

    const onShowSizeChange = (current: number, pageSize: number) => {
        setState({ ...state, current, pageSize })
    }

    const onHandleChange = (current: number) => {
        setState({ ...state, current })
    }

    const dataSource = projects.map((project, index) => ({
        key: project.id,
        no: index + 1,
        nama_arsip: (
            <span className="text-body dark:text-white/60 text-[15px] font-medium">
                {project.nama_arsip}
            </span>
        ),
        created_at: (
            <span className="text-body dark:text-white/60 text-[15px] font-medium">
                {new Date(project.created_at).toLocaleDateString()}
            </span>
        ),
        action: (
            <DropDown
                className="min-w-[140px] hover:bg-gray-100 dark:hover:bg-gray-800"
                customContent={moreContent(index, () =>
                    showDeleteConfirm(project.id)
                )}
            >
                <Link href="#">
                    <UilEllipsisH className="w-4 h-4 text-light-extra dark:text-white/60 hover:text-primary" />
                </Link>
            </DropDown>
        ),
    }))

    const columns = [
        {
            title: 'No',
            dataIndex: 'no',
            key: 'no',
        },
        {
            title: 'Nama Arsip',
            dataIndex: 'nama_arsip',
            key: 'nama_arsip',
        },
        {
            title: 'Created at',
            dataIndex: 'created_at',
            key: 'created_at',
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
        },
    ]

    return (
        <>
            <Row gutter={25}>
                <Col xs={24}>
                    <div className="bg-white dark:bg-[#202531] pt-[25px] px-[25px] rounded-[10px]">
                        <div className="table-responsive">
                            <Table
                                pagination={false}
                                dataSource={dataSource}
                                columns={columns}
                                rowKey="id"
                            />
                        </div>
                    </div>
                </Col>
                <Col xs={24}>
                    <Pagination
                        onChange={onHandleChange}
                        showSizeChanger
                        onShowSizeChange={onShowSizeChange}
                        pageSize={state.pageSize}
                        current={state.current}
                        total={projects.length}
                    />
                </Col>
            </Row>

            <ScheduleModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleScheduleSubmit}
            />

            <Modal
                title="Confirm Delete"
                visible={isDeleteModalVisible}
                onOk={confirmDelete}
                onCancel={cancelDelete}
                className="p-6"
            >
                <p>Are you sure you want to delete this project?</p>
            </Modal>
        </>
    )
}

export default ProjectList
