import React from "react";
import { motion } from "framer-motion";

interface ButtonGroupProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  currentStep: number;
  totalSteps: number;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  isSavingDraft,
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="flex justify-between mt-8">
      <div>
        {onSaveDraft && (
          <motion.button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            whileHover={{ scale: isSavingDraft || isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSavingDraft || isSubmitting ? 1 : 0.98 }}
            className={`px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600/50 transition-all border border-gray-300/50 dark:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 flex items-center space-x-2 ${
              (isSavingDraft || isSubmitting) ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSavingDraft ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600 dark:text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Save Draft
              </>
            )}
          </motion.button>
        )}
      </div>

      <div className="flex space-x-4">
        {onPrevious && (
          <motion.button
            type="button"
            onClick={onPrevious}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600/50 transition-all border border-gray-300/50 dark:border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Previous
          </motion.button>
        )}

        {currentStep < totalSteps - 1 ? (
          <motion.button
            type="button"
            onClick={onNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-500 dark:to-blue-500 dark:hover:from-indigo-600 dark:hover:to-blue-600 text-white font-medium transition-all shadow-lg hover:shadow-xl dark:shadow-gray-900/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Continue
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={onSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-medium transition-all shadow-lg hover:shadow-xl dark:shadow-gray-900/20 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>s
                Submitting...
              </span>
            ) : (
              "Submit Application"
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ButtonGroup;
