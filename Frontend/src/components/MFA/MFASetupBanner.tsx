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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-amber-600/10 dark:bg-amber-400/10 rounded-full flex items-center justify-center">
            <FiShield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              🔒 Complete MFA Setup
            </h3>
            {hasLimitedAccess && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                Limited Access
              </span>
            )}
          </div>
          <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
            {hasLimitedAccess
              ? "Your access is limited. Complete setup to unlock full features."
              : "Secure your account with multi-factor authentication."
            }
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartSetup}
          className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 group"
        >
          <span>Complete Setup</span>
          <FiArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
        
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 transition-colors rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30"
            title="Dismiss banner"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};