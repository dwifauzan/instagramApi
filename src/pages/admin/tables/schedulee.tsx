import React, { useEffect, useState } from 'react'
import {
    Form,
    Button,
    Select,
    Row,
    Col,
    Card,
    Input,
    Modal,
    Spin,
    Image,
    DatePicker,
    TimePicker,
} from 'antd'
import axios from 'axios'
import useNotification from '@/pages/admin/crud/axios/handler/error'
import { useRouter } from 'next/router'
import { facebookApi } from '@/pages/api/useFacebook'
import moment from 'moment'

const { Option } = Select

interface LocalData {
    id: number
    name: string
    access_token: string
    userInstagram: string
    expired_at: string
    isActive: boolean
}
const SchedulePage = () => {
    const [localData, setLocalData] = useState<LocalData[]>([])
    const [selectedAccount, setSelectedAccount] = useState<string>('')
    const [formLoading, setFormLoading] = useState(false)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [mediaFiles, setMediaFiles] = useState<string>('')
    const [captionText, setCaptionText] = useState<string>('')

    const { openNotificationWithIcon, contextHolder } = useNotification()
    const [usersF, setUsersF] = useState<LocalData[]>([]) // facebook accounts
    const [usersI, setUsersI] = useState<string[]>([]) // instagram accounts
    const [fSelected, setFSelected] = useState<number>(0)
    const [form] = Form.useForm()
    const router = useRouter()
    const { url, caption } = router.query

    useEffect(() => {
        const getUsers = async () => {
            try {
                const response = await facebookApi.getUsers()
                setUsersF(Array.isArray(response) ? response : [])
                // console.log(response)
            } catch (error) {
                console.error('Error fetching users:', error)
                setUsersF([])
            }
        }
        getUsers()
    }, [])

    const getRepostMedia = async () => {
        const image = '/hexadash-nextjs/repost/media-0.jpg'
        const video = '/hexadash-nextjs/repost/media-0.mp4'

        try {
            const response = await axios.get(image, { responseType: 'blob' })
            if (response.status === 200) {
                setMediaFiles(image)
            } else {
                setMediaFiles(video)
            }
        } catch (err: any) {
            console.log('Media not found')
            setMediaFiles(video)
        }
    }

    useEffect(() => {
        getRepostMedia()
    }, [])

    const fetchCaptionFromFile = async () => {
        try {
            const result: any = caption
            setCaptionText(result)
            form.setFieldsValue({ textareaValue: result })
        } catch (error) {
            console.error('Failed to read caption file:', error)
        }
    }

    const handleSelectF = (value: number) => {
        setFSelected(value)
        const selectedUser = usersF.find((user) => user.id === value)
        if (selectedUser) {
            const instagramUsers = selectedUser.userInstagram.split(',')
            setUsersI(instagramUsers)
            console.log(instagramUsers)
        }
        console.log(selectedUser)
    }

    const handleRepost = async (values: any) => {
        setFormLoading(true)
        setIsModalVisible(true)

        try {
            const accessToken = usersF.find(
                (user: any) => user.id === fSelected
            )?.access_token
            const data = {
                access_token: accessToken,
                users: values.users_instagram, // Akun Instagram yang dipilih
                caption: captionText,
                mediaFiles: JSON.parse(url as string),
                date: values.schedule_date.format('DD/MM/YYYY'), // Pastikan tanggal tidak null
                time: values.schedule_time.format('HH:mm'), // Pastikan waktu tidak null
            }

            const response = await axios.post(
                '/hexadash-nextjs/api/postSchedule',
                data
            )

            if (response.status === 201) {
                const result = response.data
                openNotificationWithIcon(
                    'success',
                    'Success Repost',
                    result.message
                )
                const path = '/admin'
                router.push(`${path}/pages/search`)

                form.resetFields()
                setSelectedAccount('')
            }
        } catch (err: any) {
            localStorage.setItem('retry-repost-route', '/admin/tables/schedule')
            openNotificationWithIcon('error', 'Failed to Repost', err.message)
        } finally {
            setFormLoading(false)
            setIsModalVisible(false)
        }
    }

    return (
        <div>
            {contextHolder}
            <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-8 pb-12">
                <Row gutter={25} className="mt-6">
                    <Col sm={12} xs={18}>
                        <Card
                            title="Repost"
                            bordered={false}
                            style={{ borderRadius: 8 }}
                        >
                            <Form
                                onFinish={handleRepost}
                                layout="vertical"
                                initialValues={{
                                    textareaValue: captionText,
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
                                        mode="multiple"
                                        placeholder="Select Users Instagram"
                                        options={usersI?.map((user) => ({
                                            value: user,
                                            label: user, // Menampilkan nama Instagram yang sudah ada di state
                                        }))}
                                    />
                                </Form.Item>

                                <Input.TextArea
                                    rows={12}
                                    placeholder="Masukkan caption di sini..."
                                    value={captionText}
                                    onChange={(e) =>
                                        setCaptionText(e.target.value)
                                    }
                                    className="text-base"
                                />

                                <Button
                                    type="dashed"
                                    onClick={fetchCaptionFromFile}
                                    className="mt-2"
                                >
                                    Gunakan Caption
                                </Button>

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
                                            const today =
                                                moment().startOf('day')
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

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={formLoading}
                                        block
                                    >
                                        Submit Repost
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                    <Col sm={12} xs={24}>
                        <Card
                            title="Pratinjau Media"
                            className="max-w-[450px] aspect-square rounded-lg shadow-md"
                        >
                            {mediaFiles ? (
                                mediaFiles.endsWith('.mp4') ? (
                                    <video
                                        className="w-full h-auto"
                                        controls
                                        src={mediaFiles}
                                    />
                                ) : (
                                    <Image
                                        className="w-full"
                                        src={mediaFiles}
                                        alt="Pratinjau Media"
                                    />
                                )
                            ) : (
                                <p className="text-center text-gray-500">
                                    Tidak ada media yang tersedia
                                </p>
                            )}
                            <div className="p-2 text-left">
                                <p className="line-clamp-4 text-base">
                                    {captionText}
                                </p>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </main>

            <Modal
                visible={isModalVisible}
                footer={null}
                maskClosable={false}
                style={{
                    borderRadius: 12,
                    padding: '20px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                <div style={{ borderRadius: 12, padding: '20px' }}>
                    <Spin tip="Menunggu..." spinning={formLoading} />
                </div>
            </Modal>
        </div>
    )
}

export default SchedulePage
