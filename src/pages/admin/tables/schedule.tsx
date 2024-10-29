import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useNotification } from '../crud/axios/handler/error';
import { Col, Form, Spin, Card, Modal, Upload, DatePicker, Select, notification } from 'antd';
import { Buttons } from '@/components/buttons';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';

const { Item } = Form;
const { Option } = Select;

interface apiResponse {
    status: number;
    msg: string;
}

interface LocalData {
    id: number;
    name: string;
    access_token: string;
    users: string;
    expired_at: string;
    isActive: boolean;
}

function SchedulePage() {
    const [localData, setLocalData] = useState<LocalData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]); // State for image files
    const [txtFileList, setTxtFileList] = useState<any[]>([]); // State for text files
    const [selectedAccessToken, setSelectedAccessToken] = useState<string | null>(null); // Access token state
    const [form] = Form.useForm();
    const router = useRouter();

    // Hook for notifications
    const { openNotificationWithIcon, contextHolder } = useNotification();

    const openNotification = (type: 'success' | 'error', message: string) => {
        notification[type]({
            message,
        });
    };

    const getLocalData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://192.168.18.45:5000/api/v1/accounts');
            const load = await response.json();
            const transformLoad = load.data.map((item: any) => ({
                ...item,
                id: item.id,
            }));
            setLocalData(transformLoad);
        } catch (err) {
            console.log(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getLocalData();
    }, []);

    const handlePhotoChange = ({ fileList }: any) => {
        setFileList(fileList);
    };

    const handleTxtChange = ({ fileList }: any) => {
        setTxtFileList(fileList);
    };

    const handleSchedule = async (values: any) => {
        setFormLoading(true);
        try {
            const formData = new FormData();
            formData.append('access_token', selectedAccessToken as string); // Add access token

            // Append each image file
            fileList.forEach((file: any) => {
                formData.append('images', file.originFileObj);
            });

            // Append each text file
            txtFileList.forEach((file: any) => {
                formData.append('txtFiles', file.originFileObj);
            });

            // Add schedule date and time
            formData.append('schedule_date', values.schedule_date.format('DD/MM/YYYY'));
            formData.append('schedule_time', values.schedule_time.format('HH:mm'));

            // Send the form data to the API
            const response = await fetch('http://192.168.18.45:5000/api/v1/posts/schedule', {
                method: 'POST',
                headers: {
                    'X-License-Key': 'your-license-key-here',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create schedule');
            }

            const data = await response.json();
            openNotification('success', data.message);
            // Redirect after successful scheduling
            router.push('/admin/scheduled-posts');
        } catch (err: any) {
            openNotification('error', err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleAccountSelect = (value: string) => {
        const selectedAccount = localData.find(account => account.id === Number(value));
        if (selectedAccount) {
            setSelectedAccessToken(selectedAccount.access_token); // Set selected access token
        }
    };

    return (
        <>
            {contextHolder} {/* To display notifications */}
            <div className="flex justify-center py-14">
                <Col xs={12}>
                    <Card className="shadow-md">
                        <Card.Meta
                            title={
                                <div className="text-2xl font-semibold text-black mb-3">
                                    <h1>Schedule Photo Upload</h1>
                                    <h1>Schedule Content</h1>
                                </div>
                            }
                        />
                        <Form
                            onFinish={handleSchedule}
                            className="p-10"
                            layout="vertical"
                            name="schedulePost"
                        >
                            <Item
                                name="accounts"
                                label="Select Accounts"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select an account!',
                                    },
                                ]}
                            >
                                <Select
                                    placeholder="Select an account"
                                    style={{ width: '100%', marginBottom: '16px' }}
                                    onChange={handleAccountSelect}
                                    loading={isLoading}
                                >
                                    {localData.map((account) => {
                                        const usersArray = account.users.split(','); // Split users by comma
                                        return usersArray.map((user: string, index: number) => (
                                            <Option key={`${account.id}-${index}`} value={account.id}>
                                                <UserOutlined style={{ marginRight: 8 }} />
                                                {user.trim()}
                                            </Option>
                                        ));
                                    })}
                                </Select>
                            </Item>

                            <Item
                                name="images"
                                label="Upload Images"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please upload images!',
                                    },
                                ]}
                            >
                                <Upload
                                    multiple
                                    maxCount={10} // Allow up to 10 images
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    onChange={handlePhotoChange} // Handle multiple photo uploads
                                >
                                    <Buttons icon={<UploadOutlined />}>Click to Upload</Buttons>
                                </Upload>
                            </Item>

                            <Item
                                name="txtFiles"
                                label="Upload .txt File"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please upload a .txt file!',
                                    },
                                ]}
                            >
                                <Upload
                                    multiple={false} // Only allow one .txt file
                                    beforeUpload={() => false}
                                    fileList={txtFileList}
                                    onChange={handleTxtChange}
                                    accept=".txt"
                                >
                                    <Buttons icon={<UploadOutlined />}>Click to Upload .txt</Buttons>
                                </Upload>
                            </Item>

                            <Item
                                name="schedule_date"
                                label="Schedule Date"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select a schedule date!',
                                    },
                                ]}
                            >
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    style={{ width: '100%' }}
                                    placeholder="Select a date"
                                />
                            </Item>

                            <Item
                                name="schedule_time"
                                label="Schedule Time"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please select a schedule time!',
                                    },
                                ]}
                            >
                                <DatePicker
                                    showTime
                                    format="HH:mm"
                                    placeholder="Select schedule time"
                                    style={{ width: '100%' }}
                                />
                            </Item>

                            <Buttons
                                type="primary"
                                htmlType="submit"
                                loading={formLoading}
                                className="w-full py-5"
                            >
                                Schedule Post
                            </Buttons>
                        </Form>

                        {/* Modal loading */}
                        <Modal
                            title="Scheduling Post"
                            visible={formLoading} // Pop-up shows when formLoading is true
                            footer={null}
                            closable={false}
                            className="flex flex-col justify-center text-center items-center"
                        >
                            <div className="mx-2 my-3">
                                <Spin /> {/* Loading spinner */}
                                <p>Please wait</p>
                            </div>
                        </Modal>
                    </Card>
                </Col>
            </div>
        </>
    );
}

export default SchedulePage;
