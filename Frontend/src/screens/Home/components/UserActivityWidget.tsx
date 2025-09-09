import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  ml_activity?: {
    recent_applications: number;
    credit_scores_generated: number;
    processing_status?: 'processing' | 'completed' | 'failed';
    last_ml_activity?: string;
  };
}

interface UserActivityWidgetProps {
  users: User[];
  isLoading?: boolean;
  error?: any;
  onViewAll?: () => void;
  title?: string;
  showMLActivity?: boolean;
}

// Pagination configuration
const ITEMS_PER_PAGE = 8;

export const UserActivityWidget: React.FC<UserActivityWidgetProps> = ({
  users = [],
  isLoading = false,
  error,
  onViewAll,
  title = "Recent User Activity",
  showMLActivity = false
}) => {
  // State for search, filters, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mlProcessingStats, setMlProcessingStats] = useState({
    total_processing: 0,
    completed_today: 0,
    active_users: 0
  });

  // Sample data fallback
  const sampleUsers: User[] = [
    {
      id: 1,
      email: "admin@creditrisk.com",
      full_name: "Sarah Johnson",
      last_login: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      active_roles: [{ name: "Administrator", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: true,
      status: "active",
      ml_activity: {
        recent_applications: 12,
        credit_scores_generated: 8,
        processing_status: 'completed',
        last_ml_activity: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    },
    {
      id: 2,
      email: "analyst@creditrisk.com", 
      full_name: "Michael Chen",
      last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      active_roles: [{ name: "Risk Analyst", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: true,
      status: "active",
      ml_activity: {
        recent_applications: 24,
        credit_scores_generated: 18,
        processing_status: 'processing',
        last_ml_activity: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    },
    {
      id: 3,
      email: "auditor@creditrisk.com",
      full_name: "Emily Rodriguez",
      last_login: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      active_roles: [{ name: "Compliance Auditor", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: false,
      status: "dormant",
    },
    {
      id: 4,
      email: "manager@creditrisk.com",
      full_name: "David Park",
      last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      active_roles: [{ name: "Manager", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: true,
      status: "dormant",
    },
    {
      id: 5,
      email: "client@creditrisk.com",
      full_name: "Jennifer Liu",
      last_login: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      active_roles: [{ name: "Client User", assigned_at: new Date().toISOString() }],
      is_active: true,
      mfa_enabled: false,
      status: "inactive",
    },
    {
      id: 6,
      email: "newuser@creditrisk.com",
      full_name: "Robert Thompson",
      last_login: undefined,
      active_roles: [{ name: "Risk Analyst", assigned_at: new Date().toISOString() }],
      is_active: false,
      mfa_enabled: false,
      status: "never_logged_in",
    }
  ];

  // Get filtered and searched users
  const filteredUsers = useMemo(() => {
    let baseUsers = users.length > 0 ? users : sampleUsers;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      baseUsers = baseUsers.filter(user => {
        const nameMatch = (user.full_name || '').toLowerCase().includes(searchLower);
        const emailMatch = user.email.toLowerCase().includes(searchLower);
        const roleMatch = user.active_roles.some(role => 
          role.name.toLowerCase().includes(searchLower)
        );
        return nameMatch || emailMatch || roleMatch;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      baseUsers = baseUsers.filter(user => user.status === statusFilter);
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      baseUsers = baseUsers.filter(user => 
        user.active_roles.some(role => role.name === roleFilter)
      );
    }

    return baseUsers;
  }, [users, sampleUsers, searchTerm, statusFilter, roleFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  // Simulate real-time ML processing updates
  useEffect(() => {
    if (showMLActivity) {
      const interval = setInterval(() => {
        setMlProcessingStats(prev => ({
          total_processing: Math.floor(Math.random() * 5) + prev.total_processing % 10,
          completed_today: Math.floor(Math.random() * 3) + prev.completed_today % 50,
          active_users: Math.floor(Math.random() * 2) + prev.active_users % 8
        }));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [showMLActivity]);

  // Get available roles for filter
  const availableRoles = useMemo(() => {
    const baseUsers = users.length > 0 ? users : sampleUsers;
    const roles = new Set<string>();
    baseUsers.forEach(user => {
      user.active_roles.forEach(role => roles.add(role.name));
    });
    return Array.from(roles).sort();
  }, [users, sampleUsers]);

  // Utility functions
  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        text: 'Active',
        icon: '🟢'
      },
      dormant: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        dot: 'bg-blue-500',
        text: 'Recent',
        icon: '🔵'
      },
      inactive: {
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        dot: 'bg-amber-500',
        text: 'Away',
        icon: '🟡'
      },
      never_logged_in: {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        dot: 'bg-gray-500',
        text: 'New',
        icon: '⚪'
      },
      unverified: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        dot: 'bg-red-500',
        text: 'Pending',
        icon: '🔴'
      }
    };
    return configs[status as keyof typeof configs] || configs.inactive;
  };

  const getRoleIcon = (roleName: string) => {
    const icons: { [key: string]: string } = {
      'Administrator': '👑',
      'Risk Analyst': '📊',
      'Compliance Auditor': '🛡️',
      'Manager': '👔',
      'Client User': '👤',
      'User': '👤'
    };
    return icons[roleName] || '👤';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
    setCurrentPage(1);
  };

  const getMLStatusIcon = (status?: 'processing' | 'completed' | 'failed') => {
    switch (status) {
      case 'processing':
        return { icon: '⚡', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
      case 'completed':
        return { icon: '✅', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
      case 'failed':
        return { icon: '❌', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
      default:
        return { icon: '🔄', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
    }
  };

  const formatMLActivity = (lastActivity?: string) => {
    if (!lastActivity) return 'No ML activity';
    
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'ML processing now';
    if (diffInMinutes < 60) return `ML activity ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `ML activity ${Math.floor(diffInMinutes / 60)}h ago`;
    return `ML activity ${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
              </div>
              <div className="space-y-3">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full mt-4">
                  <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full" style={{width: `${Math.random() * 60 + 20}%`}}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-8"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-3">
            <span className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
              👥
            </span>
            <span>{title}</span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
            <span>{filteredUsers.length} of {(users.length > 0 ? users : sampleUsers).length} users</span>
            <span>•</span>
            <span>Page {currentPage} of {Math.max(1, totalPages)}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse block"></span>
              <span>Live data</span>
            </span>
            {showMLActivity && (
              <>
                <span>•</span>
                <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <span>⚡</span>
                  <span>{mlProcessingStats.total_processing} processing</span>
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Grid view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="List view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>View All</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200/50 dark:border-gray-700/50">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">🟢 Active</option>
              <option value="dormant">🔵 Recent</option>
              <option value="inactive">🟡 Away</option>
              <option value="never_logged_in">⚪ New</option>
              <option value="unverified">🔴 Pending</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="all">All Roles</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{getRoleIcon(role)} {role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary and Clear */}
        {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Filters applied:</span>
              {searchTerm && <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded">"{searchTerm}"</span>}
              {statusFilter !== 'all' && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">{getStatusConfig(statusFilter).text}</span>}
              {roleFilter !== 'all' && <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">{roleFilter}</span>}
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center space-x-2 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Users Display */}
      <div className="mb-8">
        {paginatedUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') 
                ? "Try adjusting your search or filter criteria"
                : "No user activity data available"
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Clear all filters</span>
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${currentPage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedUsers.map((user, index) => {
                    const statusConfig = getStatusConfig(user.status);
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="bg-white/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/30 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-600 transition-all duration-300 group"
                      >
                        {/* Avatar and Status */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="relative">
                            <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            {user.mfa_enabled && (
                              <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center">
                                <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.color}`}>
                            <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${statusConfig.dot} ${user.status === 'active' ? 'animate-pulse' : ''}`}></div>
                            {statusConfig.text}
                          </span>
                        </div>

                        {/* User Info */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                              {user.full_name || user.email.split('@')[0]}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5">
                            <span className="text-sm">{getRoleIcon(user.active_roles[0]?.name)}</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {user.active_roles[0]?.name || 'No role'}
                            </span>
                            {user.active_roles.length > 1 && (
                              <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                +{user.active_roles.length - 1}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Last seen {formatLastLogin(user.last_login)}</span>
                          </div>

                          {showMLActivity && user.ml_activity && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-2.5">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">
                                  {getMLStatusIcon(user.ml_activity.processing_status).icon}
                                </span>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  <div>{formatMLActivity(user.ml_activity.last_ml_activity)}</div>
                                  <div className="flex items-center space-x-3 mt-1">
                                    <span>📊 {user.ml_activity.credit_scores_generated} scores</span>
                                    <span>📋 {user.ml_activity.recent_applications} apps</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`h-2 w-2 rounded-full ${user.ml_activity.processing_status === 'processing' ? 'animate-pulse bg-blue-500' : 'bg-green-500'}`}></div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/30">
                          <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 px-3 text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>
                          <button className="bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg p-2 transition-all duration-200">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/50 dark:bg-gray-700/30 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/30 overflow-hidden">
                  <div className="divide-y divide-gray-200/50 dark:divide-gray-600/30">
                    {paginatedUsers.map((user, index) => {
                      const statusConfig = getStatusConfig(user.status);
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="relative">
                                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                </div>
                                {user.mfa_enabled && (
                                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center">
                                    <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                    {user.full_name || user.email.split('@')[0]}
                                  </p>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig.color}`}>
                                    <div className={`h-1.5 w-1.5 rounded-full mr-1 ${statusConfig.dot} ${user.status === 'active' ? 'animate-pulse' : ''}`}></div>
                                    {statusConfig.text}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center space-x-1">
                                    <span>{getRoleIcon(user.active_roles[0]?.name)}</span>
                                    <span>{user.active_roles[0]?.name || 'No role'}</span>
                                    {user.active_roles.length > 1 && (
                                      <span className="text-indigo-600 dark:text-indigo-400">+{user.active_roles.length - 1}</span>
                                    )}
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{formatLastLogin(user.last_login)}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-all duration-200 flex items-center space-x-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View</span>
                              </button>
                              <button className="bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg p-2 transition-all duration-200">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Showing</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}
            </span>
            <span>of</span>
            <span className="font-medium text-gray-900 dark:text-white">{filteredUsers.length}</span>
            <span>users</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
              <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Sample data notice */}
      {users.length === 0 && !isLoading && (
        <div className="mt-6 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <div className="flex items-center text-blue-700 dark:text-blue-300 text-sm">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Displaying sample data</span>
            <span className="ml-2">- Connect to your user management system to see live data</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};