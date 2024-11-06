import { useState, useEffect } from 'react'
import { UilSetting, UilTrash } from '@iconscout/react-unicons'
import {
    Row,
    Col,
    Table,
    Pagination,
    Button,
    Modal,
} from 'antd'
import { useRouter } from 'next/router'
import { useData } from '@/components/table/detailProvider'

interface Project {
    id: number
    nama_arsip: string
    created_at: any
}

function ProjectList() {
    const router = useRouter()
    const path = '/admin'
    const [projects, setProjects] = useState<Project[]>([])
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
    const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null)
    const [state, setState] = useState({
        current: 1,
        pageSize: 10,
    })

    const { setData } = useData() as any

    useEffect(() => {
        const getArsip = async () => {projects
            const response = await (window as any).electron.getFeedData()
            console.log(response)
            setProjects(response)
        }
        getArsip()
    }, [])

    const lala = (index: number) => {
        setData(projects[index])
        router.push({ pathname: `${path}/project/detailArsip/detail`})
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
            <div className='inline-flex gap-4'>
                <button onClick={() => lala(index)} className='flex gap-3 bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm text-base'><UilSetting/> Aksi</button>
                <button className='flex gap-3 bg-red-600 text-white px-4 py-2 rounded-md shadow-sm text-base'><UilTrash/> Aksi</button>
            </div>
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
                    <div className="bg-white dark:bg-[#202531] py-[25px] px-[25px] rounded-[10px]">
                        <div className="table-responsive">
                            <Table
                                dataSource={dataSource}
                                columns={columns}
                                rowKey="id"
                            />
                        </div>
                    </div>
                </Col>
            </Row>
        </>
    )
}

export default ProjectList
