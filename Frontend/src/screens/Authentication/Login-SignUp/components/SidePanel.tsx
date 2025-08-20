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
      <div className="absolute top-10 right-10 w-40 h-40 bg-gradient-to-br from-cyan-400/30 to-purple-600/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/25 to-pink-600/25 rounded-full blur-2xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-5 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-blue-600/20 rounded-full blur-xl animate-pulse delay-500" />
      
      {/* New floating elements */}
      <div className="absolute top-1/4 left-8 w-6 h-6 bg-gradient-to-br from-yellow-400/40 to-orange-500/40 rounded-full blur-sm animate-bounce delay-700" />
      <div className="absolute bottom-1/3 right-12 w-4 h-4 bg-gradient-to-br from-green-400/50 to-teal-500/50 rounded-full blur-sm animate-bounce delay-1200" />

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
          <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">
            RiskGuard
          </h1>
          
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full my-3 shadow-lg shadow-cyan-500/25"></div>

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full backdrop-blur-sm">
              <FiShield className="text-yellow-300 text-xl drop-shadow-sm" />
            </div>
            <p className="text-blue-100 text-lg font-medium drop-shadow-sm">
              AI-Powered Credit Risk Platform
            </p>
          </div>

          <div className="flex items-center space-x-3 mt-3">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                >
                  <FiStar className="text-yellow-300 text-sm fill-current drop-shadow-sm" />
                </motion.div>
              ))}
            </div>
            <span className="text-blue-200 text-sm font-medium">
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
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 via-blue-400 to-purple-400 rounded-full mr-3 shadow-lg shadow-cyan-500/30" />
          <span className="drop-shadow-sm">Platform Features</span>
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
              className="group relative bg-white/10 dark:bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-white/10 hover:border-cyan-300/40 dark:hover:border-cyan-300/30 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/10 hover:shadow-cyan-500/20"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              {/* Feature content */}
              <div className="relative z-10 flex items-center">
                <motion.div
                  animate={{
                    scale: hoveredFeature === index ? 1.1 : 1,
                    rotate: hoveredFeature === index ? 10 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl mr-4 p-3 bg-gradient-to-br from-cyan-400/25 via-blue-400/25 to-purple-400/25 rounded-xl backdrop-blur-sm shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/30"
                >
                  {feature.icon}
                </motion.div>

                <div className="flex-1">
                  <div className="text-white font-semibold text-base group-hover:text-cyan-200 transition-colors duration-200 drop-shadow-sm">
                    {feature.title}
                  </div>
                  <div className="text-blue-200/80 text-sm mt-1 group-hover:text-cyan-100 transition-colors duration-200">
                    {feature.desc}
                  </div>
                </div>
              </div>

              {/* Subtle animated border */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.4), rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.4), transparent)",
                  animation:
                    hoveredFeature === index
                      ? "shimmer 2.5s ease-in-out infinite"
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
          <div className="p-1.5 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-lg mr-2">
            <FiTrendingUp className="text-green-300 drop-shadow-sm" />
          </div>
          <span className="drop-shadow-sm">Platform Insights</span>
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-white/10 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-white/10 hover:border-green-300/40 dark:hover:border-green-300/30 transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-green-500/20"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                <FiActivity className="text-white text-sm drop-shadow-sm" />
              </div>
              <div>
                <div className="text-white font-bold text-lg drop-shadow-sm">99.8%</div>
                <div className="text-green-200/80 text-xs">Accuracy Rate</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="bg-white/10 dark:bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-white/10 hover:border-purple-300/40 dark:hover:border-purple-300/30 transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-purple-500/20"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <FiShield className="text-white text-sm drop-shadow-sm" />
              </div>
              <div>
                <div className="text-white font-bold text-lg drop-shadow-sm">10M+</div>
                <div className="text-purple-200/80 text-xs">Risk Assessments</div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02, y: -1 }}
          className="mt-4 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-white/10 hover:border-cyan-300/40 dark:hover:border-cyan-300/30 transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-cyan-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold text-sm drop-shadow-sm">
                Real-time Processing
              </div>
              <div className="text-cyan-200/80 text-xs">
                Average response time: 0.3s
              </div>
            </div>
            <div className="relative">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced brand accent */}
      <div className="absolute bottom-4 right-4 w-24 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-full opacity-70 shadow-lg shadow-cyan-500/30" />
      <div className="absolute bottom-6 right-6 w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse opacity-60" />

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
