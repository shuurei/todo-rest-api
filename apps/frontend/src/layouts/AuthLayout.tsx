import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth.store'

export default function AuthLayout() {
    const user = useAuthStore((state) => state.user);
    if (!user) {
        return <Navigate to='/auth/login' replace />
    }

    return <Outlet />
}