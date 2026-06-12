import axios from "axios";
import { store } from "../store";
import { logoutThunk } from "../store/authSlice";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Response interceptor: redirect to /login on 401 ──────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any cached auth state and redirect, but NOT on public pages
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const isPublicPath =
          path === "/" ||
          path === "/explore" ||
          path.startsWith("/course/") ||
          path === "/login" ||
          path === "/register";

        if (!isPublicPath) {
          store.dispatch(logoutThunk());
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;