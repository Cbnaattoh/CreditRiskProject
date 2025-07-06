import { createSlice, createSelector } from "@reduxjs/toolkit";
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

// Basic selectors
export const selectUserProfile = (state: RootState) => state.user.profile;
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;
export const selectUserLastUpdated = (state: RootState) =>
  state.user.lastUpdated;
export const selectUserPreferences = (state: RootState) =>
  state.user.preferences;

// Memoized derived selectors
export const selectUserFullName = createSelector(
  [selectUserProfile],
  (profile) => {
    if (!profile) return null;

    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`.trim();
    }

    return profile.name || profile.email;
  }
);

export const selectUserInitials = createSelector(
  [selectUserProfile],
  (profile) => {
    try {
      const name =
        profile?.name ||
        (profile?.first_name && profile?.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile?.first_name || profile?.last_name || "");
      if (!name || typeof name !== "string") {
        return "U";
      }
      const trimmedName = name.trim();
      if (!trimmedName) {
        return "U";
      }
      return trimmedName
        .split(" ")
        .filter((word) => word && word.length > 0)
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
        .substring(0, 2);
    } catch (error) {
      console.warn("Error in selectUserInitials:", error);
      return "U";
    }
  }
);

export const selectIsUserVerified = createSelector(
  [selectUserProfile],
  (profile) => profile?.is_verified ?? false
);

export const selectIsMFAEnabled = createSelector(
  [selectUserProfile],
  (profile) => profile?.mfa_enabled ?? false
);

export const selectIsMFAFullyConfigured = createSelector(
  [selectUserProfile],
  (profile) => profile?.mfa_fully_configured ?? false
);

export const selectUserTheme = createSelector(
  [selectUserPreferences],
  (preferences) => preferences.theme ?? "light"
);

export const selectUserLanguage = createSelector(
  [selectUserPreferences],
  (preferences) => preferences.language ?? "en"
);

export const selectNotificationsEnabled = createSelector(
  [selectUserPreferences],
  (preferences) => preferences.notifications ?? true
);

export type { User, UserState };
