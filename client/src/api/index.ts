import axios from "axios";
import { setCredentials, logOut } from "../store/slices/authSlice";

export const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true, // Transmit HTTP-only cookies (refresh token)
});

/**
 * Configure request & response interceptors dynamically with the Redux Store
 */
export const setupInterceptors = (store: any) => {
  // Request Interceptor: Automatically attach in-memory Bearer token
  api.interceptors.request.use(
    (config) => {
      const token = store.getState().auth.accessToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor: Self-healing token refresh logic on 401 Unauthorized
  api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config;
      
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url.includes("/auth/login") &&
        !originalRequest.url.includes("/auth/refresh")
      ) {
        originalRequest._retry = true;
        try {
          // Request new access token from cookie-secured refresh endpoint
          const refreshResponse = await axios.post(
            "http://localhost:5000/api/v1/auth/refresh",
            {},
            { withCredentials: true }
          );
          
          const newAccessToken = refreshResponse.data.accessToken;
          
          // Save fresh token to Redux Store
          store.dispatch(setCredentials({ accessToken: newAccessToken }));
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh cookie expired/invalid, clear session and log user out
          store.dispatch(logOut());
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
};
