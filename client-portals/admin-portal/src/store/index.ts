import { configureStore } from "@reduxjs/toolkit";
import authReducer, { setCredentials, logOut } from "./slices/authSlice";
import staffAuthReducer, { setCredentials as setStaffCredentials, logOut as logOutStaff } from "./slices/staffAuthSlice";
import { setupInterceptors } from "../api/index";
import { setupStaffInterceptors } from "../api/staffApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    staffAuth: staffAuthReducer,
  },
});

setupInterceptors(store, {
  setAccessToken: (token) => store.dispatch(setCredentials({ accessToken: token })),
  logout: () => store.dispatch(logOut()),
});

setupStaffInterceptors(store, {
  setAccessToken: (token) => store.dispatch(setStaffCredentials({ accessToken: token })),
  logout: () => store.dispatch(logOutStaff()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type { User } from "./slices/authSlice";
export type { Staff } from "./slices/staffAuthSlice";
