import axios, { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL } from "./apiConstants";
import { getAuthToken } from "../utils/authToken";
import { handleAuthFailure } from "../utils/authRedirect";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers);
    headers.set("Authorization", "Bearer " + token);
    config.headers = headers;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      handleAuthFailure();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
