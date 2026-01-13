import axios from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { storage, STORAGE_KEYS } from "../../../utils";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Extend config to include timing metadata
interface TimedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
    requestId: string;
  };
}

// Performance: Generate short request ID for tracking
const generateRequestId = () => Math.random().toString(36).substring(2, 8);

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutes to handle longer AI responses
  headers: {
    "Content-Type": "application/json",
    // PERFORMANCE: Signal HTTP/2 support for connection multiplexing
    // Browser automatically handles Accept-Encoding, setting it manually is unsafe and blocked by some browsers
  },
});

// Request interceptor: Add auth token + timing metadata
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // PERFORMANCE: Attach timing metadata for request tracking
    (config as TimedAxiosRequestConfig).metadata = {
      startTime: performance.now(),
      requestId: generateRequestId(),
    };

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Log timing + handle errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // PERFORMANCE: Log request duration for successful responses
    const config = response.config as TimedAxiosRequestConfig;
    if (config.metadata?.startTime) {
      // const duration = performance.now() - config.metadata.startTime;
      // const method = config.method?.toUpperCase() || "GET";
      // const url = config.url || "unknown";

      // Only log in development or for slow requests (> 1s in production)
      // if (import.meta.env.DEV || duration > 1000) {
      //   console.log(
      //     `[API] ${method} ${url} - ${duration.toFixed(0)}ms`,
      //     response.status
      //   );
      // }
    }

    return response;
  },
  (error: AxiosError) => {
    // PERFORMANCE: Log timing for failed requests
    const config = error.config as TimedAxiosRequestConfig | undefined;
    if (config?.metadata?.startTime) {
      const duration = performance.now() - config.metadata.startTime;
      const method = config.method?.toUpperCase() || "GET";
      const url = config.url || "unknown";

      console.warn(
        `[API] ${method} ${url} - FAILED after ${duration.toFixed(0)}ms`,
        error.response?.status || "Network Error"
      );
    }

    if (error.response?.status === 401) {
      // Don't redirect if it's a password reset or signup verification error
      const url = error.config?.url || "";
      const isPasswordReset = url.includes("/password-reset/");
      const isSignupVerification =
        url.includes("/signup/verify") || url.includes("/signup/resend");

      if (!isPasswordReset && !isSignupVerification) {
        storage.remove(STORAGE_KEYS.AUTH_TOKEN);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
