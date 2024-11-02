import React, { useEffect, useState } from 'react';
import {
    Form,
    DatePicker,
    TimePicker,
    Button,
    Upload,
    Select,
    Row,
    Col,
    Card,
    Switch,
    Input,
    Modal,
    Spin
} from 'antd';
import axios from 'axios';
import { useNotification } from '@/pages/admin/crud/axios/handler/error';

const { Option } = Select;

interface LocalData {
    id: number;
    name: string;
    access_token: string;
    users: string;
    expired_at: string;
    isActive: boolean;
}

const SchedulePage = () => {
    const [localData, setLocalData] = useState<LocalData[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [fileList, setFileList] = useState<any[]>([]);
    const [txtFileList, setTxtFileList] = useState<any[]>([]);
    const [formLoading, setFormLoading] = useState(false);
    const [formOutput, setFormOutput] = useState<any>(null);
    const [useTextarea, setUseTextarea] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const { openNotificationWithIcon, contextHolder } = useNotification();
    const [form] = Form.useForm();

    const getLocalData = async () => {
        try {
            const response = await fetch(
                'http://192.168.18.45:5000/api/v1/accounts'
            );
            const load = await response.json();
            const transformLoad = load.data.map((item: any) => ({
                ...item,
                id: item.id,
            }));
            setLocalData(transformLoad);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        getLocalData();
    }, []);

    const handleFileChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList);
    };

    const handleTxtChange = ({ fileList: newTxtFileList }: any) => {
        setTxtFileList(newTxtFileList);
    };

    const handleAccountChange = (selectedAccountId: string) => {
        setSelectedAccounts([selectedAccountId]);
        const users: string[] = [];
        const account = localData.find(
            (item) => item.id.toString() === selectedAccountId
        );
        if (account) {
            const accountUsers = account.users
                .split(',')
                .map((user) => user.trim());
            users.push(...accountUsers);
        }
        setSelectedUsers(users);
    };

    const handleSchedule = async (values: any) => {
        setFormLoading(true);
        setIsModalVisible(true);

        try {
            const selectedAccountData = localData.find((account) =>
                selectedAccounts.includes(account.id.toString())
            );
            if (!selectedAccountData) {
                openNotificationWithIcon(
                    'error',
                    'Undefined Account',
                    'Akun tidak ditemukan'
                );
                return;
            }

            const accessToken = selectedAccountData.access_token;

            const formData = new FormData();
            formData.append('access_token', accessToken);
            formData.append('users', JSON.stringify(selectedUsers));
            formData.append(
                'schedule_date',
                values.schedule_date.format('DD/MM/YYYY')
            );
            formData.append(
                'schedule_time',
                values.schedule_time.format('HH:mm')
            );

            fileList.forEach((file) => {
                formData.append('media', file.originFileObj);
            });

            if (!useTextarea && txtFileList.length > 0) {
                txtFileList.forEach((file) => {
                    formData.append('txtFiles', file.originFileObj);
                });
            } else if (useTextarea) {
                const textareaValue = values.textareaValue || '';
                const blob = new Blob([textareaValue], { type: 'text/plain' });
                formData.append('txtFiles', blob, 'custom.txt');
            }

            const response = await axios.post(
                '/hexadash-nextjs/api/schedule',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.status !== 200) {
                const error = response.data;
                openNotificationWithIcon(
                    'error',
                    'Failed Schedule',
                    error.message
                );
            }

            const result = response.data;
            openNotificationWithIcon(
                'success',
                'Success Schedule',
                result.message
            );

            // Reset form fields
            form.resetFields();
            setFileList([]);
            setTxtFileList([]);
            setSelectedAccounts([]);
            setSelectedUsers([]);
        } catch (err: any) {
            openNotificationWithIcon('error', 'Failed Schedule', err.message);
        } finally {
            setFormLoading(false);
            setIsModalVisible(false);
        }
    };

    const validasiTxt = (file: File) => {
        const isTxt = file.type === 'text/plain';
        if (!isTxt) {
            openNotificationWithIcon(
                'error',
                'Failed Schedule',
                'Hanya format txt selain itu tidak dapat diterima!'
            );
            return Upload.LIST_IGNORE;
        }
        return isTxt;
    };

    return (
        <div>
            {contextHolder}
            <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-8 pb-12">
                <Row gutter={25}>
                    <Col sm={12} xs={18}>
                        <Card title="Jadwalkan Postingan" bordered={false} style={{ borderRadius: 8 }}>
                            <Form onFinish={handleSchedule} layout="vertical">
                                {/* Select Account */}
                                <Form.Item label="Pilih Akun" name="accounts" rules={[{ required: true, message: 'Silakan pilih akun!' }]}>
                                    <Select placeholder="Pilih akun" onChange={handleAccountChange} style={{ width: '100%' }}>
                                        {localData.map((account) => {
                                            const usersArray = account.users.split(',');
                                            return usersArray.map((user: string, index: number) => (
                                                <Option key={`${account.id}-${index}`} value={account.id.toString()}>
                                                    {user.trim()}
                                                </Option>
                                            ));
                                        })}
                                    </Select>
                                </Form.Item>

                                {/* Date Picker */}
                                <Form.Item label="Jadwal Tanggal" name="schedule_date" rules={[{ required: true, message: 'Silakan pilih tanggal!' }]}>
                                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                                </Form.Item>

                                {/* Time Picker */}
                                <Form.Item label="Jadwal Waktu" name="schedule_time" rules={[{ required: true, message: 'Silakan pilih waktu!' }]}>
                                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                                </Form.Item>

                                {/* Upload Image/Video */}
                                <Form.Item label="Upload Gambar/Video">
                                    <Upload fileList={fileList} beforeUpload={() => false} onChange={handleFileChange} showUploadList={{ showRemoveIcon: true }}>
                                        <Button>+ Pilih File</Button>
                                    </Upload>
                                </Form.Item>

                                {/* Switch for .txt file or textarea */}
                                <Form.Item label="Gunakan Textarea?">
                                    <Switch checked={useTextarea} onChange={setUseTextarea} />
                                </Form.Item>

                                {/* Conditional input for .txt */}
                                {useTextarea ? (
                                    <Form.Item label="Masukkan Text untuk .txt" name="textareaValue" rules={[{ required: true, message: 'Silakan masukkan teks!' }]}>
                                        <Input.TextArea rows={4} placeholder="Masukkan teks di sini..." />
                                    </Form.Item>
                                ) : (
                                    <Form.Item label="Upload File .txt">
                                        <Upload fileList={txtFileList} beforeUpload={validasiTxt} onChange={handleTxtChange} showUploadList={{ showRemoveIcon: true }}>
                                            <Button>+ Pilih File .txt</Button>
                                        </Upload>
                                    </Form.Item>
                                )}

                                {/* Submit Button */}
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" loading={formLoading} block>
                                        Submit Jadwal
                                    </Button>
                                </Form.Item>
                            </Form>

                            {formOutput && (
                                <div style={{ marginTop: '20px', border: '1px solid #ccc', borderRadius: 8, padding: '10px' }}>
                                    <h3>Output Form:</h3>
                                    <pre>{JSON.stringify(formOutput, null, 2)}</pre>
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </main>

            <Modal
                visible={isModalVisible}
                footer={null} // Remove footer buttons
                style={{ borderRadius: 12 }} // Style modal to look like a card
                bodyStyle={{ borderRadius: 12, padding: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }} // Add shadow and padding
            >
                <Spin tip="Menunggu..." spinning={formLoading} />
            </Modal>
        </div>
    );
};

export default SchedulePage;
