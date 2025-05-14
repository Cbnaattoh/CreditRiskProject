import React from "react";
import { motion } from "framer-motion";
import { FiDownload } from "react-icons/fi";

const DownloadReportButton: React.FC = () => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium hover:from-indigo-700 hover:to-blue-700 transition-colors"
    >
      <FiDownload className="mr-2" />
      Download Full Report
    </motion.button>
  );
};

export default DownloadReportButton;
