import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiStar,
  FiTrendingUp,
  FiActivity,
} from "react-icons/fi";
import Logo from "../../../../components/utils/Logo";
import { FEATURES } from "./constants";

interface SidePanelProps {
  userType: string;
  setUserType: (type: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

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
          <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            RiskGuard
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

      {/* Platform Statistics */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-8 relative"
      >
        <h3 className="text-white/90 text-sm font-medium mb-4 flex items-center">
          <FiTrendingUp className="text-blue-300 mr-2" />
          Platform Insights
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <FiActivity className="text-white text-sm" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">99.8%</div>
                <div className="text-blue-200/80 text-xs">Accuracy Rate</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <FiShield className="text-white text-sm" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">10M+</div>
                <div className="text-blue-200/80 text-xs">Risk Assessments</div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="mt-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold text-sm">
                Real-time Processing
              </div>
              <div className="text-blue-200/80 text-xs">
                Average response time: 0.3s
              </div>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        </motion.div>
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
