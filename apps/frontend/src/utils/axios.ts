import axios from 'axios'

export const api = axios.create({
    baseURL: import.meta.env?.VITE_API_URL ?? (import.meta.env?.DEV ? 'http://localhost:3000/api' : '/api'),
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// No token is accessible to JavaScript; the browser sends the HttpOnly cookie.
api.interceptors.response.use((res) => res.data, (err) => {
    return Promise.reject({
        ...(err.response?.data ?? { code: err.code ?? 'NETWORK_ERROR' }),
        status: err.response?.status,
        requestUrl: err.config?.url,
    });
});
