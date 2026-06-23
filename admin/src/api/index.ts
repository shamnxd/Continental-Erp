import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { ApiRoute } from "../constants/routes.enum";

type AuthCallbacks = {
  setAccessToken: (token: string) => void;
  logout: () => void;
};

type StoreLike = {
  getState: () => { auth: { accessToken: string | null } };
};

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean; _skipAuth?: boolean };

function resolveAccessToken(store: StoreLike | null): string | null {
  const token = store?.getState().auth.accessToken;
  return token?.trim() ? token.trim() : null;
}

function attachBearerToken(config: InternalAxiosRequestConfig, token: string): void {
  const bearer = `Bearer ${token}`;
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }
  if (typeof config.headers.set === "function") {
    config.headers.set("Authorization", bearer);
  }
  // Safe fallback and double assignment for direct properties
  (config.headers as Record<string, string>).Authorization = bearer;
  (config.headers as Record<string, string>).authorization = bearer;
}

function isAuthRoute(url?: string): boolean {
  if (!url) return false;
  return url.includes("/auth/login") || url.includes("/auth/refresh");
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

let authCallbacks: AuthCallbacks | null = null;
let boundStore: StoreLike | null = null;
let requestInterceptorId: number | null = null;
let responseInterceptorId: number | null = null;

/** One in-flight refresh so parallel API calls don't race the refresh cookie. */
let refreshInFlight: Promise<string | null> | null = null;

function extractAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const direct = (payload as { accessToken?: string }).accessToken;
  if (direct) return direct;
  const nested = (payload as { data?: { accessToken?: string } }).data?.accessToken;
  return nested ?? null;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!authCallbacks) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await api.post(
        ApiRoute.AUTH_REFRESH,
        {},
        { _retry: true, _skipAuth: true } as RequestConfigWithRetry,
      );
      const token = extractAccessToken(response);
      if (!token) {
        throw new Error("Refresh response missing accessToken");
      }
      authCallbacks!.setAccessToken(token);
      return token;
    } catch {
      authCallbacks?.logout();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function getValidAccessToken(): Promise<string | null> {
  const existing = resolveAccessToken(boundStore);
  if (existing) return existing;
  return refreshAccessToken();
}

export const setupInterceptors = (store: StoreLike, callbacks: AuthCallbacks) => {
  boundStore = store;
  authCallbacks = callbacks;

  if (requestInterceptorId !== null) {
    api.interceptors.request.eject(requestInterceptorId);
  }
  if (responseInterceptorId !== null) {
    api.interceptors.response.eject(responseInterceptorId);
  }

  requestInterceptorId = api.interceptors.request.use(
    async (config) => {
      const cfg = config as RequestConfigWithRetry;
      if (cfg._skipAuth || isAuthRoute(cfg.url)) {
        return config;
      }

      const token = await getValidAccessToken();
      console.log(`[Axios Request] URL: ${config.url}, Token resolved: ${token ? "Yes" : "No"}`);
      if (token) {
        attachBearerToken(config, token);
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  responseInterceptorId = api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config as RequestConfigWithRetry | undefined;

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthRoute(originalRequest.url)
      ) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await refreshAccessToken();
          if (!newAccessToken) {
            throw new Error("Unable to refresh session");
          }
          attachBearerToken(originalRequest, newAccessToken);
          return api(originalRequest);
        } catch (refreshError) {
          authCallbacks?.logout();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    },
  );
};
