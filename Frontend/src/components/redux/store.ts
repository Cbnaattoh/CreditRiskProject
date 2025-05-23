import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./features/api/baseApi";
import authReducer from "./features/auth/authSlice";
import { loadAuthState, saveAuthState } from "../utils/services/authPersist";

const preloadedState = {
  auth: loadAuthState(),
};

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

// Subscribe to store changes to persist auth state
store.subscribe(() => {
  saveAuthState(store.getState().auth);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
