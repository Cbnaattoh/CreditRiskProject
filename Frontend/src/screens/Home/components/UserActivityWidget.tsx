import React, {useMemo, useState} from 'react';
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
  status: string;
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
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

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
      status: "active",
    },
    {
      id: 2,
      email: "manager@example.com", 
      full_name: "Manager User",
      last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      active_roles: [{ name: "Manager", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: false,
      status: "active",
    },
    {
      id: 3,
      email: "user@example.com",
      full_name: "Standard User",
      last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      active_roles: [{ name: "User", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: false,
      status: "dormant",
    }
  ];

  // Enhanced data handling with search and filter logic
  const displayUsers = useMemo(() => {
    // Get base users (API data or fallback)
    let baseUsers = [];
    if (users && users.length > 0) {
      baseUsers = users;
    } else if (isLoading) {
      return [];
    } else if (error && sampleUsers.length > 0) {
      baseUsers = sampleUsers;
    } else {
      baseUsers = sampleUsers;
    }

    // Apply search filter
    let filteredUsers = baseUsers.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = (user.full_name || '').toLowerCase().includes(searchLower);
      const emailMatch = user.email.toLowerCase().includes(searchLower);
      const roleMatch = user.active_roles.some(role => 
        role.name.toLowerCase().includes(searchLower)
      );
      return nameMatch || emailMatch || roleMatch;
    });

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => 
        user.active_roles.some(role => role.name === roleFilter)
      );
    }

    return filteredUsers;
  }, [users, isLoading, error, sampleUsers, searchTerm, statusFilter, roleFilter]);

  // Get unique roles for filter dropdown
  const availableRoles = useMemo(() => {
    const baseUsers = users?.length > 0 ? users : sampleUsers;
    const roles = new Set<string>();
    baseUsers.forEach(user => {
      user.active_roles.forEach(role => roles.add(role.name));
    });
    return Array.from(roles).sort();
  }, [users, sampleUsers]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
  };
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'dormant':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'unverified':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'never_logged_in':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'dormant':
        return 'Recent';
      case 'unverified':
        return 'Unverified';
      case 'inactive':
        return 'Inactive';
      case 'never_logged_in':
        return 'Never logged in';
      default:
        return 'Unknown';
    }
  };

  const getStatusTooltip = (status: string) => {
    switch (status) {
      case 'active':
        return 'User has logged in within the last 24 hours';
      case 'dormant':
        return 'User has logged in within the last 7 days but not recently';
      case 'unverified':
        return 'User account is not verified and has never logged in';
      case 'inactive':
        return 'User has not logged in for more than 7 days';
      case 'never_logged_in':
        return 'User account is verified but has never logged in';
      default:
        return 'Status unknown';
    }
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
      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 transition-colors duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent User Activity
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {displayUsers.length} user{displayUsers.length !== 1 ? 's' : ''} 
            {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && 
              ` of ${users?.length || sampleUsers.length} total`
            } • Updated just now
          </p>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors flex items-center space-x-1"
          >
            <span>View all</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="dormant">Recent</option>
              <option value="unverified">Unverified</option>
              <option value="inactive">Inactive</option>
              <option value="never_logged_in">Never Logged In</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="all">All Roles</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {displayUsers.length} of {users?.length || sampleUsers.length} users
            {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && ' (filtered)'}
          </span>
          {displayUsers.length === 0 && (searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
            <span className="text-orange-600 dark:text-orange-400">No users match your filters</span>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
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
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') ? (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
                <p className="text-sm mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Clear all filters</span>
                </button>
              </>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-lg font-medium">No user activity to display</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
            {displayUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 group min-h-[200px] flex flex-col justify-between"
              >
                {/* Header: Avatar + Status */}
                <div className="flex items-start justify-between mb-6">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white dark:ring-gray-800">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    {user.mfa_enabled && user.is_active && user.status !== 'unverified' && (
                      <div 
                        className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 flex items-center justify-center shadow-lg"
                        title="MFA Enabled & Verified"
                      >
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(user.status)} shadow-lg`}
                    title={getStatusTooltip(user.status)}
                  >
                    {getStatusText(user.status)}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-4">
                  <div className="text-center">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                      {user.full_name || user.email}
                    </h4>
                    {user.email !== (user.full_name || user.email) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {user.email}
                      </p>
                    )}
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2.221V7H4.221a.905.905 0 01-.284-.441.906.906 0 01.284-1.268L8.447 2.166A.909.909 0 019 2.221zM15.221 13H11v4.779a.905.905 0 00.284.441.906.906 0 001.268-.284l3.125-4.226A.909.909 0 0015.221 13z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {user.active_roles.length > 0 
                        ? user.active_roles[0].name 
                        : 'No role assigned'
                      }
                      {user.active_roles.length > 1 && (
                        <span className="text-indigo-500 dark:text-indigo-400 ml-1">
                          +{user.active_roles.length - 1}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Last Login */}
                  <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">
                      Last seen {formatLastLogin(user.last_login)}
                    </span>
                  </div>
                </div>

                {/* Action Section */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Activity Indicator */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className={`h-3 w-3 rounded-full shadow-sm ${
                      user.status === 'active' ? 'bg-green-400 animate-pulse' :
                      user.status === 'dormant' ? 'bg-blue-400' :
                      user.status === 'unverified' ? 'bg-yellow-400' :
                      'bg-gray-400'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {user.status === 'active' ? 'Online Now' :
                       user.status === 'dormant' ? 'Recently Active' :
                       user.status === 'unverified' ? 'New User' :
                       'Offline'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button 
                      className="flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      title="View user details"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View</span>
                    </button>
                    <button 
                      className="flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      title="Send message"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                      </svg>
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};