import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

interface AuthState {
  user: null | {
    id: string;
    email: string;
    name: string;
    role: string;
    mfa_enabled?: boolean;
  };
  token: string | null;
  isAuthenticated: boolean;
  requiresMFA: boolean;
  tempToken: string | null;
  mfaMethods?: string[];
}
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  requiresMFA: false,
  tempToken: null,
  mfaMethods: [],
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
        mfa_enabled?: boolean;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.requiresMFA = false;
      state.tempToken = null;
    },
      setAuthToken: (
      state,
      action: PayloadAction<string>
    ) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      // Keep all other state the same (user data remains unchanged)
    },
   setMFARequired: (
      state, 
      action: PayloadAction<{ 
        tempToken: string;
        mfaMethods?: string[] 
      }>
    ) => {
      state.requiresMFA = true;
      state.tempToken = action.payload.tempToken;
      state.mfaMethods = action.payload.mfaMethods || ['totp'];
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.requiresMFA = false;
      state.tempToken = null;
      state.mfaMethods = [];
    },
  },
});

export const { setCredentials,setAuthToken, setMFARequired, logout } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectRequiresMFA = (state: RootState) => state.auth.requiresMFA;
export const selectTempToken = (state: RootState) => state.auth.tempToken;
export const selectMFAMethods = (state: RootState) => state.auth.mfaMethods;
