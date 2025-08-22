import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMoon,
  FiSun,
  FiBell,
  FiGlobe,
  FiMail,
  FiToggleLeft,
  FiToggleRight,
  FiSettings,
  FiZap,
  FiStar,
  FiHeart,
  FiTrendingUp,
  FiMonitor,
  FiVolume2,
  FiWifi,
  FiEye,
  FiSliders
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../components/redux/features/auth/authSlice";
import { 
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useBulkUpdatePreferencesMutation
} from "../../../components/redux/features/api/settings/settingsApi";
import { useToast } from "../../../components/utils/Toast";
import { useOptimizedRealTime } from "../../../hooks/useRealTimeSettings";
import { RealTimeIndicator } from "../../../components/ui/RealTimeIndicator";

interface PreferenceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'toggle' | 'select';
  value?: boolean | string;
  options?: { label: string; value: string }[];
}

export const PreferencesTab: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const { showToast } = useToast();
  
  // Real-time updates for preferences
  const realTimeData = useOptimizedRealTime(['preferences'], 90000); // Reduced to 1.5 minutes
  
  // Enhanced API queries
  const { data: userPreferences, isLoading: preferencesLoading, refetch: refetchPreferences } = useGetUserPreferencesQuery();
  const [updatePreferences, { isLoading: isUpdating }] = useUpdateUserPreferencesMutation();
  const [bulkUpdatePreferences, { isLoading: isBulkUpdating }] = useBulkUpdatePreferencesMutation();
  
  const [preferences, setPreferences] = useState({
    darkMode: userPreferences?.theme === 'dark',
    notifications: userPreferences?.push_notifications ?? true,
    emailUpdates: userPreferences?.email_notifications ?? true,
    language: userPreferences?.language || 'en',
    timezone: userPreferences?.timezone || 'UTC',
    soundEnabled: true, // This would be a custom setting
    animationsEnabled: userPreferences?.animations_enabled ?? true,
    autoSave: userPreferences?.auto_save ?? true,
    compactView: userPreferences?.compact_view ?? false
  });
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Use backend customization level
  const customizationLevel = userPreferences?.customization_level || 78;

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Sync preferences when backend data loads
  useEffect(() => {
    if (userPreferences) {
      setPreferences({
        darkMode: userPreferences.theme === 'dark',
        notifications: userPreferences.push_notifications,
        emailUpdates: userPreferences.email_notifications,
        language: userPreferences.language,
        timezone: userPreferences.timezone,
        soundEnabled: userPreferences.custom_settings?.sound_enabled ?? true,
        animationsEnabled: userPreferences.animations_enabled,
        autoSave: userPreferences.auto_save,
        compactView: userPreferences.compact_view
      });
    }
  }, [userPreferences]);

  const handleToggle = async (key: string) => {
    const newValue = !preferences[key];
    
    // Optimistically update UI
    setPreferences(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Map frontend keys to backend keys
    const backendKeyMap = {
      darkMode: { theme: newValue ? 'dark' : 'light' },
      notifications: { push_notifications: newValue },
      emailUpdates: { email_notifications: newValue },
      animationsEnabled: { animations_enabled: newValue },
      autoSave: { auto_save: newValue },
      compactView: { compact_view: newValue },
      soundEnabled: { custom_settings: { ...userPreferences?.custom_settings, sound_enabled: newValue } }
    };

    try {
      const updateData = backendKeyMap[key] || {};
      await updatePreferences(updateData).unwrap();
      showToast(`${key} updated successfully`, 'success');
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({
        ...prev,
        [key]: !newValue
      }));
      showToast('Failed to update preference', 'error');
    }
  };

  const handleSelect = async (key: string, value: string) => {
    const oldValue = preferences[key];
    
    // Optimistically update UI
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));

    try {
      const updateData = {
        [key]: value
      };
      await updatePreferences(updateData).unwrap();
      showToast(`${key} updated successfully`, 'success');
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({
        ...prev,
        [key]: oldValue
      }));
      showToast('Failed to update preference', 'error');
    }
  };

  const handleBulkSave = async () => {
    try {
      const backendPreferences = {
        theme: preferences.darkMode ? 'dark' : 'light',
        push_notifications: preferences.notifications,
        email_notifications: preferences.emailUpdates,
        language: preferences.language,
        timezone: preferences.timezone,
        animations_enabled: preferences.animationsEnabled,
        auto_save: preferences.autoSave,
        compact_view: preferences.compactView,
        custom_sound_enabled: preferences.soundEnabled
      };

      await bulkUpdatePreferences({ preferences: backendPreferences }).unwrap();
      showToast('All preferences saved successfully!', 'success');
      refetchPreferences();
    } catch (error) {
      showToast('Failed to save preferences', 'error');
    }
  };

  const preferenceCategories = {
    appearance: {
      title: 'Appearance & Theme',
      description: 'Customize the visual experience',
      icon: <FiEye className="h-6 w-6" />,
      color: 'indigo',
      items: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          description: 'Switch between light and dark themes for comfortable viewing',
          icon: preferences.darkMode ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />,
          type: 'toggle',
          value: preferences.darkMode,
          premium: false
        },
        {
          id: 'compactView',
          title: 'Compact View',
          description: 'Reduce spacing and show more content on screen',
          icon: <FiMonitor className="h-5 w-5" />,
          type: 'toggle',
          value: preferences.compactView,
          premium: true
        },
        {
          id: 'animationsEnabled',
          title: 'Smooth Animations',
          description: 'Enable beautiful transitions and micro-interactions',
          icon: <FiZap className="h-5 w-5" />,
          type: 'toggle',
          value: preferences.animationsEnabled,
          premium: false
        }
      ]
    },
    notifications: {
      title: 'Notifications & Alerts',
      description: 'Control how you receive updates',
      icon: <FiBell className="h-6 w-6" />,
      color: 'purple',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          description: 'Receive real-time notifications about important updates',
          icon: <FiBell className="h-5 w-5" />,
          type: 'toggle',
          value: preferences.notifications,
          premium: false
        },
        {
          id: 'emailUpdates',
          title: 'Email Notifications',
          description: 'Get detailed updates and newsletters via email',
          icon: <FiMail className="h-5 w-5" />,
          type: 'toggle',
          value: preferences.emailUpdates,
          premium: false
        },
        {
          id: 'soundEnabled',
          title: 'Sound Effects',
          description: 'Play subtle sounds for actions and notifications',
          icon: <FiVolume2 className="h-5 w-5" />,
          type: 'toggle',
          value: preferences.soundEnabled,
          premium: true
        }
      ]
    },
    system: {
      title: 'System & Performance',
      description: 'Optimize your experience',
      icon: <FiSettings className="h-6 w-6" />,
      color: 'green',
      items: [
        {
          id: 'autoSave',
          title: 'Auto-Save',
          description: 'Automatically save your work and preferences',
          icon: <FiHeart className="h-5 w-5" />,
          type: 'toggle',
          value: preferences.autoSave,
          premium: false
        },
        {
          id: 'language',
          title: 'Language',
          description: 'Choose your preferred interface language',
          icon: <FiGlobe className="h-5 w-5" />,
          type: 'select',
          value: preferences.language,
          premium: false,
          options: [
            { label: '🇺🇸 English', value: 'en' },
            { label: '🇪🇸 Spanish', value: 'es' },
            { label: '🇫🇷 French', value: 'fr' },
            { label: '🇩🇪 German', value: 'de' },
            { label: '🇯🇵 Japanese', value: 'ja' },
            { label: '🇨🇳 Chinese', value: 'zh' },
          ],
        }
      ]
    }
  };

  return (
    <motion.div
      key="preferences"
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
      {/* Enhanced Preferences Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-pink-50/20 to-purple-50/30 dark:from-gray-800/95 dark:via-pink-900/10 dark:to-purple-900/15 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40 p-8">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
        
        {/* Premium Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-6 right-6 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-xl rounded-full border border-pink-500/30"
        >
          <FiStar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          <span className="text-sm font-semibold text-pink-700 dark:text-pink-300">Premium Experience</span>
        </motion.div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl">
                <FiSliders className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                  Personal Preferences
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Tailor your experience to perfection
                </p>
              </div>
            </div>
            
            {/* Customization Progress */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <FiTrendingUp className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">Customization Level: {customizationLevel}%</span>
              </div>
            </div>
          </div>
          
          {/* Customization Progress Circle */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mt-6 lg:mt-0 relative"
          >
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200 dark:text-gray-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  className="text-pink-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${customizationLevel}, 100`}
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${customizationLevel}, 100` }}
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
                    className="text-xl font-bold text-pink-600 dark:text-pink-400"
                  >
                    {customizationLevel}%
                  </motion.div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Optimized</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Preferences Categories */}
      <div className="space-y-8">
        {Object.entries(preferenceCategories).map(([categoryKey, category], categoryIndex) => {
          const getColorClasses = (color: string) => {
            const colors = {
              indigo: {
                bg: 'from-indigo-500/10 to-indigo-600/10',
                text: 'text-indigo-600 dark:text-indigo-400',
                border: 'border-indigo-200 dark:border-indigo-800',
                gradient: 'from-indigo-600 to-indigo-700'
              },
              purple: {
                bg: 'from-purple-500/10 to-purple-600/10',
                text: 'text-purple-600 dark:text-purple-400',
                border: 'border-purple-200 dark:border-purple-800',
                gradient: 'from-purple-600 to-purple-700'
              },
              green: {
                bg: 'from-green-500/10 to-green-600/10',
                text: 'text-green-600 dark:text-green-400',
                border: 'border-green-200 dark:border-green-800',
                gradient: 'from-green-600 to-green-700'
              }
            };
            return colors[color] || colors.indigo;
          };
          
          const colorClasses = getColorClasses(category.color);
          
          return (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.2 }}
              className="relative overflow-hidden bg-gradient-to-br from-white/95 via-gray-50/30 to-white/80 dark:from-gray-900/95 dark:via-gray-800/30 dark:to-gray-900/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/40"
            >
              {/* Decorative elements */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${colorClasses.bg} rounded-full blur-3xl`}></div>
              
              <div className="relative z-10 p-8">
                {/* Category Header */}
                <div className="flex items-center space-x-4 mb-8">
                  <div className={`p-4 bg-gradient-to-r ${colorClasses.bg} rounded-2xl shadow-lg`}>
                    <div className={colorClasses.text}>
                      {category.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                      {category.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
                  </div>
                </div>
                
                {/* Preference Items */}
                <div className="space-y-6">
                  {category.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (categoryIndex * 0.2) + (itemIndex * 0.1) }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="group relative overflow-hidden flex items-center justify-between p-6 bg-gradient-to-r from-white/80 to-gray-50/50 dark:from-gray-800/60 dark:to-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}></div>
                      
                      <div className="relative z-10 flex items-center space-x-6 flex-1">
                        <motion.div
                          className={`p-3 bg-gradient-to-r ${colorClasses.bg} rounded-2xl shadow-lg ring-2 ring-white/20 dark:ring-gray-800/20`}
                          whileHover={{ rotate: 5, scale: 1.1 }}
                          transition={{ type: "spring", damping: 15 }}
                        >
                          <div className={colorClasses.text}>
                            {item.icon}
                          </div>
                        </motion.div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-3">
                            <h5 className={`text-lg font-bold text-gray-900 dark:text-white group-hover:${colorClasses.text.replace('text-', 'text-').replace(' dark:', ' dark:')} transition-colors`}>
                              {item.title}
                            </h5>
                            {item.premium && (
                              <motion.span
                                className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-300 dark:border-amber-700 rounded-full"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                              >
                                <FiStar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">PRO</span>
                              </motion.span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Controls */}
                      <div className="relative z-10 flex items-center ml-4">
                        {item.type === 'toggle' ? (
                          <motion.button
                            onClick={() => handleToggle(item.id)}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 shadow-lg ${
                              item.value
                                ? `bg-gradient-to-r ${colorClasses.gradient} shadow-lg hover:shadow-xl`
                                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.span
                              className="inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-2 ring-white/30"
                              animate={{
                                x: item.value ? 32 : 4
                              }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            />
                            
                            {/* Glow effect when enabled */}
                            {item.value && (
                              <motion.div
                                className={`absolute inset-0 rounded-full bg-gradient-to-r ${colorClasses.bg} opacity-50`}
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </motion.button>
                        ) : (
                          <motion.select
                            value={item.value as string}
                            onChange={(e) => handleSelect(item.id, e.target.value)}
                            whileHover={{ scale: 1.02 }}
                            className={`px-5 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-2 ${colorClasses.border} rounded-2xl text-gray-900 dark:text-white focus:ring-0 focus:${colorClasses.border} transition-all duration-300 shadow-lg hover:shadow-xl font-medium`}
                          >
                            {item.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </motion.select>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Save Button with Preview */}
      <div className="flex flex-col space-y-6">
        {/* Quick Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-white/80 to-gray-50/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-gray-700/30 p-6 shadow-lg"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl">
              <FiEye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h5 className="font-semibold text-gray-900 dark:text-white">Settings Preview</h5>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <div className="font-medium text-gray-900 dark:text-white">{preferences.darkMode ? 'Dark' : 'Light'}</div>
              <div className="text-gray-500 dark:text-gray-400">Theme</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <div className="font-medium text-gray-900 dark:text-white">{preferences.notifications ? 'On' : 'Off'}</div>
              <div className="text-gray-500 dark:text-gray-400">Notifications</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <div className="font-medium text-gray-900 dark:text-white">{(preferences.language || 'en').toUpperCase()}</div>
              <div className="text-gray-500 dark:text-gray-400">Language</div>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <div className="font-medium text-gray-900 dark:text-white">{preferences.autoSave ? 'Auto' : 'Manual'}</div>
              <div className="text-gray-500 dark:text-gray-400">Save Mode</div>
            </div>
          </div>
        </motion.div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <motion.button
            onClick={handleBulkSave}
            disabled={isBulkUpdating}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="group relative overflow-hidden flex items-center space-x-4 px-12 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 disabled:from-pink-400 disabled:via-purple-400 disabled:to-indigo-400 text-white rounded-2xl font-bold shadow-2xl hover:shadow-3xl hover:shadow-purple-500/30 transition-all duration-300 disabled:cursor-not-allowed"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {isBulkUpdating ? (
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full relative z-10"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <FiHeart className="h-5 w-5 relative z-10" />
            )}
            <span className="relative z-10 text-lg">
              {isBulkUpdating ? 'Saving...' : 'Save My Preferences'}
            </span>
            
            <motion.div
              className="w-2 h-2 bg-white rounded-full relative z-10"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Progress indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
              <motion.div
                className="h-full bg-white/50"
                initial={{ width: '0%' }}
                animate={{ width: `${customizationLevel}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};