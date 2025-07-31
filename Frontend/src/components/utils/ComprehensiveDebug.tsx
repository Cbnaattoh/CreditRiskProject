import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserPermissions, selectUserRoles, selectIsAuthenticated } from '../redux/features/auth/authSlice';
import { usePermissions } from '../../hooks/usePermissions';
import { FiX, FiInfo } from 'react-icons/fi';
import { useSafeString } from './SafeRender';

export const ComprehensiveDebug: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const user = useSelector(selectCurrentUser);
  const permissions = useSelector(selectUserPermissions);
  const roles = useSelector(selectUserRoles);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  const {
    canManageUsers,
    canAssignRoles,
    canViewAuditLogs,
    isAdmin,
    hasPermission,
    hasAnyPermission
  } = usePermissions();

  if (process.env.NODE_ENV === 'production' && !isOpen) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 left-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50 hover:bg-blue-700"
          title="Open Debug Panel"
        >
          <FiInfo className="h-5 w-5" />
        </button>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl mx-auto max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Debug Panel</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Authentication Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Authentication Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Authenticated:</span>
                    <span className={`ml-2 px-2 py-1 rounded ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {isAuthenticated ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">User Email:</span>
                    <span className="ml-2">{user?.email || 'None'}</span>
                  </div>
                  <div>
                    <span className="font-medium">User Name:</span>
                    <span className="ml-2">{user?.full_name || user?.name || 'None'}</span>
                  </div>
                  <div>
                    <span className="font-medium">User Type:</span>
                    <span className="ml-2">{typeof user?.user_type === 'string' ? user.user_type : (user?.user_type?.name || user?.user_type_display || 'None')}</span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Permissions</h3>
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Total Permissions:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">{permissions.length}</span>
                  </div>
                  {permissions.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {permissions.map((permission, index) => (
                        <div key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                          {permission}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Roles</h3>
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Total Roles:</span>
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded">{roles.length}</span>
                  </div>
                  {roles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {roles.map((role, index) => (
                        <div key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                          {typeof role === 'string' ? role : (role?.name || JSON.stringify(role))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Permission Checks */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Permission Checks</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Is Admin:</span>
                    <span className={`ml-2 px-2 py-1 rounded ${isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {isAdmin ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Can Manage Users:</span>
                    <span className={`ml-2 px-2 py-1 rounded ${canManageUsers ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {canManageUsers ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Can Assign Roles:</span>
                    <span className={`ml-2 px-2 py-1 rounded ${canAssignRoles ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {canAssignRoles ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Can View Audit Logs:</span>
                    <span className={`ml-2 px-2 py-1 rounded ${canViewAuditLogs ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {canViewAuditLogs ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specific Permission Tests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Specific Permission Tests</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    'user_view_all',
                    'user_manage', 
                    'role_view',
                    'role_manage',
                    'audit_view',
                    'report_view'
                  ].map(permission => (
                    <div key={permission} className="flex justify-between items-center">
                      <span className="font-mono text-xs">{permission}:</span>
                      <span className={`px-2 py-1 rounded text-xs ${hasPermission(permission) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {hasPermission(permission) ? 'Yes' : 'No'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Endpoints Test */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Local Storage</h3>
                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
                  <div>authToken: {localStorage.getItem('authToken') ? 'Present' : 'Missing'}</div>
                  <div>authUser: {localStorage.getItem('authUser') ? 'Present' : 'Missing'}</div>
                  <div>user_permissions: {localStorage.getItem('user_permissions') ? 'Present' : 'Missing'}</div>
                  <div>user_roles: {localStorage.getItem('user_roles') ? 'Present' : 'Missing'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComprehensiveDebug;