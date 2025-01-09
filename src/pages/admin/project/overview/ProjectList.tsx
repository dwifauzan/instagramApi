import { useState, useEffect } from 'react'
import { UilSetting, UilTrash } from '@iconscout/react-unicons'
import { Row, Col, Table, Pagination, Button, Modal } from 'antd'
import { useRouter } from 'next/router'
import { useData } from '@/components/table/detailProvider'
import useNotification from '../../crud/axios/handler/error'

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
    const { openNotificationWithIcon, contextHolder } = useNotification()

    const getArsip = async () => {
        projects
        const response = await (window as any).electron.getFeedData()
        console.log(response)
        setProjects(response)
    }

    useEffect(() => {
        getArsip()
    }, [])

    const lala = (id: number) => {
        const selectedData = projects[id]
        setData(selectedData)
        console.log('ini adalah setData ', selectedData)
        console.log('oke ', projects[id])
        router.push({ pathname: `${path}/project/detailArsip/detail` })
    }

    const confirmDelete = async () => {
        console.log(deleteProjectId)
        try {
            const responseHapus = await (window as any).electron.deleteFolderArsip(deleteProjectId)
            const messageString = JSON.stringify(responseHapus)
            const objectMessage = JSON.parse(messageString)
            if (objectMessage.status === 200) {
                openNotificationWithIcon('success', 'success delete arsip', objectMessage.message)
                await getArsip()
            }
            setDeleteProjectId(null)
            setIsDeleteModalVisible(false)
        } catch (err) {
            console.log(err)
        }
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
                {/* Menampilkan tanggal dan waktu lengkap */}
                {new Date(project.created_at).toLocaleString('id-ID', {
                    weekday: 'long', // Menampilkan hari (Senin, Selasa, dll)
                    year: 'numeric', // Menampilkan tahun
                    month: 'long', // Menampilkan nama bulan (Januari, Februari, dll)
                    day: 'numeric', // Menampilkan tanggal
                    hour: '2-digit', // Menampilkan jam (format 2 digit)
                    minute: '2-digit', // Menampilkan menit (format 2 digit)
                    hour12: false, // Menggunakan format waktu 24 jam
                })}
            </span>
        ),
        action: (
            <div className="inline-flex gap-4">
                <button
                    onClick={() => lala(index)}
                    className="flex gap-3 bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm text-base"
                >
                    <UilSetting /> Aksi
                </button>
                <button
                    className="flex gap-3 bg-red-600 text-white px-4 py-2 rounded-md shadow-sm text-base"
                    onClick={() => {
                        setIsDeleteModalVisible(true)
                        setDeleteProjectId(project.id)
                    }}
                >
                    <UilTrash /> Delete
                </button>
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
        {contextHolder}
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
            <Modal visible={isDeleteModalVisible} footer={null}>
                <div className="py-12 px-5">
                    <h4 className="font-normal">
                        Apakah Anda yakin ingin menghapus arsip ini?
                    </h4>
                    <div className="mt-4 flex gap-5">
                        <Button
                            className="shadow-md text-base rounded-md w-full py-4"
                            onClick={cancelDelete}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-500 shadow-md text-base rounded-md text-white py-4 w-full"
                            onClick={confirmDelete}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default ProjectList
