import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { loginApi, logoutApi, refreshApi, User } from "../../api/auth.api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: true,
  error: null,
};

/**
 * Helper to decode user payload claims securely from active JWT
 */
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
  } catch (e) {
    return null;
  }
}

// Thunk: Authenticate Dispatcher Credentials
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await loginApi(credentials.email, credentials.password);
      dispatch(setCredentials({ user: response.user, accessToken: response.accessToken }));
      return response.user;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Sign-in failed";
      dispatch(setError(errMsg));
      return rejectWithValue(errMsg);
    }
  }
);

// Thunk: Secure Corporate Logout
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

// Thunk: Silent Boot-time Session Restoration
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
