import Image from 'next/image'

import backgroundImage from '../../public/img/admin-bg-light.png'

const AuthLayout = ({ children }: { children: React.ReactNode }) => {

    return (
        <div
            style={{
                backgroundImage: `url(${backgroundImage.src})`,
            }}
            className="bg-top bg-no-repeat"
        >
            <div className="py-[120px] 2xl:py-[80px] px-[15px]">
                <div className="flex justify-center">
                    <Image
                        className="dark:hidden"
                        src="/hexadash-nextjs/img/logo_dark.svg"
                        alt="Logo Dark"
                        width="140"
                        height="32"
                    />
                    <Image
                        className="hidden dark:block"
                        src="/hexadash-nextjs/img/logo_white.svg"
                        alt="Logo"
                        width="140"
                        height="32"
                    />
                </div>
                {children}
            </div>
        </div>
    )
}

export default AuthLayout
