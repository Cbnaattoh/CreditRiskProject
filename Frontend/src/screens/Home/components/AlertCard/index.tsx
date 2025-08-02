import React from "react";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiAlertCircle, FiInfo } from "react-icons/fi";

interface AlertCardProps {
  severity: "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  time: string;
}

const AlertCard: React.FC<AlertCardProps> = ({
  severity,
  title,
  description,
  time,
}) => {
  const severityConfig = {
    high: {
      icon: <FiAlertTriangle className="h-5 w-5" />,
      // Light theme
      bg: "bg-red-50/80",
      border: "border-red-200/60",
      text: "text-red-800",
      iconColor: "text-red-500",
      accentBg: "bg-red-100/50",
      // Dark theme
      darkBg: "dark:bg-red-900/20",
      darkBorder: "dark:border-red-800/30",
      darkText: "dark:text-red-200",
      darkIconColor: "dark:text-red-400",
      darkAccentBg: "dark:bg-red-800/20",
      // Gradient overlay
      gradientOverlay:
        "from-red-50/50 via-transparent to-red-100/30 dark:from-red-900/10 dark:via-transparent dark:to-red-800/20",
    },
    medium: {
      icon: <FiAlertCircle className="h-5 w-5" />,
      // Light theme
      bg: "bg-yellow-50/80",
      border: "border-yellow-200/60",
      text: "text-yellow-800",
      iconColor: "text-yellow-500",
      accentBg: "bg-yellow-100/50",
      // Dark theme
      darkBg: "dark:bg-yellow-900/20",
      darkBorder: "dark:border-yellow-800/30",
      darkText: "dark:text-yellow-200",
      darkIconColor: "dark:text-yellow-400",
      darkAccentBg: "dark:bg-yellow-800/20",
      // Gradient overlay
      gradientOverlay:
        "from-yellow-50/50 via-transparent to-yellow-100/30 dark:from-yellow-900/10 dark:via-transparent dark:to-yellow-800/20",
    },
    low: {
      icon: <FiInfo className="h-5 w-5" />,
      // Light theme
      bg: "bg-blue-50/80",
      border: "border-blue-200/60",
      text: "text-blue-800",
      iconColor: "text-blue-500",
      accentBg: "bg-blue-100/50",
      // Dark theme
      darkBg: "dark:bg-blue-900/20",
      darkBorder: "dark:border-blue-800/30",
      darkText: "dark:text-blue-200",
      darkIconColor: "dark:text-blue-400",
      darkAccentBg: "dark:bg-blue-800/20",
      // Gradient overlay
      gradientOverlay:
        "from-blue-50/50 via-transparent to-blue-100/30 dark:from-blue-900/10 dark:via-transparent dark:to-blue-800/20",
    },
    info: {
      icon: <FiInfo className="h-5 w-5" />,
      // Light theme
      bg: "bg-green-50/80",
      border: "border-green-200/60",
      text: "text-green-800",
      iconColor: "text-green-500",
      accentBg: "bg-green-100/50",
      // Dark theme
      darkBg: "dark:bg-green-900/20",
      darkBorder: "dark:border-green-800/30",
      darkText: "dark:text-green-200",
      darkIconColor: "dark:text-green-400",
      darkAccentBg: "dark:bg-green-800/20",
      // Gradient overlay
      gradientOverlay:
        "from-green-50/50 via-transparent to-green-100/30 dark:from-green-900/10 dark:via-transparent dark:to-green-800/20",
    },
  };

  const config = severityConfig[severity] || severityConfig.info; // Fallback to info if severity is not found

  return (
    <motion.div
      whileHover={{
        y: -2,
        scale: 1.01,
        transition: { type: "spring", bounce: 0.2, duration: 0.3 },
      }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative p-5 rounded-xl border overflow-hidden
        ${config.bg} ${config.darkBg}
        ${config.border} ${config.darkBorder}
        backdrop-blur-sm
        shadow-sm hover:shadow-md dark:shadow-gray-900/20
        hover:border-opacity-80 dark:hover:border-opacity-50
        transition-all duration-200
        group
      `}
    >
      {/* Gradient overlay for premium feel */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.gradientOverlay} pointer-events-none`}
      />

      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 dark:ring-gray-800/50 pointer-events-none" />

      <div className="relative flex items-start">
        {/* Icon container with enhanced styling */}
        <div
          className={`
          flex-shrink-0 p-2 rounded-lg 
          ${config.accentBg} ${config.darkAccentBg}
          ${config.iconColor} ${config.darkIconColor}
          ring-1 ring-white/20 dark:ring-gray-700/50
          shadow-sm
          group-hover:scale-105 transition-transform duration-200
        `}
        >
          {config.icon}
        </div>

        <div className="ml-4 flex-1">
          {/* Title */}
          <h3
            className={`
            text-sm font-semibold 
            ${config.text} ${config.darkText}
            group-hover:text-opacity-90 dark:group-hover:text-opacity-90
            transition-colors duration-200
          `}
          >
            {title}
          </h3>

          {/* Description */}
          <div
            className={`
            mt-1.5 text-sm 
            ${config.text} ${config.darkText}
            opacity-80 dark:opacity-80
            leading-relaxed
          `}
          >
            <p>{description}</p>
          </div>

          {/* Time with enhanced styling */}
          <div className="mt-3 flex items-center">
            <div
              className={`
              text-xs px-2 py-1 rounded-full
              bg-white/60 dark:bg-gray-800/60
              text-gray-600 dark:text-gray-400
              border border-gray-200/50 dark:border-gray-700/50
              backdrop-blur-sm
              font-medium
            `}
            >
              {time}
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect accent line */}
      <div
        className={`
        absolute bottom-0 left-0 right-0 h-0.5 
        bg-gradient-to-r ${config.iconColor} ${config.darkIconColor}
        opacity-0 group-hover:opacity-50 dark:group-hover:opacity-40
        transition-opacity duration-200
      `}
      />
    </motion.div>
  );
};

export default AlertCard;
