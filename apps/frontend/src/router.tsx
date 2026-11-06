import { createBrowserRouter, Navigate } from 'react-router'

import AuthLayout from './layouts/AuthLayout'
import GuestLayout from './layouts/GuestLayout'
import AuthPage from './pages/AuthPage'
import TodoPage from './pages/TodoPage'
import SettingsPage from './pages/SettingsPage'
import HomePage from './pages/HomePage'
import UserPage from './pages/UserPage'

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
        children: [
            {
                path: '/',
                element: <HomePage />
            },
            {
                path: 'todos',
                element: <TodoPage />
            },
            {
                path: 'account',
                element: <UserPage />
            },
            {
                path: 'settings',
                element: <SettingsPage />
            }
        ]
    }
]);

export default router;