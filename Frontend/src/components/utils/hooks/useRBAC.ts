import { useSelector } from "react-redux";
import { useMemo } from "react";
import type { RootState } from "../../redux/store";
import type {
  PermissionCode,
  RoleName,
} from "../../redux/features/api/RBAC/rbac";
import {
  selectUserPermissions,
  selectUserRoles,
  selectIsAuthenticated,
  selectIsAdmin,
  selectIsStaff,
  selectPermissionSummary,
  selectAuthStatus,
  selectRoleLevel,
  selectHasElevatedAccess,
  selectHasPermission,
  selectHasAnyPermission,
  selectHasAllPermissions,
  selectHasRole,
  selectHasAnyRole,
} from "../../redux/features/auth/authSlice";

export const usePermissions = () => {
  const permissions = useSelector(selectUserPermissions);
  const roles = useSelector(selectUserRoles);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const isStaff = useSelector(selectIsStaff);
  const permissionSummary = useSelector(selectPermissionSummary);

  return {
    permissions,
    roles,
    isAuthenticated,
    isAdmin,
    isStaff,
    permissionSummary,
  };
};

// Check single permission
export const useHasPermission = (permission: PermissionCode): boolean => {
  return useSelector((state: RootState) =>
    selectHasPermission(state, permission)
  );
};

// Check multiple permissions (user must have ALL)
export const useHasAllPermissions = (
  permissions: PermissionCode[]
): boolean => {
  return useSelector((state: RootState) =>
    selectHasAllPermissions(state, permissions)
  );
};

// Check multiple permissions (user must have ANY)
export const useHasAnyPermission = (permissions: PermissionCode[]): boolean => {
  return useSelector((state: RootState) =>
    selectHasAnyPermission(state, permissions)
  );
};

// Check single role
export const useHasRole = (role: RoleName): boolean => {
  return useSelector((state: RootState) => selectHasRole(state, role));
};

// Check multiple roles (user must have ANY)
export const useHasAnyRole = (roles: RoleName[]): boolean => {
  return useSelector((state: RootState) => selectHasAnyRole(state, roles));
};

// Admin check
export const useIsAdmin = (): boolean => {
  return useSelector(selectIsAdmin);
};

// Staff check
export const useIsStaff = (): boolean => {
  return useSelector(selectIsStaff);
};

// Pure function for checking access
export const checkCanAccess = (
  userPermissions: string[],
  userRoles: string[],
  isAuthenticated: boolean,
  config: {
    permissions?: PermissionCode[];
    roles?: RoleName[];
    requireAll?: boolean;
    requireAuth?: boolean;
  }
): boolean => {
  const {
    permissions = [],
    roles = [],
    requireAll = false,
    requireAuth = true,
  } = config;

  // Check authentication first
  if (requireAuth && !isAuthenticated) {
    return false;
  }

  // If no permissions or roles specified, just check auth
  if (permissions.length === 0 && roles.length === 0) {
    return requireAuth ? isAuthenticated : true;
  }

  // Check permissions
  const hasPermissions =
    permissions.length === 0
      ? true
      : requireAll
      ? permissions.every((p) => userPermissions.includes(p))
      : permissions.some((p) => userPermissions.includes(p));

  // Check roles
  const hasRoles =
    roles.length === 0
      ? true
      : requireAll
      ? roles.every((r) => userRoles.includes(r))
      : roles.some((r) => userRoles.includes(r));

  // Combine results
  return requireAll ? hasPermissions && hasRoles : hasPermissions || hasRoles;
};

export const useCanAccess = (config: {
  permissions?: PermissionCode[];
  roles?: RoleName[];
  requireAll?: boolean;
  requireAuth?: boolean;
}): boolean => {
  const { permissions, roles, isAuthenticated } = usePermissions();

  return useMemo(() => {
    return checkCanAccess(permissions, roles, isAuthenticated, config);
  }, [permissions, roles, isAuthenticated, config]);
};

export const useCanManageUsers = () => {
  return useHasAnyPermission(["user_view_all", "user_edit_all"]);
};

export const useCanManageRoles = () => {
  return useHasAnyPermission(["role_view", "role_edit", "user_manage_roles"]);
};

export const useCanViewReports = () => {
  return useHasAnyPermission(["report_view", "report_create", "report_admin"]);
};

export const useCanAccessAdmin = () => {
  return useHasAnyPermission([
    "user_view_all",
    "role_view",
    "system_settings",
    "view_dashboard",
  ]);
};

export const useCanViewAuditLogs = () => {
  return useHasPermission("view_audit_logs");
};

export const useCanExportData = () => {
  return useHasPermission("data_export");
};

// Data action hooks
export const useCanEditUser = (userId?: string) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const canEditAll = useHasPermission("user_edit_all");

  return useMemo(() => {
    // Can edit if: admin OR editing own profile
    return canEditAll || (userId && currentUser?.id === userId);
  }, [canEditAll, userId, currentUser?.id]);
};

export const useCanDeleteUser = () => {
  return useHasPermission("user_delete");
};

export const useCanAssignRole = () => {
  return useHasPermission("user_manage_roles");
};

export const useCanResetPassword = () => {
  return useHasPermission("user_edit_all");
};

export const useAuthStatus = () => {
  return useSelector(selectAuthStatus);
};

export const useRoleLevel = (): number => {
  return useSelector(selectRoleLevel);
};

export const useHasElevatedAccess = (): boolean => {
  return useSelector(selectHasElevatedAccess);
};

// Hook for conditional rendering based on multiple conditions
export const useConditionalAccess = (conditions: {
  minRoleLevel?: number;
  permissions?: PermissionCode[];
  roles?: RoleName[];
  requireAuth?: boolean;
  customCheck?: () => boolean;
}): boolean => {
  const {
    minRoleLevel,
    permissions = [],
    roles = [],
    requireAuth = true,
    customCheck,
  } = conditions;

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRoleLevel = useSelector(selectRoleLevel);
  const hasPermissions = useHasAnyPermission(permissions);
  const hasRoles = useHasAnyRole(roles);

  return useMemo(() => {
    // Check authentication
    if (requireAuth && !isAuthenticated) return false;

    // Check minimum role level
    if (minRoleLevel !== undefined && userRoleLevel < minRoleLevel)
      return false;

    // Check permissions (if specified)
    if (permissions.length > 0 && !hasPermissions) return false;

    // Check roles (if specified)
    if (roles.length > 0 && !hasRoles) return false;

    // Run custom check if provided
    if (customCheck && !customCheck()) return false;

    return true;
  }, [
    isAuthenticated,
    userRoleLevel,
    hasPermissions,
    hasRoles,
    minRoleLevel,
    permissions.length,
    roles.length,
    customCheck,
    requireAuth,
  ]);
};

// Hook for checking feature availability
export const useFeatureAccess = (feature: string): boolean => {
  const isAdmin = useSelector(selectIsAdmin);
  const userPermissions = useSelector(selectUserPermissions);

  return useMemo(() => {
    // Feature flag mapping based on backend permissions
    const featurePermissions: Record<string, PermissionCode[]> = {
      admin_panel: ["user_view_all", "role_view"],
      user_management: ["user_view_all"],
      role_management: ["role_view"],
      audit_logs: ["view_audit_logs"],
      system_settings: ["system_settings"],
      bulk_actions: ["user_edit_all"],
      advanced_reports: ["report_admin"],
      compliance_audit: ["compliance_audit"],
      data_export: ["data_export"],
      data_import: ["data_import"],
      risk_management: ["risk_view"],
      client_management: ["client_view"],
    };

    // Admin has access to everything
    if (isAdmin) return true;

    const requiredPermissions = featurePermissions[feature];

    if (!requiredPermissions) {
      return true;
    }

    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );
  }, [feature, isAdmin, userPermissions]);
};
