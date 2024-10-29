import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Row, Col, Form, Input, Spin, Card, Modal } from 'antd'
import { Buttons } from '@/components/buttons'
import { useNotification } from './handler/error'

const { Item } = Form

interface apiResponse {
    status: number
    msg: string
}

function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [formLoading, setFormLoading] = useState(false)
    const [loginFailed, setLoginFailed] = useState(false)
    const router = useRouter()
    const path = '/admin'

    // Hook untuk notifikasi
    const { openNotificationWithIcon, contextHolder } = useNotification()

    const handleLogin = async (values: any) => {
        setFormLoading(true)
        setLoginFailed(false)

        const dataLogin = {
            name: values.name,
            username: values.username,
            password: values.password,
        }
        console.log(dataLogin)

        try {
            const response = await fetch(
                'http://192.168.18.45:5000/api/v1/users/add',
                {
                    method: 'POST',
                    headers: {
                        'X-License-Key':
                            'akrmxgkgfkjarhfakzmgakjherfgkaueygzamkhj',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataLogin),
                }
            )
            const getMessage: apiResponse = await response.json()
            if (!response.ok) {
                setLoginFailed(true)
                openNotificationWithIcon(
                    'error',
                    'Failed to log in',
                    `${getMessage.status}: ${getMessage.msg}`
                )
                return
            }

            openNotificationWithIcon(
                'success',
                'Login successful!',
                'You have successfully logged in.'
            )
            setTimeout(() => {
                router.push(`${path}/crud/axios`) // Redirect jika login sukses
            }, 2000)
        } catch (err: any) {
            setLoginFailed(true)
            openNotificationWithIcon('error', 'Login failed', err.message)
        } finally {
            setFormLoading(false) // Stop loading
        }
    }

    return (
        <>
            {contextHolder} {/* Untuk menampilkan notifikasi */}
            <div className="flex justify-center py-14">
                <Col xs={12}>
                    <Card className="shadow-md">
                        <Card.Meta
                            title={
                                <div className="text-2xl font-semibold text-black mb-3">
                                    <h1>Daftarkan Account</h1>
                                </div>
                            }
                            description={
                                <div>
                                    <Form
                                        onFinish={handleLogin}
                                        className="p-10"
                                        layout="vertical"
                                        name="addedAccount"
                                    >
                                        <Item
                                            name="name"
                                            label="Name"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        'Please input your name!',
                                                },
                                            ]}
                                        >
                                            <Input placeholder="Enter your name" />
                                        </Item>
                                        <Item
                                            name="username"
                                            label="Username"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        'Please input your username!',
                                                },
                                            ]}
                                        >
                                            <Input placeholder="Enter your username" />
                                        </Item>
                                        <Item
                                            name="password"
                                            label="Password"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        'Please input your password!',
                                                },
                                            ]}
                                        >
                                            <Input.Password placeholder="Enter your password" />
                                        </Item>
                                        <Buttons
                                            type="primary"
                                            htmlType="submit"
                                            loading={formLoading} // Tombol menjadi loading ketika submit
                                            className="w-full py-5"
                                        >
                                            Submit
                                        </Buttons>
                                    </Form>

                                    {/* Modal loading */}
                                    <Modal
                                        title="Logging In"
                                        visible={formLoading} // Pop-up muncul saat formLoading true
                                        footer={null}
                                        className="flex flex-col justify-center text-center items-center"
                                        closable={false}
                                    >
                                        <div className="mx-2 my-3">
                                            <Spin /> {/* Komponen loading */}
                                            <p>Please wait</p>
                                        </div>
                                    </Modal>
                                </div>
                            }
                        />
                    </Card>
                </Col>
            </div>
        </>
    )
}

export default LoginPage