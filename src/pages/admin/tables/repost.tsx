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
} from 'antd'
import axios from 'axios'
import { useNotification } from '@/pages/admin/crud/axios/handler/error'
import LocationInput from '@/lib/auto-complete-input'

const { Option } = Select

interface LocalData {
    id: number
    name: string
    username: string
    password: string
}

const RepostPage = () => {
    const [localData, setLocalData] = useState<LocalData[]>([])
    const [selectedAccount, setSelectedAccount] = useState<string>('')
    const [formLoading, setFormLoading] = useState(false)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [mediaFiles, setMediaFiles] = useState<string>('')
    const [captionText, setCaptionText] = useState<string>('')

    const { openNotificationWithIcon, contextHolder } = useNotification()
    const [form] = Form.useForm()

    const getLocalData = async () => {
        try {
            const response = await fetch(
                'http://192.168.18.45:5000/api/v1/users'
            )
            const load = await response.json()
            const localStorageKeys = Object.keys(localStorage)
            const filteredData = load.data.filter((user: any) =>
                localStorageKeys.includes(user.name)
            )
            setLocalData(filteredData)
        } catch (err) {
            console.error(err)
        }
    }

    const getRepostMedia = async () => {
        const image = '/hexadash-nextjs/repost/media-0.jpg'
        const video = '/hexadash-nextjs/repost/cover-0.jpg'

        try {
            const response = await axios.get(image, { responseType: 'blob' })
            if (response.status == 200) {
                setMediaFiles(image)
            } else {
                setMediaFiles(video)
            }
        } catch (err: any) {
            console.log('tidak ditemukan')
            setMediaFiles(video)
        }
    }

    useEffect(() => {
        getLocalData()
        getRepostMedia()
    }, [])

    // Fungsi untuk membaca file caption.txt
    const fetchCaptionFromFile = async () => {
        try {
            const response = await axios.get(
                '/hexadash-nextjs/api/readCaptionRepost'
            )
            const result = response.data.content
            setCaptionText(result) // Pastikan ini benar
            form.setFieldsValue({ textareaValue: result }) // Mengisi textarea
        } catch (error) {
            console.error('Gagal membaca file caption.txt:', error)
        }
    }

    const handleRepost = async (values: any) => {
        setFormLoading(true)
        setIsModalVisible(true)

        try {
            const data = {
                id: selectedAccount,
                caption: captionText,
                location: values.locations
            }

            const response = await axios.post(
                '/hexadash-nextjs/api/repost',
                data
            )

            if (response.status !== 200) {
                const error = response
                openNotificationWithIcon(
                    'error',
                    'Failed to Repost',
                    'error'
                )
            } else {
                const result = response.data
                openNotificationWithIcon(
                    'success',
                    'Success Repost',
                    result.message
                )
                
                form.resetFields()
                setSelectedAccount('')
            }
        } catch (err: any) {
            localStorage.setItem('retry-repost-route', '/admin/tables/repost')
            console.log(err)

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
                                    textareaValue: captionText, // Ini hanya untuk inisialisasi
                                }}
                            >
                                <Form.Item
                                    label="Pilih Akun"
                                    name="accounts"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Silakan pilih akun!',
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Pilih akun"
                                        onChange={setSelectedAccount}
                                        style={{ width: '100%' }}
                                    >
                                        {localData.map((account) => (
                                            <Option
                                                key={account.id}
                                                value={account.id.toString()}
                                            >
                                                {account.username}
                                            </Option>
                                        ))}
                                    </Select>
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
                    {/* Preview Media */}
                    <Col sm={12} xs={24}>
                        <Card
                            title="Pratinjau Media"
                            className="max-w-[450px] aspect-square rounded-lg shadow-md"
                        >
                            {mediaFiles && (
                                <Image
                                    className="w-full"
                                    src={mediaFiles}
                                    alt="Pratinjau Media"
                                />
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

export default RepostPage
