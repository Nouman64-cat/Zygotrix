import axios, { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL } from "./apiConstants";
import { getAuthToken } from "../utils/authToken";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    const headers = config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);
    headers.set("Authorization", "Bearer " + token);
    config.headers = headers;
  }
  return config;
});

API.interceptors.response.use((response) => response, (error) => Promise.reject(error));

export default API;
