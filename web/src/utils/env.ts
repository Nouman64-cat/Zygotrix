/**
 * Environment utility functions
 */

/**
 * Check if the application is running in development mode
 * @returns {boolean} true if VITE_APP_ENV is set to 'Development'
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.VITE_APP_ENV === "Development";
};

/**
 * Get the current environment name
 * @returns {string} the current environment name
 */
export const getEnvironment = (): string => {
  return import.meta.env.VITE_APP_ENV || "production";
};
