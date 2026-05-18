import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { setupInterceptors } from "../api/index";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Inject the active store into our API configuration layer to enable robust auto-refresh interceptors
setupInterceptors(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type { User } from "./slices/authSlice";
