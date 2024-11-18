import { useState, useEffect } from 'react'
import {
    Card,
    Col,
    Row,
    Tag,
    Spin,
    Button,
    Modal,
    Select,
    Upload,
    DatePicker,
    TimePicker,
    Form,
    Input,
} from 'antd'
import DataTable from '@/components/table/DataTable'
import Link from 'next/link'
import { UilEye, UilEdit, UilTrash } from '@iconscout/react-unicons'
import { PageHeaders } from '@/components/page-headers'
import { useData } from '@/components/table/detailProvider'
import axios from 'axios'
import moment from 'moment'
import { useNotification } from '../../crud/axios/handler/error'
import LocationInput from '../../../../lib/auto-complete-input'

interface FolderArsip {
    id: number
    detail_content: { file_path: string; media_type: number }
    caption: string
    like: number
    coment: number
    created_at: string
    status: string
    isExecuted: boolean
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

const { Option } = Select

interface LocalData {
    id: number
    name: string
    access_token: string
    users: string
    expired_at: string
    isActive: boolean
}

interface FormValues {
    users_facebook: string
    users_instagram: string
    schedule_date: moment.Moment
    schedule_time: moment.Moment
    locations: {
        name: string
        location: {
            lat: number
            lng: number
        }
    }
    batas_postingan: number
}

function ProjectDetail() {
    const [form] = Form.useForm()
    const { data } = useData() as any
    const [delayedData, setDelayedData] = useState<FolderArsip[]>([])
    const [loading, setLoading] = useState(true)
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedOption, setSelectedOption] = useState<string | undefined>(
        undefined
    )
    const [scheduledDate, setScheduledDate] = useState<moment.Moment | null>(
        null
    )
    const [scheduledTime, setScheduledTime] = useState<moment.Moment | null>(
        null
    )
    const [localData, setLocalData] = useState<LocalData[]>([])
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])

    const [usersF, setUsersF] = useState<any[]>([]) // facebook
    const [usersI, setUsersI] = useState<[]>([]) // instagram
    const [fSelected, setFSelected] = useState<number>(0)

    const { openNotificationWithIcon, contextHolder } = useNotification()
    const [modalLoading, setModalLoading] = useState(false)
    const [refreshData, setRefreshData] = useState(false) // Tambahkan state ini untuk memicu reload DataTable

    useEffect(() => {
        const timer = setTimeout(() => {
            setDelayedData(data?.folder_arsip || [])
            setLoading(false)
            setRefreshData(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [data, refreshData])

    useEffect(() => {
        const getUsers = async () => {
            try {
                const response = await axios.get(
                    'http://192.168.18.45:5000/api/v1/accounts'
                )
                setUsersF(response.data.data)
            } catch (error) {
                console.error('Error fetching users:', error)
            }
        }
        getUsers()
    }, [])

    const handleSelectF = (value: number) => {
        setFSelected(value)
        const userI = usersF.find((user: any) => user.id === value)
        setUsersI(userI.users.split(','))
    }

    const getLocalData = async () => {
        try {
            const response = await fetch(
                'http://192.168.18.45:5000/api/v1/accounts'
            )
            const load = await response.json()
            const transformLoad = load.data.map((item: any) => ({
                ...item,
                id: item.id,
            }))
            setLocalData(transformLoad)
        } catch (err) {
            console.error(err)
        }
    }
    const handleAccountChange = (selectedAccountId: string) => {
        setSelectedAccounts([selectedAccountId])
        const users: string[] = []
        const account = localData.find(
            (item) => item.id.toString() === selectedAccountId
        )
        if (account) {
            const accountUsers = account.users
                .split(',')
                .map((user) => user.trim())
            users.push(...accountUsers)
        }
        setSelectedUsers(users)
    }

    const dataTableColumn = [
        { title: 'Media', dataIndex: 'media', key: 'media' },
        { title: 'Caption', dataIndex: 'caption', key: 'caption' },
        { title: 'Like', dataIndex: 'like', key: 'like' },
        { title: 'Comment', dataIndex: 'comment', key: 'comment' },
        { title: 'Created at', dataIndex: 'createAt', key: 'createAt' },
        { title: 'Status', dataIndex: 'status', key: 'status' },
        { title: 'Actions', dataIndex: 'action', key: 'action', width: '90px' },
    ]

    const handleSchedule = async (values: FormValues) => {
        console.log(values)
        setModalLoading(true)
        try {
            const accessToken = usersF.find(
                (user: any) => user.id === fSelected
            ).access_token

            // Menyiapkan payload untuk dikirim ke endpoint
            const payload = {
                folderArsip: delayedData,
                date: values.schedule_date.format('DD/MM/YYYY'),
                time: values.schedule_time.format('HH:mm'),
                access_token: accessToken,
                users: values.users_instagram,
                perpostingan: values.batas_postingan,
                location: {
                    name: values.locations.name,
                    lat: values.locations.location.lat,
                    lng: values.locations.location.lng,
                },
            }

            console.log(payload)

            const response = await axios.post(
                '/hexadash-nextjs/api/schedule',
                payload
            )
            openNotificationWithIcon(
                'success',
                'Success Schedule',
                response.data.message
            )
            form.resetFields()
            setRefreshData(true)
        } catch (error: any) {
            if (error.response)
                openNotificationWithIcon(
                    'error',
                    'Failed Schedule',
                    error.response.message
                )
            setRefreshData(true)
        } finally {
            setModalLoading(false)
            setModalVisible(false)
            setRefreshData(true)
        }
    }

    const handleDateChange = (date: moment.Moment | null) => {
        setScheduledDate(date)
    }

    const handleTimeChange = (time: moment.Moment | null) => {
        setScheduledTime(time)
    }

    const tableDataSource: TableDataItem[] = delayedData.map(
        (item: FolderArsip) => {
            const {
                caption,
                like,
                coment,
                created_at,
                status,
                detail_content,
                isExecuted,
            } = item
            const xoxo = detail_content.file_path.split('/')
            const felepath = `${xoxo[xoxo.length - 3]}/${
                xoxo[xoxo.length - 2]
            }/${xoxo[xoxo.length - 1]}`

            //status color kondisi
            let color = ''
            switch (status) {
                case 'success':
                    color = 'green'
                    break
                case 'pending':
                    color = 'orange'
                    break
                case 'failed':
                    color = 'red'
                    break
            }

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
                            src={`/hexadash-nextjs/arsip/${felepath}`}
                            type="video/mp4"
                        />
                        Your browser does not support the video tag.
                    </video>
                )
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
                        color={color}
                        className="min-h-[24px] px-3 text-xs font-medium rounded-[15px]"
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
        { path: 'index', breadcrumbName: 'Dashboard' },
        { path: 'first', breadcrumbName: 'Detail Arsip' },
    ]
    useEffect(() => {
        getLocalData()
    }, [])

    return (
        <>
            {contextHolder}
            <PageHeaders
                routes={PageRoutes}
                title="Detail Arsip"
                className="flex items-center justify-between px-8 xl:px-[15px] pt-[18px] pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
            />
            <div className="min-h-[715px] lg:min-h-[580px] flex-1 h-auto px-8 xl:px-[15px] pb-[30px] bg-transparent">
                <Row gutter={15}>
                    <Col xs={24} className="mb-[25px]">
                        <div className="bg-white dark:bg-white/10 m-0 p-0 mb-[25px] rounded-10 relative">
                            <div className="flex justify-between items-center p-[20px]">
                                <Button
                                    className="px-12 py-5 text-medium"
                                    type="primary"
                                    onClick={() => setModalVisible(true)}
                                >
                                    Start Schedule
                                </Button>
                            </div>
                            <div className="p-[25px]">
                                {loading ? (
                                    <Spin size="large" tip="Loading data..." />
                                ) : (
                                    <DataTable
                                        filterOnchange
                                        filterOption={false}
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

            {/* Modal for Scheduling */}
            <Modal visible={modalVisible} footer={false}>
                <Spin spinning={modalLoading} tip="Mohon Tunggu....">
                    <div className="px-5 py-3">
                        <div className="mb-5">
                            <h1 className="capitalize text-2xl font-semibold">
                                jadwalkan arsip
                            </h1>
                        </div>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={(values) => {
                                handleSchedule(values)
                            }}
                        >
                            <Form.Item
                                name="users_facebook"
                                label="Akun Facebook"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Pilih akun Facebook!',
                                    },
                                ]}
                            >
                                <Select
                                    placeholder="Select Users Facebook"
                                    onChange={handleSelectF}
                                >
                                    {usersF?.map((user: any) => (
                                        <Select.Option
                                            value={user.id}
                                            key={user.id}
                                        >
                                            {user.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="users_instagram"
                                label="Akun Instagram terkait"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Pilih akun Instagram!',
                                    },
                                ]}
                            >
                                <Select
                                    placeholder="Select Users Instagram"
                                    options={usersI?.map((user: any) => ({
                                        value: user,
                                        label: user,
                                    }))}
                                />
                            </Form.Item>

                            <Form.Item
                                name="schedule_date"
                                label="Tanggal"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Tentukan tanggal!',
                                    },
                                ]}
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    inputReadOnly
                                    disabledDate={(current) => {
                                        // Disable dates before today and more than 30 days from today
                                        const today = moment().startOf('day')
                                        const maxDate = moment()
                                            .add(30, 'days')
                                            .endOf('day')
                                        return (
                                            current &&
                                            (current < today ||
                                                current > maxDate)
                                        )
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="schedule_time"
                                label="Waktu"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Tentukan waktu!',
                                    },
                                ]}
                            >
                                <TimePicker
                                    format="HH:mm"
                                    className="w-full"
                                    inputReadOnly
                                    hideDisabledOptions
                                />
                            </Form.Item>

                            <Form.Item
                                name="locations"
                                label="Lokasi"
                                rules={[
                                    {
                                        required: false,
                                        message: 'Tentukan lokasi!',
                                    },
                                ]}
                            >
                                <LocationInput placeholder="Cari lokasi..." />
                            </Form.Item>

                            <Form.Item
                                name="batas_postingan"
                                label="jumlah perhari postingan"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            'Tentukan jumlah perhari postingan!',
                                    },
                                ]}
                            >
                                <Input
                                    className="w-full"
                                    type="number"
                                    maxLength={2}
                                    max={20}
                                    onInput={(e) => {
                                        const input =
                                            e.target as HTMLInputElement
                                        if (parseInt(input.value) > 20) {
                                            input.value = '20'
                                        } else if (input.value.length > 2) {
                                            input.value = input.value.slice(
                                                0,
                                                2
                                            )
                                        }
                                        if (
                                            (e.target as HTMLInputElement).value
                                                .length > 2
                                        ) {
                                            ;(
                                                e.target as HTMLInputElement
                                            ).value = (
                                                e.target as HTMLInputElement
                                            ).value.slice(0, 2)
                                        }
                                    }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={modalLoading}
                                >
                                    Submit
                                </Button>
                            </Form.Item>
                            <Form.Item>
                                <Button onClick={() => setModalVisible(false)}>
                                    cancel
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Spin>
            </Modal>
        </>
    )
}

export default ProjectDetail
