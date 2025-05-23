import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

interface AuthState {
  user: null | {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string | null;
  isAuthenticated: boolean;
  requires2FA: boolean;
  tempToken: string | null;
}
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  requires2FA: false,
  tempToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthState["user"];
        token: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.requires2FA = false;
      state.tempToken = null;
    },
    set2FARequired: (state, action: PayloadAction<{ tempToken: string }>) => {
      state.requires2FA = true;
      state.tempToken = action.payload.tempToken;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.requires2FA = false;
      state.tempToken = null;
    },
  },
});

export const { setCredentials, set2FARequired, logout } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectRequires2FA = (state: RootState) => state.auth.requires2FA;
export const selectTempToken = (state: RootState) => state.auth.tempToken;
