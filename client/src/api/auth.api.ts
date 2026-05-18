import { api } from "./index";

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  user: User;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return await api.post("/auth/login", { email, password });
}

export async function logoutApi(): Promise<void> {
  return await api.post("/auth/logout");
}

export async function refreshApi(): Promise<{ success: boolean; accessToken: string }> {
  return await api.post("/auth/refresh");
}
