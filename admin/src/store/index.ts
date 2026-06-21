import { configureStore } from "@reduxjs/toolkit";
import authReducer, { setCredentials, logOut } from "./slices/authSlice";
import { setupInterceptors } from "../api/index";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

setupInterceptors(store, {
  setAccessToken: (token) => store.dispatch(setCredentials({ accessToken: token })),
  logout: () => store.dispatch(logOut()),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type { User } from "./slices/authSlice";
