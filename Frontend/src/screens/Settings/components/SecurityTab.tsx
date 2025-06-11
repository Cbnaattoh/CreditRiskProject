import { motion } from "framer-motion";
import { useState } from "react";
import { 
  FiBell,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import {RiShieldKeyholeLine} from "react-icons/ri"
import { FaFingerprint } from "react-icons/fa";
import { SettingCard } from "./SettingCard";
import { ToggleSwitch } from "./ToggleSwitch";

export const SecurityTab = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const securityFeatures = [
    {
      icon: <RiShieldKeyholeLine className="text-blue-600 dark:text-blue-400" size={24} />,
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      enabled: twoFactorEnabled,
      toggle: () => setTwoFactorEnabled(!twoFactorEnabled),
      color: "from-blue-600 to-teal-600",
    },
    {
      icon: <FiBell className="text-amber-600 dark:text-amber-400" size={24} />,
      title: "Login Notifications",
      description: "Get alerts for new sign-ins to your account",
      enabled: notificationsEnabled,
      toggle: () => setNotificationsEnabled(!notificationsEnabled),
      color: "from-amber-600 to-orange-600",
    },
    {
      icon: <FaFingerprint className="text-purple-600 dark:text-purple-400" size={24} />,
      title: "Biometric Authentication",
      description: "Enable fingerprint or face recognition",
      enabled: biometricEnabled,
      toggle: () => setBiometricEnabled(!biometricEnabled),
      color: "from-purple-600 to-indigo-600",
    },
  ];

  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="space-y-6"
    >
      <motion.h3
        className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Security Center
      </motion.h3>

      <SettingCard>
        <div className="space-y-4">
          {securityFeatures.map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center justify-between p-5 md:p-6 bg-white/80 dark:bg-gray-700/80 rounded-xl border border-white/20 dark:border-gray-600/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-white/20 dark:border-gray-600/30">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
              </div>
              <ToggleSwitch 
                isOn={item.enabled} 
                toggle={item.toggle} 
                color={item.color} 
              />
            </motion.div>
          ))}
        </div>
      </SettingCard>

      {/* Session Management */}
      <SettingCard>
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Session Management
        </h4>
        <div className="space-y-4">
          <motion.div className="flex items-center justify-between p-5 md:p-6 bg-white/80 dark:bg-gray-700/80 rounded-xl border border-white/20 dark:border-gray-600/50">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-white/20 dark:border-gray-600/30">
                <FiShield className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Active Sessions
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Manage your logged-in devices
                </p>
              </div>
            </div>
            <motion.button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-600 dark:to-gray-700 text-gray-800 dark:text-white text-sm font-medium border border-gray-200 dark:border-gray-600">
              View Sessions
            </motion.button>
          </motion.div>

          <motion.div className="flex items-center justify-between p-5 md:p-6 bg-white/80 dark:bg-gray-700/80 rounded-xl border border-white/20 dark:border-gray-600/50">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-white/20 dark:border-gray-600/30">
                <FiCheck className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Log Out Everywhere
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sign out of all devices except this one
                </p>
              </div>
            </div>
            <motion.button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-700/50">
              Sign Out
            </motion.button>
          </motion.div>
        </div>
      </SettingCard>
    </motion.div>
  );
};