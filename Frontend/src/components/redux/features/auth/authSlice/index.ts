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
  requiresMFASetup: boolean;
  tempToken: string | null;
  mfaMethods: string[];
  uid: string | null;
  isLoading: boolean;
  tokenExpired: boolean;
  permissions: string[];
  roles: string[];
  permissionSummary: PermissionSummary | null;
  tokenType: 'full_access' | 'mfa_setup' | null;
  limitedAccess: boolean;
  mfaCompleted: boolean;
  requiresPasswordChange: boolean;
  passwordExpired: boolean;
  temporaryPassword: boolean;
  createdByAdmin: boolean;
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
  user: any | null;
} => {
  if (typeof window === "undefined") return { token: null, refreshToken: null, user: null };

  const token = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const userDataString = localStorage.getItem("authUser");

  let user = null;
  if (userDataString) {
    try {
      user = JSON.parse(userDataString);
    } catch {
      localStorage.removeItem("authUser");
    }
  }

  if (token && isTokenExpired(token)) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authState");
    localStorage.removeItem("authUser");
    clearUserState();
    return { token: null, refreshToken: null, user: null };
  }

  return { token, refreshToken, user };
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

// Helper to get persisted permission summary
const getPersistedPermissionSummary = (): PermissionSummary | null => {
  if (typeof window === "undefined") return null;

  try {
    const item = localStorage.getItem("user_permission_summary");
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const { token: initialToken, refreshToken: initialRefreshToken, user: initialUser } =
  validateAndCleanupToken();

const EMPTY_PERMISSIONS: string[] = [];
const EMPTY_ROLES: string[] = [];
const EMPTY_MFA_METHODS: string[] = [];

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialToken && !isTokenExpired(initialToken),
  requiresMFA: false,
  requiresMFASetup: false,
  tempToken: null,
  mfaMethods: EMPTY_MFA_METHODS,
  uid: null,
  isLoading: false,
  tokenExpired: false,
  permissions: safeParseLocalStorage("user_permissions", EMPTY_PERMISSIONS),
  roles: safeParseLocalStorage("user_roles", EMPTY_ROLES),
  permissionSummary: getPersistedPermissionSummary(),
  tokenType: null,
  limitedAccess: false,
  mfaCompleted: false,
  requiresPasswordChange: false,
  passwordExpired: false,
  temporaryPassword: false,
  createdByAdmin: false,
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
      console.log('🔵 Updating permissions:', action.payload);

      state.permissions = Array.isArray(action.payload.permissions)
        ? action.payload.permissions
        : EMPTY_PERMISSIONS;
      state.roles = Array.isArray(action.payload.roles)
        ? action.payload.roles
        : EMPTY_ROLES;
      state.permissionSummary = action.payload.permissionSummary || null;

      // Persist to localStorage for page refresh survival
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "user_permissions",
          JSON.stringify(state.permissions)
        );
        localStorage.setItem("user_roles", JSON.stringify(state.roles));
        if (state.permissionSummary) {
          localStorage.setItem(
            "user_permission_summary",
            JSON.stringify(state.permissionSummary)
          );
        } else {
          localStorage.removeItem("user_permission_summary");
        }

        console.log('🔵 Persisted permissions to localStorage:', {
          permissions: state.permissions.length,
          roles: state.roles.length,
          summary: !!state.permissionSummary
        });
      }
    },

    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser & { permissions?: string[]; roles?: Array<{ id: number, name: string }> };
        token: string;
        refreshToken?: string;
        tokenType?: 'full_access' | 'mfa_setup';
        requiresMFASetup?: boolean;
        limitedAccess?: boolean;
        mfaCompleted?: boolean;
        requires_password_change?: boolean;
        password_expired?: boolean;
        temporary_password?: boolean;
        created_by_admin?: boolean;
      }>
    ) => {

      const {
        user,
        token,
        refreshToken,
        tokenType,
        requiresMFASetup,
        limitedAccess,
        mfaCompleted,
        requires_password_change,
        password_expired,
        temporary_password,
        created_by_admin,
      } = action.payload;

      if (isTokenExpired(token)) {
        console.warn("Attempted to set expired token");
        return;
      }

      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;
      state.requiresMFA = false;
      state.requiresMFASetup = requiresMFASetup ?? false;
      state.tempToken = null;
      state.isLoading = false;
      state.tokenExpired = false;
      state.tokenType = tokenType ?? 'full_access';
      state.limitedAccess = limitedAccess ?? false;
      state.mfaCompleted = mfaCompleted ?? true;
      state.requiresPasswordChange = requires_password_change ?? false;
      state.passwordExpired = password_expired ?? false;
      state.temporaryPassword = temporary_password ?? false;
      state.createdByAdmin = created_by_admin ?? false;
      state.roles = Array.isArray(user.roles) ? user.roles.map((r) => typeof r === 'string' ? r : r.name) : EMPTY_ROLES;
      state.permissions = Array.isArray(user.permissions) ? user.permissions : EMPTY_PERMISSIONS;


      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
        localStorage.setItem("authUser", JSON.stringify(user));
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        localStorage.setItem("user_permissions", JSON.stringify(state.permissions));
        localStorage.setItem("user_roles", JSON.stringify(state.roles));

        if (state.permissionSummary) {
          localStorage.setItem("user_permission_summary", JSON.stringify(state.permissionSummary));
        }

        console.log('🔵 Persisted RBAC data from setCredentials:', {
          permissions: state.permissions.length,
          roles: state.roles.length,
          summary: !!state.permissionSummary
        });

      }

      // Handle RBAC data from user object
      // if ("permissions" in action.payload.user) {
      //   const rbacUser = action.payload.user as any;
      //   console.log('🔵 Processing RBAC data from user:', rbacUser);

      //   state.permissions = Array.isArray(rbacUser.permissions)
      //     ? rbacUser.permissions
      //     : EMPTY_PERMISSIONS;
      //   state.roles = Array.isArray(rbacUser.roles)
      //     ? rbacUser.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      //     : EMPTY_ROLES;
      //   state.permissionSummary = rbacUser.permission_summary || null;

      //   // Persist RBAC data
      //   if (typeof window !== "undefined") {
      //     localStorage.setItem(
      //       "user_permissions",
      //       JSON.stringify(state.permissions)
      //     );
      //     localStorage.setItem("user_roles", JSON.stringify(state.roles));
      //     if (state.permissionSummary) {
      //       localStorage.setItem(
      //         "user_permission_summary",
      //         JSON.stringify(state.permissionSummary)
      //       );
      //     }

      //     console.log('🔵 Persisted RBAC data from setCredentials:', {
      //       permissions: state.permissions.length,
      //       roles: state.roles.length,
      //       summary: !!state.permissionSummary
      //     });
      //   }
      // }
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

    setMFASetupRequired: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        token: string;
        refreshToken?: string;
        message?: string;
      }>
    ) => {
      const { user, token, refreshToken } = action.payload;

      if (isTokenExpired(token)) {
        console.warn("Attempted to set expired MFA setup token");
        return;
      }

      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;
      state.requiresMFA = false;
      state.requiresMFASetup = true;
      state.tempToken = null;
      state.isLoading = false;
      state.tokenExpired = false;
      state.tokenType = 'mfa_setup';
      state.limitedAccess = true;
      state.mfaCompleted = false;

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
        localStorage.setItem("authUser", JSON.stringify(user));
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
      }

      console.log('🔒 MFA Setup Required - Limited Access Token Issued');
    },

    completeMFASetup: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
        tokenType?: 'full_access';
      }>
    ) => {
      const { token, refreshToken, tokenType } = action.payload;

      if (isTokenExpired(token)) {
        console.warn("Attempted to set expired token after MFA completion");
        return;
      }

      state.token = token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.requiresMFASetup = false;
      state.limitedAccess = false;
      state.mfaCompleted = true;
      state.tokenType = tokenType ?? 'full_access';

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
      }

      console.log('✅ MFA Setup Completed - Full Access Token Issued');
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("authUser", JSON.stringify(action.payload));
      }
    },

    clearMFAState: (state) => {
      state.requiresMFA = false;
      state.requiresMFASetup = false;
      state.tempToken = null;
      state.uid = null;
      state.mfaMethods = EMPTY_MFA_METHODS;
      state.limitedAccess = false;
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
      state.requiresMFASetup = false;
      state.tempToken = null;
      state.mfaMethods = EMPTY_MFA_METHODS;
      state.uid = null;
      state.isLoading = false;
      state.tokenExpired = false;
      state.permissions = EMPTY_PERMISSIONS;
      state.roles = EMPTY_ROLES;
      state.permissionSummary = null;
      state.tokenType = null;
      state.limitedAccess = false;
      state.mfaCompleted = false;
      state.requiresPasswordChange = false;
      state.passwordExpired = false;
      state.temporaryPassword = false;
      state.createdByAdmin = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        localStorage.removeItem("authUser");
        localStorage.removeItem("user_permissions");
        localStorage.removeItem("user_roles");
        localStorage.removeItem("user_permission_summary");
        clearUserState();
        console.log('🔵 Logout: Cleared all auth and RBAC data from localStorage');
      }
    },

    clearPasswordChangeRequirements: (state) => {
      state.requiresPasswordChange = false;
      state.passwordExpired = false;
      state.temporaryPassword = false;
    },

    clearAllAuthData: (state) => {
      Object.assign(state, {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        requiresMFA: false,
        requiresMFASetup: false,
        tempToken: null,
        mfaMethods: EMPTY_MFA_METHODS,
        uid: null,
        isLoading: false,
        tokenExpired: false,
        permissions: EMPTY_PERMISSIONS,
        roles: EMPTY_ROLES,
        permissionSummary: null,
        tokenType: null,
        limitedAccess: false,
        mfaCompleted: false,
        requiresPasswordChange: false,
        passwordExpired: false,
        temporaryPassword: false,
        createdByAdmin: false,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        localStorage.removeItem("authUser");
        localStorage.removeItem("user_permissions");
        localStorage.removeItem("user_roles");
        localStorage.removeItem("user_permission_summary");
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
      state.requiresMFASetup = false;
      state.tempToken = null;
      state.mfaMethods = EMPTY_MFA_METHODS;
      state.uid = null;
      state.isLoading = false;
      state.tokenExpired = true;
      state.permissions = EMPTY_PERMISSIONS;
      state.roles = EMPTY_ROLES;
      state.permissionSummary = null;
      state.tokenType = null;
      state.limitedAccess = false;
      state.mfaCompleted = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authState");
        localStorage.removeItem("authUser");
        localStorage.removeItem("user_permissions");
        localStorage.removeItem("user_roles");
        localStorage.removeItem("user_permission_summary");
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
  setMFASetupRequired,
  completeMFASetup,
  setLoading,
  setUser,
  clearMFAState,
  logout,
  setTokenExpired,
  refreshTokenSuccess,
  refreshTokenFailure,
  clearAllAuthData,
  updatePermissions,
  clearPasswordChangeRequirements,
} = authSlice.actions;

export default authSlice.reducer;

const selectAuthState = (state: RootState) => state.auth;

// Basic selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectRequiresMFA = (state: RootState) => state.auth.requiresMFA;
export const selectRequiresMFASetup = (state: RootState) => state.auth.requiresMFASetup;
export const selectTempToken = (state: RootState) => state.auth.tempToken;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectUid = (state: RootState) => state.auth.uid;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectTokenExpired = (state: RootState) => state.auth.tokenExpired;
export const selectPermissionSummary = (state: RootState) => state.auth.permissionSummary;
export const selectTokenType = (state: RootState) => state.auth.tokenType;
export const selectLimitedAccess = (state: RootState) => state.auth.limitedAccess;
export const selectMfaCompleted = (state: RootState) => state.auth.mfaCompleted;

// Password change selectors
export const selectRequiresPasswordChange = (state: RootState) => state.auth.requiresPasswordChange;
export const selectPasswordExpired = (state: RootState) => state.auth.passwordExpired;
export const selectTemporaryPassword = (state: RootState) => state.auth.temporaryPassword;
export const selectCreatedByAdmin = (state: RootState) => state.auth.createdByAdmin;

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) =>
    auth.isAuthenticated &&
    auth.token !== null &&
    !isTokenExpired(auth.token)
);

export const selectHasFullAccess = createSelector(
  [selectAuthState],
  (auth) =>
    auth.isAuthenticated &&
    auth.token !== null &&
    !isTokenExpired(auth.token) &&
    auth.tokenType === 'full_access' &&
    !auth.limitedAccess
);

export const selectHasLimitedAccess = createSelector(
  [selectAuthState],
  (auth) =>
    auth.isAuthenticated &&
    auth.token !== null &&
    !isTokenExpired(auth.token) &&
    auth.tokenType === 'mfa_setup' &&
    auth.limitedAccess
);

export const selectIsTokenValid = createSelector(
  [selectAuthToken],
  (token) => token && !isTokenExpired(token)
);

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
    selectHasFullAccess,
    selectHasLimitedAccess,
    selectIsLoading,
    selectTokenExpired,
    selectRequiresMFA,
    selectRequiresMFASetup,
    selectTokenType,
    selectLimitedAccess,
    selectMfaCompleted,
    selectPermissionCounts,
  ],
  (isAuthenticated, hasFullAccess, hasLimitedAccess, isLoading, tokenExpired, requiresMFA, requiresMFASetup, tokenType, limitedAccess, mfaCompleted, permissionCounts) => ({
    isAuthenticated,
    hasFullAccess,
    hasLimitedAccess,
    isLoading,
    tokenExpired,
    requiresMFA,
    requiresMFASetup,
    tokenType,
    limitedAccess,
    mfaCompleted,
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
    return 0;
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