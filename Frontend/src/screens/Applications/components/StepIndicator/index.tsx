import React from "react";
import { motion } from "framer-motion";
import { FiCheck } from "react-icons/fi";

interface Step {
  label: string;
  isActive: boolean;
  isCompleted?: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  setCurrentStep,
}) => {
  return (
    <div className="flex justify-between relative mb-8">
      {/* Progress line */}
      <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 z-0">
        <motion.div
          className="absolute top-0 left-0 h-full bg-indigo-600"
          initial={{ width: 0 }}
          animate={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {steps.map((step, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.05 }}
          className="flex flex-col items-center relative z-10 cursor-pointer"
          onClick={() => setCurrentStep(index)}
        >
          <motion.div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step.isActive
                ? "bg-indigo-600 text-white"
                : step.isCompleted
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600"
            } transition-colors`}
            whileHover={{ scale: 1.1 }}
          >
            {step.isCompleted ? (
              <FiCheck className="h-4 w-4" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </motion.div>
          <motion.p
            className={`text-xs font-medium mt-2 ${
              step.isActive
                ? "text-indigo-600"
                : step.isCompleted
                ? "text-green-600"
                : "text-gray-500"
            } transition-colors`}
          >
            {step.label}
          </motion.p>
        </motion.div>
      ))}
    </div>
  );
};

export default StepIndicator;
