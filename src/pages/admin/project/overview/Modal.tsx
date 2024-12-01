import React, { useEffect, useState } from 'react'
import {
    Modal,
    Form,
    Input,
    DatePicker,
    TimePicker,
    Button,
    Select,
} from 'antd'
import moment from 'moment'
import axios from 'axios'

interface ScheduleModalProps {
    visible: boolean
    onClose: () => void
    onSubmit: (data: {
        arsip_name: string
        captions: string
        access_token: string
        users: string
        schedule_date: string
        schedule_time: string
    }) => void
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [form] = Form.useForm()
    const [usersF, setUsersF] = useState<any[]>([]) // facebook
    const [usersI, setUsersI] = useState<[]>([]) // instagram
    const [fSelected, setFSelected] = useState<number>(0)

    useEffect(() => {
        const getUsers = async () => {
            try {
                const response = await axios.get(
                    'http://192.168.18.45:5000/api/v1/accounts'
                )
                setUsersF(response.data.data)
            } catch (error) {
                console.error('Error fetching users:', error)
            }
        }
        getUsers()
    }, [])

    const handleSelectF = (value: number) => {
        setFSelected(value)
        const userI = usersF.find((user: any) => user.id === value)
        setUsersI(userI.users.split(','))
    }

    const handleFinish = (values: any) => {
        const accessToken = usersF.find((user: any) => user.id === fSelected).access_toke6n
        console.log(accessToken)
        const data = {
            ...values,
            access_token: accessToken,  
            schedule_date: values.schedule_date.format('YYYY-MM-DD'),
            schedule_time: values.schedule_time.format('HH:mm'),
        }
        onSubmit(data)
        form.resetFields()
    }

    return (
        <Modal
            title="Schedule Post"
            visible={visible}
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item
                    label="Users Facebook"
                    name="users_facebook"
                    rules={[{ required: true, message: 'Please select users' }]}
                >
                    <Select placeholder="Select Users Facebook" onChange={handleSelectF}>
                        {usersF?.map((user: any) => (
                            <Select.Option value={user.id}>{user.name}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Users Instagram"
                    name="users_instagram"
                    rules={[{ required: true, message: 'Please select users' }]}
                >
                    <Select placeholder="Select Users Instagram">
                        {usersI?.map((user: any) => (
                            <Select.Option value={user}>{user}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Schedule Date"
                    name="schedule_date"
                    rules={[
                        { required: true, message: 'Please select a date' },
                    ]}
                >
                    <DatePicker format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item
                    label="Schedule Time"
                    name="schedule_time"
                    rules={[
                        { required: true, message: 'Please select a time' },
                    ]}
                >
                    <TimePicker format="HH:mm" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    )
}
export default ScheduleModal
