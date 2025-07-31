import React, {useMemo} from 'react';
import { motion } from 'framer-motion';

interface User {
  id: number;
  email: string;
  full_name: string;
  last_login?: string;
  active_roles: Array<{
    name: string;
    assigned_at: string;
  }>;
  is_active: boolean;
  mfa_enabled: boolean;
}

interface UserActivityWidgetProps {
  users: User[];
  isLoading?: boolean;
  error?: any;
  onViewAll?: () => void;
}

export const UserActivityWidget: React.FC<UserActivityWidgetProps> = ({
  users = [],
  isLoading = false,
  error,
  onViewAll
}) => {
  // Debug logging
  console.log('🔵 UserActivityWidget - Props received:', {
    usersCount: users.length,
    isLoading,
    error,
    users: users.slice(0, 2) // Log first 2 users for debugging
  });

  // Sample data for fallback
  const sampleUsers: User[] = [
    {
      id: 1,
      email: "admin@example.com",
      full_name: "Admin User",
      last_login: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      active_roles: [{ name: "Administrator", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: true,
    },
    {
      id: 2,
      email: "manager@example.com", 
      full_name: "Manager User",
      last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      active_roles: [{ name: "Manager", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: false,
    },
    {
      id: 3,
      email: "user@example.com",
      full_name: "Standard User",
      last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      active_roles: [{ name: "User", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: false,
    }
  ];

  // Enhanced data handling with better fallback logic
  const displayUsers = useMemo(() => {
    // If we have actual API data, use it
    if (users && users.length > 0) {
      return users;
    }
    
    // If still loading, show empty array (for loading state)
    if (isLoading) {
      return [];
    }
    
    // If there's an error but we have cached/fallback users, show sample data
    if (error && sampleUsers.length > 0) {
      return sampleUsers;
    }
    
    // Default fallback to sample users for demo purposes
    return sampleUsers;
  }, [users, isLoading, error, sampleUsers]);
  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (isActive: boolean, lastLogin?: string) => {
    if (!isActive) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (!lastLogin) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    
    const daysSinceLogin = lastLogin ? 
      Math.floor((new Date().getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : 
      999;
    
    if (daysSinceLogin <= 1) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (daysSinceLogin <= 7) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getStatusText = (isActive: boolean, lastLogin?: string) => {
    if (!isActive) return 'Inactive';
    if (!lastLogin) return 'Never logged in';
    
    const daysSinceLogin = Math.floor((new Date().getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLogin <= 1) return 'Active';
    if (daysSinceLogin <= 7) return 'Recent';
    return 'Inactive';
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent User Activity
          </h3>
          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 transition-colors duration-200"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent User Activity
        </h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
          >
            View all
          </button>
        )}
      </div>
      
      <div className="space-y-5">
        {/* Sample data indicator */}
        {displayUsers === sampleUsers && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-center text-blue-700 dark:text-blue-300 text-sm">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Showing sample data - API connection unavailable
            </div>
          </div>
        )}
        
        {displayUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="mt-2">No user activity to display</p>
          </div>
        ) : (
          displayUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                {user.mfa_enabled && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.full_name || user.email}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.active_roles.length > 0 
                      ? user.active_roles[0].name 
                      : 'No role assigned'
                    }
                  </p>
                  {user.active_roles.length > 1 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      +{user.active_roles.length - 1} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    user.is_active,
                    user.last_login
                  )}`}
                >
                  {getStatusText(user.is_active, user.last_login)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatLastLogin(user.last_login)}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};