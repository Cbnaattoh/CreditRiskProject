import React from "react";
import { motion } from "framer-motion";
import { FiAlertTriangle, FiAlertCircle, FiInfo } from "react-icons/fi";

interface AlertCardProps {
  severity: "high" | "medium" | "low";
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
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      iconColor: "text-red-500",
    },
    medium: {
      icon: <FiAlertCircle className="h-5 w-5" />,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      iconColor: "text-yellow-500",
    },
    low: {
      icon: <FiInfo className="h-5 w-5" />,
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      iconColor: "text-blue-500",
    },
  };

  const config = severityConfig[severity];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${config.iconColor}`}>{config.icon}</div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${config.text}`}>{title}</h3>
          <div className={`mt-1 text-sm ${config.text}`}>
            <p>{description}</p>
          </div>
          <div className="mt-2 text-xs text-gray-500">{time}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default AlertCard;
