import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { 
  usePermissions, 
  useIsAdministrator,
  useIsClientUser,
  useIsAnalyst,
  useIsAuditor,
  useIsManager,
  useDashboardAccess,
  useNavigationAccess 
} from '../utils/hooks/useRBAC';

const RBACTest: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { permissions, roles, isAuthenticated } = usePermissions();
  const isAdmin = useIsAdministrator();
  const isClient = useIsClientUser();
  const isAnalyst = useIsAnalyst();
  const isAuditor = useIsAuditor();
  const isManager = useIsManager();
  const dashboardAccess = useDashboardAccess();
  const navigationAccess = useNavigationAccess();

  if (!isAuthenticated) {
    return <div className="p-4 bg-red-50 text-red-800">Not authenticated</div>;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">RBAC Test Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">User Information</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role (user.role):</strong> {user?.role}</p>
            <p><strong>User Type:</strong> {user?.user_type}</p>
            <p><strong>MFA Enabled:</strong> {user?.mfa_enabled ? 'Yes' : 'No'}</p>
            <p><strong>Verified:</strong> {user?.is_verified ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Role Detection */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Role Detection</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Is Administrator:</strong> <span className={isAdmin ? 'text-green-600' : 'text-red-600'}>{isAdmin ? 'Yes' : 'No'}</span></p>
            <p><strong>Is Client User:</strong> <span className={isClient ? 'text-green-600' : 'text-red-600'}>{isClient ? 'Yes' : 'No'}</span></p>
            <p><strong>Is Analyst:</strong> <span className={isAnalyst ? 'text-green-600' : 'text-red-600'}>{isAnalyst ? 'Yes' : 'No'}</span></p>
            <p><strong>Is Auditor:</strong> <span className={isAuditor ? 'text-green-600' : 'text-red-600'}>{isAuditor ? 'Yes' : 'No'}</span></p>
            <p><strong>Is Manager:</strong> <span className={isManager ? 'text-green-600' : 'text-red-600'}>{isManager ? 'Yes' : 'No'}</span></p>
          </div>
        </div>

        {/* Roles Array */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Roles Array ({roles.length})</h3>
          <div className="space-y-1 text-sm">
            {roles.length > 0 ? (
              roles.map((role, index) => (
                <p key={index} className="text-green-600">• {role}</p>
              ))
            ) : (
              <p className="text-red-600">No roles assigned</p>
            )}
          </div>
          
          <h4 className="text-md font-semibold mt-3 mb-1 text-gray-900 dark:text-white">User Roles Objects</h4>
          {user?.roles && user.roles.length > 0 ? (
            user.roles.map((roleObj, index) => (
              <p key={index} className="text-xs text-blue-600">• {roleObj.name} (ID: {roleObj.id})</p>
            ))
          ) : (
            <p className="text-xs text-red-600">No role objects</p>
          )}
        </div>

        {/* Permissions */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Permissions ({permissions.length})</h3>
          <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
            {permissions.length > 0 ? (
              permissions.map((permission, index) => (
                <p key={index} className="text-green-600">• {permission}</p>
              ))
            ) : (
              <p className="text-red-600">No permissions assigned</p>
            )}
          </div>
        </div>

        {/* Dashboard Access */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Dashboard Access</h3>
          <div className="space-y-1 text-xs">
            <p><strong>Can View Dashboard:</strong> <span className={dashboardAccess.canViewDashboard ? 'text-green-600' : 'text-red-600'}>{dashboardAccess.canViewDashboard ? 'Yes' : 'No'}</span></p>
            <p><strong>Can View Reports:</strong> <span className={dashboardAccess.canViewReports ? 'text-green-600' : 'text-red-600'}>{dashboardAccess.canViewReports ? 'Yes' : 'No'}</span></p>
            <p><strong>Can View Users:</strong> <span className={dashboardAccess.canViewUsers ? 'text-green-600' : 'text-red-600'}>{dashboardAccess.canViewUsers ? 'Yes' : 'No'}</span></p>
            <p><strong>Can View Audit Logs:</strong> <span className={dashboardAccess.canViewAuditLogs ? 'text-green-600' : 'text-red-600'}>{dashboardAccess.canViewAuditLogs ? 'Yes' : 'No'}</span></p>
            <p><strong>Has Elevated Access:</strong> <span className={dashboardAccess.hasElevatedAccess ? 'text-green-600' : 'text-red-600'}>{dashboardAccess.hasElevatedAccess ? 'Yes' : 'No'}</span></p>
            <p><strong>Has Staff Access:</strong> <span className={dashboardAccess.hasStaffAccess ? 'text-green-600' : 'text-red-600'}>{dashboardAccess.hasStaffAccess ? 'Yes' : 'No'}</span></p>
            <p><strong>Has Limited Access:</strong> <span className={dashboardAccess.hasLimitedAccess ? 'text-green-600' : 'text-red-600'}>{dashboardAccess.hasLimitedAccess ? 'Yes' : 'No'}</span></p>
          </div>
        </div>

        {/* Navigation Access */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Navigation Access</h3>
          <div className="space-y-1 text-xs">
            <p><strong>Show Reports:</strong> <span className={navigationAccess.showReports ? 'text-green-600' : 'text-red-600'}>{navigationAccess.showReports ? 'Yes' : 'No'}</span></p>
            <p><strong>Show User Management:</strong> <span className={navigationAccess.showUserManagement ? 'text-green-600' : 'text-red-600'}>{navigationAccess.showUserManagement ? 'Yes' : 'No'}</span></p>
            <p><strong>Show Role Management:</strong> <span className={navigationAccess.showRoleManagement ? 'text-green-600' : 'text-red-600'}>{navigationAccess.showRoleManagement ? 'Yes' : 'No'}</span></p>
            <p><strong>Show Audit Logs:</strong> <span className={navigationAccess.showAuditLogs ? 'text-green-600' : 'text-red-600'}>{navigationAccess.showAuditLogs ? 'Yes' : 'No'}</span></p>
            <p><strong>Show System Settings:</strong> <span className={navigationAccess.showSystemSettings ? 'text-green-600' : 'text-red-600'}>{navigationAccess.showSystemSettings ? 'Yes' : 'No'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACTest;