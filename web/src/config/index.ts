/**
 * Application configuration from environment variables
 */

// Logo URLs - uses CDN in production, fallback to local files
export const LOGO_URL = import.meta.env.VITE_LOGO_URL || '/zygotrix-logo.png';
export const LOGO_ICO_URL = import.meta.env.VITE_LOGO_ICO_URL || '/zygotrix-logo.ico';
export const ZYGO_AI_LOGO_URL = import.meta.env.VITE_ZYGOTRIX_AI_LOGO_URL || '/zygotrix-ai.png';

// API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Export all config
export const config = {
    logoUrl: LOGO_URL,
    logoIcoUrl: LOGO_ICO_URL,
    zygoAiLogoUrl: ZYGO_AI_LOGO_URL,
    apiUrl: API_URL,
};

export default config;
