import axios from "axios";

const STAFF_TOKEN_KEY = "staff_access_token";

export const staffApi = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
});

staffApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(STAFF_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

staffApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Only auto-redirect on 401 for protected routes, NOT for the login endpoint itself
    const url = error?.config?.url || "";
    const isAuthRoute = url.includes("/staff/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem(STAFF_TOKEN_KEY);
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
