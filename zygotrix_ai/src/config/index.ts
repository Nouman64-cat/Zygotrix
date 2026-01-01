/**
 * Application configuration from environment variables
 */

// Logo URL - uses CDN in production, fallback to local file
export const LOGO_URL = import.meta.env.VITE_LOGO_URL || '/zygotrix-ai.png';

// API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Export all config
export const config = {
    logoUrl: LOGO_URL,
    apiUrl: API_URL,
};

export default config;
