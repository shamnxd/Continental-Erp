import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

type AuthCallbacks = {
  setAccessToken: (token: string) => void;
  logout: () => void;
};

type StoreLike = {
  getState: () => { staffAuth: { accessToken: string | null } };
};

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean; _skipAuth?: boolean };

function resolveAccessToken(store: StoreLike | null): string | null {
  const token = store?.getState().staffAuth.accessToken;
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
  return url.includes("/staff/auth/");
}

export const staffApi = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
});

let authCallbacks: AuthCallbacks | null = null;
let boundStore: StoreLike | null = null;
let requestInterceptorId: number | null = null;
let responseInterceptorId: number | null = null;

let refreshInFlight: Promise<string | null> | null = null;

function extractAccessToken(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null;
  const direct = payload.accessToken;
  if (direct) return direct;
  const nested = payload.data?.accessToken;
  return nested ?? null;
}

async function refreshStaffToken(): Promise<string | null> {
  if (!authCallbacks) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await staffApi.post(
        "/staff/auth/refresh",
        {},
        { _retry: true, _skipAuth: true } as RequestConfigWithRetry
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
  return refreshStaffToken();
}

export const setupStaffInterceptors = (store: StoreLike, callbacks: AuthCallbacks) => {
  boundStore = store;
  authCallbacks = callbacks;

  if (requestInterceptorId !== null) {
    staffApi.interceptors.request.eject(requestInterceptorId);
  }
  if (responseInterceptorId !== null) {
    staffApi.interceptors.response.eject(responseInterceptorId);
  }

  requestInterceptorId = staffApi.interceptors.request.use(
    async (config) => {
      const cfg = config as RequestConfigWithRetry;
      if (cfg._skipAuth || isAuthRoute(cfg.url)) {
        return config;
      }

      const token = await getValidAccessToken();
      if (token) {
        attachBearerToken(config, token);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  responseInterceptorId = staffApi.interceptors.response.use(
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
          const newAccessToken = await refreshStaffToken();
          if (!newAccessToken) {
            throw new Error("Unable to refresh staff session");
          }
          attachBearerToken(originalRequest, newAccessToken);
          return staffApi(originalRequest);
        } catch (refreshError) {
          authCallbacks?.logout();
          window.location.href = "/#/login";
          return Promise.reject(refreshError);
        }
      }
      if (error.response?.status === 401 && !isAuthRoute(originalRequest?.url)) {
        authCallbacks?.logout();
        window.location.href = "/#/login";
      }
      return Promise.reject(error);
    }
  );
};
