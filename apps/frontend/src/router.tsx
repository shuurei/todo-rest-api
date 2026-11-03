import { createBrowserRouter, Navigate } from 'react-router'

import AuthLayout from './layouts/AuthLayout'
import GuestLayout from './layouts/GuestLayout'
import AuthPage from './pages/AuthPage'

const router = createBrowserRouter([
    {
        path: '/auth',
        element: <GuestLayout />,
        children: [
            {
                index: true,
                element: <Navigate to='/auth/login' replace />
            },
            {
                path: ':type',
                element: <AuthPage />
            },
        ]
    },
    {
        path: '/',
        element: <AuthLayout />,
        children: []
    }
]);

export default router;