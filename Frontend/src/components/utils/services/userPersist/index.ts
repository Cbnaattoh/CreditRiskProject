import type { RootState } from "../../../redux/store";
import { loadAuthState } from "../authPersist";

export const loadUserState = (): RootState["user"] => {
  try {
    const serializedState = localStorage.getItem("userState");
    const authState = loadAuthState();

    if (!serializedState) {
      return getDefaultUserState();
    }

    const parsed = JSON.parse(serializedState);

    if (parsed.profile && !authState.user) {
      console.warn(
        "User profile exists without auth user - clearing user profile"
      );
      clearUserState();
      return {
        ...getDefaultUserState(),
        preferences: parsed.preferences || getDefaultPreferences(),
      };
    }

    if (
      parsed.profile &&
      authState.user &&
      parsed.profile.id !== authState.user.id
    ) {
      console.warn("User profile ID mismatch with auth user - will need sync");
      parsed.syncedWithAuth = false;
    }

    // Ensure new fields exist with backwards compatibility
    parsed.syncedWithAuth = parsed.hasOwnProperty("syncedWithAuth")
      ? parsed.syncedWithAuth
      : !!parsed.profile && !!authState.user;

    parsed.lastAuthSync = parsed.hasOwnProperty("lastAuthSync")
      ? parsed.lastAuthSync
      : parsed.profile
      ? parsed.lastUpdated
      : null;

    if (!parsed.preferences) {
      parsed.preferences = getDefaultPreferences();
    }

    console.log("Loaded user state:", parsed);
    return parsed;
  } catch (err) {
    console.error("Error loading user state:", err);
    return getDefaultUserState();
  }
};

export const saveUserState = (state: RootState["user"]) => {
  try {
    const toPersist = {
      profile: state.profile,
      isLoading: false,
      error: null,
      lastUpdated: state.lastUpdated,
      preferences: state.preferences,
      syncedWithAuth: state.syncedWithAuth,
      lastAuthSync: state.lastAuthSync,
    };

    console.log("Saving user state:", toPersist);
    localStorage.setItem("userState", JSON.stringify(toPersist));
  } catch (err) {
    console.error("Error saving user state:", err);
  }
};

export const clearUserState = () => {
  try {
    localStorage.removeItem("userState");
  } catch {
    // ignore errors
  }
};

// Helper function to get default user state
const getDefaultUserState = (): RootState["user"] => ({
  profile: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  preferences: getDefaultPreferences(),
  syncedWithAuth: false,
  lastAuthSync: null,
});

// Helper function to get default preferences
const getDefaultPreferences = () => ({
  theme: "light" as const,
  language: "en" as const,
  notifications: true,
});

// Validate user state consistency with auth state
export const validateUserState = (
  userState: RootState["user"],
  authState: RootState["auth"]
) => {
  const issues: string[] = [];
  let needsUserClear = false;

  // Check auth-user consistency
  if (userState.profile && !authState.user) {
    issues.push("User profile without auth user");
    needsUserClear = true;
  }

  if (authState.user && !userState.profile) {
    issues.push("Auth user without user profile");
  }

  if (
    authState.user &&
    userState.profile &&
    authState.user.id !== userState.profile.id
  ) {
    issues.push("User ID mismatch");
  }

  return { issues, needsUserClear };
};
