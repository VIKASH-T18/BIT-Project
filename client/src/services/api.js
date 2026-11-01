/**
 * @file api.js
 * @description Axios instance with JWT interceptors, token refresh, and error handling.
 */

import axios from "axios";
import toast from "react-hot-toast";

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // Send cookies with requests
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// ─── Request Interceptor: Attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 + Token Refresh ────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Auth routes that should NEVER trigger a refresh attempt (avoid infinite loops)
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    // Handle 401 Unauthorized — attempt token refresh for ANY 401 on protected routes.
    // Covers: TOKEN_EXPIRED, "Invalid token." (stale/mismatched JWT), and plain 401s.
    const isAuthRoute = AUTH_ROUTES.some((r) => requestUrl.includes(r));
    if (
      error.response?.status === 401 &&
      !isAuthRoute &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh");
        const newToken = data.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        // Redirect to login only if not already there
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle network errors
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response.status === 403) {
      const msg = error.response.data?.message || "Access denied. You don't have permission for this action.";
      toast.error(msg);
    }

    // Handle 500 Server Error
    if (error.response.status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

// ─── Multipart Upload Helper ──────────────────────────────────────────────────
export const uploadApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 60000,
  headers: { "Content-Type": "multipart/form-data" },
});

uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
