import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiList, FiFileText } from "react-icons/fi";
import { useIsClientUser } from "../../components/utils/hooks/useRBAC";
import Applicants from "../Applicants"; // This is the list view component
import Applications from "./index"; // This is the form component

const ApplicationsWrapper: React.FC = () => {
  const isClientUser = useIsClientUser();
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  
  // RBAC working correctly
  console.log('✅ ApplicationsWrapper: Showing client applications view');
  
  // For admin/staff users who somehow access this route, show the filtered applicants list
  if (!isClientUser) {
    return <Applicants showClientView={true} />;
  }
  
  // For client users, show both list and create options
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 transition-all duration-500">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent mb-3">
              My Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              View your credit applications and create new ones
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200/50 dark:border-gray-700/50 mt-4 sm:mt-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'list'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <FiList className="w-4 h-4" />
              <span>View Applications</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === 'create'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <FiPlus className="w-4 h-4" />
              <span>New Application</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'list' ? (
              <div>
                {/* Quick Stats for Client */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    💡 <strong>Tip:</strong> You can only see your own applications here. 
                    Use the "New Application" tab to submit additional credit applications.
                  </div>
                </motion.div>

                {/* Applications List */}
                <Applicants showClientView={true} />
              </div>
            ) : (
              <div>
                {/* Info Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start gap-3">
                    <FiFileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Create New Credit Application
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Fill out the form below to submit a new credit application. 
                        Make sure to provide accurate information and upload all required documents.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Application Form */}
                <Applications />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ApplicationsWrapper;