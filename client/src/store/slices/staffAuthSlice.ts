import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { staffApi } from "../../api/staffApi";

export interface Staff {
  id: string;
  fullName: string;
  staffNo: string;
  email: string;
  role: string;
  status: string;
}

interface StaffAuthState {
  staff: Staff | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: StaffAuthState = {
  staff: null,
  accessToken: null,
  loading: true,
  error: null,
};

function decodeStaffJwt(token: string): Staff | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as Staff;
  } catch {
    return null;
  }
}

export const restoreStaffSession = createAsyncThunk(
  "staffAuth/restore",
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response: any = await staffApi.post("/staff/auth/refresh");
      const token = response.accessToken;
      const decodedStaff = decodeStaffJwt(token);
      if (decodedStaff) {
        dispatch(setCredentials({ staff: decodedStaff, accessToken: token }));
      }
    } catch (err) {
      console.warn("Silent staff session restoration failed");
      dispatch(logOut());
    } finally {
      dispatch(setLoading(false));
    }
  }
);

const staffAuthSlice = createSlice({
  name: "staffAuth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCredentials: (state, action: PayloadAction<{ staff?: Staff; accessToken: string | null }>) => {
      if (action.payload.staff) {
        state.staff = action.payload.staff;
      } else if (action.payload.accessToken) {
        const decoded = decodeStaffJwt(action.payload.accessToken);
        if (decoded) state.staff = decoded;
      }
      state.accessToken = action.payload.accessToken;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logOut: (state) => {
      state.staff = null;
      state.accessToken = null;
      state.error = null;
    },
  },
});

export const { setLoading, setCredentials, setError, logOut } = staffAuthSlice.actions;
export default staffAuthSlice.reducer;
