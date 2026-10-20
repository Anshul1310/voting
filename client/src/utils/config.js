// In local development, Vite proxy handles relative '/api' paths.
// In production on Vercel, set VITE_BACKEND_URL in Vercel Project Settings (e.g. https://api.yourdomain.com or http://<EC2-IP>:5000)
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
