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
    <div className="bg-gradient-to-r from-amber-50/80 via-yellow-50/60 to-orange-50/80 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 backdrop-blur-xl border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-6 mb-8 shadow-lg">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">
          System Debug Information
        </h3>
        <div className="flex-1"></div>
        <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Development Mode</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-gray-700/30">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Authentication State
          </h4>
          <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-auto text-xs font-mono border border-gray-200 dark:border-gray-700 max-h-48">
            {JSON.stringify({
              isAuthenticated: authState.isAuthenticated,
              permissions: authState.permissions,
              roles: authState.roles,
              user: authState.user ? { id: authState.user.id, email: authState.user.email } : null
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-gray-700/30">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            Permissions API
          </h4>
          <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-auto text-xs font-mono border border-gray-200 dark:border-gray-700 max-h-48">
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

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 dark:border-gray-700/30">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Permissions Hook
          </h4>
          <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-auto text-xs font-mono border border-gray-200 dark:border-gray-700 max-h-48">
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