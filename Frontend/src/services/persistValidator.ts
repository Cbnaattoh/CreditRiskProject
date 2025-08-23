import {
  loadAuthState,
  saveAuthState,
  clearAuthState,
  validateAuthState,
} from "./authPersist";
import {
  loadUserState,
  clearUserState,
  validateUserState,
} from "./userPersist";
import { resetAllPersistedState } from "./persistUtils";

// Utility function to validate and fix state consistency on app startup
export const validateAndFixPersistedState = () => {
  try {
    const authState = loadAuthState();
    const userState = loadUserState();

    const allIssues: string[] = [];
    let needsAuthSave = false;
    let needsUserSave = false;

    // Validate auth state
    const authValidation = validateAuthState(authState);
    allIssues.push(...authValidation.issues);

    if (authValidation.needsClear) {
      clearAuthState();
      clearUserState();
      return { issues: allIssues, clearedAll: true };
    }

    if (authValidation.correctedState) {
      saveAuthState(authValidation.correctedState);
      needsAuthSave = true;
    }

    // Validate user state against auth state
    const userValidation = validateUserState(
      userState,
      authValidation.correctedState || authState
    );
    allIssues.push(...userValidation.issues);

    if (userValidation.needsUserClear) {
      clearUserState();
      needsUserSave = true;
    }

    if (allIssues.length > 0) {
      console.warn("Fixed persistence issues on startup:", allIssues);
    }

    return {
      issues: allIssues,
      clearedAll: false,
      needsAuthSave,
      needsUserSave,
    };
  } catch (error) {
    console.error("Error validating persisted state:", error);
    clearAuthState();
    clearUserState();
    return {
      issues: ["Critical persistence error - cleared all state"],
      clearedAll: true,
      needsAuthSave: false,
      needsUserSave: false,
    };
  }
};

// Function to perform a complete state validation and cleanup
export const performStateCleanup = () => {
  console.info("Performing complete state cleanup...");
  resetAllPersistedState();
  return validateAndFixPersistedState();
};

// Function to check if states are in sync
export const checkStateSync = () => {
  const authState = loadAuthState();
  const userState = loadUserState();

  return {
    authLoaded: !!authState,
    userLoaded: !!userState,
    hasAuthUser: !!authState.user,
    hasUserProfile: !!userState.profile,
    isAuthenticated: authState.isAuthenticated,
    syncedWithAuth: userState.syncedWithAuth,
    userIdMatch: authState.user?.id === userState.profile?.id,
  };
};
