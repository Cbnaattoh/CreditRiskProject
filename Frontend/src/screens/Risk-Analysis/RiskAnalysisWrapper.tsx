import React, { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiBarChart, FiUsers, FiSearch, FiEye, FiArrowRight } from "react-icons/fi";
import { useGetApplicationsQuery } from "../../components/redux/features/api/applications/applicationsApi";
import { usePermissions, useIsClientUser } from "../../components/utils/hooks/useRBAC";
import PredictionOutcome from "./index";

const RiskAnalysisWrapper: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = searchParams.get('id');
  const isClientUser = useIsClientUser();
  
  // If applicationId is provided, show the actual Risk Analysis component
  if (applicationId) {
    return <PredictionOutcome />;
  }
  
  // Otherwise, show application selection interface
  return <ApplicationSelector />;
};

const ApplicationSelector: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const isClientUser = useIsClientUser();
  const navigate = useNavigate();
  
  // Fetch applications
  const { 
    data: applicationsData, 
    isLoading, 
    error 
  } = useGetApplicationsQuery({ 
    page: 1, 
    page_size: 20,
    search: searchQuery 
  }, {
    // For client users, only fetch their own applications
    // For admin/staff, fetch all applications
  });
  
  const applications = applicationsData?.results || [];
  
  const handleSelectApplication = (appId: string) => {
    navigate(`/home/risk-analysis?id=${appId}`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md">
          <FiBarChart className="mx-auto text-6xl text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Applications
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            There was an error loading your applications. Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-white/20 dark:border-gray-700/20 mb-6"
          >
            <FiBarChart className="text-2xl text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Risk Analysis
            </h1>
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            {isClientUser 
              ? "Select one of your applications to view detailed risk analysis and insights"
              : "Select an application to view comprehensive risk analysis and assessment details"
            }
          </p>
        </div>
        
        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Applications List */}
        {applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 max-w-md mx-auto"
          >
            <FiUsers className="mx-auto text-6xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Applications Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isClientUser 
                ? "You haven't submitted any applications yet."
                : searchQuery 
                  ? "No applications match your search criteria."
                  : "No applications are available for analysis."
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                onClick={() => handleSelectApplication(app.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Application #{app.id}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {app.full_name || 'Application'}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    app.status === 'approved' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : app.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {app.status}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${app.loan_amount?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    View Risk Analysis
                  </span>
                  <FiArrowRight className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAnalysisWrapper;