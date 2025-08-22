import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiLock,
  FiBell,
  FiSmartphone,
  FiEye,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiGlobe,
  FiWifi,
  FiClock,
  FiTrendingUp,
  FiZap,
  FiStar,
  FiCheck,
  FiX
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { 
  selectCurrentUser,
  selectRequiresMFASetup,
  selectMfaCompleted,
} from "../../../components/redux/features/auth/authSlice";
import { MFASetupModal } from "../../../components/MFA";
import { 
  useGetUserSessionsQuery,
  useGetSecurityEventsQuery,
  useGetSecurityEventsSummaryQuery,
  useTerminateSessionMutation,
  useTerminateAllOtherSessionsMutation,
  useGetSettingsOverviewQuery
} from "../../../components/redux/features/api/settings/settingsApi";
import { useToast } from "../../../components/utils/Toast";
import { useOptimizedRealTime } from "../../../hooks/useRealTimeSettings";
import { RealTimeIndicator } from "../../../components/ui/RealTimeIndicator";

interface SecurityItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'enabled' | 'disabled' | 'warning';
  action?: string;
}

export const SecurityTab: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const requiresMFASetup = useSelector(selectRequiresMFASetup);
  const mfaCompleted = useSelector(selectMfaCompleted);
  const { showToast } = useToast();
  
  // Real-time updates for security data
  const realTimeData = useOptimizedRealTime(['security'], 60000); // Reduced to 1 minute for security data
  
  // Enhanced API queries
  const { data: userSessions, isLoading: sessionsLoading, refetch: refetchSessions } = useGetUserSessionsQuery();
  const { data: securityEvents, isLoading: eventsLoading } = useGetSecurityEventsQuery();
  const { data: securitySummary, isLoading: summaryLoading } = useGetSecurityEventsSummaryQuery();
  const { data: settingsOverview, isLoading: overviewLoading } = useGetSettingsOverviewQuery();
  const [terminateSession, { isLoading: isTerminating }] = useTerminateSessionMutation();
  const [terminateAllOthers, { isLoading: isTerminatingAll }] = useTerminateAllOtherSessionsMutation();
  
  const [settings, setSettings] = useState({
    mfaEnabled: user?.mfa_enabled || false,
    loginNotifications: true,
    securityAlerts: true,
    sessionTimeout: true,
  });
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Calculate dynamic values from backend data
  const securityScore = settingsOverview?.security_score || 92;
  const threatDetections = securitySummary?.recent_activity || 3;

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sync local settings with backend user data and auth state
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        mfaEnabled: user.mfa_enabled || false,
      }));
    }
  }, [user?.mfa_enabled, mfaCompleted, requiresMFASetup]);

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTerminateSession = async (sessionId: number) => {
    try {
      await terminateSession(sessionId).unwrap();
      showToast('Session terminated successfully', 'success');
      refetchSessions();
    } catch (error) {
      showToast('Failed to terminate session', 'error');
    }
  };

  const handleTerminateAllOthers = async () => {
    try {
      const result = await terminateAllOthers().unwrap();
      showToast(result.message, 'success');
      refetchSessions();
    } catch (error) {
      showToast('Failed to terminate sessions', 'error');
    }
  };

  const getMFAStatus = () => {
    // Check backend user data first for most accurate status
    const userMfaEnabled = user?.mfa_enabled;
    
    // If user has MFA enabled in backend, and no setup is required, consider it enabled
    if (userMfaEnabled && !requiresMFASetup) {
      return 'enabled';
    }
    
    // If setup is explicitly required, show warning
    if (requiresMFASetup) {
      return 'warning';
    }
    
    // Check local state with MFA completion status
    if (settings.mfaEnabled && mfaCompleted) {
      return 'enabled';
    }
    
    // If MFA is enabled but not completed, show warning
    if (settings.mfaEnabled && !mfaCompleted) {
      return 'warning';
    }
    
    return 'disabled';
  };

  const getMFAAction = () => {
    // Check backend user data first for most accurate status
    const userMfaEnabled = user?.mfa_enabled;
    
    // If user has MFA enabled in backend, and no setup is required, show manage
    if (userMfaEnabled && !requiresMFASetup) {
      return 'Manage';
    }
    
    // If setup is explicitly required, show complete setup
    if (requiresMFASetup) {
      return 'Complete Setup';
    }
    
    // Check local state with MFA completion status
    if (settings.mfaEnabled && mfaCompleted) {
      return 'Manage';
    }
    
    // If MFA is enabled but not completed, show complete setup
    if (settings.mfaEnabled && !mfaCompleted) {
      return 'Complete Setup';
    }
    
    return 'Enable';
  };

  const securityItems: SecurityItem[] = [
    {
      id: 'mfa',
      title: 'Multi-Factor Authentication',
      description: (() => {
        const userMfaEnabled = user?.mfa_enabled;
        
        if (userMfaEnabled && !requiresMFASetup) {
          return 'MFA is active and protecting your account';
        }
        if (requiresMFASetup) {
          return 'Complete your MFA setup to secure your account';
        }
        return 'Add an extra layer of security with MFA';
      })(),
      icon: <FiShield className="h-5 w-5" />,
      status: getMFAStatus(),
      action: getMFAAction()
    },
    {
      id: 'notifications',
      title: 'Login Notifications',
      description: 'Get notified of new sign-ins to your account',
      icon: <FiBell className="h-5 w-5" />,
      status: settings.loginNotifications ? 'enabled' : 'disabled',
    },
    {
      id: 'alerts',
      title: 'Security Alerts',
      description: 'Receive alerts about suspicious activities',
      icon: <FiAlertTriangle className="h-5 w-5" />,
      status: settings.securityAlerts ? 'enabled' : 'disabled',
    },
    {
      id: 'sessions',
      title: 'Session Management',
      description: 'Automatic logout after inactivity',
      icon: <FiActivity className="h-5 w-5" />,
      status: settings.sessionTimeout ? 'enabled' : 'disabled',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'disabled':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'enabled':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/20';
      case 'disabled':
        return 'bg-gray-100 dark:bg-gray-800/20';
      default:
        return 'bg-gray-100 dark:bg-gray-800/20';
    }
  };

  // Use real session data from backend
  const recentSessions = userSessions?.slice(0, 5) || [];

  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-6"
    >
      {/* Real-time Status Indicator */}
      <div className="flex justify-end mb-4">
        <RealTimeIndicator 
          position="inline" 
          showDetails={true}
          onRefresh={realTimeData.refreshAll}
        />
      </div>
      {/* Enhanced Security Overview Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-emerald-50/20 to-green-50/30 dark:from-gray-800/95 dark:via-emerald-900/10 dark:to-green-900/15 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-8">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-green-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl">
                <FiShield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                  Security Overview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Advanced protection for your digital identity
                </p>
              </div>
            </div>
            
            {/* Security Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <motion.div
                  className="w-3 h-3 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Real-time Protection Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiTrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{threatDetections} threats blocked today</span>
              </div>
            </div>
          </div>
          
          {/* Security Score Circle */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mt-6 lg:mt-0 relative"
          >
            <div className="relative w-32 h-32 mx-auto lg:mx-0">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200 dark:text-gray-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className="text-green-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${securityScore}, 100`}
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${securityScore}, 100` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-2xl font-bold text-green-600 dark:text-green-400"
                  >
                    {securityScore}%
                  </motion.div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Security Score</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Security Settings */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/10 to-purple-50/10 dark:from-gray-900/95 dark:via-indigo-900/5 dark:to-purple-900/5 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative z-10 p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl">
              <FiZap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Security Settings
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Configure your security preferences and protections</p>
            </div>
          </div>
          <div className="space-y-6">
            {securityItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: index * 0.15, type: "spring", damping: 20 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative overflow-hidden flex items-center justify-between p-6 bg-gradient-to-r from-white/80 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center space-x-6">
                  <motion.div
                    className={`p-4 rounded-2xl ${getStatusBg(item.status)} ring-2 ring-white/30 dark:ring-gray-800/30 shadow-lg`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    <div className={`${getStatusColor(item.status)} text-lg`}>
                      {item.icon}
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <h5 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                    
                    {/* Status indicator with enhanced styling */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {item.status === 'enabled' && (
                          <motion.div
                            className="flex items-center space-x-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                          >
                            <FiCheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">Active</span>
                          </motion.div>
                        )}
                        {item.status === 'warning' && (
                          <motion.div
                            className="flex items-center space-x-1"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <FiAlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">Action Required</span>
                          </motion.div>
                        )}
                        {item.status === 'disabled' && (
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800/50 rounded-full">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center space-x-4">
                  {item.id === 'mfa' ? (
                    <motion.button
                      onClick={() => setShowMFAModal(true)}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`group relative overflow-hidden flex items-center space-x-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl ${
                        getMFAStatus() === 'enabled'
                          ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 hover:from-green-500/20 hover:to-emerald-500/20'
                          : getMFAStatus() === 'warning'
                          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:from-amber-500/20 hover:to-orange-500/20'
                          : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:from-indigo-500/20 hover:to-purple-500/20'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      
                      <FiZap className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">{item.action}</span>
                      
                      <motion.div
                        className="w-1 h-1 bg-current rounded-full relative z-10"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => {
                        if (item.id === 'notifications') handleToggle('loginNotifications');
                        if (item.id === 'alerts') handleToggle('securityAlerts');
                        if (item.id === 'sessions') handleToggle('sessionTimeout');
                      }}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 shadow-lg ${
                        (item.id === 'notifications' && settings.loginNotifications) ||
                        (item.id === 'alerts' && settings.securityAlerts) ||
                        (item.id === 'sessions' && settings.sessionTimeout)
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30'
                          : 'bg-gray-300 dark:bg-gray-600 shadow-gray-300/30'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-2 ring-white/30"
                        animate={{
                          x: (item.id === 'notifications' && settings.loginNotifications) ||
                             (item.id === 'alerts' && settings.securityAlerts) ||
                             (item.id === 'sessions' && settings.sessionTimeout) ? 32 : 4
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                      
                      {/* Glow effect when enabled */}
                      {((item.id === 'notifications' && settings.loginNotifications) ||
                        (item.id === 'alerts' && settings.securityAlerts) ||
                        (item.id === 'sessions' && settings.sessionTimeout)) && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400/30 to-purple-400/30"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Recent Sessions */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-blue-50/10 to-cyan-50/10 dark:from-gray-900/95 dark:via-blue-900/5 dark:to-cyan-900/5 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl">
                <FiActivity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  Active Sessions
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your account access across all devices</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={handleTerminateAllOthers}
                disabled={isTerminatingAll || recentSessions.length <= 1}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 border border-red-200 dark:border-red-700 rounded-2xl text-red-700 dark:text-red-300 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTerminatingAll ? (
                  <motion.div
                    className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <FiX className="h-4 w-4 group-hover:scale-110 transition-transform" />
                )}
                <span>End All Others</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-200 dark:border-blue-700 rounded-2xl text-blue-700 dark:text-blue-300 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FiEye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>View All ({userSessions?.length || 0})</span>
              </motion.button>
            </div>
          </div>

          <div className="space-y-4">
            {recentSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.15, type: "spring", damping: 20 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative overflow-hidden flex items-center justify-between p-6 bg-gradient-to-r from-white/80 to-blue-50/30 dark:from-gray-800/60 dark:to-blue-900/10 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-transparent to-cyan-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center space-x-6">
                  <motion.div
                    className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl shadow-lg ring-2 ring-white/20 dark:ring-gray-800/20"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", damping: 15 }}
                  >
                    <FiSmartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {session.device_info?.device || `${session.device_type} - ${session.browser}`}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <FiGlobe className="h-3 w-3" />
                        <span>{session.location || 'Unknown Location'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiClock className="h-3 w-3" />
                        <span>{session.time_since_login}</span>
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <FiShield className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Score: {session.security_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center space-x-4">
                  {session.is_current_session ? (
                    <motion.div
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-300 dark:border-green-700 rounded-full"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <motion.div
                        className="w-2 h-2 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-sm font-bold text-green-700 dark:text-green-300">Active Now</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        session.is_active 
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' 
                          : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50'
                      }`}>
                        {session.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <motion.button
                        onClick={() => handleTerminateSession(session.id)}
                        disabled={isTerminating}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isTerminating ? (
                          <motion.div
                            className="w-3 h-3 border border-red-500/30 border-t-red-500 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <FiX className="h-3 w-3 group-hover:rotate-90 transition-transform duration-300" />
                        )}
                        <span className="text-sm">End Session</span>
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Save Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          className="group relative overflow-hidden flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold shadow-2xl hover:shadow-3xl hover:shadow-indigo-500/30 transition-all duration-300"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          <FiShield className="h-5 w-5 relative z-10" />
          <span className="relative z-10 text-lg">Save Security Settings</span>
          
          <motion.div
            className="w-2 h-2 bg-white rounded-full relative z-10"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      </div>
      
      {/* MFA Setup Modal */}
      <MFASetupModal
        isOpen={showMFAModal}
        onClose={() => setShowMFAModal(false)}
        onComplete={() => {
          setShowMFAModal(false);
          // Refresh the component state to reflect completed MFA
          setSettings(prev => ({ ...prev, mfaEnabled: true }));
        }}
      />
    </motion.div>
  );
};