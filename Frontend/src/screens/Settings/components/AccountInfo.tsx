import { motion } from "framer-motion";
import { useState } from "react";
import {
  FiCopy,
  FiShield,
  FiUser,
  FiCalendar,
  FiActivity,
  FiCheck,
  FiStar,
  FiZap,
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import { SettingCard } from "./SettingCard";

const UltraPremiumAccountInfo = ({ currentUser, isAdmin, isManager }) => {
  const [copiedId, setCopiedId] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const getRoleIcon = () => {
    if (isAdmin)
      return {
        icon: FaCrown,
        color: "from-amber-400 to-yellow-500",
        bg: "from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20",
      };
    if (isManager)
      return {
        icon: FiShield,
        color: "from-emerald-400 to-teal-500",
        bg: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
      };
    return {
      icon: FiUser,
      color: "from-blue-400 to-indigo-500",
      bg: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
    };
  };

  const getRoleText = () => {
    if (isAdmin)
      return {
        title: "Administrator",
        subtitle: "Full system access",
        privileges: [
          "Complete control",
          "User management",
          "System configuration",
        ],
      };
    if (isManager)
      return {
        title: "Manager",
        subtitle: "Team management access",
        privileges: ["Team oversight", "Report access", "Limited admin rights"],
      };
    return {
      title: "Standard User",
      subtitle: "Basic user access",
      privileges: ["Profile management", "Basic features", "Standard support"],
    };
  };

  const roleConfig = getRoleIcon();
  const roleInfo = getRoleText();
  const RoleIcon = roleConfig.icon;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const shimmerVariants = {
    initial: { x: "-100%" },
    animate: {
      x: "100%",
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "linear",
      },
    },
  };

  return (
    <SettingCard>
      <motion.div
        className="relative p-8 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-indigo-50/30 dark:from-slate-900/50 dark:via-gray-900 dark:to-indigo-900/20"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-purple-200/20 to-transparent dark:from-purple-800/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-transparent dark:from-blue-800/10 rounded-full blur-3xl"></div>

        {/* Floating Orbs */}
        <motion.div
          className="absolute top-6 right-8 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-8 right-16 w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
          animate={{
            y: [0, -15, 0],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-8"
            variants={cardVariants}
          >
            <div>
              <h4 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent mb-2">
                Account Information
              </h4>
              <p className="text-gray-600 dark:text-gray-400 flex items-center">
                <FiActivity className="mr-2 text-indigo-500" />
                Secure credential overview
              </p>
            </div>
            <motion.div
              className="p-3 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/20 dark:to-purple-400/20 rounded-2xl backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/50"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FiZap className="text-2xl text-indigo-600 dark:text-indigo-400" />
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User ID Card */}
            <motion.div
              className="group relative"
              variants={cardVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-400/10 dark:to-indigo-400/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg mr-3">
                        <FiUser className="text-blue-600 dark:text-blue-400" />
                      </div>
                      User Identifier
                    </h5>
                    <motion.button
                      onClick={() => copyToClipboard(currentUser?.id || "N/A")}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copiedId ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-green-500"
                        >
                          <FiCheck size={16} />
                        </motion.div>
                      ) : (
                        <FiCopy
                          size={16}
                          className="text-gray-600 dark:text-gray-400"
                        />
                      )}
                    </motion.button>
                  </div>

                  <div className="relative">
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <div className="font-mono text-sm md:text-base text-slate-700 dark:text-slate-300 break-all tracking-wider">
                        {currentUser?.id || "N/A"}
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Unique system identifier
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Type Card */}
            <motion.div
              className="group relative"
              variants={cardVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${roleConfig.color}/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`}
              ></div>
              <div className="relative p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                    style={{ animationDelay: "1s" }}
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                      <div
                        className={`p-2 bg-gradient-to-br ${roleConfig.bg} rounded-lg mr-3`}
                      >
                        <RoleIcon
                          className={`text-transparent bg-gradient-to-r ${roleConfig.color} bg-clip-text`}
                        />
                      </div>
                      Account Type
                    </h5>
                    <motion.div
                      className={`px-3 py-1 bg-gradient-to-r ${roleConfig.color} rounded-full`}
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0.4)",
                          "0 0 0 10px rgba(59, 130, 246, 0)",
                          "0 0 0 0 rgba(59, 130, 246, 0)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                    >
                      <FiStar className="text-white" size={14} />
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <div
                      className={`p-4 bg-gradient-to-r ${roleConfig.bg} rounded-xl border border-opacity-50`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h6
                          className={`text-lg font-bold text-transparent bg-gradient-to-r ${roleConfig.color} bg-clip-text`}
                        >
                          {roleInfo.title}
                        </h6>
                        <RoleIcon
                          className={`text-xl text-transparent bg-gradient-to-r ${roleConfig.color} bg-clip-text`}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {roleInfo.subtitle}
                      </p>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Access Privileges:
                        </p>
                        {roleInfo.privileges.map((privilege, index) => (
                          <motion.div
                            key={privilege}
                            className="flex items-center text-xs text-gray-600 dark:text-gray-400"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${roleConfig.color} mr-2`}
                            ></div>
                            {privilege}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Footer */}
          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={cardVariants}
          >
            {[
              {
                icon: FiCalendar,
                label: "Account Age",
                value: "2+ years",
                color: "from-green-400 to-emerald-500",
              },
              {
                icon: FiActivity,
                label: "Status",
                value: "Active",
                color: "from-blue-400 to-cyan-500",
              },
              {
                icon: FiShield,
                label: "Security",
                value: "Verified",
                color: "from-purple-400 to-pink-500",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="group relative p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/30 dark:border-gray-700/30"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center">
                  <div
                    className={`p-2 bg-gradient-to-br ${stat.color}/10 rounded-lg mr-3 group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon
                      className={`text-transparent bg-gradient-to-r ${stat.color} bg-clip-text`}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </SettingCard>
  );
};

export default UltraPremiumAccountInfo;
