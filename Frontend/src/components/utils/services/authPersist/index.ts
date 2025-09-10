import type { RootState } from "../../../redux/store";
import { isTokenExpired } from "../persistUtils";

// Load auth state from localStorage
export const loadAuthState = (): RootState["auth"] => {
  try {
    const serializedState = localStorage.getItem("authState");
    const token = localStorage.getItem("authToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const rolesStr = localStorage.getItem("user_roles");
    const permissionsStr = localStorage.getItem("user_permissions");
    const permissionSummaryStr = localStorage.getItem("user_permission_summary");

    if (!serializedState && token) {
      return {
        ...getDefaultAuthState(),
        token,
        refreshToken: refreshToken || null,
        isAuthenticated: true,
        roles: rolesStr ? JSON.parse(rolesStr) : [],
        permissions: permissionsStr ? JSON.parse(permissionsStr) : [],
        permissionSummary: permissionSummaryStr ? JSON.parse(permissionSummaryStr) : null,
      };
    }

    if (!serializedState) {
      return getDefaultAuthState();
    }

    const parsed = JSON.parse(serializedState);

    // Validate token consistency
    if (parsed.token !== token || parsed.refreshToken !== refreshToken) {
      console.warn("Token mismatch between authState and localStorage tokens");
      parsed.token = token;
      parsed.refreshToken = refreshToken;
      parsed.isAuthenticated = !!token;
    }

    // Validate token expiration
    if (parsed.token && isTokenExpired(parsed.token)) {
      console.warn("Loaded expired token, clearing auth state");
      clearAuthState();
      return {
        ...getDefaultAuthState(),
        tokenExpired: true,
      };
    }

    parsed.roles = rolesStr ? JSON.parse(rolesStr) : [];
    parsed.permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
    parsed.permissionSummary = permissionSummaryStr ? JSON.parse(permissionSummaryStr) : null;

    // console.log("✅ Loaded auth state:", parsed);
    return parsed;
  } catch (err) {
    console.error("Error loading auth state:", err);
    clearAuthState();
    return getDefaultAuthState();
  }
};

// Save auth state to localStorage
export const saveAuthState = (state: RootState["auth"]) => {
  try {
    if (!state.isAuthenticated && !state.requiresMFA) {
      clearAuthState();
      return;
    }

    const toPersist = {
      user: state.user,
      token: state.token,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
      requiresMFA: state.requiresMFA,
      tempToken: state.tempToken,
      mfaMethods: state.mfaMethods,
      uid: state.uid,
      isLoading: false,
      tokenExpired: state.tokenExpired,
    };

    localStorage.setItem("authState", JSON.stringify(toPersist));

    if (state.token) localStorage.setItem("authToken", state.token);
    if (state.refreshToken) localStorage.setItem("refreshToken", state.refreshToken);
    if (state.roles) localStorage.setItem("user_roles", JSON.stringify(state.roles));
    if (state.permissions) localStorage.setItem("user_permissions", JSON.stringify(state.permissions));
    if (state.permissionSummary) {
      localStorage.setItem("user_permission_summary", JSON.stringify(state.permissionSummary));
    }

    // console.log("💾 Saved auth state:", toPersist);
  } catch (err) {
    console.error("Error saving auth state:", err);
  }
};

// Clear all auth-related localStorage
export const clearAuthState = () => {
  try {
    localStorage.removeItem("authState");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user_roles");
    localStorage.removeItem("user_permissions");
    localStorage.removeItem("user_permission_summary");
  } catch {
    // Ignore errors
  }
};

// Default structure of auth state
const getDefaultAuthState = (): RootState["auth"] => ({
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
  roles: [],
  permissions: [],
  permissionSummary: null,
});

// Validate auth state consistency
export const validateAuthState = (authState: RootState["auth"]) => {
  const issues: string[] = [];
  let needsSave = false;
  const correctedState = { ...authState };

  if (authState.token && isTokenExpired(authState.token)) {
    issues.push("Auth token expired");
    return { issues, correctedState: null, needsClear: true };
  }

  if (authState.isAuthenticated && !authState.token) {
    issues.push("Authenticated without token");
    correctedState.isAuthenticated = false;
    needsSave = true;
  }

  if (authState.token && !authState.isAuthenticated) {
    issues.push("Token without authentication");
    correctedState.isAuthenticated = true;
    needsSave = true;
  }

  return {
    issues,
    correctedState: needsSave ? correctedState : null,
    needsClear: false,
  };
};
