import '@/styles/globals.css'; // Pastikan ini ada di atas
import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'

import { Provider } from 'react-redux'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import AdminLayout from './adminLayout'
import AuthLayout from './authLayout'
import { wrapper, store } from '../redux/store'
import '../i18n/config'

import { AuthContextProvider } from '../authentication/AuthContext'

function App({ Component, pageProps }: AppProps) {
    return (
        <>
               <UserProvider profileUrl="/hexadash-nextjs/api/auth/me">
                    <AuthContextProvider>
                        <AdminLayout>
                            <Component {...pageProps} />
                        </AdminLayout>
                    </AuthContextProvider>
                </UserProvider>
        </>
    )
}

export default wrapper.withRedux(App)
