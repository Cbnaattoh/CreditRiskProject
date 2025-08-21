import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ValidationIndicatorProps {
  isValid: boolean;
  errorCount: number;
  showDetails?: boolean;
  className?: string;
}

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  isValid,
  errorCount,
  showDetails = true,
  className = ""
}) => {
  if (isValid) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 dark:text-green-400 ${className}`}>
        <CheckCircle className="w-5 h-5" />
        {showDetails && <span className="text-sm font-medium">All fields valid</span>}
      </div>
    );
  }

  if (errorCount > 0) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 dark:text-red-400 ${className}`}>
        <AlertCircle className="w-5 h-5" />
        {showDetails && (
          <span className="text-sm font-medium">
            {errorCount} validation error{errorCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-blue-600 dark:text-blue-400 ${className}`}>
      <Info className="w-5 h-5" />
      {showDetails && <span className="text-sm font-medium">Start filling the form</span>}
    </div>
  );
};

interface ValidationSummaryProps {
  steps: Array<{
    name: string;
    isValid: boolean;
    errorCount: number;
    isActive: boolean;
    isCompleted: boolean;
  }>;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  steps,
  className = ""
}) => {
  const totalErrors = steps.reduce((sum, step) => sum + step.errorCount, 0);
  const completedSteps = steps.filter(step => step.isCompleted && step.isValid).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Validation Status
        </h3>
        <ValidationIndicator 
          isValid={totalErrors === 0} 
          errorCount={totalErrors} 
          showDetails={false}
        />
      </div>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div 
            key={step.name}
            className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
              step.isActive 
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                : step.isCompleted && step.isValid
                ? 'bg-green-50 dark:bg-green-900/20'
                : step.errorCount > 0
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <span className={`text-sm font-medium ${
              step.isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {index + 1}. {step.name}
            </span>
            
            <ValidationIndicator 
              isValid={step.isCompleted && step.isValid} 
              errorCount={step.errorCount} 
              showDetails={false}
              className="text-xs"
            />
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Progress: {completedSteps}/{steps.length} steps completed</span>
          {totalErrors > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {totalErrors} error{totalErrors > 1 ? 's' : ''} to fix
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationIndicator;