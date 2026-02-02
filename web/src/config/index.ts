/**
 * Application configuration
 * Non-secret values are hardcoded here.
 */

export const APP_ENV = 'Production'; // Set to 'Development' in dev if needed, or rely on import.meta.env.MODE if preferred, but user wants hardcoded config. Or better, just export it.

// API URL
export const API_URL = 'https://api.zygotrix.com';

// External Apps
export const UNIVERSITY_APP_URL = 'https://university.zygotrix.com/';

// Assets / CDN
export const LOGO_URL = 'https://cdn-zygotrix.s3.us-east-1.amazonaws.com/zygotrix-logo.png';
export const ZYGO_AI_LOGO_URL = 'https://cdn-zygotrix.s3.us-east-1.amazonaws.com/zygotrix-ai.png';

// Brand Info
export const BOT_NAME = 'Zygotrix AI';
export const CONTACT_EMAIL = 'zygotrix.work@gmail.com';

// Services
export const HYGRAPH_ENDPOINT = 'https://ap-south-1.cdn.hygraph.com/content/cmg0d4ao2013r08wb95es4c0w/master';

// Export all config
export const config = {
    apiUrl: API_URL,
    universityAppUrl: UNIVERSITY_APP_URL,
    logoUrl: LOGO_URL,
    zygoAiLogoUrl: ZYGO_AI_LOGO_URL,
    botName: BOT_NAME,
    contactEmail: CONTACT_EMAIL,
    hygraphEndpoint: HYGRAPH_ENDPOINT,
};

export default config;
