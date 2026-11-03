import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'

export default function GuestLayout() {
    const user = useAuthStore((state) => state.user);
    if (user) {
        return <Navigate to='/' replace />
    }

    return <Outlet />
}