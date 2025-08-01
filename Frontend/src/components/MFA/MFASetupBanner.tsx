import React from "react";
import { motion } from "framer-motion";
import { FiShield, FiArrowRight, FiX } from "react-icons/fi";
import { useSelector } from "react-redux";
import { selectRequiresMFASetup, selectHasLimitedAccess } from "../redux/features/auth/authSlice";

interface MFASetupBannerProps {
  onStartSetup: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const MFASetupBanner: React.FC<MFASetupBannerProps> = ({
  onStartSetup,
  onDismiss,
  showDismiss = false,
}) => {
  const requiresMFASetup = useSelector(selectRequiresMFASetup);
  const hasLimitedAccess = useSelector(selectHasLimitedAccess);

  if (!requiresMFASetup) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <FiShield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-1">
              Complete Your MFA Setup
            </h3>
            <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
              {hasLimitedAccess
                ? "You have limited access until you complete your multi-factor authentication setup. This adds an extra layer of security to your account."
                : "You requested multi-factor authentication during registration. Complete the setup to enhance your account security."
              }
            </p>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartSetup}
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Complete Setup
                <FiArrowRight className="ml-2 w-4 h-4" />
              </motion.button>
              
              {hasLimitedAccess && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  • Access limited until setup is complete
                </p>
              )}
            </div>
          </div>
        </div>
        
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};