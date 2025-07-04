import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
  mfa_enabled?: boolean;
  is_verified?: boolean;
  mfa_fully_configured?: boolean;
  date_joined?: string;
  last_login?: string;
}

interface UserState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  preferences: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  preferences: {
    theme: "light",
    language: "en",
    notifications: true,
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }
    },

    setUserLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setUserError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearUserError: (state) => {
      state.error = null;
    },

    updateUserPreferences: (
      state,
      action: PayloadAction<Partial<UserState["preferences"]>>
    ) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    clearUser: (state) => {
      state.profile = null;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = null;
      state.preferences = {
        theme: "light",
        language: "en",
        notifications: true,
      };
    },

    syncUserFromAuth: (state, action: PayloadAction<User>) => {
      const authUser = action.payload;
      if (!state.profile || state.profile.id !== authUser.id) {
        state.profile = authUser;
        state.lastUpdated = new Date().toISOString();
      }
    },

    updateUserField: (
      state,
      action: PayloadAction<{ field: keyof User; value: any }>
    ) => {
      if (state.profile) {
        const { field, value } = action.payload;
        (state.profile as any)[field] = value;
        state.lastUpdated = new Date().toISOString();
      }
    },

    toggleMFA: (state, action: PayloadAction<boolean>) => {
      if (state.profile) {
        state.profile.mfa_enabled = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },

    updateVerificationStatus: (state, action: PayloadAction<boolean>) => {
      if (state.profile) {
        state.profile.is_verified = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },
  },
});

export const {
  setUser,
  updateUser,
  setUserLoading,
  setUserError,
  clearUserError,
  updateUserPreferences,
  clearUser,
  syncUserFromAuth,
  updateUserField,
  toggleMFA,
  updateVerificationStatus,
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;
export const selectUserLastUpdated = (state: RootState) =>
  state.user.lastUpdated;
export const selectUserPreferences = (state: RootState) =>
  state.user.preferences;

// Derived selectors
export const selectUserFullName = (state: RootState) => {
  const profile = state.user.profile;
  if (!profile) return null;

  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`.trim();
  }

  return profile.name || profile.email;
};

export const selectUserInitials = (state: RootState) => {
  const profile = state.user.profile;
  if (!profile) return "";

  if (profile.first_name && profile.last_name) {
    return `${profile.first_name.charAt(0)}${profile.last_name.charAt(
      0
    )}`.toUpperCase();
  }

  if (profile.name) {
    const nameParts = profile.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    }
    return profile.name.charAt(0).toUpperCase();
  }

  return profile.email.charAt(0).toUpperCase();
};

export const selectIsUserVerified = (state: RootState) =>
  state.user.profile?.is_verified ?? false;

export const selectIsMFAEnabled = (state: RootState) =>
  state.user.profile?.mfa_enabled ?? false;

export const selectIsMFAFullyConfigured = (state: RootState) =>
  state.user.profile?.mfa_fully_configured ?? false;

export const selectUserTheme = (state: RootState) =>
  state.user.preferences.theme ?? "light";

export const selectUserLanguage = (state: RootState) =>
  state.user.preferences.language ?? "en";

export const selectNotificationsEnabled = (state: RootState) =>
  state.user.preferences.notifications ?? true;

export type { User, UserState };
