import React from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  FiTrendingUp,
  FiShield,
  FiMonitor,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiSettings,
  FiZap,
  FiStar,
  FiArrowRight
} from "react-icons/fi";
import { 
  useGetSettingsOverviewQuery, 
  useGetSettingsRecommendationsQuery,
  useGetRecentSecurityEventsQuery 
} from "../../../components/redux/features/api/settings/settingsApi";
import { useOptimizedRealTime } from "../../../hooks/useRealTimeSettings";
import { RealTimeIndicator } from "../../../components/ui/RealTimeIndicator";
import { useToast } from "../../../components/utils/Toast";

const SettingsDashboard: React.FC = () => {
  // Hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  
  // Use real-time optimized hook for dashboard components
  const realTimeData = useOptimizedRealTime(['dashboard'], 120000); // Reduced to 2 minutes for dashboard
  
  const { data: overview, isLoading: overviewLoading } = useGetSettingsOverviewQuery();
  const { data: recommendations, isLoading: recLoading } = useGetSettingsRecommendationsQuery();
  const { data: recentEvents, isLoading: eventsLoading } = useGetRecentSecurityEventsQuery();

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500";
    if (score >= 70) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  // Handle applying recommendations with smart navigation
  const handleApplyRecommendation = (recommendation: any) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Navigate based on recommendation type and category
    switch (recommendation.type) {
      case 'profile':
        // Navigate to Account tab for profile-related recommendations
        newParams.set('tab', 'account');
        setSearchParams(newParams);
        showToast(
          `Redirecting to Account settings to ${recommendation.title.toLowerCase()}`,
          'info'
        );
        
        // Scroll to form fields after a brief delay to allow tab transition
        setTimeout(() => {
          const formElement = document.querySelector('[data-form-section]');
          if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
        break;
        
      case 'security':
        // Navigate to Security tab for security-related recommendations
        newParams.set('tab', 'security');
        setSearchParams(newParams);
        showToast(
          `Redirecting to Security settings to ${recommendation.title.toLowerCase()}`,
          'info'
        );
        break;
        
      case 'preferences':
        // Navigate to Preferences tab for preference-related recommendations
        newParams.set('tab', 'preferences');
        setSearchParams(newParams);
        showToast(
          `Redirecting to Preferences to ${recommendation.title.toLowerCase()}`,
          'info'
        );
        break;
        
      default:
        // Handle unknown recommendation types
        showToast(
          'This recommendation will be applied automatically',
          'success'
        );
        break;
    }
    
    // Track the applied recommendation (could be sent to analytics)
    console.log('Applied recommendation:', {
      action: recommendation.action,
      type: recommendation.type,
      category: recommendation.category,
      priority: recommendation.priority
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Profile Completion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/95 via-blue-50/30 to-indigo-50/40 dark:from-gray-800/95 dark:via-blue-900/20 dark:to-indigo-900/20 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl">
                <FiTrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(overview?.profile_completion || 0)}`}>
                {overview?.profile_completion || 0}%
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Profile Complete
            </h3>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
              <motion.div
                className={`h-2 bg-gradient-to-r ${getScoreGradient(overview?.profile_completion || 0)} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${overview?.profile_completion || 0}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete your profile for better experience
            </p>
          </div>
        </motion.div>

        {/* Security Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/95 via-green-50/30 to-emerald-50/40 dark:from-gray-800/95 dark:via-green-900/20 dark:to-emerald-900/20 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl">
                <FiShield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(overview?.security_score || 0)}`}>
                {overview?.security_score || 0}%
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Security Score
            </h3>
            
            {/* Progress Circle */}
            <div className="relative w-16 h-16 mx-auto mb-3">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
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
                  strokeDasharray={`${overview?.security_score || 0}, 100`}
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${overview?.security_score || 0}, 100` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {overview?.mfa_enabled ? "MFA Active" : "Enable MFA"}
            </p>
          </div>
        </motion.div>

        {/* Active Sessions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/95 via-purple-50/30 to-pink-50/40 dark:from-gray-800/95 dark:via-purple-900/20 dark:to-pink-900/20 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl">
                <FiMonitor className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {overview?.active_sessions || 0}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Active Sessions
            </h3>
            
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Currently Active
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your device sessions
            </p>
          </div>
        </motion.div>

        {/* Recent Security Events */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/95 via-orange-50/30 to-red-50/40 dark:from-gray-800/95 dark:via-orange-900/20 dark:to-red-900/20 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl">
                <FiAlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {overview?.recent_security_events || 0}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Security Events
            </h3>
            
            <div className="flex items-center space-x-2 mb-3">
              <FiClock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last 7 days
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor account activity
            </p>
          </div>
        </motion.div>
      </div>

      {/* Recommendations Section */}
      {!recLoading && recommendations && recommendations.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/20 to-purple-50/20 dark:from-gray-900/95 dark:via-indigo-900/10 dark:to-purple-900/10 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl">
                  <FiZap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                    Smart Recommendations
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Personalized suggestions to optimize your experience
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-300 dark:border-red-700 rounded-full text-sm font-semibold text-red-700 dark:text-red-300">
                  {recommendations.high_priority_count} High Priority
                </span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-300 dark:border-blue-700 rounded-full text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {recommendations.total_count} Total
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.recommendations.slice(0, 6).map((rec, index) => (
                <motion.div
                  key={rec.action}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="group relative overflow-hidden p-5 bg-gradient-to-r from-white/80 to-gray-50/50 dark:from-gray-800/60 dark:to-gray-900/30 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/3 via-transparent to-purple-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl ${
                        rec.priority === 'high' 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {rec.type === 'security' ? <FiShield className="h-4 w-4" /> :
                         rec.type === 'profile' ? <FiSettings className="h-4 w-4" /> :
                         <FiCheckCircle className="h-4 w-4" />}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        rec.priority === 'high' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {rec.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                      {rec.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800/50 rounded-full">
                        {rec.category}
                      </span>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApplyRecommendation(rec)}
                        className="flex items-center space-x-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
                      >
                        <span>Apply</span>
                        <FiArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Settings Preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Current Settings */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-blue-50/20 to-cyan-50/20 dark:from-gray-900/95 dark:via-blue-900/10 dark:to-cyan-900/10 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FiSettings className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
              Quick Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {overview?.current_theme === 'dark' ? '🌙' : overview?.current_theme === 'light' ? '☀️' : '🔄'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {overview?.current_theme} Theme
                </div>
              </div>
              
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {overview?.notification_status === 'enabled' ? '🔔' : '🔕'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {overview?.notification_status}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  🌐
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {overview?.language_preference?.toUpperCase()}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {overview?.auto_save_enabled ? '💾' : '📝'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {overview?.auto_save_enabled ? 'Auto Save' : 'Manual Save'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Progress */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-purple-50/20 to-pink-50/20 dark:from-gray-900/95 dark:via-purple-900/10 dark:to-pink-900/10 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FiStar className="h-5 w-5 mr-3 text-purple-600 dark:text-purple-400" />
              Customization Level
            </h3>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {overview?.preferences_configured || 0}%
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                of preferences configured
              </p>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <motion.div
                className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overview?.preferences_configured || 0}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Personalize your experience further
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsDashboard;