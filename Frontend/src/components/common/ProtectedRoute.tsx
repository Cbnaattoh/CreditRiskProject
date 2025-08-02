import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiUser, FiLock } from 'react-icons/fi';
import { useRobustAccessCheck, usePermissions } from '../utils/hooks/useRBAC';
import type { PermissionCode, RoleName } from '../redux/features/api/RBAC/rbac';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  permissions?: PermissionCode[];
  roles?: RoleName[];
  excludeRoles?: RoleName[];
  features?: string[];
  requireAll?: boolean;
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

const UnauthorizedPage: React.FC<{ message?: string; userRole?: string }> = ({ 
  message = "You don't have permission to access this page.",
  userRole = "Unknown"
}) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
    >
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <FiShield className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Access Denied
      </h1>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {message}
      </p>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <FiUser className="w-4 h-4" />
          <span>Current Role: <strong className="text-gray-900 dark:text-white">{userRole}</strong></span>
        </div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.history.back()}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
      >
        Go Back
      </motion.button>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        If you believe this is an error, please contact your administrator.
      </p>
    </motion.div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permissions = [],
  roles = [],
  excludeRoles = [],
  features = [],
  requireAll = false,
  fallbackPath = "/home",
  showUnauthorized = true,
}) => {
  const location = useLocation();
  const { isAuthenticated, roles: userRoles } = usePermissions();
  
  const hasAccess = useRobustAccessCheck({
    permissions,
    roles,
    excludeRoles,
    features,
    requireAll,
  });

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If has access, render children or outlet for nested routes
  if (hasAccess) {
    return children ? <>{children}</> : <Outlet />;
  }

  // If no access and should show unauthorized page
  if (showUnauthorized) {
    const userRole = userRoles.length > 0 ? userRoles[0] : 'Unknown';
    let message = "You don't have permission to access this page.";
    
    if (excludeRoles.length > 0 && excludeRoles.some(role => userRoles.includes(role))) {
      message = `Access to this feature is restricted for ${userRole} users.`;
    } else if (roles.length > 0) {
      message = `This page requires ${roles.join(' or ')} role access.`;
    } else if (permissions.length > 0) {
      message = `This page requires specific permissions that your role doesn't have.`;
    }
    
    return <UnauthorizedPage message={message} userRole={userRole} />;
  }

  // Otherwise redirect to fallback
  return <Navigate to={fallbackPath} replace />;
};

export default ProtectedRoute;