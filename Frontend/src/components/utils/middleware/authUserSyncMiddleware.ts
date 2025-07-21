import type { Middleware } from "@reduxjs/toolkit";
import type { RootState } from "../../redux/store";
import {
  syncUserFromAuth,
  forceUserClear,
  markAuthOutOfSync,
} from "../../redux/features/user/userSlice";
import { clearAllAuthData } from "../../redux/features/auth/authSlice";

const AUTH_SYNC_ACTIONS = [
  "auth/setCredentials",
  "auth/setUser",
  "auth/logout",
  "auth/clearAllAuthData",
  "auth/refreshTokenFailure",
  "auth/refreshTokenSuccess",
];

const USER_DESYNC_ACTIONS = [
  "user/updateUserField",
  "user/toggleMFA",
  "user/updateVerificationStatus",
];

const USER_SYNC_ACTIONS = ["user/setUser", "user/updateUser"];

export const authUserSyncMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action) => {
    const result = next(action);
    const state = store.getState();

    if (AUTH_SYNC_ACTIONS.some((syncAction) => action.type === syncAction)) {
      const authUser = state.auth.user;

      if (
        action.type === "auth/logout" ||
        action.type === "auth/clearAllAuthData" ||
        action.type === "auth/refreshTokenFailure"
      ) {
        store.dispatch(forceUserClear());
      } else if (authUser) {
        store.dispatch(syncUserFromAuth(authUser));
      } else {
        store.dispatch(syncUserFromAuth(null));
      }
    }

    if (
      USER_DESYNC_ACTIONS.some((desyncAction) => action.type === desyncAction)
    ) {
      store.dispatch(markAuthOutOfSync());
    }

    // Handle user actions that might conflict with auth
    if (USER_SYNC_ACTIONS.some((syncAction) => action.type === syncAction)) {
      const userProfile = state.user.profile;
      const authUser = state.auth.user;

      if (userProfile && !authUser) {
        console.warn(
          "User profile exists without auth user - clearing user profile"
        );
        store.dispatch(forceUserClear());
      } else if (userProfile && authUser && userProfile.id !== authUser.id) {
        console.warn(
          "User profile ID mismatch with auth user - syncing from auth"
        );
        store.dispatch(syncUserFromAuth(authUser));
      }
    }

    return result;
  };

// Utility function to manually trigger synchronization check
export const checkAndFixStateSynchronization = (store: any) => {
  const state = store.getState() as RootState;
  const { auth, user } = state;

  const issues: string[] = [];

  // Check for common inconsistencies
  if (user.profile && !auth.user) {
    issues.push("User profile exists without auth user");
    store.dispatch(forceUserClear());
  }

  if (auth.user && !user.profile) {
    issues.push("Auth user exists without user profile");
    store.dispatch(syncUserFromAuth(auth.user));
  }

  if (auth.user && user.profile && auth.user.id !== user.profile.id) {
    issues.push("Auth user ID mismatch with user profile ID");
    store.dispatch(syncUserFromAuth(auth.user));
  }

  if (auth.isAuthenticated && !auth.user) {
    issues.push("Authenticated without auth user");
    store.dispatch(clearAllAuthData());
  }

  if (user.profile && !auth.isAuthenticated) {
    issues.push("User profile exists without authentication");
    store.dispatch(forceUserClear());
  }

  if (issues.length > 0) {
    console.warn("Fixed state synchronization issues:", issues);
  }

  return issues;
};

// Hook for React components to check state consistency
export const useAuthUserConsistency = () => {
  return {
    checkConsistency: () => {
      // Implementation would check selectors and return consistency status
    },
    fixInconsistencies: () => {
      // Implementation would dispatch actions to fix issues
    },
  };
};
