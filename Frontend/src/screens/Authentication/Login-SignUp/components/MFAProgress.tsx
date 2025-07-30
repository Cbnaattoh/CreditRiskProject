import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiShield, FiKey, FiSave } from 'react-icons/fi';

interface MFAProgressProps {
  currentStep: 'setup' | 'verify' | 'backup';
  className?: string;
}

export const MFAProgress: React.FC<MFAProgressProps> = ({ 
  currentStep, 
  className = '' 
}) => {
  const steps = [
    {
      id: 'setup',
      title: 'Scan QR Code',
      description: 'Set up authenticator',
      icon: FiKey,
    },
    {
      id: 'verify',
      title: 'Verify Code',
      description: 'Enter first code',
      icon: FiShield,
    },
    {
      id: 'backup',
      title: 'Save Codes',
      description: 'Backup codes',
      icon: FiSave,
    },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className={`flex justify-between items-center ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isUpcoming = index > currentStepIndex;

        return (
          <div key={step.id} className="flex flex-col items-center flex-1">
            {/* Step Circle */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ 
                scale: isCurrent ? 1.1 : 1, 
                opacity: isUpcoming ? 0.4 : 1 
              }}
              className={`
                relative w-12 h-12 rounded-full border-2 flex items-center justify-center mb-3
                ${isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isCurrent
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }
              `}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <FiCheck className="w-5 h-5" />
                </motion.div>
              ) : (
                <step.icon className="w-5 h-5" />
              )}
              
              {/* Pulse animation for current step */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-500"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              )}
            </motion.div>

            {/* Step Text */}
            <div className="text-center">
              <p className={`text-sm font-medium ${
                isCompleted || isCurrent 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {step.title}
              </p>
              <p className={`text-xs ${
                isCompleted || isCurrent 
                  ? 'text-gray-600 dark:text-gray-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {step.description}
              </p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute top-6 left-1/2 w-full h-0.5 -z-10">
                <div
                  className={`h-full transition-colors duration-500 ${
                    index < currentStepIndex 
                      ? 'bg-green-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{
                    marginLeft: '3rem',
                    marginRight: '3rem',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};