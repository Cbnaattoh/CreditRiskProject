import type { AuthUser } from "../../user/types/user";

export interface RBACUser extends AuthUser {
    roles: Role[];
    permissions: string[];
    permission_summary?: PermissionSummary;
}

// Enhanced user interface with role mapping
export interface EnhancedRBACUser extends RBACUser {
    frontendRoles: RoleName[];
    backendRole: BackendRoleType;
    roleLevel: number;
    hasElevatedAccess: boolean;
}

export interface Role {
    id: number;
    name: string;
    description?: string;
}

export interface PermissionSummary {
  user_management: {
    can_view_all_users: boolean;
    can_edit_all_users: boolean;
    can_delete_users: boolean;
    can_manage_roles: boolean;
  };
  role_management: {
    can_view_roles: boolean;
    can_create_roles: boolean;
    can_edit_roles: boolean;
    can_delete_roles: boolean;
    can_assign_roles: boolean;
  };
  system: {
    can_access_settings: boolean;
    can_view_logs: boolean;
    can_view_audit_logs: boolean;
    can_view_dashboard: boolean;
  };
  data: {
    can_export_data: boolean;
    can_import_data: boolean;
    can_delete_data: boolean;
  };
  reporting: {
    can_view_reports: boolean;
    can_create_reports: boolean;
    can_manage_reports: boolean;
  };
  risk_management: {
    can_view_risk: boolean;
    can_edit_risk: boolean;
    can_approve_risk: boolean;
    can_delete_risk: boolean;
  };
  compliance: {
    can_view_compliance: boolean;
    can_edit_compliance: boolean;
    can_audit_compliance: boolean;
  };
  client_management: {
    can_view_clients: boolean;
    can_edit_clients: boolean;
    can_delete_clients: boolean;
  };
}

export type PermissionCode = 
  | 'user_view_all' | 'user_edit_all' | 'user_delete' | 'user_manage_roles'
  | 'role_view' | 'role_create' | 'role_edit' | 'role_delete' | 'role_assign'
  | 'system_settings' | 'system_logs' | 'view_audit_logs' | 'view_dashboard' | 'system_backup'
  | 'data_export' | 'data_import' | 'data_delete'
  | 'report_view' | 'report_create' | 'report_admin' | 'report_edit' | 'report_delete' | 'report_comment' | 'report_share' | 'report_template_create' | 'report_template_edit' | 'report_template_delete' | 'report_schedule_create' | 'report_schedule_edit' | 'report_schedule_delete' | 'report_schedule_view'
  | 'risk_view' | 'risk_edit' | 'risk_approve' | 'risk_delete'
  | 'compliance_view' | 'compliance_edit' | 'compliance_audit'
  | 'client_view' | 'client_edit' | 'client_delete'
  | 'edit_own_profile' | 'view_own_profile' | 'view_permissions' | 'manage_permissions';

export type RoleName = 'Administrator' | 'Risk Analyst' | 'Compliance Auditor' | 'Client User' | 'Manager';

// Backend role type mappings
export type BackendRoleType = 'ADMIN' | 'CLIENT' | 'ANALYST' | 'AUDITOR' | 'MANAGER';

// Mapping between backend roles and frontend role names
export const BACKEND_TO_FRONTEND_ROLE: Record<BackendRoleType, RoleName> = {
  'ADMIN': 'Administrator',
  'CLIENT': 'Client User',
  'ANALYST': 'Risk Analyst',
  'AUDITOR': 'Compliance Auditor',
  'MANAGER': 'Manager'
};

export const FRONTEND_TO_BACKEND_ROLE: Record<RoleName, BackendRoleType> = {
  'Administrator': 'ADMIN',
  'Client User': 'CLIENT',
  'Risk Analyst': 'ANALYST',
  'Compliance Auditor': 'AUDITOR',
  'Manager': 'MANAGER'
};

// Role-based access control mappings - updated to match backend permissions
export const ROLE_PERMISSIONS: Record<RoleName, PermissionCode[]> = {
  'Administrator': [
    'user_view_all', 'user_edit_all', 'user_delete', 'user_manage_roles',
    'role_view', 'role_create', 'role_edit', 'role_delete', 'role_assign',
    'system_settings', 'system_logs', 'view_audit_logs', 'view_dashboard', 'system_backup',
    'data_export', 'data_import', 'data_delete',
    'report_view', 'report_create', 'report_admin', 'report_edit', 'report_delete', 'report_comment', 'report_share', 'report_template_create', 'report_template_edit', 'report_template_delete', 'report_schedule_create', 'report_schedule_edit', 'report_schedule_delete', 'report_schedule_view',
    'risk_view', 'risk_edit', 'risk_approve', 'risk_delete',
    'compliance_view', 'compliance_edit', 'compliance_audit',
    'client_view', 'client_edit', 'client_delete',
    'edit_own_profile', 'view_own_profile', 'view_permissions', 'manage_permissions'
  ],
  'Risk Analyst': [
    'risk_view', 'risk_edit', 'risk_approve',
    'compliance_view', 'compliance_edit',
    'report_view', 'report_create', 'report_edit', 'report_comment',
    'data_export',
    'client_view',
    'view_dashboard',
    'edit_own_profile', 'view_own_profile'
  ],
  'Compliance Auditor': [
    'risk_view',
    'compliance_view', 'compliance_edit', 'compliance_audit',
    'report_view', 'report_create', 'report_edit', 'report_comment',
    'system_logs', 'view_audit_logs',
    'data_export',
    'client_view',
    'view_dashboard',
    'edit_own_profile', 'view_own_profile'
  ],
  'Client User': [
    'risk_view',
    'compliance_view',
    'client_view',
    'view_dashboard',
    'edit_own_profile', 'view_own_profile'
  ],
  'Manager': [
    'user_view_all', 'user_edit_all',
    'role_view', 'role_assign',
    'risk_view', 'risk_edit', 'risk_approve',
    'compliance_view', 'compliance_edit',
    'report_view', 'report_create', 'report_admin', 'report_edit', 'report_delete', 'report_comment', 'report_share', 'report_schedule_create', 'report_schedule_edit', 'report_schedule_view',
    'data_export',
    'client_view', 'client_edit',
    'view_dashboard',
    'edit_own_profile', 'view_own_profile'
  ]
};

// Feature access based on roles
export const ROLE_FEATURES: Record<RoleName, string[]> = {
  'Administrator': ['user_management', 'role_management', 'audit_logs', 'reporting', 'risk_management', 'client_management', 'admin_panel', 'system_settings', 'data_management'],
  'Risk Analyst': ['reporting', 'risk_management', 'client_management'],
  'Compliance Auditor': ['reporting', 'audit_logs', 'risk_management', 'client_management', 'compliance_audit'],
  'Client User': ['risk_management', 'client_view'], // Limited access - no reporting
  'Manager': ['user_management', 'role_management', 'reporting', 'risk_management', 'client_management']
};

// Role hierarchy levels (higher number = more privileges)
export const ROLE_HIERARCHY: Record<RoleName, number> = {
  'Administrator': 5,
  'Manager': 4,
  'Risk Analyst': 3,
  'Compliance Auditor': 3,
  'Client User': 1
};

// Utility functions
export const mapBackendRoleToFrontend = (backendRole: string): RoleName | null => {
  const role = backendRole.toUpperCase() as BackendRoleType;
  return BACKEND_TO_FRONTEND_ROLE[role] || null;
};

export const mapFrontendRoleToBackend = (frontendRole: RoleName): BackendRoleType => {
  return FRONTEND_TO_BACKEND_ROLE[frontendRole];
};

export const getRoleLevel = (roleName: RoleName): number => {
  return ROLE_HIERARCHY[roleName] || 0;
};

export const hasHigherRoleLevel = (userRole: RoleName, requiredRole: RoleName): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};

// Check if user has specific permission based on their roles
export const userHasPermission = (userRoles: string[], permission: PermissionCode): boolean => {
  return userRoles.some(roleName => {
    const mappedRole = mapBackendRoleToFrontend(roleName);
    if (!mappedRole) return false;
    return ROLE_PERMISSIONS[mappedRole]?.includes(permission) || false;
  });
};

// Get all permissions for a user based on their roles
export const getUserPermissionsFromRoles = (userRoles: string[]): PermissionCode[] => {
  const permissions = new Set<PermissionCode>();
  
  userRoles.forEach(roleName => {
    const mappedRole = mapBackendRoleToFrontend(roleName);
    if (mappedRole) {
      ROLE_PERMISSIONS[mappedRole]?.forEach(permission => permissions.add(permission));
    }
  });
  
  return Array.from(permissions);
};