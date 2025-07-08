import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiChevronDown, FiShield, FiStar } from "react-icons/fi";
import Logo from "../../../../components/utils/Logo";
import { FEATURES, USER_TYPES } from "./constants";

interface SidePanelProps {
  userType: string;
  setUserType: (type: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ userType, setUserType }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const selectedUserType = USER_TYPES.find((type) => type.value === userType);

  return (
    <motion.div
      className="w-full md:w-2/5 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-900 p-10 flex flex-col justify-between relative overflow-hidden"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/10 via-transparent to-purple-50/10 dark:from-indigo-900/30 dark:via-transparent dark:to-purple-900/20 pointer-events-none" />

      {/* Animated Background Orbs */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-indigo-600/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-5 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-blue-600/20 rounded-full blur-lg animate-pulse delay-500" />

      {/* Header Section */}
      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <Logo />
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-5xl font-bold text-white leading-tight">
            RiskGuard{" "}
            <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Pro
            </span>
          </h1>

          <div className="flex items-center space-x-2">
            <FiShield className="text-yellow-400 text-xl" />
            <p className="text-blue-100 text-lg font-medium">
              AI-Powered Credit Risk Platform
            </p>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className="text-yellow-400 text-sm fill-current"
                />
              ))}
            </div>
            <span className="text-blue-200 text-sm">
              Enterprise Grade Security
            </span>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-12 space-y-4"
      >
        <h3 className="text-white/90 text-lg font-semibold mb-6 flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3" />
          Platform Features
        </h3>

        <div className="grid gap-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
              className="group relative bg-white/10 dark:bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              {/* Feature content */}
              <div className="relative z-10 flex items-center">
                <motion.div
                  animate={{
                    scale: hoveredFeature === index ? 1.1 : 1,
                    rotate: hoveredFeature === index ? 10 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl mr-4 p-2 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-xl backdrop-blur-sm"
                >
                  {feature.icon}
                </motion.div>

                <div className="flex-1">
                  <div className="text-white font-semibold text-base group-hover:text-blue-200 transition-colors duration-200">
                    {feature.title}
                  </div>
                  <div className="text-blue-200/80 text-sm mt-1 group-hover:text-blue-100 transition-colors duration-200">
                    {feature.desc}
                  </div>
                </div>
              </div>

              {/* Subtle animated border */}
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
                  animation:
                    hoveredFeature === index
                      ? "shimmer 2s ease-in-out infinite"
                      : "none",
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Premium User Type Selector */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-8 relative"
      >
        <h3 className="text-white/90 text-sm font-medium mb-3 flex items-center">
          <FiUser className="text-blue-300 mr-2" />
          Access Level
        </h3>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <FiUser className="text-white text-lg" />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold text-base">
                  {selectedUserType?.label}
                </div>
                <div className="text-blue-200/80 text-sm">
                  {selectedUserType?.description || "Select your role"}
                </div>
              </div>
            </div>

            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-white/70 group-hover:text-white transition-colors duration-200"
            >
              <FiChevronDown className="text-lg" />
            </motion.div>
          </motion.button>

          {/* Enhanced Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden z-50"
              >
                <div className="p-2">
                  {USER_TYPES.map((type, index) => (
                    <motion.button
                      key={type.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      onClick={() => {
                        setUserType(type.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                        userType === type.value
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          userType === type.value
                            ? "bg-white/20"
                            : "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50"
                        }`}
                      >
                        <FiUser
                          className={`text-sm ${
                            userType === type.value
                              ? "text-white"
                              : "text-indigo-600 dark:text-indigo-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{type.label}</div>
                        {type.description && (
                          <div
                            className={`text-xs mt-1 ${
                              userType === type.value
                                ? "text-white/80"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {type.description}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Subtle brand accent */}
      <div className="absolute bottom-4 right-4 w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60" />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default SidePanel;
