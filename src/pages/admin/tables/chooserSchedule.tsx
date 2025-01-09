import { Row, Col } from 'antd'
import { PageHeaders } from '@/components/page-headers'
import Link from 'next/link'
import Image from 'next/image'

function BlankPage() {
    const path = '/admin'
    const PageRoutes = [
        {
            path: 'index',
            breadcrumbName: 'Dashboard',
        },
        {
            path: '',
            breadcrumbName: 'Schedule Menu',
        },
    ]
    return (
        <>
            <PageHeaders
                routes={PageRoutes}
                title="Schedule Menu"
                className="flex  justify-between items-center px-8 xl:px-[15px] pt-[18px] pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
            />
            <main className="min-h-[715px] lg:min-h-[580px] bg-transparent px-8 pb-12">
                <Row gutter={25}>
                    <Col sm={12} xs={18}>
                        <Link href={`${path}/tables/schedule`}>
                            <div className="bg-white dark:bg-white/10 m-0 p-0 mb-[25px] rounded-10 relative">
                                <div className="p-[25px]">
                                    <Image src="https://img.freepik.com/free-vector/appointment-booking-mobile-phone-with-calendar_23-2148550000.jpg?t=st=1730102155~exp=1730105755~hmac=6702631bf2696197b5d799acb373b4f0c4b676a7c58bb97a73984cd88b735cff&w=740" width={430} height={230} alt=''/>
                                    <h1 className="mb-0 text-lg text-dark dark:text-white/60 capitalize">
                                        schedule biasa
                                    </h1>
                                    <span className='capitalize fs-4'>hanya bisa schedule 1 postingan dan pastikan anda sudah menyiapkan postigan</span>
                                </div>
                            </div>
                        </Link>
                    </Col>
                    <Col sm={12} xs={18}>
                        <div className="bg-white dark:bg-white/10 m-0 p-0 mb-[25px] rounded-10 relative">
                            <div className="p-[25px]">
                                <Image src="https://img.freepik.com/free-vector/blogging-isometric-concept-with-content-plan-making-process-3d-illustration_1284-55140.jpg?t=st=1730102135~exp=1730105735~hmac=20350ad6179fee3ee13647178630e2dfa6201ddc053b0ad78bb8955e2ca5844e&w=740" width={430} height={230} alt=''/>
                                <h1 className="mb-0 text-lg text-dark dark:text-white/60 capitalize">
                                    schedule massal
                                </h1>
                                <span className='capitalize fs-4'>Schedule Masssal, Sebelum anda menggunakan schedule massal pastikan anda membaca tata cara menggunakannya</span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </main>
        </>
    )
}

export default BlankPage
