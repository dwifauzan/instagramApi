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
import Heading from '@/components/heading'
import DropDown from '@/components/dropdown'
import { UploadOutlined } from '@ant-design/icons'

const moreContent = (onDelete) => [
    {
        key: '1',
        label: (
            <Link
                className="flex items-center text-theme-gray dark:text-white/60 hover:bg-primary-transparent hover:text-primary dark:hover:bg-white/10 px-3 py-1.5 text-sm active"
                href="#"
            >
                Detail
            </Link>
        ),
    },
    {
        key: '2',
        label: (
            <span
                className="flex items-center text-theme-gray dark:text-white/60 hover:bg-primary-transparent hover:text-primary dark:hover:bg-white/10 px-3 py-1.5 text-sm active cursor-pointer"
                onClick={onDelete}
            >
                Delete
            </span>
        ),
    },
]

interface Project {
    id: number
    title: string
    status: string
    category: string
    percentage: number
}

interface RootState {
    projects: {
        data: Project[]
    }
}

function ProjectList() {
    const project = useSelector((state: RootState) => state.projects.data)
    const [state, setState] = useState({
        projects: project,
        current: 0,
        pageSize: 0,
    })
    const { projects } = state

    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false)
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
    const [deleteProjectId, setDeleteProjectId] = useState(null)
    const [form] = Form.useForm()

    const showUploadModal = () => {
        setIsUploadModalVisible(true)
    }

    const handleUploadOk = () => {
        form.submit()
        setIsUploadModalVisible(false)
    }

    const handleUploadCancel = () => {
        setIsUploadModalVisible(false)
    }

    const handleFormSubmit = (values: any) => {
        console.log('Form values:', values)
    }

    const showDeleteConfirm = (id: number) => {
        setDeleteProjectId(id)
        setIsDeleteModalVisible(true)
    }

    const confirmDelete = () => {
        // Add your delete logic here using deleteProjectId
        console.log(`Project with id ${deleteProjectId} deleted`)
        setDeleteProjectId(null)
        setIsDeleteModalVisible(false)
    }

    const cancelDelete = () => {
        setDeleteProjectId(null)
        setIsDeleteModalVisible(false)
    }

    useEffect(() => {
        if (project) {
            setState((prevState) => ({
                ...prevState,
                projects: project,
            }))
        }
    }, [project])

    const onShowSizeChange = (current: number, pageSize: number) => {
        setState({ ...state, current, pageSize })
    }

    const onHandleChange = (current: number, pageSize: number) => {
        setState({ ...state, current, pageSize })
    }

    const dataSource: any[] = []

    if (projects.length) {
        projects.map((value: Project) => {
            const { id, title, status, category, percentage } = value
            return dataSource.push({
                key: id,
                startDate: (
                    <span className="text-body dark:text-white/60 text-[15px] font-medium">
                        26 Dec 2019
                    </span>
                ),
                deadline: (
                    <span className="text-body dark:text-white/60 text-[15px] font-medium">
                        18 Mar 2020
                    </span>
                ),
                assigned: (
                    <ul className="flex items-center -m-[3px] p-0 gap-[3px]">
                        <li>
                            <span>Account a</span>
                        </li>
                        <li>
                            <span>Account b</span>
                        </li>
                        <li>
                            <span>Account c</span>
                        </li>
                        <li>
                            <span>Account d</span>
                        </li>
                    </ul>
                ),
                status: (
                    <Tag
                        className={`inline-flex items-center justify-center text-white min-h-[18px] px-3 text-[10px] uppercase font-semibold border-none rounded-1 ${
                            status === 'complete'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                        }`}
                    >
                        {status === 'complete' ? 'Complete' : 'Progress'}
                    </Tag>
                ),
                completion: (
                    <Progress
                        percent={status === 'complete' ? 100 : percentage}
                        size="small"
                        className="inline-flex items-center text-sm text-body dark:text-white/60"
                    />
                ),
                action: (
                    <DropDown
                        className="min-w-[140px]"
                        customContent={moreContent(() => showDeleteConfirm(id))}
                    >
                        <Link href="#">
                            <UilEllipsisH className="w-4 h-4 text-light-extra dark:text-white/60" />
                        </Link>
                    </DropDown>
                ),
            })
        })
    }

    const columns = [
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
        },
        {
            title: 'Deadline',
            dataIndex: 'deadline',
            key: 'deadline',
        },
        {
            title: 'Target Account',
            dataIndex: 'assigned',
            key: 'assigned',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Progress',
            dataIndex: 'completion',
            key: 'completion',
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
                {/* <Col xs={24}>
                    <Button
                        className="mx-5 mt-4 px-5 py-2"
                        type="primary"
                        onClick={showUploadModal}
                    >
                        Upload Media
                    </Button>
                </Col> */}
                <Col xs={24}>
                    <div className="bg-white dark:bg-[#202531] pt-[25px] px-[25px] rounded-[10px]">
                        <div className="table-responsive">
                            <Table
                                pagination={false}
                                dataSource={dataSource}
                                columns={columns}
                            />
                        </div>
                    </div>
                </Col>
                <Col xs={24}>
                    <Pagination
                        onChange={onHandleChange}
                        showSizeChanger
                        onShowSizeChange={onShowSizeChange}
                        pageSize={10}
                        defaultCurrent={1}
                        total={40}
                    />
                </Col>
            </Row>

            <Modal
                title="Confirm Delete"
                visible={isDeleteModalVisible}
                onOk={confirmDelete}
                onCancel={cancelDelete}
                className="p-6"
            >
                <p>Are you sure you want to delete this project?</p>
            </Modal>

            <Modal
                title="Upload Media"
                visible={isUploadModalVisible}
                onOk={handleUploadOk}
                onCancel={handleUploadCancel}
                className="p-6"
            >
                <Form form={form} onFinish={handleFormSubmit} layout="vertical">
                    <Form.Item name="media" label="Upload Media">
                        <Upload multiple listType="picture">
                            <Button icon={<UploadOutlined />}>
                                Select File
                            </Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item name="campaign" label="Campaign">
                        <Input placeholder="Enter campaign name" />
                    </Form.Item>
                    <Form.Item name="account" label="Select Account">
                        <Select mode="multiple" placeholder="Select account(s)">
                            <Select.Option value="account1">
                                Account 1
                            </Select.Option>
                            <Select.Option value="account2">
                                Account 2
                            </Select.Option>
                            <Select.Option value="account3">
                                Account 3
                            </Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default ProjectList
