import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export default function GuestLayout() {
    const { user } = useAuth();
    if (user) {
        return <Navigate to='/' replace />
    }

    return <Outlet />
}