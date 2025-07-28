import type { AuthUser } from "../../user/types/user";

export interface RBACUser extends AuthUser {
    roles: Role[];
    permissions: string[];
    permission_summary?: PermissionSummary;
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
  | 'system_settings' | 'system_logs' | 'view_audit_logs' | 'view_dashboard'
  | 'data_export' | 'data_import' | 'data_delete'
  | 'report_view' | 'report_create' | 'report_admin'
  | 'risk_view' | 'risk_edit' | 'risk_approve' | 'risk_delete'
  | 'compliance_view' | 'compliance_edit' | 'compliance_audit'
  | 'client_view' | 'client_edit' | 'client_delete';

export type RoleName = 'Administrator' | 'Risk Analyst' | 'Compliance Auditor' | 'Client User' | 'Manager';