import { createBrowserRouter, Navigate } from 'react-router';
import AuthLayout from './layouts/AuthLayout';
import GuestLayout from './layouts/GuestLayout';
import AuthPage from './pages/AuthPage';
import TodoPage from './pages/TodoPage';
import SettingsPage from './pages/settings/SettingsPage';
import AppearancePage from './pages/settings/AppearancePage';
import LanguagePage from './pages/settings/LanguagePage';
import DevicesPage from './pages/settings/DevicesPage';
import HomePage from './pages/HomePage';
import HomeSettingsPage from './pages/settings/HomeSettingsPage';
import AccountPage from './pages/settings/AccountPage';
import SessionLayout from './layouts/SessionLayout';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';

const router = createBrowserRouter([
    {
        element: <SessionLayout />,
        children: [
            {
                path: '/auth',
                element: <GuestLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="/auth/login" replace />
                    },
                    {
                        path: 'login',
                        element: <AuthPage />
                    },
                    {
                        path: 'register',
                        element: <AuthPage />
                    }
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
                        element: <Navigate to="/settings/account" replace />
                    },
                    {
                        path: 'settings',
                        element: <SettingsPage />,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/settings/account" replace />
                            },
                            {
                                path: 'account',
                                element: <AccountPage />
                            },
                            {
                                path: 'home',
                                element: <HomeSettingsPage />
                            },
                            {
                                path: 'appearance',
                                element: <AppearancePage />
                            },
                            {
                                path: 'language',
                                element: <LanguagePage />
                            },
                            {
                                path: 'devices',
                                element: <DevicesPage />
                            }
                        ]
                    },
                    {
                        path: 'admin',
                        element: <AdminPage />
                    }
                ]
            },
            {
                path: '*',
                element: <NotFoundPage />
            }
        ]
    }
]);

export default router;
