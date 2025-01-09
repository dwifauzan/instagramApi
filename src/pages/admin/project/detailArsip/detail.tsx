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
    Switch,
    Checkbox,
} from 'antd'
import DataTable from '@/components/table/DataTable'
import Link from 'next/link'
import { UilExclamationTriangle } from '@iconscout/react-unicons'
import { PageHeaders } from '@/components/page-headers'
import { useData } from '@/components/table/detailProvider'
import moment from 'moment'
import useNotification from '../../crud/axios/handler/error'

interface FolderArsip {
    id: number
    detail_content: { file_path: string; media_type: number }
    caption: string
    like: number
    coment: number
    sumber: string
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
    const [isSwitched, setIsSwitched] = useState(false)
    const [usersF, setUsersF] = useState<any[]>([]) // facebook
    const [usersI, setUsersI] = useState<[]>([]) // instagram
    const [fSelected, setFSelected] = useState<number>(0)
    const [promotionChecked, setPromotionChecked] = useState(false);
    const [watermarkChecked, setWatermarkChecked] = useState(false);
    const [setErrorModal, setSetErrorModal] = useState(false)
    const { openNotificationWithIcon, contextHolder } = useNotification()
    const [modalLoading, setModalLoading] = useState(false)
    const [refreshData, setRefreshData] = useState(false) // Tambahkan state ini untuk memicu reload DataTable

    console.log(data)
    useEffect(() => {
        const timer = setTimeout(() => {
            try{
                setDelayedData(data?.folder_arsip || [])
                setLoading(false)
                setRefreshData(false)
            }catch(err){
                setSetErrorModal(true)
            }
        }, 2000)

        return () => clearTimeout(timer)
    }, [data, refreshData])

    useEffect(() => {
        const getUsers = async () => {
            try {
                const response = await (window as any).electron.getAllUsers();
                console.log('Raw response:', response);
                
                if (Array.isArray(response)) {
                    setUsersF(response);
                } else if (response && typeof response === 'object' && response.data) {
                    setUsersF(Array.isArray(response.data) ? response.data : []);
                } else {
                    console.error('Unexpected response format:', response);
                    setUsersF([]);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                setUsersF([]);
            }
        };

        getUsers();
    }, []);

    useEffect(() => {
        console.log('Current usersF state:', usersF);
    }, [usersF]);

    const handleSelectF = (value: number) => {
        setFSelected(value);
        const selectedUser = usersF.find((user) => user.id === value);
        if (selectedUser && selectedUser.AccountFacebook) {
            const instagramUsers = selectedUser.AccountFacebook.userInstagram
                ? selectedUser.AccountFacebook.userInstagram.split(',').map((user: string) => user.trim()).filter((user: string) => user)
                : [];
            setUsersI(instagramUsers);
            console.log('Selected Facebook user:', selectedUser);
            console.log('Extracted Instagram users:', instagramUsers);
        }
    };

    const getLocalData = async () => {
        try {
            const response = await (window as any).electron.getAllUsers()
            const transformLoad = response.data.map((item: any) => ({
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
    ]

    const handleSchedule = async (values: any) => {
        setModalLoading(true);
        console.log()
        try {
            const selectedUser = usersF.find((user) => user.id === fSelected);
            const accessToken = selectedUser?.AccountFacebook?.access_token;
            // Menyiapkan payload untuk dikirim ke endpoint
            const dataArsip = {
                folderArsip: delayedData,
                date: values.schedule_date.format('DD/MM/YYYY'),
                time: values.schedule_time.format('HH:mm'),
                access_token: accessToken,
                users: values.users_instagram,
                perpostingan: values.batas_postingan,
                promotion: promotionChecked ? values.users_instagram : '',
                source: isSwitched ? values.source : '',
                sumber: watermarkChecked ? values.watermark : ''
            };
            
            console.log(dataArsip);
            const response = await (window as any).electron.handleArsip(dataArsip);
            openNotificationWithIcon('success', 'Success Schedule', response.data.message);
            form.resetFields();
            setRefreshData(true);
        } catch (error: any) {
            if (error.response) {
                openNotificationWithIcon('error', 'Failed Schedule', error.response.message);
            }
            setRefreshData(true);
        } finally {
            setModalLoading(false);
            setModalVisible(false);
            setRefreshData(true);
        }
    };

    const handleDateChange = (date: moment.Moment | null) => {
        setScheduledDate(date)
    }

    const handleTimeChange = (time: moment.Moment | null) => {
        setScheduledTime(time)
    }

    const handlePromotionChange = (checked: boolean) => {
        setPromotionChecked(checked);
    };

    const handleWatermarkChange = (checked: boolean) => {
        setWatermarkChecked(checked);
    };

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
            <Modal 
                visible={modalVisible} 
                footer={false}
                width={600}
                className="schedule-modal"
                onCancel={() => setModalVisible(false)}
            >
                <Spin spinning={modalLoading} tip="Mohon Tunggu....">
                    <div className="p-6">
                        {/* Header */}
                        <div className="mb-6 border-b pb-4">
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                Jadwalkan Arsip
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Atur jadwal posting konten arsip Anda
                            </p>
                        </div>

                        {/* Form */}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSchedule}
                            className="space-y-4"
                        >
                            {/* Account Selection Section */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                                    Pilih Akun
                                </h3>
                                <Form.Item
                                    name="users_facebook"
                                    label="Akun Facebook"
                                    rules={[{ required: true, message: 'Pilih akun Facebook!' }]}
                                >
                                    <Select
                                        placeholder="Pilih akun Facebook"
                                        onChange={handleSelectF}
                                        className="w-full"
                                    >
                                        {usersF.map((user) => (
                                            <Select.Option key={user.id} value={user.id}>
                                                {user.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="users_instagram"
                                    label="Akun Instagram"
                                    rules={[{ required: true, message: 'Pilih akun Instagram!' }]}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Pilih akun Instagram"
                                        options={usersI.map((user) => ({
                                            value: user,
                                            label: user,
                                        }))}
                                        disabled={!fSelected}
                                        notFoundContent={
                                            fSelected 
                                                ? "Tidak ada akun Instagram" 
                                                : "Pilih akun Facebook terlebih dahulu"
                                        }
                                        className="w-full"
                                    />
                                </Form.Item>
                            </div>

                            {/* Schedule Section */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                                    Pengaturan Jadwal
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item
                                        name="schedule_date"
                                        label="Tanggal"
                                        rules={[{ required: true, message: 'Tentukan tanggal!' }]}
                                    >
                                        <DatePicker
                                            format="DD/MM/YYYY"
                                            className="w-full"
                                            inputReadOnly
                                            disabledDate={(current) => {
                                                const today = moment().startOf('day')
                                                const maxDate = moment().add(30, 'days').endOf('day')
                                                return current && (current < today || current > maxDate)
                                            }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="schedule_time"
                                        label="Waktu"
                                        rules={[{ required: true, message: 'Tentukan waktu!' }]}
                                    >
                                        <TimePicker
                                            format="HH:mm"
                                            className="w-full"
                                            inputReadOnly
                                            hideDisabledOptions
                                        />
                                    </Form.Item>
                                </div>

                                <Form.Item
                                    name="batas_postingan"
                                    label="Jumlah Postingan per Hari"
                                    rules={[{ required: true, message: 'Tentukan jumlah postingan!' }]}
                                >
                                    <Input
                                        type="number"
                                        max={20}
                                        className="w-full"
                                        suffix="post/hari"
                                        onInput={(e) => {
                                            const input = e.target as HTMLInputElement
                                            if (parseInt(input.value) > 20) input.value = '20'
                                            input.value = input.value.slice(0, 2)
                                        }}
                                    />
                                </Form.Item>
                            </div>

                            {/* Additional Options */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">
                                    Opsi Tambahan
                                </h3>
                                
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Caption tambahan
                                        </span>
                                        <Switch 
                                            checked={isSwitched} 
                                            onChange={(checked) => setIsSwitched(checked)}
                                        />
                                    </div>
                                    
                                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        Catatan: Gunakan {'{[username]}'} untuk mencantumkan account. 
                                        Account dipilih berdasarkan user Instagram yang telah dipilih.
                                    </div>
                                    
                                    {isSwitched && (
                                        <Form.Item name='source'>
                                            <Input 
                                                placeholder="Masukkan caption tambahan" 
                                                className="mt-2"
                                            />
                                        </Form.Item>
                                    )}
                                </div>

                                <Form.Item className="mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Tambahkan Sumber postingan pada media
                                        </span>
                                        <Switch 
                                            checked={watermarkChecked} 
                                            onChange={(checked) => setWatermarkChecked(checked)}
                                        />
                                    </div>

                                    <div className="text-sm text-gray-600 dark:text-gray-300 italic">
                                        Catatan: Gunakan {`[sumber]`} untuk mencantumkan sumber postingan
                                    </div>
                                    
                                    {watermarkChecked && (
                                        <Form.Item name='watermark'>
                                            <Input 
                                                placeholder="Masukan teks watermark" 
                                                className="mt-2"
                                            />
                                        </Form.Item>
                                    )}
                                </Form.Item>

                                <Form.Item name="promotion_options" className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            onChange={(e) => handlePromotionChange(e.target.checked)}
                                            className="text-sm text-gray-600 dark:text-gray-300"
                                        >
                                            {`ubah @account dengan account kita`}
                                        </Checkbox>
                                    </div>
                                </Form.Item>
                            </div>

                            {/* Action Buttons */}
                            <Form.Item>
                                <div className="flex justify-end space-x-4 pt-4 border-t">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={modalLoading}
                                        className="px-6 w-full"
                                    >
                                        Jadwalkan
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    </div>
                </Spin>
            </Modal>

            <Modal
                title={null}
                visible={setErrorModal}
                footer={null}
                centered
                closable={false}
                className="error-modal"
                width={400}
            >
                <div className="text-center p-6">
                    {/* Error Icon */}
                    <div className="mb-4">
                        <UilExclamationTriangle 
                            className="text-red-500 w-16 h-16 mx-auto" 
                        />
                    </div>

                    {/* Error Title */}
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Terjadi Kesalahan
                    </h3>

                    {/* Error Message */}
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Maaf, terjadi masalah saat memproses permintaan Anda.
                        Silakan coba kembali ke menu arsip.
                    </p>

                    {/* Action Button */}
                    <Link href='/admin/tables/dataTable'>
                        <Button 
                            type='primary' 
                            danger
                            className="min-w-[200px] h-[40px] rounded-lg font-medium"
                        >
                            Kembali ke Menu Arsip
                        </Button>
                    </Link>
                </div>
            </Modal>
        </>
    )
}

export default ProjectDetail
