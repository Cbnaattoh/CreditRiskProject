import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../store";
import type { AuthUser } from "../../user/types/user";
import { clearUserState } from "../../../../utils/services/userPersist";
import type {
  PermissionCode,
  PermissionSummary,
  RoleName,
} from "../../api/RBAC/rbac";

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
  permissions: string[];
  roles: string[];
  permissionSummary: PermissionSummary | null;
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

const safeParseLocalStorage = (key: string, fallback: any[] = []): any[] => {
  if (typeof window === "undefined") return fallback;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const { token: initialToken, refreshToken: initialRefreshToken } =
  validateAndCleanupToken();

const EMPTY_PERMISSIONS: string[] = [];
const EMPTY_ROLES: string[] = [];
const EMPTY_MFA_METHODS: string[] = [];

const initialState: AuthState = {
  user: null,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialToken && !isTokenExpired(initialToken),
  requiresMFA: false,
  tempToken: null,
  mfaMethods: EMPTY_MFA_METHODS,
  uid: null,
  isLoading: false,
  tokenExpired: false,
  permissions: safeParseLocalStorage("user_permissions", EMPTY_PERMISSIONS),
  roles: safeParseLocalStorage("user_roles", EMPTY_ROLES),
  permissionSummary: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updatePermissions: (
      state,
      action: PayloadAction<{
        permissions: string[];
        roles: string[];
        permissionSummary?: PermissionSummary;
      }>
    ) => {
      state.permissions = Array.isArray(action.payload.permissions) 
        ? action.payload.permissions 
        : EMPTY_PERMISSIONS;
      state.roles = Array.isArray(action.payload.roles) 
        ? action.payload.roles 
        : EMPTY_ROLES;
      state.permissionSummary = action.payload.permissionSummary || null;

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "user_permissions",
          JSON.stringify(state.permissions)
        );
        localStorage.setItem("user_roles", JSON.stringify(state.roles));
      }
    },

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

      // Handle RBAC data from user object
      if ("permissions" in action.payload.user) {
        const rbacUser = action.payload.user as any;
        state.permissions = Array.isArray(rbacUser.permissions) 
          ? rbacUser.permissions 
          : EMPTY_PERMISSIONS;
        state.roles = Array.isArray(rbacUser.roles) 
          ? rbacUser.roles.map((r: any) => (typeof r === 'string' ? r : r.name)) 
          : EMPTY_ROLES;
        state.permissionSummary = rbacUser.permission_summary || null;
        
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "user_permissions",
            JSON.stringify(state.permissions)
          );
          localStorage.setItem("user_roles", JSON.stringify(state.roles));
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
      state.mfaMethods = Array.isArray(action.payload.mfaMethods) 
        ? action.payload.mfaMethods 
        : ["totp"];
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
      state.mfaMethods = EMPTY_MFA_METHODS;
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
      state.mfaMethods = EMPTY_MFA_METHODS;
      state.uid = null;
      state.isLoading = false;
      state.tokenExpired = false;
      state.permissions = EMPTY_PERMISSIONS;
      state.roles = EMPTY_ROLES;
      state.permissionSummary = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        localStorage.removeItem("user_permissions");
        localStorage.removeItem("user_roles");
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
        mfaMethods: EMPTY_MFA_METHODS,
        uid: null,
        isLoading: false,
        tokenExpired: false,
        permissions: EMPTY_PERMISSIONS,
        roles: EMPTY_ROLES,
        permissionSummary: null,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        localStorage.removeItem("user_permissions");
        localStorage.removeItem("user_roles");
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
      state.mfaMethods = EMPTY_MFA_METHODS;
      state.uid = null;
      state.isLoading = false;
      state.tokenExpired = true;
      state.permissions = EMPTY_PERMISSIONS;
      state.roles = EMPTY_ROLES;
      state.permissionSummary = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        localStorage.removeItem("user_permissions");
        localStorage.removeItem("user_roles");
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
  updatePermissions,
} = authSlice.actions;

export default authSlice.reducer;

const selectAuthState = (state: RootState) => state.auth;

// Basic selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectRequiresMFA = (state: RootState) => state.auth.requiresMFA;
export const selectTempToken = (state: RootState) => state.auth.tempToken;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectUid = (state: RootState) => state.auth.uid;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectTokenExpired = (state: RootState) => state.auth.tokenExpired;
export const selectPermissionSummary = (state: RootState) => state.auth.permissionSummary;

// Memoized authentication selectors
export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => 
    auth.isAuthenticated &&
    auth.token !== null &&
    !isTokenExpired(auth.token)
);

export const selectIsTokenValid = createSelector(
  [selectAuthToken],
  (token) => token && !isTokenExpired(token)
);

// Memoized array selectors to prevent unnecessary re-renders
export const selectUserPermissions = createSelector(
  [selectAuthState],
  (auth) => auth.permissions ?? EMPTY_PERMISSIONS
);

export const selectUserRoles = createSelector(
  [selectAuthState],
  (auth) => auth.roles ?? EMPTY_ROLES
);

export const selectMFAMethods = createSelector(
  [selectAuthState],
  (auth) => auth.mfaMethods ?? EMPTY_MFA_METHODS
);

// Memoized permission checker selectors
export const selectHasPermission = createSelector(
  [selectUserPermissions, (state: RootState, permission: PermissionCode) => permission],
  (permissions, permission) => permissions.includes(permission)
);

export const selectHasAnyPermission = createSelector(
  [selectUserPermissions, (state: RootState, permissions: PermissionCode[]) => permissions],
  (userPermissions, permissions) =>
    permissions.some((permission) => userPermissions.includes(permission))
);

export const selectHasAllPermissions = createSelector(
  [selectUserPermissions, (state: RootState, permissions: PermissionCode[]) => permissions],
  (userPermissions, permissions) =>
    permissions.every((permission) => userPermissions.includes(permission))
);

// Memoized role checker selectors
export const selectHasRole = createSelector(
  [selectUserRoles, (state: RootState, role: RoleName) => role],
  (roles, role) => roles.includes(role)
);

export const selectHasAnyRole = createSelector(
  [selectUserRoles, (state: RootState, roles: RoleName[]) => roles],
  (userRoles, roles) => roles.some((role) => userRoles.includes(role))
);

// Specific role selectors
export const selectIsAdmin = createSelector(
  [selectUserRoles],
  (roles) => roles.includes("Administrator")
);

export const selectIsStaff = createSelector(
  [selectUserRoles],
  (roles) => roles.some((role) =>
    ["Administrator", "Risk Analyst", "Compliance Auditor", "Manager"].includes(role)
  )
);

// User consistency checker
export const selectAuthUserConsistency = createSelector(
  [selectCurrentUser, (state: RootState) => state.user?.profile, selectIsAuthenticated],
  (authUser, userProfile, isAuthenticated) => ({
    authHasUser: !!authUser,
    userHasProfile: !!userProfile,
    isConsistent: !!authUser === (!!userProfile && isAuthenticated),
    authUserId: authUser?.id,
    userProfileId: userProfile?.id,
    idsMatch: authUser?.id === userProfile?.id,
  })
);

// Permission summary selector
export const selectPermissionCounts = createSelector(
  [selectUserPermissions, selectUserRoles],
  (permissions, roles) => ({
    permissionCount: permissions.length,
    roleCount: roles.length,
    hasPermissions: permissions.length > 0,
    hasRoles: roles.length > 0,
  })
);

// Auth status summary
export const selectAuthStatus = createSelector(
  [
    selectIsAuthenticated,
    selectIsLoading,
    selectTokenExpired,
    selectRequiresMFA,
    selectPermissionCounts,
  ],
  (isAuthenticated, isLoading, tokenExpired, requiresMFA, permissionCounts) => ({
    isAuthenticated,
    isLoading,
    tokenExpired,
    requiresMFA,
    ...permissionCounts,
  })
);

// Role level selector
export const selectRoleLevel = createSelector(
  [selectUserRoles],
  (roles) => {
    if (roles.includes("Administrator")) return 4;
    if (roles.includes("Manager")) return 3;
    if (roles.includes("Risk Analyst") || roles.includes("Compliance Auditor")) return 2;
    if (roles.includes("Client User")) return 1;
    return 0; // No recognized role
  }
);

// Elevated access checker
export const selectHasElevatedAccess = createSelector(
  [selectUserRoles, selectUserPermissions],
  (roles, permissions) => {
    const hasAdminRole = roles.includes("Administrator");
    const hasAdminPermissions = [
      "user_view_all",
      "role_view", 
      "system_settings",
      "view_audit_logs"
    ].some(permission => permissions.includes(permission));
    
    return hasAdminRole || hasAdminPermissions;
  }
);

// Utility function to check token expiration
export { isTokenExpired };