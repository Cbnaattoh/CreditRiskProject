import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiMoon,
  FiSun,
  FiBell,
  FiGlobe,
  FiMail,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../components/redux/features/auth/authSlice";

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
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
    emailUpdates: true,
    language: 'en',
    timezone: 'UTC',
  });

  const handleToggle = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelect = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const preferenceItems: PreferenceItem[] = [
    {
      id: 'darkMode',
      title: 'Dark Mode',
      description: 'Switch between light and dark themes',
      icon: preferences.darkMode ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />,
      type: 'toggle',
      value: preferences.darkMode,
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Receive notifications about important updates',
      icon: <FiBell className="h-5 w-5" />,
      type: 'toggle',
      value: preferences.notifications,
    },
    {
      id: 'emailUpdates',
      title: 'Email Updates',
      description: 'Get updates and newsletters via email',
      icon: <FiMail className="h-5 w-5" />,
      type: 'toggle',
      value: preferences.emailUpdates,
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Choose your preferred language',
      icon: <FiGlobe className="h-5 w-5" />,
      type: 'select',
      value: preferences.language,
      options: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
      ],
    },
  ];

  return (
    <motion.div
      key="preferences"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-6"
    >
      {/* User Preferences Header */}
      <div className="bg-gradient-to-r from-white/80 via-blue-50/50 to-indigo-50/80 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Personal Preferences
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your experience and notification settings
        </p>
      </div>

      {/* Preferences List */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/30 overflow-hidden">
        <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
          {preferenceItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/10 dark:to-purple-400/10 rounded-xl">
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  {item.type === 'toggle' ? (
                    <motion.button
                      onClick={() => handleToggle(item.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        item.value
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                          item.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                        animate={{ x: item.value ? 24 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  ) : (
                    <select
                      value={item.value as string}
                      onChange={(e) => handleSelect(item.id, e.target.value)}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      {item.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Save Preferences
        </motion.button>
      </div>
    </motion.div>
  );
};