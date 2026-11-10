import { createBrowserRouter, Navigate } from 'react-router'

import AuthLayout from './layouts/AuthLayout'
import GuestLayout from './layouts/GuestLayout'
import AuthPage from './pages/AuthPage'
import TodoPage from './pages/TodoPage'
import SettingsPage from './pages/SettingsPage'
import HomePage from './pages/HomePage'
import UserPage from './pages/UserPage'
import SessionLayout, { sessionLoader } from './layouts/SessionLayout'
import NotFoundPage from './pages/NotFoundPage'
import AdminPage from './pages/AdminPage'

const router = createBrowserRouter([{
    element: <SessionLayout />,
    loader: sessionLoader,
    shouldRevalidate: () => true,
    children: [
    {
        path: '/auth',
        element: <GuestLayout />,
        children: [
            {
                index: true,
                element: <Navigate to='/auth/login' replace />
            },
            {
                path: 'login',
                element: <AuthPage />
            },
            {
                path: 'register',
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
            },
            {
                path: 'admin',
                element: <AdminPage />
            }
        ]
    },
    { path: '*', element: <NotFoundPage /> }
    ]
}]);

export default router;