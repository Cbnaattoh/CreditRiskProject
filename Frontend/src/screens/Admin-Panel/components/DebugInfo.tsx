import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../components/redux/store";
import { useGetMyPermissionsQuery } from "../../../components/redux/features/api/RBAC/rbacApi";
import { usePermissions } from "../../../hooks/usePermissions";

const DebugInfo: React.FC = () => {
  const authState = useSelector((state: RootState) => state.auth);
  const { data: permissionsData, isLoading, error } = useGetMyPermissionsQuery();
  const permissions = usePermissions();

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
        Debug Information
      </h3>
      
      <div className="space-y-3 text-sm">
        <div>
          <strong>Auth State:</strong>
          <pre className="bg-white dark:bg-gray-800 p-2 rounded mt-1 overflow-auto text-xs">
            {JSON.stringify({
              isAuthenticated: authState.isAuthenticated,
              permissions: authState.permissions,
              roles: authState.roles,
              user: authState.user ? { id: authState.user.id, email: authState.user.email } : null
            }, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Permissions Query:</strong>
          <pre className="bg-white dark:bg-gray-800 p-2 rounded mt-1 overflow-auto text-xs">
            {JSON.stringify({
              isLoading,
              error: error ? error : null,
              data: permissionsData ? {
                permission_codes: permissionsData.permission_codes,
                roles: permissionsData.roles
              } : null
            }, null, 2)}
          </pre>
        </div>

        <div>
          <strong>usePermissions Hook:</strong>
          <pre className="bg-white dark:bg-gray-800 p-2 rounded mt-1 overflow-auto text-xs">
            {JSON.stringify({
              isAdmin: permissions.isAdmin,
              canManageUsers: permissions.canManageUsers,
              canAssignRoles: permissions.canAssignRoles,
              canViewAuditLogs: permissions.canViewAuditLogs
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;