import { api } from "./index";
import { LoginRequest, LoginResponse, RefreshTokenResponse } from "../interfaces/auth.interface";
import { ApiRoute } from "../constants/routes.enum";

export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  return await api.post(ApiRoute.AUTH_LOGIN, credentials);
}

export async function logoutApi(): Promise<void> {
  return await api.post(ApiRoute.AUTH_LOGOUT);
}

export async function refreshApi(): Promise<RefreshTokenResponse> {
  return await api.post(ApiRoute.AUTH_REFRESH);
}
