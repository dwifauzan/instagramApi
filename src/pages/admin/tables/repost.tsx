import React, { useEffect, useState } from 'react';
import {
    Form,
    DatePicker,
    TimePicker,
    Button,
    Select,
    Row,
    Col,
    Card,
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

const RepostPage = () => {
    const [localData, setLocalData] = useState<LocalData[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [formLoading, setFormLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<string>('');
    const [captionText, setCaptionText] = useState<string>('');

    const { openNotificationWithIcon, contextHolder } = useNotification();
    const [form] = Form.useForm();

    const getLocalData = async () => {
        try {
            const response = await fetch('http://192.168.18.45:5000/api/v1/accounts');
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

    const getRepostMedia = () => {
        setMediaFiles('/hexadash-nextjs/repost/media-0.jpg');
        setCaptionText('Default caption'); // Ini bisa diubah sesuai dengan caption yang diambil dari sumber lain
    };

    useEffect(() => {
        getLocalData();
        getRepostMedia();
    }, []);

    const handleRepost = async (values: any) => {
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
            formData.append('schedule_date', values.schedule_date.format('DD/MM/YYYY'));
            formData.append('schedule_time', values.schedule_time.format('HH:mm'));
            formData.append('textareaValue', values.textareaValue);
            formData.append('location', values.location);

            const response = await axios.post(
                '/hexadash-nextjs/api/repostLoad',
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
                    'Failed to Repost',
                    error.message
                );
            } else {
                const result = response.data;
                openNotificationWithIcon(
                    'success',
                    'Success Repost',
                    result.message
                );

                form.resetFields();
                setSelectedAccounts([]);
            }
        } catch (err: any) {
            openNotificationWithIcon('error', 'Failed to Repost', err.message);
        } finally {
            setFormLoading(false);
            setIsModalVisible(false);
        }
    };

    return (
        <div>
            {contextHolder}
            <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-8 pb-12">
                <Row gutter={25}>
                    <Col sm={12} xs={18}>
                        <Card title="Repost" bordered={false} style={{ borderRadius: 8 }}>
                            <Form onFinish={handleRepost} layout="vertical">
                                <Form.Item label="Pilih Akun" name="accounts" rules={[{ required: true, message: 'Silakan pilih akun!' }]}>
                                    <Select placeholder="Pilih akun" onChange={setSelectedAccounts} style={{ width: '100%' }}>
                                        {localData.map((account) => (
                                            <Option key={account.id} value={account.id.toString()}>
                                                {account.users.split(',')[0].trim()}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item label="Masukkan Teks" name="textareaValue" rules={[{ required: true, message: 'Silakan masukkan teks!' }]}>
                                    <Input.TextArea rows={4} placeholder="Masukkan teks di sini..." />
                                </Form.Item>

                                <Button type="dashed" onClick={() => form.setFieldsValue({ textareaValue: captionText })}>
                                    Gunakan Caption
                                </Button>

                                <Form.Item label="Lokasi" name="location">
                                    <Input placeholder="Masukkan lokasi..." />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" loading={formLoading} block>
                                        Submit Repost
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>

                    {/* Preview Media */}
                    <Col sm={12} xs={24}>
                        <Card title="Pratinjau Media" bordered={false} style={{ borderRadius: 8 }}>
                            {mediaFiles && (
                                <img src={mediaFiles} alt="Pratinjau Media" style={{ width: '100%', borderRadius: 8 }} />
                            )}
                        </Card>
                    </Col>
                </Row>
            </main>

            <Modal
                visible={isModalVisible}
                footer={null}
                style={{ borderRadius: 12 }}
                bodyStyle={{ borderRadius: 12, padding: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
            >
                <Spin tip="Menunggu..." spinning={formLoading} />
            </Modal>
        </div>
    );
};

export default RepostPage;
