/**
 * Application configuration
 * Non-secret values are hardcoded here.
 */

export const APP_ENV = 'Production';

// API URL
export const API_URL = 'https://api.zygotrix.com';

// Assets / CDN
export const LOGO_URL = 'https://cdn-zygotrix.s3.us-east-1.amazonaws.com/zygotrix-ai.png';
export const ZYGOTRIX_LOGO_URL = 'https://cdn-zygotrix.s3.us-east-1.amazonaws.com/zygotrix-logo.png';

// Export all config
export const config = {
    appEnv: APP_ENV,
    apiUrl: API_URL,
    logoUrl: LOGO_URL,
    zygotrixLogoUrl: ZYGOTRIX_LOGO_URL,
};

export default config;
