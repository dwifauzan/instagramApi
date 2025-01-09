import { notification } from 'antd'
import Link from 'next/link'
import React from 'react'

const useCallback = () => {
    const [api, contextHolderRepost] = notification.useNotification()

    const callbackRepost = (
        type: 'error',
        message: string,
        description: string,
        linkText: string,
        linkHref: string
    ) => {
        api[type]({
            message,
            description: (
                <span>
                    {description}{' '}
                    <Link href={linkHref} passHref>
                        {linkText}
                    </Link>
                </span>
            ),
        })
    }

    return { callbackRepost, contextHolderRepost }
}

export default useCallback
