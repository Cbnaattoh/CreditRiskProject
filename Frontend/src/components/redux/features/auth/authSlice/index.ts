import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";
import type { AuthUser } from "../../user/types/user";
import { clearUserState } from "../../../../utils/services/userPersist";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  requiresMFA: boolean;
  tempToken: string | null;
  mfaMethods: string[];
  uid: string | null;
  isLoading: boolean;
  tokenExpired: boolean;
}

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

const validateAndCleanupToken = (): {
  token: string | null;
  refreshToken: string | null;
} => {
  if (typeof window === "undefined") return { token: null, refreshToken: null };

  const token = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (token && isTokenExpired(token)) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authState");
    clearUserState();
    return { token: null, refreshToken: null };
  }

  return { token, refreshToken };
};

const { token: initialToken, refreshToken: initialRefreshToken } =
  validateAndCleanupToken();

const initialState: AuthState = {
  user: null,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialToken && !isTokenExpired(initialToken),
  requiresMFA: false,
  tempToken: null,
  mfaMethods: [],
  uid: null,
  isLoading: false,
  tokenExpired: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        token: string;
        refreshToken?: string;
      }>
    ) => {
      const { user, token, refreshToken } = action.payload;

      if (isTokenExpired(token)) {
        console.warn("Attempted to set expired token");
        return;
      }

      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;
      state.requiresMFA = false;
      state.tempToken = null;
      state.isLoading = false;
      state.tokenExpired = false;

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

      if (isTokenExpired(token)) {
        console.warn("Attempted to set expired auth token");
        return;
      }

      state.token = token;
      state.isAuthenticated = true;
      state.tokenExpired = false;

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
        if (refreshToken) {
          state.refreshToken = refreshToken;
          localStorage.setItem("refreshToken", refreshToken);
        }
      }
    },

    setAuthTokenString: (state, action: PayloadAction<string>) => {
      const token = action.payload;

      if (isTokenExpired(token)) {
        console.warn("Attempted to set expired token string");
        return;
      }

      state.token = token;
      state.isAuthenticated = true;
      state.tokenExpired = false;

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
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

    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },

    clearMFAState: (state) => {
      state.requiresMFA = false;
      state.tempToken = null;
      state.uid = null;
      state.mfaMethods = [];
    },

    setTokenExpired: (state) => {
      state.tokenExpired = true;
      state.isAuthenticated = false;
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
      state.tokenExpired = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        clearUserState();
      }
    },

    clearAllAuthData: (state) => {
      Object.assign(state, {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        requiresMFA: false,
        tempToken: null,
        mfaMethods: [],
        uid: null,
        isLoading: false,
        tokenExpired: false,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        clearUserState();
      }
    },

    refreshTokenSuccess: (
      state,
      action: PayloadAction<{ token: string; refreshToken?: string }>
    ) => {
      const { token, refreshToken } = action.payload;

      state.token = token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;
      state.tokenExpired = false;

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
      }
    },

    refreshTokenFailure: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.requiresMFA = false;
      state.tempToken = null;
      state.mfaMethods = [];
      state.uid = null;
      state.isLoading = false;
      state.tokenExpired = true;

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        clearUserState();
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
  setTokenExpired,
  refreshTokenSuccess,
  refreshTokenFailure,
  clearAllAuthData,
} = authSlice.actions;

export default authSlice.reducer;

// Enhanced selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated &&
  state.auth.token !== null &&
  !isTokenExpired(state.auth.token);
export const selectRequiresMFA = (state: RootState) => state.auth.requiresMFA;
export const selectTempToken = (state: RootState) => state.auth.tempToken;
export const selectMFAMethods = (state: RootState) => state.auth.mfaMethods;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectUid = (state: RootState) => state.auth.uid;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectTokenExpired = (state: RootState) => state.auth.tokenExpired;
export const selectIsTokenValid = (state: RootState) =>
  state.auth.token && !isTokenExpired(state.auth.token);

// Selector to check auth/user state consistency
export const selectAuthUserConsistency = (state: RootState) => ({
  authHasUser: !!state.auth.user,
  userHasProfile: !!state.user.profile,
  isConsistent:
    !!state.auth.user === (!!state.user.profile && state.auth.isAuthenticated),
  authUserId: state.auth.user?.id,
  userProfileId: state.user.profile?.id,
  idsMatch: state.auth.user?.id === state.user.profile?.id,
});

// Utility function to check token expiration
export { isTokenExpired };
