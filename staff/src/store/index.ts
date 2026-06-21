import { configureStore } from "@reduxjs/toolkit";
import staffAuthReducer, { setCredentials as setStaffCredentials, logOut as logOutStaff } from "./slices/staffAuthSlice";
import { setupStaffInterceptors } from "../api/staffApi";

export const store = configureStore({
  reducer: {
    staffAuth: staffAuthReducer,
  },
});

setupStaffInterceptors(store, {
  setAccessToken: (token) => store.dispatch(setStaffCredentials({ accessToken: token })),
  logout: () => store.dispatch(logOutStaff()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type { Staff } from "./slices/staffAuthSlice";
