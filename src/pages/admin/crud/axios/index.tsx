import { Button, Form, Input, Modal, Spin, Table } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { PageHeaders } from '@/components/page-headers';
import { UilPlus, UilSearch } from '@iconscout/react-unicons';
import { instagramApi } from '@/lib/api/instagram';
import { useInstagram } from '@/hooks/useInstagram';
import { useNotification } from './handler/error';

interface User {
    id: number;
    name: string;
    username: string;
    status: string;
}

interface NotificationProps {
    linkHref: string;
}

const Notification: React.FC<NotificationProps> = ({ linkHref }) => (
    <div className="absolute z-40 top-3 right-4 bg-white ps-4 pe-6 py-2 rounded shadow-md text-base">
        <p>Anda sebelumnya sudah mencoba melakukan repost</p>
        <Button className="text-white bg-blue-500 px-6 py-3">
            <Link href={linkHref} passHref>
                klik area ini
            </Link>
        </Button>
    </div>
);

const ViewPage: React.FC = () => {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]); // Inisialisasi dengan array kosong
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [isNotified, setIsNotified] = useState(false);

    const { openNotificationWithIcon, contextHolder } = useNotification();

    const { login, logout, isLoading: authLoading } = useInstagram();

    useEffect(() => {
        fetchUsers();
        checkNotification();
        getDefaultAccount();
    }, []);

    const getDefaultAccount = () => {
        setCurrentUser(localStorage.getItem('default'));
    };

    const handleSetDefault = (name: string) => {
        localStorage.setItem('default', name);
        setCurrentUser(name);
        openNotificationWithIcon(
            'success',
            'Default Account Updated',
            `${name} has been set as default account`
        );
    };

    const fetchUsers = async () => {
        try {
            const response = await instagramApi.getUsers();
            console.log('API Response:', response); // Debugging response
            setUsers(Array.isArray(response) ? response : []); // Pastikan response adalah array
        } catch (error) {
            openNotificationWithIcon(
                'error',
                'Error',
                'Failed to load user data. Please try again later.'
            );
            setUsers([]); // Set users sebagai array kosong jika error
        } finally {
            setIsLoading(false);
        }
    };

    const checkNotification = () => {
        const readRepost = localStorage.getItem('retry-repost-route');
        if (readRepost && !isNotified) {
            setIsNotified(true);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    // Validasi bahwa users adalah array sebelum memfilter
    const filteredUsers = Array.isArray(users)
        ? users.filter((user) =>
              user.name.toLowerCase().includes(searchTerm)
          )
        : [];

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
            key: 'action',
            width: '200px',
            render: (record: User) => (
                <div className="flex items-center gap-2">
                    {record.status === 'login' && (
                        <Button
                            type={
                                currentUser === record.name
                                    ? 'primary'
                                    : 'default'
                            }
                            onClick={() => handleSetDefault(record.name)}
                            className={
                                currentUser === record.name
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : ''
                            }
                        >
                            {currentUser === record.name
                                ? 'Default'
                                : 'Set Default'}
                        </Button>
                    )}
                    <Button
                        onClick={() =>
                            record.status !== 'login'
                                ? handleLoginClick(record)
                                : handleLogoutClick(record.id)
                        }
                        loading={authLoading}
                        type={record.status === 'login' ? 'primary' : 'default'}
                        danger={record.status === 'login'}
                    >
                        {record.status !== 'login'
                            ? record.status !== 'expired'
                                ? 'Login'
                                : 'Relogin'
                            : 'Logout'}
                    </Button>
                </div>
            ),
        },
    ];

    const handleModalClose = () => {
        setIsLoginModalVisible(false);
        setSelectedUser(null);
    };

    const handleLoginClick = (user: User) => {
        setSelectedUser(user);
        setIsLoginModalVisible(true);
    };

    const handleLogoutClick = async (userId: number) => {
        try {
            const success = await logout(userId);
            if (success) {
                openNotificationWithIcon(
                    'success',
                    'Logout Successful',
                    'User has been successfully logged out'
                );
                await fetchUsers();
            } else {
                openNotificationWithIcon(
                    'error',
                    'Logout Failed',
                    'Failed to logout user. Please try again.'
                );
            }
        } catch (error) {
            openNotificationWithIcon(
                'error',
                'Error',
                'An unexpected error occurred during logout'
            );
        }
    };

    const handleLoginSubmit = async (values: any) => {
        try {
            const result = await login(
                selectedUser!.name,
                values.username,
                values.password
            );
            if (result) {
                openNotificationWithIcon(
                    'success',
                    'Login Successful',
                    `Successfully logged in as ${values.username}`
                );
                setIsLoginModalVisible(false);
                await fetchUsers();
            } else {
                openNotificationWithIcon(
                    'error',
                    'Login Failed',
                    'Invalid credentials or Instagram API error'
                );
            }
        } catch (error) {
            openNotificationWithIcon(
                'error',
                'Error',
                'An unexpected error occurred during login'
            );
        }
    };

    return (
        <div className="relative">
            {isNotified && <Notification linkHref="/admin/tables/repost" />}
            {contextHolder}
            <PageHeaders
                className="flex items-center justify-between px-8 py-6 bg-transparent"
                ghost
                title="Kelola Account Ig"
                subTitle={
                    <div className="flex items-center justify-between w-full">
                        <Link
                            className="bg-primary hover:bg-hbr-primary border-solid border-primary text-white text-sm font-semibold leading-normal inline-flex items-center justify-center rounded px-5 h-11"
                            href="/admin/crud/axios/login"
                        >
                            <UilPlus className="w-4 h-4 mr-2" />
                            Add New
                        </Link>

                        <div className="relative flex-grow ml-4">
                            <UilSearch className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-light" />
                            <input
                                className="border-none h-10 min-w-[280px] pl-12 pr-5 rounded-lg bg-white focus:outline-none"
                                type="text"
                                placeholder="Search by Username"
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                }
            />

            <div className="min-h-[715px] px-8 pb-8 bg-transparent">
                <div className="bg-white rounded-lg">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={filteredUsers}
                            pagination={{ pageSize: 10 }}
                            rowKey="id"
                        />
                    )}
                </div>
            </div>

            <Modal
                open={isLoginModalVisible}
                onCancel={handleModalClose}
                footer={null}
                className="p-10"
            >
                {selectedUser && (
                    <Form
                        className="p-10"
                        onFinish={handleLoginSubmit}
                        layout="vertical"
                    >
                        <h2 className="mb-5 text-lg font-semibold">
                            Login Account
                        </h2>

                        <Form.Item
                            name="username"
                            label="Username"
                            initialValue={selectedUser.username}
                        >
                            <Input disabled />
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
                            <Input.Password />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            className="bg-primary w-full h-10"
                        >
                            Login
                        </Button>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default ViewPage;
