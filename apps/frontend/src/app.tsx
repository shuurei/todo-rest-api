import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import router from './router';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MiniAppProvider } from './contexts/MiniAppContext';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <ThemeProvider>
                <MiniAppProvider>
                    <RouterProvider router={router} />
                </MiniAppProvider>
            </ThemeProvider>
        </AuthProvider>
    </StrictMode>
);
