import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAlertTriangle,
  FiX,
  FiLogOut,
  FiShield,
  FiClock,
} from "react-icons/fi";

interface SignoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  showSuccessToast: (message: string) => void;
  variant?: "default" | "critical" | "minimal";
  size?: "sm" | "md" | "lg";
  showTimer?: boolean;
  autoCloseDelay?: number;
  preventBackdropClose?: boolean;
  customTitle?: string;
  customMessage?: string;
  customIcon?: React.ReactNode;
  showSessionInfo?: boolean;
}

const SignoutModal: React.FC<SignoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  showSuccessToast,
  variant = "default",
  size = "md",
  showTimer = false,
  autoCloseDelay,
  preventBackdropClose = false,
  customTitle,
  customMessage,
  customIcon,
  showSessionInfo = true,
}) => {
  const [timeLeft, setTimeLeft] = React.useState(autoCloseDelay || 0);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { width: "max-w-sm", padding: "p-4", spacing: "mt-4" },
    md: { width: "max-w-md", padding: "p-6", spacing: "mt-6" },
    lg: { width: "max-w-lg", padding: "p-8", spacing: "mt-8" },
  };

  const config = sizeConfig[size];

  // Variant configurations
  const variantConfig = {
    default: {
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-500 dark:text-red-400",
      headerGradient:
        "from-indigo-500 via-purple-500 to-red-500 dark:from-indigo-400 dark:via-purple-400 dark:to-red-400",
      confirmButton:
        "from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 hover:from-red-600 hover:to-red-700 dark:hover:from-red-500 dark:hover:to-red-600",
      ringColor: "ring-red-500 dark:ring-red-400",
    },
    critical: {
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-500 dark:text-orange-400",
      headerGradient:
        "from-orange-500 via-red-500 to-red-600 dark:from-orange-400 dark:via-red-400 dark:to-red-500",
      confirmButton:
        "from-orange-500 to-red-600 dark:from-orange-400 dark:to-red-500 hover:from-orange-600 hover:to-red-700 dark:hover:from-orange-500 dark:hover:to-red-600",
      ringColor: "ring-orange-500 dark:ring-orange-400",
    },
    minimal: {
      iconBg: "bg-gray-100 dark:bg-gray-800",
      iconColor: "text-gray-500 dark:text-gray-400",
      headerGradient:
        "from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-500",
      confirmButton:
        "from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 hover:from-gray-600 hover:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-800",
      ringColor: "ring-gray-500 dark:ring-gray-400",
    },
  };

  const variantStyles = variantConfig[variant];

  // Auto-close timer effect
  useEffect(() => {
    if (autoCloseDelay && isOpen && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && autoCloseDelay) {
      handleConfirm();
    }
  }, [timeLeft, isOpen, autoCloseDelay]);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen && autoCloseDelay) {
      setTimeLeft(autoCloseDelay);
    }
  }, [isOpen, autoCloseDelay]);

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventBackdropClose) {
        onClose();
      }
      if (e.key === "Enter" && !isProcessing) {
        handleConfirm();
      }
    },
    [onClose, isProcessing, preventBackdropClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    showSuccessToast("Signing out securely...");

    // Simulate processing delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    onConfirm();
    setIsProcessing(false);
  };

  const handleBackdropClick = () => {
    if (!preventBackdropClose) {
      onClose();
    }
  };

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      scale: 0.8,
      y: 50,
      opacity: 0,
      rotateX: -15,
    },
    visible: {
      scale: 1,
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.5,
      },
    },
    exit: {
      scale: 0.8,
      y: 50,
      opacity: 0,
      rotateX: 15,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300,
        delay: 0.2,
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3,
        duration: 0.4,
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ perspective: "1000px" }}
        >
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Enhanced Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative ${config.width} bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden`}
          >
            {/* Gradient Header */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${variantStyles.headerGradient}`}
            />

            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-indigo-50/30 dark:from-gray-800/30 dark:via-transparent dark:to-indigo-900/20 pointer-events-none" />

            <div className={config.padding}>
              {/* Header Section */}
              <div className="flex items-start justify-between relative">
                <div className="flex items-center flex-1">
                  {/* Enhanced Icon */}
                  <motion.div
                    variants={iconVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${variantStyles.iconBg} ring-2 ring-white/50 dark:ring-gray-800/50 shadow-lg`}
                  >
                    {customIcon || (
                      <FiAlertTriangle
                        className={`h-6 w-6 ${variantStyles.iconColor}`}
                      />
                    )}
                  </motion.div>

                  {/* Title and Description */}
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    className="ml-4 flex-1"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {customTitle || "Sign out"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {customMessage || "Are you sure you want to sign out?"}
                    </p>
                  </motion.div>
                </div>

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="ml-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                >
                  <FiX className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Warning Content */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className={config.spacing}
              >
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                  <div className="flex items-start">
                    <FiShield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                        Security Notice
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        You'll need to sign in again to access your account. Any
                        unsaved changes may be lost.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Session Info */}
              {showSessionInfo && (
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FiClock className="h-4 w-4 mr-2" />
                    <span>Session will be terminated securely</span>
                  </div>
                </motion.div>
              )}

              {/* Timer Display */}
              {showTimer && autoCloseDelay && timeLeft > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 text-center"
                >
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm font-medium">
                    Auto-signout in {timeLeft}s
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className={`${config.spacing} flex justify-end space-x-3`}
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${variantStyles.confirmButton} text-sm font-medium text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:${variantStyles.ringColor} flex items-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden`}
                >
                  {/* Loading spinner */}
                  {isProcessing && (
                    <motion.div
                      className="absolute inset-0 bg-white/20 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </motion.div>
                  )}

                  <motion.div
                    className="flex items-center"
                    animate={{ opacity: isProcessing ? 0 : 1 }}
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </motion.div>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SignoutModal;
