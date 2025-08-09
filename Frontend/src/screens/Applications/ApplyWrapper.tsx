import React from "react";
import { motion } from "framer-motion";
import { FiPlus, FiFileText, FiShield, FiList } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useIsClientUser } from "../../components/utils/hooks/useRBAC";
import Applications from "./index";

const ApplyWrapper: React.FC = () => {
  const isClientUser = useIsClientUser();
  const navigate = useNavigate();

  // Redirect non-client users to the appropriate page
  React.useEffect(() => {
    if (!isClientUser) {
      navigate('/home', { replace: true });
    }
  }, [isClientUser, navigate]);

  // Show loading or redirect message for non-client users
  if (!isClientUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 transition-all duration-500">
      <div className="max-w-7xl mx-auto p-6">
        Header
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <FiPlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent mb-3">
                  Apply for Credit
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Submit a new credit application with our secure online form
                </p>
              </div>
            </div>
            
            {/* Quick Navigation */}
            <motion.button
              onClick={() => navigate('/home/applications')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm"
            >
              <FiList className="w-4 h-4" />
              <span className="text-sm font-medium">My Applications</span>
            </motion.button>
          </div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-6"
          >
            <div className="flex items-start gap-3">
              <FiFileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Credit Application Process
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="mb-2">
                    Complete the form below to apply for credit. Our AI-powered system will:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Analyze your financial information securely</li>
                    <li>Provide instant risk assessment using Ghana employment data</li>
                    <li>Generate a credit score tailored to Ghanaian market conditions</li>
                    <li>Send you updates on your application status</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Applications />
        </motion.div>
      </div>
    </div>
  );
};

export default ApplyWrapper;