import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface EnvVariables {
  VITE_ZYGOTRIX_API?: string;
  VITE_GEMINI_API_KEY?: string;
  VITE_ZYGOTRIX_BOT_NAME?: string;
  [key: string]: string | undefined;
}

/**
 * Load environment variables from .env file in production
 * In development, Vite handles environment variables
 */
export function loadEnvironmentVariables(): EnvVariables {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // In development, return current process.env (Vite handles it)
    return {
      VITE_ZYGOTRIX_API: process.env.VITE_ZYGOTRIX_API,
      VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
      VITE_ZYGOTRIX_BOT_NAME: process.env.VITE_ZYGOTRIX_BOT_NAME,
    };
  }

  // In production, load from .env file in resources
  const envPath = path.join(process.resourcesPath, '.env');
  const env: EnvVariables = {};

  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue;
        }

        // Parse KEY=VALUE
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          let value = trimmedLine.substring(equalIndex + 1).trim();

          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          env[key] = value;
          // Also set in process.env for compatibility
          process.env[key] = value;
        }
      }
    } else {
      console.warn('Environment file not found:', envPath);
      // Use default values
      env.VITE_ZYGOTRIX_API = 'http://127.0.0.1:8000';
      env.VITE_ZYGOTRIX_BOT_NAME = 'Zigi';
    }
  } catch (error) {
    console.error('Error loading environment variables:', error);
    // Use default values
    env.VITE_ZYGOTRIX_API = 'http://127.0.0.1:8000';
    env.VITE_ZYGOTRIX_BOT_NAME = 'Zigi';
  }

  return env;
}

/**
 * Get a specific environment variable with fallback
 */
export function getEnvVariable(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(requiredVars: string[]): boolean {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing.join(', '));
    return false;
  }

  return true;
}
