import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./features/api/baseApi";
import authReducer from "./features/auth/authSlice";
import userReducer from "./features/user/userSlice";
import { loadAuthState, saveAuthState } from "../utils/services/authPersist";
import { loadUserState, saveUserState } from "../utils/services/userPersist";

const preloadedState = {
  auth: loadAuthState(),
  user: loadUserState(),
};

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    user: userReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

// Subscribe to store changes to persist auth state
store.subscribe(() => {
  saveAuthState(store.getState().auth);
  saveUserState(store.getState().user);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
