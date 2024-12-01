import React, { useState, useEffect } from 'react'
import {
    Row,
    Col,
    Button,
    Form,
    Input,
    notification,
    Spin,
    Card,
    Modal,
} from 'antd'
import { PageHeaders } from '@/components/page-headers'
import { UserOutlined, DeleteOutlined } from '@ant-design/icons'

interface LocalData {
    id: number
    name: string
    profilePic: string
    userInstagram: string
    created_at: string
}

function ViewPage() {
    const [localData, setLocalData] = useState<LocalData[]>([])
    const [formLoading, setFormLoading] = useState(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [form] = Form.useForm()
    const [showForm, setShowForm] = useState(false)

    const openNotification = (type: 'success' | 'error', message: string) => {
        notification[type]({ message })
    }

    const handleAddNew = () => {
        setShowForm(true)
        form.resetFields()
    }

    const handleFinish = async (values: any) => {
        setFormLoading(true)
        const accountForm = {
            name: values.name,
            username: values.accountName,
            password: values.password,
        }
    
        try {
            // Mengirimkan request ke API route yang sesuai
            console.log('clicked')
            const response = await (window as any).electron.createAccount(accountForm)
        } catch (error: any) {
            console.error('Error:', error)
            openNotification('error', error.response?.data?.message || error.message)
        } finally {
            setFormLoading(false)
        }
    }

    const getLocalData = async () => {
        setIsLoading(true)
        try {
            const result = await (window as any).electron.getAllUsers()
            console.log(result)

            // Transformasi data
            const transformedData = Array.isArray(result)
                ? result.map((item: any) => ({
                      id: item.id,
                      name: item.name,
                      profilePic: item.AccountFacebook?.profilePic || '',
                      userInstagram: item.AccountFacebook?.userInstagram || '',
                      created_at: item.created_at,
                  }))
                : []
            console.log(transformedData)
            setLocalData(transformedData)
        } catch (err) {
            console.error('Fetch error:', err)
            setLocalData([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getLocalData()
    }, [])

    const handleDeleteAccount = async (id: number) => {
        if (!id) return
        try {
            const response = await (window as any).electron.deleteUsers(id)
            openNotification('success', 'Account deleted successfully!')
            getLocalData()
        } catch (error: any) {
            openNotification('error', error.message)
        }
    }

    const handleSinkron = async (id: number) => {
        if (!id) return
        try {
            const response = await (window as any).electron.sinkronUsers(id)
            openNotification('success', 'Account success Sinkron')
            getLocalData()
        } catch (error: any) {
            openNotification('error', error.message)
        }
    }

    return (
        <div>
            <PageHeaders
                title="Account Meta"
                subTitle={
                    <Button type="primary" onClick={handleAddNew}>
                        Add New
                    </Button>
                }
            />
            <Row gutter={[16, 16]} className="px-5 py-8">
                {isLoading ? (
                    <Col span={24}>
                        <Spin tip="Loading..." />
                    </Col>
                ) : localData.length > 0 ? (
                    localData.map((account) => (
                        <Col key={account.id} xs={24} sm={12} md={8} lg={6}>
                            <Card
                                title={`Pemilik Account: ${account.name}`}
                                bordered
                                hoverable
                                className="w-full"
                            >
                                <div className="flex flex-col items-center">
                                    <img
                                        src={account.profilePic}
                                        alt="avatar"
                                        className="object-cover w-60 rounded-full py-3 px-2"
                                    />
                                    <div className="text-center mt-4">
                                        <p className="text-black text-lg">
                                            <strong>Instagram User:</strong>{' '}
                                            {account.userInstagram || '-'}
                                        </p>
                                        <p className="text-black text-lg">
                                            <strong>Created At:</strong>{' '}
                                            {new Date(
                                                account.created_at
                                            ).toLocaleString('id-ID', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="default"
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                            handleDeleteAccount(account.id)
                                        }
                                        className="w-full mt-7 capitalize"
                                    >
                                        delete
                                    </Button>
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            handleSinkron(account.id)
                                        }
                                        icon={<UserOutlined/>}
                                        className="w-full mt-7 capitalize"
                                    >
                                        sinkron
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    ))
                ) : (
                    <Col span={24}>
                        <p>No data available.</p>
                    </Col>
                )}
            </Row>

            <Modal
                visible={showForm}
                footer={null}
                onCancel={() => setShowForm(false)}
            >
                <div className="px-4 py-6">
                    <div>
                        <h3 className="capitalize text-2xl font-semibold">
                            Tambah Account Meta
                        </h3>
                    </div>
                    <Form
                        form={form}
                        onFinish={handleFinish}
                        layout="vertical"
                        style={{ marginTop: '16px' }}
                    >
                        <Form.Item
                            name="name"
                            label="Name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your name!',
                                },
                            ]}
                        >
                            <Input placeholder="Enter your name" />
                        </Form.Item>
                        <Form.Item
                            name="accountName"
                            label="Account Name"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your account name!',
                                },
                            ]}
                        >
                            <Input placeholder="Enter your account name" />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your password!',
                                },
                            ]}
                        >
                            <Input
                                type="password"
                                placeholder="Enter your password"
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="w-full"
                            >
                                Submit
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </div>
    )
}

export default ViewPage
