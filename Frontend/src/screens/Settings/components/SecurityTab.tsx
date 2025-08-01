import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiLock,
  FiBell,
  FiSmartphone,
  FiEye,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { 
  selectCurrentUser,
  selectRequiresMFASetup,
  selectMfaCompleted,
} from "../../../components/redux/features/auth/authSlice";
import { MFASetupModal } from "../../../components/MFA";

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
  const [settings, setSettings] = useState({
    mfaEnabled: user?.mfa_enabled || false,
    loginNotifications: true,
    securityAlerts: true,
    sessionTimeout: true,
  });
  const [showMFAModal, setShowMFAModal] = useState(false);

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getMFAStatus = () => {
    if (requiresMFASetup) return 'warning';
    if (settings.mfaEnabled && mfaCompleted) return 'enabled';
    if (settings.mfaEnabled && !mfaCompleted) return 'warning';
    return 'disabled';
  };

  const getMFAAction = () => {
    if (requiresMFASetup) return 'Complete Setup';
    if (settings.mfaEnabled && mfaCompleted) return 'Manage';
    if (settings.mfaEnabled && !mfaCompleted) return 'Complete Setup';
    return 'Enable';
  };

  const securityItems: SecurityItem[] = [
    {
      id: 'mfa',
      title: 'Multi-Factor Authentication',
      description: requiresMFASetup 
        ? 'Complete your MFA setup to secure your account'
        : 'Add an extra layer of security with MFA',
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

  const recentSessions = [
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'New York, NY',
      time: '2 hours ago',
      current: true,
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'New York, NY',
      time: '1 day ago',
      current: false,
    },
    {
      id: 3,
      device: 'Firefox on MacOS',
      location: 'Los Angeles, CA',
      time: '3 days ago',
      current: false,
    },
  ];

  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-6"
    >
      {/* Security Overview Header */}
      <div className="bg-gradient-to-r from-white/80 via-blue-50/50 to-indigo-50/80 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Security Overview
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account security and privacy settings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Account Secured
            </span>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
        <div className="p-6">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Security Settings
          </h4>
          <div className="space-y-4">
            {securityItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${getStatusBg(item.status)}`}>
                    <div className={getStatusColor(item.status)}>
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {item.status === 'enabled' && (
                      <FiCheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {item.status === 'warning' && (
                      <FiAlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'enabled' ? 'Enabled' : 
                       item.status === 'warning' ? 'Setup Required' : 'Disabled'}
                    </span>
                  </div>
                  
                  {item.id === 'mfa' ? (
                    <motion.button
                      onClick={() => setShowMFAModal(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        getMFAStatus() === 'enabled'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : getMFAStatus() === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {item.action}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => {
                        if (item.id === 'notifications') handleToggle('loginNotifications');
                        if (item.id === 'alerts') handleToggle('securityAlerts');
                        if (item.id === 'sessions') handleToggle('sessionTimeout');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        (item.id === 'notifications' && settings.loginNotifications) ||
                        (item.id === 'alerts' && settings.securityAlerts) ||
                        (item.id === 'sessions' && settings.sessionTimeout)
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                        animate={{
                          x: (item.id === 'notifications' && settings.loginNotifications) ||
                             (item.id === 'alerts' && settings.securityAlerts) ||
                             (item.id === 'sessions' && settings.sessionTimeout) ? 24 : 4
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Sessions
            </h4>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
            >
              View All
            </motion.button>
          </div>

          <div className="space-y-3">
            {recentSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <FiSmartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {session.device}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.location} • {session.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {session.current && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                      Current
                    </span>
                  )}
                  {!session.current && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Revoke
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Save Security Settings
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