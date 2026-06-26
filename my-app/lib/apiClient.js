import axios from "axios";

/**
 * Centralized Axios API Client
 *
 * Industry-standard pattern: one instance with shared config,
 * interceptors, and automatic error handling.
 *
 * WebSocket/Redis Note: This client drives all REST polling.
 * When Socket.io is integrated (Phase 8), many of these calls
 * will be replaced by socket event listeners, but the axios
 * instance will still handle mutations (POST/PATCH/DELETE).
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true, // Always send cookies (JWT)
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Response Interceptor ─────────────────────────────────────────────────────
// Centralized error handling — no more scattered .catch() boilerplate
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: Token expired or invalid → redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
