import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { loginApi, logoutApi, refreshApi } from "../../api/auth.api";
import { User } from "../../interfaces/user.interface";
import { LoginRequest } from "../../interfaces/auth.interface";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

/** Decode user payload claims from JWT */
function decodeJwt(token: string): User | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as User;
  } catch {
    return null;
  }
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: true,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await loginApi(credentials);
      if (!response?.accessToken) {
        throw new Error("Login response missing access token");
      }
      dispatch(setCredentials({ user: response.user, accessToken: response.accessToken }));
      return response.user;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Sign-in failed";
      dispatch(setError(errMsg));
      return rejectWithValue(errMsg);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout failed on server", err);
    } finally {
      dispatch(logOut());
    }
  }
);

/** Restore access token from HTTP-only refresh cookie into Redux. */
export const restoreSession = createAsyncThunk(
  "auth/restore",
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await refreshApi();
      const token = response.accessToken;
      const decodedUser = decodeJwt(token);
      if (decodedUser) {
        dispatch(setCredentials({ user: decodedUser, accessToken: token }));
      }
    } catch (err) {
      console.warn("Silent session restoration failed");
      dispatch(logOut());
    } finally {
      dispatch(setLoading(false));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCredentials: (state, action: PayloadAction<{ user?: User; accessToken: string | null }>) => {
      if (action.payload.user) {
        state.user = action.payload.user;
      } else if (action.payload.accessToken) {
        const decoded = decodeJwt(action.payload.accessToken);
        if (decoded) state.user = decoded;
      }
      state.accessToken = action.payload.accessToken;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.error = null;
    },
  },
});

export const { setLoading, setCredentials, setError, logOut } = authSlice.actions;
export default authSlice.reducer;
export type { User };
