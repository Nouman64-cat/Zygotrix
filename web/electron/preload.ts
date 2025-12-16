import { contextBridge, ipcRenderer } from 'electron';

// Platform information
const platform = process.platform;
const isMac = platform === 'darwin';
const isWindows = platform === 'win32';
const isLinux = platform === 'linux';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Platform detection
  platform: {
    isMac,
    isWindows,
    isLinux,
    name: platform,
  },

  // App information
  app: {
    version: process.env.npm_package_version || '1.0.0',
    name: 'Zygotrix',
  },

  // Environment variables (expose VITE_* variables)
  env: {
    VITE_ZYGOTRIX_API: process.env.VITE_ZYGOTRIX_API,
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
    VITE_ZYGOTRIX_BOT_NAME: process.env.VITE_ZYGOTRIX_BOT_NAME,
  },

  // IPC communication (for future use)
  ipc: {
    send: (channel: string, data?: any) => {
      // Whitelist channels for security
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        const subscription = (_event: any, ...args: any[]) => func(...args);
        ipcRenderer.on(channel, subscription);
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      return () => {};
    },
    invoke: async (channel: string, data?: any) => {
      const validChannels = ['getData'];
      if (validChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, data);
      }
      return null;
    },
  },
});

// Type declarations for window object (will be used in renderer)
declare global {
  interface Window {
    electron: {
      platform: {
        isMac: boolean;
        isWindows: boolean;
        isLinux: boolean;
        name: string;
      };
      app: {
        version: string;
        name: string;
      };
      env: {
        VITE_ZYGOTRIX_API?: string;
        VITE_GEMINI_API_KEY?: string;
        VITE_ZYGOTRIX_BOT_NAME?: string;
      };
      ipc: {
        send: (channel: string, data?: any) => void;
        on: (channel: string, func: (...args: any[]) => void) => () => void;
        invoke: (channel: string, data?: any) => Promise<any>;
      };
    };
  }
}
