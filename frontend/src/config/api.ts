/**
 * API Base URL resolver.
 * In production (Vercel), routes through Vercel's same-origin reverse proxy (/api/...)
 * to completely eliminate Wi-Fi router / ISP security blocks on external cloud domains.
 */
export const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If explicitly pointing to the external render domain or in production, route via same-origin proxy
  if (!envUrl || envUrl.includes('smart-kagura-backend.onrender.com') || import.meta.env.PROD) {
    return '';
  }
  // Local development fallback
  return envUrl || 'http://localhost:5000';
};
