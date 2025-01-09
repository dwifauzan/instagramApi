import {
    UilArrowGrowth,
    UilSearch,
    UilServer,
    UilInstagram,
    UilEllipsisV,
    UilEdit,
    UilCheckSquare,
} from '@iconscout/react-unicons'
import React, { useState, useEffect } from 'react'
import { Menu } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import versions from '../demoData/changelog.json'
import { useDispatch, useSelector } from 'react-redux'

import {
    changeMenuMode,
    changeDirectionMode,
    changeLayoutMode,
} from '../redux/themeLayout/actionCreator'

function MenuItems() {
    const path = '/admin'
    const { t } = useTranslation()

    interface RootState {
        ChangeLayoutMode: {
            topMenu: string
        }
    }

    const { topMenu } = useSelector((state: RootState) => {
        return {
            topMenu: state.ChangeLayoutMode.topMenu,
        }
    })

    const router = useRouter()
    const { pathname } = router
    const pathArray = pathname && pathname !== '/' ? pathname.split(path) : []
    const mainPath = pathArray.length > 1 ? pathArray[1] : ''
    const mainPathSplit = mainPath.split('/')

    const [openKeys, setOpenKeys] = React.useState(
        !topMenu
            ? [`${mainPathSplit.length > 2 ? mainPathSplit[1] : 'dashboard'}`]
            : []
    )
    const [openItems, setOpenItems] = React.useState(
        !topMenu
            ? [
                  `${mainPathSplit.length === 1 ? 'demo-1' : mainPathSplit.length === 2 ? mainPathSplit[1] : mainPathSplit[2]}`,
              ]
            : []
    )

    useEffect(() => {
        // Check if the current route matches the base path.
        if (pathname === path) {
            setOpenKeys(['dashboard']) // active menu key.
            setOpenItems(['demo-1']) // active menu item.
        }
    }, [pathname])

    const onOpenChange = (keys: string[]) => {
        setOpenKeys(
            keys[keys.length - 1] !== 'recharts' && keys.length > 0
                ? [keys[keys.length - 1]]
                : keys
        )
    }

    const onClick = (item: any) => {
        setOpenItems([item.key])
        if (item.keyPath.length === 1) setOpenKeys([])
    }

    const dispatch = useDispatch()

    const changeNavbar = (topMode: boolean) => {
        const html: HTMLElement | null = document.querySelector('html')
        if (html) {
            if (topMode) {
                html.classList.add('hexadash-topmenu')
            } else {
                html.classList.remove('hexadash-topmenu')
            }
        }
        //@ts-ignore
        dispatch(changeMenuMode(topMode))
    }

    const changeLayoutDirection = (rtlMode: boolean) => {
        if (rtlMode) {
            const html: HTMLElement | null = document.querySelector('html')

            if (html) {
                html.setAttribute('dir', 'rtl')
            }
        } else {
            const html: HTMLElement | null = document.querySelector('html')

            if (html) {
                html.setAttribute('dir', 'ltr')
            }
        }
        //@ts-ignore
        dispatch(changeDirectionMode(rtlMode))
    }

    const changeLayout = (mode: string) => {
        //@ts-ignore
        dispatch(changeLayoutMode(mode))
    }

    const darkmodeActivated = () => {
        document.body.classList.add('dark')
    }

    const darkmodeDiactivated = () => {
        document.body.classList.remove('dark')
    }

    function getItem(
        label: React.ReactNode,
        key: string,
        icon: any,
        children: any
    ) {
        return {
            label,
            key,
            icon,
            children,
        }
    }

    const items = [
        getItem(
            !topMenu && (
                <p className="flex text-[12px] font-medium uppercase text-theme-gray mt-[20px] dark:text-white/60 pe-[15px]">
                    {t('application')}
                </p>
            ),
            'app-title',
            null,
            null
        ),

        getItem(t('Interact'), 'axios', !topMenu && <UilInstagram />, [
            getItem(
                <Link href={`${path}/crud/axios`}>
                    {t('All')} {t('Account')}
                </Link>,
                'axios-view',
                !topMenu && (
                    <Link
                        className="menuItem-icon"
                        href={`${path}/tables/dataTable`}
                    >
                        <UilCheckSquare />
                    </Link>
                ),
                null
            ),
            getItem(
                <Link href={`${path}/crud/axios/login`}>
                    {t('Login')} {t('Account')}
                </Link>,
                'axios-login',
                !topMenu && (
                    <Link
                        className="menuItem-icon"
                        href={`${path}/tables/dataTable`}
                    >
                        <UilCheckSquare />
                    </Link>
                ),
                null
            ),
        ]),
        getItem(
            <Link href={`${path}/pages/search`}>
                {t('Search')} {t('Results')}
            </Link>,
            'search',
            !topMenu && (
                <Link className="menuItem-icon" href={`${path}/pages/search`}>
                    <UilSearch />
                </Link>
            ),
            null
        ),
        getItem(
            <Link href={`${path}/tables/dataTable`}>
                {t('Arsip')}
            </Link>,
            'dataTable',
            !topMenu && (
                <Link
                    className="menuItem-icon"
                    href={`${path}/tables/dataTable`}
                >
                    <UilServer />
                </Link>
            ),
            null
        ),
        getItem(
            <Link href={`${path}/crud/axios/accountMeta`}>
                {t('Account Meta')}
            </Link>,
            'AccountMeta',
            !topMenu && (
                <Link
                    className="menuItem-icon"
                    href={`${path}/crud/axios/accountMeta`}
                >
                    <UilEdit />
                </Link>
            ),
            null
        ),
        //backup
        // getItem(
        //     <Link href={`${path}/tables/schedule`}>
        //         {t('Schedule')}
        //     </Link>,
        //     'schedule',
        //     !topMenu && (
        //         <Link
        //             className="menuItem-icon"
        //             href={`${path}/tables/schedule`}
        //         >
        //             <UilEdit />
        //         </Link>
        //     ),
        //     null
        // ),
        getItem(
            <Link href={`${path}/pages/changelog`}>
                {t('changelog')}
                <span className="badge badge-primary menuItem">
                    {versions[0].version}
                </span>
            </Link>,
            'changelog',
            !topMenu && <UilArrowGrowth />,
            null
        ),
    ]

    return (
        <Menu
            onClick={onClick}
            onOpenChange={onOpenChange}
            mode={
                !topMenu || window.innerWidth <= 991 ? 'inline' : 'horizontal'
            }
            defaultSelectedKeys={openKeys}
            defaultOpenKeys={openItems}
            overflowedIndicator={<UilEllipsisV />}
            openKeys={openKeys}
            selectedKeys={openItems}
            items={items}
        />
    )
}

export default MenuItems
