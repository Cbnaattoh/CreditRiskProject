import React from 'react';
import { useCanAccess, usePermissions } from '../../../../utils/hooks/useRBAC';
import type { PermissionCode, RoleName } from './rbac';

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

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  requireAuth = true,
  fallback = null,
  showUnauthorized = false,
  className = "",
}) => {
  const canAccess = useCanAccess({ permissions, roles, requireAll, requireAuth });

  if (!canAccess) {
    if (showUnauthorized) {
      return (
        <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
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
};

// Specific protection components for common use cases
export const AdminOnly: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback = null, className }) => (
  <ProtectedComponent roles={['Administrator']} fallback={fallback} className={className}>
    {children}
  </ProtectedComponent>
);

export const StaffOnly: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback = null, className }) => (
  <ProtectedComponent 
    roles={['Administrator', 'Risk Analyst', 'Compliance Auditor', 'Manager']} 
    fallback={fallback}
    className={className}
  >
    {children}
  </ProtectedComponent>
);

export const UserManagementAccess: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <ProtectedComponent permissions={['user_view_all']} className={className}>
    {children}
  </ProtectedComponent>
);

export const RoleManagementAccess: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <ProtectedComponent permissions={['role_view']} className={className}>
    {children}
  </ProtectedComponent>
);

export const AuditLogsAccess: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <ProtectedComponent permissions={['view_audit_logs']} className={className}>
    {children}
  </ProtectedComponent>
);

// Button with permission
interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permissions?: PermissionCode[];
  roles?: RoleName[];
  requireAll?: boolean;
  showDisabled?: boolean;
  disabledTooltip?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  showDisabled = true,
  disabledTooltip = "You don't have permission to perform this action",
  className = "",
  variant = 'primary',
  ...buttonProps
}) => {
  const canAccess = useCanAccess({ permissions, roles, requireAll });

  if (!canAccess && !showDisabled) {
    return null;
  }

  // Base styles
  const baseStyles = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };

  const disabledStyles = !canAccess ? "opacity-50 cursor-not-allowed hover:bg-current" : "";

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
};

// Menu item for navigation that integrates with the existing routing
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

export const ProtectedMenuItem: React.FC<ProtectedMenuItemProps> = ({
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
  const canAccess = useCanAccess({ permissions, roles, requireAll });

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
};

// Feature flag component that works with the existing  permission system
interface FeatureFlagProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({ 
  feature, 
  children, 
  fallback = null 
}) => {
  const { permissions } = usePermissions();

  // Feature flag mapping based on backend permissions
  const featurePermissions: Record<string, PermissionCode[]> = {
    'admin_panel': ['user_view_all', 'role_view'],
    'user_management': ['user_view_all'],
    'role_management': ['role_view'],
    'audit_logs': ['view_audit_logs'],
    'system_settings': ['system_settings'],
    'bulk_actions': ['user_edit_all'],
    'advanced_reports': ['report_admin'],
    'compliance_audit': ['compliance_audit'],
    'data_export': ['data_export'],
    'data_import': ['data_import'],
    'risk_management': ['risk_view'],
    'client_management': ['client_view'],
  };

  const requiredPermissions = featurePermissions[feature];
  
  if (!requiredPermissions) {
    return <>{children}</>;
  }

  const hasAccess = requiredPermissions.some(permission => 
    permissions.includes(permission)
  );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Loading state component for async permission checks
interface PermissionLoadingProps {
  children: React.ReactNode;
  loading: boolean;
  fallback?: React.ReactNode;
}

export const PermissionLoading: React.FC<PermissionLoadingProps> = ({
  children,
  loading,
  fallback = (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-sm text-gray-600">Checking permissions...</span>
    </div>
  )
}) => {
  if (loading) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};