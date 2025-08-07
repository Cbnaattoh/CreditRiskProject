import React, { memo } from "react";
import { usePermissions } from "../../../../utils/hooks/useRBAC";
import type {
  PermissionCode,
  RoleName,
} from "../../../../redux/features/api/RBAC/rbac";

interface ProtectedComponentProps {
  children: React.ReactNode;
  permissions?: PermissionCode[];
  roles?: RoleName[];
  requireAll?: boolean;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
  className?: string;
}

const checkAccess = (
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

// Main protection component
export const ProtectedComponent: React.FC<ProtectedComponentProps> = memo(
  ({
    children,
    permissions = [],
    roles = [],
    requireAll = false,
    requireAuth = true,
    fallback = null,
    showUnauthorized = false,
    className = "",
  }) => {
    const {
      permissions: userPermissions,
      roles: userRoles,
      isAuthenticated,
    } = usePermissions();

    // Use the pure function to check access
    const canAccess = checkAccess(userPermissions, userRoles, isAuthenticated, {
      permissions,
      roles,
      requireAll,
      requireAuth,
    });

    if (!canAccess) {
      if (showUnauthorized) {
        return (
          <div
            className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Access Denied
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  You don't have permission to view this content.
                </p>
              </div>
            </div>
          </div>
        );
      }
      return <>{fallback}</>;
    }

    return <div className={className}>{children}</div>;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.permissions?.join(",") === nextProps.permissions?.join(",") &&
      prevProps.roles?.join(",") === nextProps.roles?.join(",") &&
      prevProps.requireAll === nextProps.requireAll &&
      prevProps.requireAuth === nextProps.requireAuth &&
      prevProps.showUnauthorized === nextProps.showUnauthorized &&
      prevProps.className === nextProps.className &&
      prevProps.fallback === nextProps.fallback &&
      prevProps.children === nextProps.children
    );
  }
);

ProtectedComponent.displayName = "ProtectedComponent";

export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = memo(({ children, fallback = null, className }) => (
  <ProtectedComponent
    roles={["Administrator"]}
    fallback={fallback}
    className={className}
  >
    {children}
  </ProtectedComponent>
));

AdminOnly.displayName = "AdminOnly";

export const StaffOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = memo(({ children, fallback = null, className }) => (
  <ProtectedComponent
    roles={["Administrator", "Risk Analyst", "Compliance Auditor", "Manager"]}
    fallback={fallback}
    className={className}
  >
    {children}
  </ProtectedComponent>
));

// Role-specific components
export const ClientOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = memo(({ children, fallback = null, className }) => (
  <ProtectedComponent
    roles={["Client User"]}
    fallback={fallback}
    className={className}
  >
    {children}
  </ProtectedComponent>
));

ClientOnly.displayName = "ClientOnly";

export const AnalystOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = memo(({ children, fallback = null, className }) => (
  <ProtectedComponent
    roles={["Risk Analyst"]}
    fallback={fallback}
    className={className}
  >
    {children}
  </ProtectedComponent>
));

AnalystOnly.displayName = "AnalystOnly";

export const AuditorOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = memo(({ children, fallback = null, className }) => (
  <ProtectedComponent
    roles={["Compliance Auditor"]}
    fallback={fallback}
    className={className}
  >
    {children}
  </ProtectedComponent>
));

AuditorOnly.displayName = "AuditorOnly";

export const ManagerOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = memo(({ children, fallback = null, className }) => (
  <ProtectedComponent
    roles={["Manager"]}
    fallback={fallback}
    className={className}
  >
    {children}
  </ProtectedComponent>
));

ManagerOnly.displayName = "ManagerOnly";

StaffOnly.displayName = "StaffOnly";

export const UserManagementAccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = memo(({ children, className }) => (
  <ProtectedComponent permissions={["user_view_all"]} className={className}>
    {children}
  </ProtectedComponent>
));

UserManagementAccess.displayName = "UserManagementAccess";

export const RoleManagementAccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = memo(({ children, className }) => (
  <ProtectedComponent permissions={["role_view"]} className={className}>
    {children}
  </ProtectedComponent>
));

RoleManagementAccess.displayName = "RoleManagementAccess";

export const AuditLogsAccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = memo(({ children, className }) => (
  <ProtectedComponent permissions={["view_audit_logs"]} className={className}>
    {children}
  </ProtectedComponent>
));

// Enhanced access components
export const ReportsAccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = memo(({ children, className }) => (
  <ProtectedComponent 
    permissions={["report_view"]} 
    roles={["Administrator", "Risk Analyst", "Compliance Auditor", "Manager"]}
    className={className}
  >
    {children}
  </ProtectedComponent>
));

ReportsAccess.displayName = "ReportsAccess";

export const RiskManagementAccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = memo(({ children, className }) => (
  <ProtectedComponent permissions={["risk_view"]} className={className}>
    {children}
  </ProtectedComponent>
));

RiskManagementAccess.displayName = "RiskManagementAccess";

export const ComplianceAccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = memo(({ children, className }) => (
  <ProtectedComponent permissions={["compliance_view"]} className={className}>
    {children}
  </ProtectedComponent>
));

ComplianceAccess.displayName = "ComplianceAccess";

export const ClientManagementAccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = memo(({ children, className }) => (
  <ProtectedComponent permissions={["client_view"]} className={className}>
    {children}
  </ProtectedComponent>
));

ClientManagementAccess.displayName = "ClientManagementAccess";

export const SystemSettingsAccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = memo(({ children, className }) => (
  <ProtectedComponent 
    permissions={["system_settings"]} 
    roles={["Administrator"]}
    requireAll
    className={className}
  >
    {children}
  </ProtectedComponent>
));

SystemSettingsAccess.displayName = "SystemSettingsAccess";

AuditLogsAccess.displayName = "AuditLogsAccess";

// Button with permission check
interface ProtectedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permissions?: PermissionCode[];
  roles?: RoleName[];
  requireAll?: boolean;
  showDisabled?: boolean;
  disabledTooltip?: string;
  variant?: "primary" | "secondary" | "danger" | "success";
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = memo(
  ({
    children,
    permissions = [],
    roles = [],
    requireAll = false,
    showDisabled = true,
    disabledTooltip = "You don't have permission to perform this action",
    className = "",
    variant = "primary",
    ...buttonProps
  }) => {
    const {
      permissions: userPermissions,
      roles: userRoles,
      isAuthenticated,
    } = usePermissions();

    const canAccess = checkAccess(userPermissions, userRoles, isAuthenticated, {
      permissions,
      roles,
      requireAll,
      requireAuth: true,
    });

    if (!canAccess && !showDisabled) {
      return null;
    }

    // Base styles
    const baseStyles =
      "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";

    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    };

    const disabledStyles = !canAccess
      ? "opacity-50 cursor-not-allowed hover:bg-current"
      : "";

    return (
      <button
        {...buttonProps}
        disabled={!canAccess || buttonProps.disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`}
        title={!canAccess ? disabledTooltip : buttonProps.title}
      >
        {children}
      </button>
    );
  },
  (prevProps, nextProps) => {
    const propsToCompare = [
      "permissions",
      "roles",
      "requireAll",
      "showDisabled",
      "disabledTooltip",
      "variant",
      "className",
      "disabled",
    ];

    return (
      propsToCompare.every(
        (prop) =>
          JSON.stringify(prevProps[prop as keyof ProtectedButtonProps]) ===
          JSON.stringify(nextProps[prop as keyof ProtectedButtonProps])
      ) && prevProps.children === nextProps.children
    );
  }
);

ProtectedButton.displayName = "ProtectedButton";

// Menu item for navigation
interface ProtectedMenuItemProps {
  children: React.ReactNode;
  permissions?: PermissionCode[];
  roles?: RoleName[];
  requireAll?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  activeClassName?: string;
  icon?: React.ReactNode;
}

export const ProtectedMenuItem: React.FC<ProtectedMenuItemProps> = memo(
  ({
    children,
    permissions = [],
    roles = [],
    requireAll = false,
    href,
    onClick,
    className = "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    activeClassName = "bg-gray-100 text-gray-900",
    icon,
  }) => {
    const {
      permissions: userPermissions,
      roles: userRoles,
      isAuthenticated,
    } = usePermissions();

    const canAccess = checkAccess(userPermissions, userRoles, isAuthenticated, {
      permissions,
      roles,
      requireAll,
      requireAuth: true,
    });

    if (!canAccess) {
      return null;
    }

    const content = (
      <>
        {icon && <span className="mr-3 flex-shrink-0">{icon}</span>}
        {children}
      </>
    );

    if (href) {
      return (
        <a href={href} className={className}>
          {content}
        </a>
      );
    }

    return (
      <button onClick={onClick} className={className}>
        {content}
      </button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.permissions?.join(",") === nextProps.permissions?.join(",") &&
      prevProps.roles?.join(",") === nextProps.roles?.join(",") &&
      prevProps.requireAll === nextProps.requireAll &&
      prevProps.href === nextProps.href &&
      prevProps.className === nextProps.className &&
      prevProps.activeClassName === nextProps.activeClassName &&
      prevProps.children === nextProps.children &&
      prevProps.icon === nextProps.icon
    );
  }
);

ProtectedMenuItem.displayName = "ProtectedMenuItem";

// Feature flag component
interface FeatureFlagProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = memo(
  ({ feature, children, fallback = null }) => {
    const { permissions } = usePermissions();

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

    const requiredPermissions = featurePermissions[feature];

    if (!requiredPermissions) {
      return <>{children}</>;
    }

    const hasAccess = requiredPermissions.some((permission) =>
      permissions.includes(permission)
    );

    return hasAccess ? <>{children}</> : <>{fallback}</>;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.feature === nextProps.feature &&
      prevProps.children === nextProps.children &&
      prevProps.fallback === nextProps.fallback
    );
  }
);

FeatureFlag.displayName = "FeatureFlag";

// Loading state component for async permission checks
interface PermissionLoadingProps {
  children: React.ReactNode;
  loading: boolean;
  fallback?: React.ReactNode;
}

export const PermissionLoading: React.FC<PermissionLoadingProps> = memo(
  ({
    children,
    loading,
    fallback = (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">
          Checking permissions...
        </span>
      </div>
    ),
  }) => {
    if (loading) {
      return <>{fallback}</>;
    }

    return <>{children}</>;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.loading === nextProps.loading &&
      prevProps.children === nextProps.children &&
      prevProps.fallback === nextProps.fallback
    );
  }
);

PermissionLoading.displayName = "PermissionLoading";
