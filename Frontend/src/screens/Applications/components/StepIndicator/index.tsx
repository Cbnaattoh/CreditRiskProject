import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiLock } from "react-icons/fi";

interface Step {
  label: string;
  isActive: boolean;
  isCompleted?: boolean;
  isDisabled?: boolean;
  subtitle?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  variant?: "default" | "minimal" | "premium";
  size?: "sm" | "md" | "lg";
  showConnector?: boolean;
  allowClickNavigation?: boolean;
  className?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  setCurrentStep,
  variant = "premium",
  size = "md",
  showConnector = true,
  allowClickNavigation = true,
  className = "",
}) => {
  // Memoized calculations for performance
  const progressPercentage = useMemo(() => {
    if (steps.length <= 1) return 0;
    return (currentStep / (steps.length - 1)) * 100;
  }, [currentStep, steps.length]);

  const completedSteps = useMemo(() => {
    return steps.filter((step) => step.isCompleted).length;
  }, [steps]);

  // Size configurations
  const sizeConfig = {
    sm: {
      circle: "w-6 h-6",
      font: "text-xs",
      labelFont: "text-xs",
      spacing: "mt-1.5",
      connector: "h-0.5",
    },
    md: {
      circle: "w-10 h-10",
      font: "text-sm",
      labelFont: "text-sm",
      spacing: "mt-2.5",
      connector: "h-1",
    },
    lg: {
      circle: "w-12 h-12",
      font: "text-base",
      labelFont: "text-base",
      spacing: "mt-3",
      connector: "h-1.5",
    },
  };

  const config = sizeConfig[size];

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const stepVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  const handleStepClick = (index: number) => {
    if (!allowClickNavigation) return;

    const step = steps[index];
    if (step.isDisabled) return;

    // Only allow navigation to completed steps or adjacent steps
    if (step.isCompleted || Math.abs(index - currentStep) <= 1) {
      setCurrentStep(index);
    }
  };

  const getStepStyles = (step: Step, index: number) => {
    const isClickable =
      allowClickNavigation &&
      !step.isDisabled &&
      (step.isCompleted || Math.abs(index - currentStep) <= 1);

    if (step.isActive) {
      return {
        circle: `bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-500 text-white shadow-xl shadow-indigo-500/25 dark:shadow-indigo-400/25 ring-4 ring-indigo-500/20 dark:ring-indigo-400/20 ring-offset-2 ring-offset-white dark:ring-offset-gray-900`,
        label: "text-indigo-600 dark:text-indigo-400 font-semibold",
        subtitle: "text-indigo-500 dark:text-indigo-300",
      };
    }

    if (step.isCompleted) {
      return {
        circle: `bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-400/20 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20 ring-offset-1 ring-offset-white dark:ring-offset-gray-900`,
        label: "text-emerald-600 dark:text-emerald-400 font-medium",
        subtitle: "text-emerald-500 dark:text-emerald-300",
      };
    }

    if (step.isDisabled) {
      return {
        circle: `bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-700`,
        label: "text-gray-400 dark:text-gray-500",
        subtitle: "text-gray-300 dark:text-gray-600",
      };
    }

    return {
      circle: `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 shadow-sm ${
        isClickable
          ? "hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/10 dark:hover:shadow-indigo-400/10"
          : ""
      }`,
      label: `text-gray-600 dark:text-gray-300 ${
        isClickable
          ? "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
          : ""
      }`,
      subtitle: `text-gray-500 dark:text-gray-400 ${
        isClickable
          ? "group-hover:text-indigo-500 dark:group-hover:text-indigo-300"
          : ""
      }`,
    };
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={`relative ${className}`}
    >
      {/* Progress Statistics */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Progress: {completedSteps}/{steps.length} completed
          </div>
          <div className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>

      {/* Main Step Container */}
      <div className="flex justify-between items-start relative">
        {/* Enhanced Progress Connector */}
        {showConnector && (
          <div
            className={`absolute top-5 left-0 right-0 ${config.connector} z-0`}
          >
            {/* Background track */}
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />

            {/* Animated progress fill */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-500 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1],
                delay: 0.2,
              }}
            />

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 2,
              }}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Step Items */}
        {steps.map((step, index) => {
          const styles = getStepStyles(step, index);
          const isClickable =
            allowClickNavigation &&
            !step.isDisabled &&
            (step.isCompleted || Math.abs(index - currentStep) <= 1);

          return (
            <motion.div
              key={index}
              variants={stepVariants}
              className={`group flex flex-col items-center relative z-10 ${
                isClickable ? "cursor-pointer" : "cursor-default"
              }`}
              onClick={() => handleStepClick(index)}
              whileHover={isClickable ? { scale: 1.05 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
            >
              {/* Step Circle */}
              <motion.div
                className={`${config.circle} ${styles.circle} flex items-center justify-center rounded-full font-semibold transition-all duration-300 relative overflow-hidden`}
                whileHover={isClickable ? { scale: 1.1 } : {}}
                layout
              >
                {/* Background glow effect */}
                {step.isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 opacity-20 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Step Content */}
                <AnimatePresence mode="wait">
                  {step.isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FiCheck
                        className={
                          size === "sm"
                            ? "h-3 w-3"
                            : size === "lg"
                            ? "h-6 w-6"
                            : "h-4 w-4"
                        }
                      />
                    </motion.div>
                  ) : step.isDisabled ? (
                    <motion.div
                      key="lock"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <FiLock
                        className={
                          size === "sm"
                            ? "h-3 w-3"
                            : size === "lg"
                            ? "h-5 w-5"
                            : "h-4 w-4"
                        }
                      />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="number"
                      className={`${config.font} font-semibold`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      {index + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Step Label */}
              <motion.div
                className={`${config.spacing} text-center max-w-24`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <p
                  className={`${config.labelFont} font-medium transition-colors duration-200 ${styles.label}`}
                >
                  {step.label}
                </p>
                {step.subtitle && (
                  <p
                    className={`text-xs mt-1 transition-colors duration-200 ${styles.subtitle}`}
                  >
                    {step.subtitle}
                  </p>
                )}
              </motion.div>

              {/* Active step indicator */}
              {step.isActive && (
                <motion.div
                  className="absolute -bottom-2 w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 rounded-full shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <motion.div
        className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {steps[currentStep]?.label}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StepIndicator;
