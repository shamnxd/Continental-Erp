import axios from "axios";

const STAFF_TOKEN_KEY = "staff_access_token";

export const staffApi = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshStaffToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/staff/auth/refresh",
        {},
        { withCredentials: true }
      );
      const token = response.data?.accessToken;
      if (token) {
        setStaffToken(token);
        return token;
      }
      throw new Error("No token returned");
    } catch {
      clearStaffToken();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

staffApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(STAFF_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

staffApi.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isAuthRoute = url.includes("/staff/auth/");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshStaffToken();
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return staffApi(originalRequest);
        }
      } catch (refreshErr) {
        // Ignored
      }
      clearStaffToken();
      window.location.href = "/staff/login";
    }

    // Fallback if not retried
    if (error.response?.status === 401 && !isAuthRoute) {
      clearStaffToken();
      window.location.href = "/staff/login";
    }

    return Promise.reject(error);
  }
);

export function setStaffToken(token: string): void {
  localStorage.setItem(STAFF_TOKEN_KEY, token);
}

export function clearStaffToken(): void {
  localStorage.removeItem(STAFF_TOKEN_KEY);
}

export function getStaffToken(): string | null {
  return localStorage.getItem(STAFF_TOKEN_KEY);
}

export function isStaffLoggedIn(): boolean {
  const token = getStaffToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now() && payload.role === "staff";
  } catch {
    return false;
  }
}
