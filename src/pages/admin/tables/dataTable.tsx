import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { UilEye, UilEdit, UilTrash } from '@iconscout/react-unicons'
import { useSelector, useDispatch } from 'react-redux'
import { Row, Col, Table, Radio, Divider } from 'antd'
import { PageHeaders } from '@/components/page-headers'
import Heading from '@/components/heading'
import ProjectList from '../project/overview/ProjectList'

import { tableReadData } from '@/redux/data-filter/actionCreator'

function DataTables() {
    const dispatch = useDispatch()

    // Define types and interfaces
    interface User {
        id: number
        name: string
        country: string
        company: string
        position: string
        status: string
        date: string
    }

    interface TableDataItem {
        id: React.ReactNode
        user: React.ReactNode
        country: React.ReactNode
        company: React.ReactNode
        position: React.ReactNode
        date: React.ReactNode
        status: React.ReactNode
        action: React.ReactNode
    }

    interface RootState {
        dataTable: {
            tableData: User[]
        }
    }

    const [state, setState]: any = useState({
        selectionType: 'checkbox',
        selectedRowKeys: null,
        selectedRows: null,
        values: {},
    })

    const PageRoutes = [
        {
            path: 'index',
            breadcrumbName: 'Dashboard',
        },
        {
            path: 'first',
            breadcrumbName: 'Schedule',
        },
    ]

    useEffect(() => {
        if (dispatch) {
            // @ts-ignore
            dispatch(tableReadData())
        }
    }, [dispatch])

    const { tableData } = useSelector((states: RootState) => {
        return {
            tableData: states.dataTable.tableData,
        }
    })

    const tableDataSource: TableDataItem[] = tableData.map((item: User) => {
        const { id, name, country, company, position, status, date } = item
        return {
            key: id,
            id: (
                <span className="text-body dark:text-white/60 text-[15px] font-medium">{`#${id}`}</span>
            ),
            user: (
                <span className="text-body dark:text-white/60 text-[15px] font-medium">
                    {name}
                </span>
            ),
            country: (
                <span className="text-body dark:text-white/60 text-[15px] font-medium">
                    {country}
                </span>
            ),
            company: (
                <span className="text-body dark:text-white/60 text-[15px] font-medium">
                    {company}
                </span>
            ),
            position: (
                <span className="text-body dark:text-white/60 text-[15px] font-medium">
                    {position}
                </span>
            ),
            date: (
                <span className="text-body dark:text-white/60 text-[15px] font-medium">
                    {date}
                </span>
            ),
            status: (
                <span
                    className={`inline-flex items-center justify-center bg-${status}-transparent text-${status} min-h-[24px] px-3 text-xs font-medium rounded-[15px]`}
                >
                    {status}
                </span>
            ),
            action: (
                <div className="min-w-[150px] text-end -m-2">
                    <Link className="inline-block m-2" href="#">
                        <UilEye className="w-4 text-light-extra dark:text-white/60" />
                    </Link>
                    <Link className="inline-block m-2" href="#">
                        <UilEdit className="w-4 text-light-extra dark:text-white/60" />
                    </Link>
                    <Link className="inline-block m-2" href="#">
                        <UilTrash className="w-4 text-light-extra dark:text-white/60" />
                    </Link>
                </div>
            ),
        }
    })

    function onChange(pagination: any, filters: any, sorter: any, extra: any) {
        setState({ ...state, values: { pagination, filters, sorter, extra } })
    }

    return (
        <>
            <div className="min-h-[715px] lg:min-h-[580px] flex-1 h-auto px-8 xl:px-[15px] pb-[30px] bg-transparent pt-5">
                <>
                    <Row gutter={15}>
                        <Col xs={24} className="mb-[25px]">
                            <div className="bg-white dark:bg-white/10 m-0 p-0 mb-[25px] rounded-10 relative">
                                <div className="py-[16px] px-[25px] text-dark dark:text-white/[.87] font-medium text-[17px] border-regular dark:border-white/10 border-b">
                                    <Heading
                                        as="h4"
                                        className="text-lg font-medium mb-0"
                                    >
                                        Schedule Record
                                    </Heading>
                                </div>
                                <ProjectList />
                            </div>
                        </Col>
                    </Row>
                </>
            </div>
        </>
    )
}

export default DataTables
