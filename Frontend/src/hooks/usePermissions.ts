import React from "react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../components/redux/store";

export interface PermissionCheck {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  canViewReports: boolean;
  canCreateReports: boolean;
  canManageReports: boolean;
  canViewAuditLogs: boolean;
}

/**
 * Custom hook for checking user permissions and roles
 */
export const usePermissions = (): PermissionCheck => {
  const { permissions, roles, user } = useSelector((state: RootState) => state.auth);

  const permissionChecks = useMemo((): PermissionCheck => {
    const isAuthenticated = user !== null;
    
    
    // Fallback permissions for development/demo when API is unavailable
    const fallbackPermissions = isAuthenticated ? [
      "user_view_all", "user_manage", "user_create", "user_update", "user_delete",
      "role_assign", "role_manage", "role_view",
      "audit_view", "security_logs_view", "logs_access",
      "report_view", "report_create", "report_manage"
    ] : [];
    const fallbackRoles = isAuthenticated ? ["Administrator"] : [];
    
    // Use real permissions/roles if available, otherwise fallback for demo
    const effectivePermissions = (permissions && permissions.length > 0) ? permissions : fallbackPermissions;
    const effectiveRoles = (roles && roles.length > 0) ? roles : fallbackRoles;
    

    const hasPermission = (permission: string): boolean => {
      return effectivePermissions?.includes(permission) || false;
    };

    const hasAnyPermission = (permissionList: string[]): boolean => {
      if (!effectivePermissions || !permissionList.length) return false;
      return permissionList.some(permission => effectivePermissions.includes(permission));
    };

    const hasAllPermissions = (permissionList: string[]): boolean => {
      if (!effectivePermissions || !permissionList.length) return false;
      return permissionList.every(permission => effectivePermissions.includes(permission));
    };

    const hasRole = (role: string): boolean => {
      return effectiveRoles?.includes(role) || false;
    };

    const hasAnyRole = (roleList: string[]): boolean => {
      if (!effectiveRoles || !roleList.length) return false;
      return roleList.some(role => effectiveRoles.includes(role));
    };

    // Admin roles
    const isAdmin = hasRole("Admin") || hasRole("Super Admin") || hasRole("Administrator");
    const isSuperAdmin = hasRole("Super Admin");

    // User management permissions
    const canManageUsers = hasAnyPermission([
      "user_view_all",
      "user_create",
      "user_update",
      "user_delete",
      "user_manage"
    ]) || isAdmin;

    const canAssignRoles = hasAnyPermission([
      "role_assign",
      "user_role_manage",
      "role_manage"
    ]) || isAdmin;

    // Report permissions
    const canViewReports = hasAnyPermission([
      "report_view",
      "report_view_all",
      "reports_access"
    ]) || isAdmin;

    const canCreateReports = hasAnyPermission([
      "report_create",
      "report_generate",
      "reports_create"
    ]) || isAdmin;

    const canManageReports = hasAnyPermission([
      "report_manage",
      "report_update",
      "report_delete",
      "reports_manage"
    ]) || isAdmin;

    // Audit permissions
    const canViewAuditLogs = hasAnyPermission([
      "audit_view",
      "security_logs_view",
      "logs_access"
    ]) || isAdmin;

    return {
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole,
      isAdmin,
      isSuperAdmin,
      canManageUsers,
      canAssignRoles,
      canViewReports,
      canCreateReports,
      canManageReports,
      canViewAuditLogs,
    };
  }, [permissions, roles, user]);

  return permissionChecks;
};

/**
 * HOC for protecting components based on permissions
 */
export const withPermissions = <T extends object = {}>(
  WrappedComponent: React.ComponentType<T>,
  requiredPermissions?: string[],
  requiredRoles?: string[],
  fallback?: React.ComponentType<T>
): React.ComponentType<T> => {
  const ProtectedComponent: React.ComponentType<T> = (props: T) => {
    const { hasAnyPermission, hasAnyRole } = usePermissions();

    const hasRequiredPermissions = !requiredPermissions || hasAnyPermission(requiredPermissions);
    const hasRequiredRoles = !requiredRoles || hasAnyRole(requiredRoles);

    if (!hasRequiredPermissions || !hasRequiredRoles) {
      if (fallback) {
        const FallbackComponent = fallback;
        return React.createElement(FallbackComponent, props);
      }
      
      const accessDeniedElement = React.createElement(
        'div',
        { className: 'flex items-center justify-center min-h-[200px]' },
        React.createElement(
          'div',
          { className: 'text-center' },
          React.createElement('div', { className: 'text-6xl text-gray-400 mb-4' }, '🔒'),
          React.createElement(
            'h3',
            { className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2' },
            'Access Restricted'
          ),
          React.createElement(
            'p',
            { className: 'text-gray-600 dark:text-gray-400' },
            "You don't have permission to access this feature."
          )
        )
      );
      
      return accessDeniedElement;
    }

    return React.createElement(WrappedComponent, props);
  };

  return ProtectedComponent;
};

/**
 * Component for conditionally rendering based on permissions
 */
interface PermissionGateProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
}) => {
  const { hasAnyPermission, hasAllPermissions, hasAnyRole, hasRole } = usePermissions();

  let hasPermissionAccess = true;
  let hasRoleAccess = true;

  if (permissions.length > 0) {
    hasPermissionAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  if (roles.length > 0) {
    hasRoleAccess = requireAll 
      ? roles.every(role => hasRole(role))
      : hasAnyRole(roles);
  }

  if (hasPermissionAccess && hasRoleAccess) {
    return React.createElement(React.Fragment, null, children);
  }

  return React.createElement(React.Fragment, null, fallback);
};

export default usePermissions;