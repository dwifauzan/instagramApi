import React, { useEffect, useState } from 'react'
import DemoOne from './admin'
import { Button, Modal } from 'antd'
import { useRouter } from 'next/router'

interface Props {
    visible: boolean
    onConfirm: () => void
    onCancel: () => void
}

const RepostNotificationModal: React.FC<Props> = ({
    visible,
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal
            title="Pemberitahuan Repost"
            open={visible}
            onOk={onConfirm}
            onCancel={onCancel}
            okText="Lanjutkan Repost"
            cancelText="Batalkan"
        >
            <p>
                Anda sebelumnya sudah mencoba melakukan repost namun gagal.
                Apakah Anda ingin melanjutkan repost ini?
            </p>
        </Modal>
    )
}

const Home = () => {
    const router = useRouter()
    const [isModalVisible, setIsModalVisible] = useState(false)

    useEffect(() => {
        const retryRepost = localStorage.getItem('retry-repost-route')
        if (retryRepost) {
            setIsModalVisible(true)
        }
    }, [])

    const handleConfirm = () => {
        // Logika untuk melanjutkan repost
        router.push('/admin/tables/repost')
        setIsModalVisible(false)
    }

    const handleCancel = () => {
        console.log('User memutuskan untuk membatalkan repost.')
        setIsModalVisible(false)
    }

    if (isModalVisible) {
        return (
            <RepostNotificationModal
                visible={isModalVisible}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        )
    }

    return
}

export default Home
