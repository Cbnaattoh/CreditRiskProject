import { useSelector } from "react-redux";
import { useMemo } from "react";
import type { RootState } from "../../redux/store";
import type {
  PermissionCode,
  RoleName,
  BackendRoleType,
} from "../../redux/features/api/RBAC/rbac";
import {
  ROLE_PERMISSIONS,
  ROLE_FEATURES,
  ROLE_HIERARCHY,
  mapBackendRoleToFrontend,
  getUserPermissionsFromRoles,
  userHasPermission,
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
  const isClientUser = useIsClientUser();

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
      reports: ["report_view"],
      compliance_audit: ["compliance_audit"],
      compliance: ["compliance_view"],
      data_export: ["data_export"],
      data_import: ["data_import"],
      risk_management: ["risk_view"],
      client_management: ["client_view"],
      dashboard: ["view_dashboard"],
    };

    // Admin has access to everything
    if (isAdmin) return true;
    
    // Client users have restricted access - explicitly block reports
    if (isClientUser && feature === 'reports') {
      return false;
    }

    const requiredPermissions = featurePermissions[feature];

    if (!requiredPermissions) {
      return true;
    }

    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );
  }, [feature, isAdmin, userPermissions, isClientUser]);
};

// ========================
// ENHANCED RBAC UTILITIES
// ========================

/**
 * Check if user can access reports (explicitly exclude Client Users)
 */
export const useCanAccessReports = (): boolean => {
  const { roles, permissions } = usePermissions();
  const isClientUser = useIsClientUser();
  
  return useMemo(() => {
    // Explicitly exclude Client Users from reports
    if (isClientUser) {
      return false;
    }
    
    // Check if user has report viewing permissions
    const hasReportPermission = permissions.includes('report_view');
    
    // Check if user has authorized roles
    const hasAuthorizedRole = roles.some(role => 
      ['Administrator', 'Risk Analyst', 'Compliance Auditor', 'Manager'].includes(role)
    );
    
    return hasReportPermission || hasAuthorizedRole;
  }, [roles, permissions, isClientUser]);
};

/**
 * Enhanced hook to check if user can access dashboard features based on their role
 */
export const useDashboardAccess = () => {
  const isAdmin = useIsAdministrator();
  const isClient = useIsClientUser();
  const isAnalyst = useIsAnalyst();
  const isAuditor = useIsAuditor();
  const isManager = useIsManager();
  const canAccessReports = useCanAccessReports();
  const { permissions } = usePermissions();
  
  return useMemo(() => ({
    // Dashboard sections access
    canViewDashboard: permissions.includes('view_dashboard'),
    canViewReports: canAccessReports,
    canViewUsers: permissions.includes('user_view_all'),
    canViewRoles: permissions.includes('role_view'),
    canViewAuditLogs: permissions.includes('view_audit_logs'),
    canViewRiskManagement: permissions.includes('risk_view'),
    canViewCompliance: permissions.includes('compliance_view'),
    canViewClients: permissions.includes('client_view'),
    canViewSystemSettings: permissions.includes('system_settings'),
    
    // Role-based access
    isAdmin,
    isClient,
    isAnalyst,
    isAuditor,
    isManager,
    
    // Combined access checks
    hasElevatedAccess: isAdmin || isManager,
    hasStaffAccess: isAdmin || isAnalyst || isAuditor || isManager,
    hasLimitedAccess: isClient,
  }), [permissions, isAdmin, isClient, isAnalyst, isAuditor, isManager, canAccessReports]);
};

/**
 * Hook for navigation access control
 */
export const useNavigationAccess = () => {
  const dashboardAccess = useDashboardAccess();
  
  return useMemo(() => ({
    // Main navigation items
    showDashboard: dashboardAccess.canViewDashboard,
    showReports: dashboardAccess.canViewReports && !dashboardAccess.isClient,
    showUserManagement: dashboardAccess.canViewUsers && dashboardAccess.hasElevatedAccess,
    showRoleManagement: dashboardAccess.canViewRoles && dashboardAccess.hasElevatedAccess,
    showAuditLogs: dashboardAccess.canViewAuditLogs,
    showRiskManagement: dashboardAccess.canViewRiskManagement,
    showCompliance: dashboardAccess.canViewCompliance,
    showClientManagement: dashboardAccess.canViewClients,
    showSystemSettings: dashboardAccess.canViewSystemSettings && dashboardAccess.isAdmin,
    
    // User profile access
    canEditProfile: true, // All users can edit their own profile
    canViewProfile: true, // All users can view their own profile
  }), [dashboardAccess]);
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
    if (!isAuthenticated) {
      return false;
    }
    
    // Check multiple sources for client user status
    const hasClientUserRole = roles.includes('Client User');
    const userTypeIsClient = currentUser?.user_type === 'CLIENT' ||
                            currentUser?.role === 'CLIENT' ||
                            currentUser?.role === 'Client User';
    
    // Check if user has client role in roles array
    const hasClientRoleInArray = currentUser?.roles?.some((role: any) => 
      role.name === 'Client User' || role.name === 'CLIENT'
    );
    
    return hasClientUserRole || userTypeIsClient || hasClientRoleInArray;
  }, [roles, isAuthenticated, currentUser?.user_type, currentUser?.role, currentUser?.roles]);
};

/**
 * Check if user is an Administrator
 */
export const useIsAdministrator = (): boolean => {
  const { roles } = usePermissions();
  const currentUser = useSelector((state: any) => state.auth.user);
  
  return useMemo(() => {
    const hasAdminRole = roles.includes('Administrator');
    const userTypeIsAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'Administrator';
    const hasAdminRoleInArray = currentUser?.roles?.some((role: any) => 
      role.name === 'Administrator' || role.name === 'ADMIN'
    );
    
    return hasAdminRole || userTypeIsAdmin || hasAdminRoleInArray;
  }, [roles, currentUser?.role, currentUser?.roles]);
};

/**
 * Check if user is a Risk Analyst
 */
export const useIsAnalyst = (): boolean => {
  const { roles } = usePermissions();
  const currentUser = useSelector((state: any) => state.auth.user);
  
  return useMemo(() => {
    const hasAnalystRole = roles.includes('Risk Analyst');
    const userTypeIsAnalyst = currentUser?.role === 'ANALYST' || currentUser?.role === 'Risk Analyst';
    const hasAnalystRoleInArray = currentUser?.roles?.some((role: any) => 
      role.name === 'Risk Analyst' || role.name === 'ANALYST'
    );
    
    return hasAnalystRole || userTypeIsAnalyst || hasAnalystRoleInArray;
  }, [roles, currentUser?.role, currentUser?.roles]);
};

/**
 * Check if user is a Compliance Auditor
 */
export const useIsAuditor = (): boolean => {
  const { roles } = usePermissions();
  const currentUser = useSelector((state: any) => state.auth.user);
  
  return useMemo(() => {
    const hasAuditorRole = roles.includes('Compliance Auditor');
    const userTypeIsAuditor = currentUser?.role === 'AUDITOR' || currentUser?.role === 'Compliance Auditor';
    const hasAuditorRoleInArray = currentUser?.roles?.some((role: any) => 
      role.name === 'Compliance Auditor' || role.name === 'AUDITOR'
    );
    
    return hasAuditorRole || userTypeIsAuditor || hasAuditorRoleInArray;
  }, [roles, currentUser?.role, currentUser?.roles]);
};

/**
 * Check if user is a Manager
 */
export const useIsManager = (): boolean => {
  const { roles } = usePermissions();
  const currentUser = useSelector((state: any) => state.auth.user);
  
  return useMemo(() => {
    const hasManagerRole = roles.includes('Manager');
    const userTypeIsManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'Manager';
    const hasManagerRoleInArray = currentUser?.roles?.some((role: any) => 
      role.name === 'Manager' || role.name === 'MANAGER'
    );
    
    return hasManagerRole || userTypeIsManager || hasManagerRoleInArray;
  }, [roles, currentUser?.role, currentUser?.roles]);
};

/**
 * Get user's highest privilege role
 */
export const useHighestRole = (): RoleName | null => {
  const { roles } = usePermissions();
  return useMemo(() => {
    let highestRole: RoleName | null = null;
    let highestLevel = 0;
    
    roles.forEach(role => {
      const level = ROLE_HIERARCHY[role as RoleName];
      if (level && level > highestLevel) {
        highestLevel = level;
        highestRole = role as RoleName;
      }
    });
    
    return highestRole;
  }, [roles]);
};

/**
 * Get user's role level (higher number = more privileges)
 */
export const useUserRoleLevel = (): number => {
  const highestRole = useHighestRole();
  return highestRole ? ROLE_HIERARCHY[highestRole] : 0;
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
