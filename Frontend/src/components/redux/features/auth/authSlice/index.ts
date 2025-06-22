import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  mfa_enabled?: boolean;
  is_verified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  requiresMFA: boolean;
  tempToken: string | null;
  mfaMethods: string[];
  uid: string | null;
  isLoading: boolean;
}

const getInitialToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

const getInitialRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("refreshToken");
  }
  return null;
};

const initialState: AuthState = {
  user: null,
  token: getInitialToken(),
  refreshToken: getInitialRefreshToken(),
  isAuthenticated: !!getInitialToken(),
  requiresMFA: false,
  tempToken: null,
  mfaMethods: [],
  uid: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;
      state.requiresMFA = false;
      state.tempToken = null;
      state.isLoading = false;

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
      }
    },

    setAuthToken: (
      state,
      action: PayloadAction<{ token: string; refreshToken?: string }>
    ) => {
      const { token, refreshToken } = action.payload;
      state.token = token;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
        if (refreshToken) {
          state.refreshToken = refreshToken;
          localStorage.setItem("refreshToken", refreshToken);
        }
      }
    },

    setAuthTokenString: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", action.payload);
      }
    },

    setMFARequired: (
      state,
      action: PayloadAction<{
        tempToken: string;
        uid: string;
        mfaMethods?: string[];
      }>
    ) => {
      state.requiresMFA = true;
      state.tempToken = action.payload.tempToken;
      state.uid = action.payload.uid;
      state.mfaMethods = action.payload.mfaMethods || ["totp"];
      state.isLoading = false;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },

    clearMFAState: (state) => {
      state.requiresMFA = false;
      state.tempToken = null;
      state.uid = null;
      state.mfaMethods = [];
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.requiresMFA = false;
      state.tempToken = null;
      state.mfaMethods = [];
      state.uid = null;
      state.isLoading = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
      }
    },
  },
});

export const {
  setCredentials,
  setAuthToken,
  setAuthTokenString,
  setMFARequired,
  setLoading,
  setUser,
  clearMFAState,
  logout,
} = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectRequiresMFA = (state: RootState) => state.auth.requiresMFA;
export const selectTempToken = (state: RootState) => state.auth.tempToken;
export const selectMFAMethods = (state: RootState) => state.auth.mfaMethods;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectUid = (state: RootState) => state.auth.uid;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;

export type { User };
