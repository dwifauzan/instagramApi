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
import useNotification from '@/pages/admin/crud/axios/handler/error'
import { useRouter } from 'next/router'

const { Option } = Select

interface LocalData {
    id: number
    name: string
    access_token: string
    userInstagram: string
    expired_at: string
    isActive: boolean
    AccountFacebook?: {
        userInstagram: string
        access_token: string // Tambahkan ini
    }
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
                const response = await (window as any).electron.getAllUsers()
                if (Array.isArray(response)) {
                    setUsersF(response)
                } else if (
                    response &&
                    typeof response === 'object' &&
                    response.data
                ) {
                    setUsersF(Array.isArray(response.data) ? response.data : [])
                } else {
                    console.error('Unexpected response format:', response)
                    setUsersF([])
                }
            } catch (error) {
                console.error('Error fetching users:', error)
                setUsersF([])
            }
        }
        getUsers()
    }, [])

    const getRepostMedia = async () => {
        try {
            const transformUrl = JSON.parse(url as string)
            console.log('transformUrl:', transformUrl) // Log seluruh objek

            // Periksa apakah 'url' ada di dalam objek
            if (!transformUrl) {
                console.error(
                    'Properti "url" tidak ditemukan dalam objek transformUrl'
                )
                return
            }

            // Cek apakah 'url' berupa array atau string
            const mediaUrl = Array.isArray(transformUrl)
                ? transformUrl[0] // Ambil URL pertama jika berupa array
                : transformUrl || '' // Jika bukan array, langsung gunakan string URL

            console.log(typeof mediaUrl)

            setMediaFiles(mediaUrl)
        } catch (err: any) {
            console.error('Error parsing URL:', err)
        }
    }

    useEffect(() => {
        getRepostMedia()
        if (url && typeof url === 'string') {
            if (url.includes('.mp4')) {
                setMediaFiles(url)
            } else {
                setMediaFiles(url)
            }
        }
    }, [url])

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
        if (selectedUser && selectedUser.AccountFacebook) {
            const instagramUsers = selectedUser.AccountFacebook.userInstagram
                ? selectedUser.AccountFacebook.userInstagram
                      .split(',')
                      .map((user: string) => user.trim())
                      .filter((user: string) => user)
                : []
            setUsersI(instagramUsers)
        }
    }

    const [replaceAccount, setReplaceAccount] = useState(false) // State untuk checkbox

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReplaceAccount(e.target.checked)
    }

    let trueCaption = captionText
    const replaceAccountInCaption = (caption: string, accountName: string) => {
        try{
            openNotificationWithIcon(
                'success',
                'report use new @',
                'berhasil mengganti account dengan yang baru'
            )
            const regexSymbol = /@(\w+)/g 
            trueCaption = trueCaption.replace(regexSymbol, (match) => {
                const matched = match.substring(1)
                if(matched === router.query.username){
                    return match
                }
                return `@${accountName}`
            })
            console.log('ini yang replaceAccountInCaption ', trueCaption)
        }catch(error){
            openNotificationWithIcon(
                'error',
                'report use new @',
                'gagal mengganti account dengan yang baru'
            )
        }
    }
    const replaceAccountInSymbol = (caption: string, accountName: string) => {
        try{
            openNotificationWithIcon(
              'success',
              'report success change symbol',
              'berhasil mengubah symbol ke account'
            )
            const regexReplace = /{\[(.*?)\]}/g
            trueCaption = trueCaption.replace(regexReplace, `@${accountName}`)
            console.log('ini yang replaceAccountInSymbol ', trueCaption)
        }catch(error){
            openNotificationWithIcon(
                'error',
                'report failed change symbol',
                'gagal mengubah symbol ke account'
            )
        }
    }
    const sumberPost = () => {
        try{
        openNotificationWithIcon('success', 'report success use credit', 'berhasil menggunakan account sumber postingan')
        const sumberAccount = `${captionText}\n\nSumber postingan @${router.query.username}`
        setCaptionText(sumberAccount)
        }catch(error){
          openNotificationWithIcon('error','report failed use credit', 'terjadi kesalahan saat apply')
        }
      }

    const handleRepost = async (values: any) => {
        setFormLoading(true)
        setIsModalVisible(true)

        try {
            const selectedUser = usersF.find((user) => user.id === fSelected)
            const accountName = values.users_instagram // Ambil nama akun dari selectedUser
            const accessToken = selectedUser?.AccountFacebook?.access_token
            await new Promise((resolve) => setTimeout(resolve, 2000))
            replaceAccountInCaption(captionText, accountName)
            await new Promise((resolve) => setTimeout(resolve, 2000))
            replaceAccountInSymbol(captionText, accountName)
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const dataRepostL = {
                access_token: accessToken,
                users: values.users_instagram, // Akun Instagram yang dipilih
                caption: trueCaption,
                mediaFiles: JSON.parse(url as string),
            }
            console.log(dataRepostL.mediaFiles)
            const response = await (window as any).electron.handleRepostLangsung(dataRepostL)

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
                                        {usersF.map((user) => (
                                            <Select.Option
                                                key={user.id}
                                                value={user.id}
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
                                        options={usersI.map((user) => ({
                                            value: user,
                                            label: user,
                                        }))}
                                        disabled={!fSelected}
                                        notFoundContent={
                                            fSelected
                                                ? 'No Instagram accounts found'
                                                : 'Please select Facebook account first'
                                        }
                                    />
                                </Form.Item>
                                <p>Catatan :</p>
                                <span>{'Silahkan inputkan {[username]} pada caption untuk menambahkan username sesuai dengan username yang di posting'}</span>
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
                                <Button type='default' onClick={sumberPost} className='mt-2'>
                                  Sumber Postingan
                                </Button>
                                <input
                                    type="checkbox"
                                    checked={replaceAccount}
                                    onChange={handleCheckboxChange}
                                />
                                Replace Account dengan Account anda
                                <Form.Item label="Lokasi" name="location">
                                    <Input placeholder="Masukkan lokasi..." />
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
