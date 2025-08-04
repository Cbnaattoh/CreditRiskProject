import { useSelector } from "react-redux";
import { useMemo } from "react";
import type { RootState } from "../../redux/store";
import type {
  PermissionCode,
  RoleName,
} from "../../redux/features/api/RBAC/rbac";
import {
  ROLE_PERMISSIONS,
  ROLE_FEATURES,
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
  const { roles, permissions, isAuthenticated } = usePermissions();
  const isAdmin = useIsAdmin();
  
  // If not authenticated, no access
  if (!isAuthenticated) {
    return false;
  }
  
  // Admin check - be very permissive for admin users
  if (isAdmin) {
    return true;
  }
  
  // Check for Administrator role (case variations)
  const adminRoleVariants = ['Administrator', 'Admin', 'admin', 'administrator'];
  if (roles.some(role => adminRoleVariants.includes(role))) {
    return true;
  }
  
  // Check for other authorized roles
  const authorizedRoles = ["Risk Analyst", "Compliance Auditor", "Manager"];
  if (roles.some(role => authorizedRoles.includes(role))) {
    return true;
  }
  
  // If user has report permissions, allow access
  const reportPermissions = ["report_view", "report_create", "report_admin"];
  if (permissions.some(perm => reportPermissions.includes(perm))) {
    return true;
  }
  
  // Default to false
  return false;
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

// ========================
// ENHANCED RBAC UTILITIES
// ========================

/**
 * Check if user can access reports (explicitly exclude Client Users)
 */
export const useCanAccessReports = (): boolean => {
  const { roles } = usePermissions();
  return useMemo(() => {
    // Client Users are explicitly excluded from reports
    return !roles.some(role => role === 'Client User') && 
           roles.some(role => ['Administrator', 'Risk Analyst', 'Compliance Auditor', 'Manager'].includes(role));
  }, [roles]);
};

/**
 * Check if user has specific feature access based on role
 */
export const useHasFeatureAccess = (feature: string): boolean => {
  const { roles } = usePermissions();
  return useMemo(() => {
    return roles.some(roleName => {
      const roleFeatures = ROLE_FEATURES[roleName as RoleName];
      return roleFeatures?.includes(feature);
    });
  }, [roles, feature]);
};

/**
 * Get all features accessible to current user
 */
export const useAccessibleFeatures = (): string[] => {
  const { roles } = usePermissions();
  return useMemo(() => {
    const features = new Set<string>();
    roles.forEach(roleName => {
      const roleFeatures = ROLE_FEATURES[roleName as RoleName];
      if (roleFeatures) {
        roleFeatures.forEach(feature => features.add(feature));
      }
    });
    return Array.from(features);
  }, [roles]);
};

/**
 * Check if user is a Client User (lowest privilege level)
 */
export const useIsClientUser = (): boolean => {
  const { roles, isAuthenticated } = usePermissions();
  const currentUser = useSelector((state: any) => state.auth.user);
  
  return useMemo(() => {
    // Don't return false during loading - be conservative
    if (!isAuthenticated) {
      console.log('🟢 useIsClientUser: NOT AUTHENTICATED');
      return false;
    }
    
    // Check multiple sources for client user status
    const hasClientUserRole = roles.includes('Client User');
    const userTypeIsClient = currentUser?.user_type === 'CLIENT' ||
                            currentUser?.user_type === 'CLIENT_USER' || 
                            currentUser?.user_type === 'Client User' ||
                            currentUser?.user_type_display === 'Client User' ||
                            currentUser?.role === 'CLIENT';
    
    // Simple logic: if has Client User role, they are a client user
    const result = hasClientUserRole || userTypeIsClient;
    
    // Success! RBAC detection is working
    if (result) {
      console.log('✅ useIsClientUser: Detected client user successfully');
    }
    
    return result;
  }, [roles, isAuthenticated, currentUser?.user_type, currentUser?.user_type_display]);
};

/**
 * Get user's highest privilege role
 */
export const useHighestRole = (): RoleName | null => {
  const { roles } = usePermissions();
  return useMemo(() => {
    const roleHierarchy: RoleName[] = ['Administrator', 'Manager', 'Compliance Auditor', 'Risk Analyst', 'Client User'];
    for (const role of roleHierarchy) {
      if (roles.includes(role)) return role;
    }
    return null;
  }, [roles]);
};

/**
 * Comprehensive access check with role and permission validation
 */
export const useRobustAccessCheck = (config: {
  permissions?: PermissionCode[];
  roles?: RoleName[];
  excludeRoles?: RoleName[];
  features?: string[];
  requireAll?: boolean;
}): boolean => {
  const { permissions: userPermissions, roles: userRoles } = usePermissions();
  const { permissions = [], roles = [], excludeRoles = [], features = [], requireAll = false } = config;

  return useMemo(() => {
    // Check if user has any excluded roles
    if (excludeRoles.length > 0 && excludeRoles.some(role => userRoles.includes(role))) {
      return false;
    }

    // Check roles
    const hasRequiredRoles = roles.length === 0 || 
      (requireAll ? roles.every(role => userRoles.includes(role)) 
                  : roles.some(role => userRoles.includes(role)));

    // Check permissions
    const hasRequiredPermissions = permissions.length === 0 || 
      (requireAll ? permissions.every(perm => userPermissions.includes(perm))
                  : permissions.some(perm => userPermissions.includes(perm)));

    // Check features
    const hasRequiredFeatures = features.length === 0 || 
      features.some(feature => {
        const roleFeatures = userRoles.flatMap(role => ROLE_FEATURES[role as RoleName] || []);
        return roleFeatures.includes(feature);
      });

    // Combine results
    return hasRequiredRoles && hasRequiredPermissions && hasRequiredFeatures;
  }, [userPermissions, userRoles, permissions, roles, excludeRoles, features, requireAll]);
};
