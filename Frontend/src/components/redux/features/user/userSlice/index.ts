import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";
import type { UserProfile } from "../types/user";

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  preferences: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
  syncedWithAuth: boolean;
  lastAuthSync: string | null;
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
  syncedWithAuth: false,
  lastAuthSync: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
      state.syncedWithAuth = true;
      state.lastAuthSync = new Date().toISOString();
    },

    updateUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
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
      state.syncedWithAuth = false;
      state.lastAuthSync = null;
    },

    syncUserFromAuth: (state, action: PayloadAction<UserProfile | null>) => {
      const authUser = action.payload;

      if (!authUser) {
        state.profile = null;
        state.syncedWithAuth = true;
        state.lastAuthSync = new Date().toISOString();
        return;
      }

      if (!state.profile || state.profile.id !== authUser.id) {
        state.profile = authUser;
        state.lastUpdated = new Date().toISOString();
      } else {
        state.profile = { ...state.profile, ...authUser };
        state.lastUpdated = new Date().toISOString();
      }

      state.syncedWithAuth = true;
      state.lastAuthSync = new Date().toISOString();
      state.error = null;
    },

    markAuthOutOfSync: (state) => {
      state.syncedWithAuth = false;
    },

    updateUserField: (
      state,
      action: PayloadAction<{ field: keyof UserProfile; value: any }>
    ) => {
      if (state.profile) {
        const { field, value } = action.payload;
        (state.profile as any)[field] = value;
        state.lastUpdated = new Date().toISOString();
        if (["email", "is_verified", "mfa_enabled"].includes(field)) {
          state.syncedWithAuth = false;
        }
      }
    },

    toggleMFA: (state, action: PayloadAction<boolean>) => {
      if (state.profile) {
        (state.profile as any).mfa_enabled = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.syncedWithAuth = false;
      }
    },

    updateVerificationStatus: (state, action: PayloadAction<boolean>) => {
      if (state.profile) {
        state.profile.is_verified = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.syncedWithAuth = false;
      }
    },
    forceUserClear: (state) => {
      return { ...initialState };
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
  markAuthOutOfSync,
  updateUserField,
  toggleMFA,
  updateVerificationStatus,
  forceUserClear,
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

// Synchronization Selectors
export const selectUserSyncedWithAuth = (state: RootState) =>
  state.user.syncedWithAuth;
export const selectLastAuthSync = (state: RootState) => state.user.lastAuthSync;

export const selectUserAuthConsistency = createSelector(
  [(state: RootState) => state.auth, (state: RootState) => state.user],
  (auth, user) => {
    const hasAuthUser = !!auth.user;
    const hasUserProfile = !!user.profile;
    const isAuthenticated = auth.isAuthenticated;

    return {
      hasAuthUser,
      hasUserProfile,
      isAuthenticated,
      syncedWithAuth: user.syncedWithAuth,

      // Consistency checks
      authUserMatchesProfile: auth.user?.id === user.profile?.id,
      statesInSync: hasAuthUser === hasUserProfile,
      needsSync: !user.syncedWithAuth || hasAuthUser !== hasUserProfile,

      // Specific inconsistency types
      ghostUser: hasUserProfile && !hasAuthUser,
      ghostAuth: hasAuthUser && !hasUserProfile,
      authWithoutAuthentication: hasAuthUser && !isAuthenticated,

      shouldClearUser: !hasAuthUser && hasUserProfile,
      shouldSetUser: hasAuthUser && !hasUserProfile,
      shouldSync:
        hasAuthUser && hasUserProfile && auth.user?.id !== user.profile?.id,
    };
  }
);

// Memoized derived selectors
export const selectUserFullName = createSelector(
  [selectUserProfile],
  (profile) => {
    if (!profile) return null;

    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`.trim();
    }

    return profile.full_name || profile.email;
  }
);

export const selectUserInitials = createSelector(
  [selectUserProfile],
  (profile) => {
    try {
      const name =
        profile?.full_name ||
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

export type { UserState };
