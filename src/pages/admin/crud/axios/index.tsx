import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { Row, Col, Table, Spin, Button, Modal, Form, Input } from 'antd'
import { UilPlus, UilSearch } from '@iconscout/react-unicons'
import { PageHeaders } from '@/components/page-headers'
import { useNotification } from './handler/error' // Import hook
import { jwtDecode } from 'jwt-decode' // Import with correct usage
import { useRouter } from 'next/router'

interface DataSource {
    id: number
    name: string
    username: string
    action: JSX.Element
}

function ViewPage() {
    const router = useRouter()
    const [dataSource, setDataSource] = useState<DataSource[]>([])
    const [currentUser, setCurrentUser] = useState<string | null>(null)
    const [loggedInUsers, setLoggedInUsers] = useState<{ name: string }[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [formLoading, setFormLoading] = useState(false)
    const [loginFailed, setLoginFailed] = useState(false)
    const [modalVisible, setModalVisible] = useState<boolean>(false)
    const [selectedRecord, setSelectedRecord] = useState<DataSource | null>(
        null
    )
    const { openNotificationWithIcon, contextHolder } = useNotification() // Use hook
    //delete modal dan session
    const [confirmSessio, setConfirmSessio] = useState<boolean>(false)
    //search const
    const [searchTerm, setSearchTerm] = useState<string>('')

    // Fetch data and initialize
    const fetchData = async () => {
        setIsLoading(true)
        try {
            const result = await fetch(
                'http://192.168.18.45:5000/api/v1/users/',
                {
                    method: 'GET',
                    headers: {
                        'X-License-Key':
                            'akrmxgkgfkjarhfakzmgakjherfgkaueygzamkhj',
                    },
                }
            )
            const akhir = await result.json()
            const modifiedData = akhir.data.map((item: any, index: number) => ({
                ...item,
                id: index + 1,
            }))

            setDataSource(modifiedData)
            setIsLoading(false)
        } catch (error) {
            console.log('Error fetching data:', error)
            setIsLoading(false)
        }
    }

    // Checking which users are logged in from sessionStorage
    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        const loggedIn: any = dataSource.map((user) => {
            const userToken = localStorage.getItem(user.name)
            if (userToken === 'expired') {
                return { name: 'expired' }
            } else {
                try {
                    const jwtSave: any = jwtDecode(userToken!)
                    return { name: jwtSave.username }
                } catch (err) {
                    console.error(err)
                    return { name: null }
                }
            }
        })

        setLoggedInUsers(loggedIn)
        console.log(loggedIn)
    }, [dataSource])
    // console.log(loggedInUsers)

    const handleLogin = (record: DataSource) => {
        setSelectedRecord(record)
        setModalVisible(true)
    }

    useEffect(() => {
        if (modalVisible && selectedRecord) {
            console.log('chose: ', selectedRecord)
        }
    }, [modalVisible, selectedRecord])

    const handleLogout = async (record: string) => {
        try {
            if (record) {
                localStorage.removeItem(record) // Hapus token dari sessionStorage
                setLoggedInUsers((prevUsers) =>
                    prevUsers.filter((user) => user.name !== record)
                ) // Perbarui daftar logged-in users
                openNotificationWithIcon(
                    'success',
                    'Logout Successful',
                    'You have logged out successfully.'
                )
                setIsLoading(false)
                fetchData()
            }
        } catch (error) {
            console.error('Error during logout:', error)
            openNotificationWithIcon(
                'error',
                'Logout Failed',
                'An error occurred while logging out.'
            )
        }
    }

    const handlePassword = async (values: any) => {
        setFormLoading(true)
        setLoginFailed(false)

        const dataLogin = {
            username: selectedRecord?.username,
            password: values.password,
        }
        console.log(dataLogin)
        try {
            const response = await fetch(
                'http://192.168.18.45:5000/api/v1/auth/login',
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

            if (!response.ok) {
                const errorData = await response.text()
                console.error('Error response:', errorData)
                setLoginFailed(true)
                openNotificationWithIcon(
                    'error',
                    'Login Failed',
                    'please try again'
                )
                return
            }

            const data = await response.json()
            localStorage.setItem(data.currentUser, data.token)
            const tokenDecode = localStorage.getItem(data.name)
            if (tokenDecode) {
                const jwtSave: { username: string } = jwtDecode(tokenDecode)
                setCurrentUser(jwtSave.username)
                setLoggedInUsers((prev) => [
                    ...prev,
                    { name: jwtSave.username },
                ])
            }
            openNotificationWithIcon(
                'success',
                'Login Successful',
                'You have logged in successfully.'
            )
            // Menutup modal setelah login berhasil
            setModalVisible(false)
            fetchData()
        } catch (err) {
            console.error('Error:', err)
            setLoginFailed(true)
            openNotificationWithIcon(
                'error',
                'Login Failed',
                'Username or password is incorrect. Please try again.'
            )
        } finally {
            setFormLoading(false)
        }
    }

    //modal trigger modal detele sessio
    const handleModalDelete = (record: DataSource) => {
        setSelectedRecord(record)
        setConfirmSessio(true)
    }

    //handle delete session pada database
    const handleDeleteSessio = async (record: DataSource) => {
        try {
            const token = localStorage.getItem(record.name)
            console.log(record.name)
            // const sessioToken = sessionStorage.getItem()
            const send = await fetch(
                'http://192.168.18.45:5000/api/v1/auth/logout',
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-License-Key':
                            'akrmxgkgfkjarhfakzmgakjherfgkaueygzamkhj',
                    },
                }
            )
            setConfirmSessio(false)
            openNotificationWithIcon(
                'success',
                'delete session success',
                'berhasil menghapus session'
            )
            setTimeout(() => {
                localStorage.removeItem(record.name)
                router.reload()
            }, 2000)
        } catch (err) {
            console.log(err)
        }
    }

    const handleModalCancel = () => {
        setModalVisible(false)
    }

    //fitur search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }

    const filterDataSearch = dataSource.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            width: '90px',
            render: (_: any, record: DataSource, i: number) => {
                const userStatus = loggedInUsers[i]?.name
                if (userStatus === 'expired' || userStatus === null) {
                    return (
                        <Button onClick={() => handleLogin(record)}>
                            {userStatus === 'expired' ? 'Relogin' : 'Login'}
                        </Button>
                    )
                } else {
                    return (
                        <Button onClick={() => handleLogout(record.name)}>
                            Logout
                        </Button>
                    )
                }
            },
        },
    ]

    return (
        <div>
            {contextHolder} {/* Render notification context holder */}
            <PageHeaders
                className="flex items-center justify-between px-[30px] py-[25px] bg-transparent"
                ghost
                title="Kelola Account Ig"
                subTitle={
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <Link
                                className="bg-primary hover:bg-hbr-primary border-solid border-1 border-primary text-white dark:text-white87 text-[14px] font-semibold leading-[22px] inline-flex items-center justify-center rounded-[4px] px-[20px] h-[44px] shadow-btn gap-[8px]"
                                href="/admin/crud/axios/login"
                            >
                                <UilPlus className="w-[15px] h-[15px]" />{' '}
                                <span>Add New</span>
                            </Link>
                        </div>
                        <div key={1} className="relative flex-grow ml-4">
                            <span className="absolute left-[18px] top-[50%] translate-y-[-50%]">
                                <UilSearch className="w-[16px] h-[16px] text-light dark:text-white60" />
                            </span>
                            <input
                                className="border-none h-[40px] min-w-[280px] ltr:pl-[45px] ltr:pr-[20px] rtl:pr-[45px] rtl:pl-[20px] rounded-6 bg-white dark:bg-whiteDark focus-none outline-none"
                                type="text"
                                placeholder="Search by Username"
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                }
            />
            <div className="min-h-[715px] lg:min-h-[580px] flex-1 h-auto px-8 xl:px-[15px] pb-[30px] bg-transparent">
                <Row gutter={15}>
                    <Col className="w-100" md={24}>
                        <div className="bg-white dark:bg-whiteDark rounded-[10px]">
                            {isLoading ? (
                                <Spin tip="Loading..." />
                            ) : (
                                <Suspense
                                    fallback={
                                        <p>Wait now, time to render...</p>
                                    }
                                >
                                    <Table
                                        columns={columns}
                                        dataSource={filterDataSearch}
                                        pagination={{ pageSize: 10 }}
                                        className="custom-table"
                                        rowKey="id"
                                    />
                                </Suspense>
                            )}
                            {loginFailed && (
                                <p className="text-red-600">
                                    Invalid username or password. Please try
                                    again.
                                </p>
                            )}
                        </div>
                    </Col>
                </Row>
            </div>
            {/* Modal */}
            <Modal
                visible={modalVisible}
                onCancel={handleModalCancel}
                footer={null}
                className="p-10"
                key={selectedRecord ? selectedRecord.id : 'modal'}
            >
                {selectedRecord && (
                    <Form
                        className="p-10"
                        onFinish={handlePassword}
                        layout="vertical"
                    >
                        <div className="mb-5 text-sm font-semibold">
                            <h1>Login Account</h1>
                        </div>
                        <Form.Item name="username" label="Username">
                            <Input
                                disabled
                                defaultValue={selectedRecord.username}
                            />
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
                            <Input.Password placeholder="Enter password" />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={formLoading}
                                className="w-full py-5"
                            >
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
            {/* Modal delete session */}
            <Modal
                visible={confirmSessio}
                onCancel={() => setConfirmSessio(false)}
                className="p-6"
                footer={null}
            >
                <div className="flex flex-col gap-3 py-5 px-3 text-center">
                    <img
                        src="https://img.freepik.com/free-vector/cookie-kawaii-food-cartoon_24877-82595.jpg?t=st=1727333075~exp=1727336675~hmac=e9ae4458e43744d2c6362e89e49ffcf3755069334fd374339a6fdec8a6a105fc&w=826"
                        alt="image 1"
                        className="mb-4 w-full"
                    />
                    <h2>apakah anda yaking ingin menghapus account</h2>
                    <span className="text-lg">{selectedRecord?.username}</span>
                    <Button
                        className="w-full bg-blue-400 shadow-md text-black py-6"
                        onClick={() => {
                            if (selectedRecord) {
                                handleDeleteSessio(selectedRecord)
                            }
                            setConfirmSessio(false)
                        }}
                    >
                        Submit
                    </Button>
                </div>
            </Modal>
        </div>
    )
}

export default ViewPage
