import 'react-lightbox-pack';
import '@/styles/globals.css'; // Pastikan ini ada di atas
import type { AppProps } from 'next/app'
import {DataProvider} from '@/components/table/detailProvider'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import AdminLayout from './adminLayout'
import { wrapper } from '../redux/store'
import '../i18n/config'

import { AuthContextProvider } from '../authentication/AuthContext'

function App({ Component, pageProps }: AppProps) {
    return (
        <>
               <UserProvider profileUrl="/hexadash-nextjs/api/auth/me">
                    <AuthContextProvider>
                        <AdminLayout>
                            <DataProvider>
                                <Component {...pageProps} />
                            </DataProvider>
                        </AdminLayout>
                    </AuthContextProvider>
                </UserProvider>
        </>
    )
}

export default wrapper.withRedux(App);
