import React from "react";
import type { UseFormRegister, FieldError } from "react-hook-form";
import type { FormData } from "../types";
import { FiInfo } from "react-icons/fi";
import Tooltip from "../../../../components/common/Tooltip";
import EnhancedHelperContent from "../../../../components/common/EnhancedHelperContent";
import { getEnhancedFieldHelper } from "../../../../data/enhancedFormHelpers";

type EnhancedFormInputProps = {
  label: string;
  name: keyof FormData;
  type?: "text" | "number" | "email" | "tel" | "date" | "select";
  required?: boolean;
  register: UseFormRegister<FormData>;
  error?: FieldError;
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  min?: number | string;
  max?: number | string;
  step?: string;
  disabled?: boolean;
  helperText?: string;
  tooltip?: string;
  example?: string;
  useEnhancedHelper?: boolean;
};

export const EnhancedFormInput = ({
  label,
  name,
  type = "text",
  required = false,
  register,
  error,
  options,
  placeholder,
  className = "",
  min,
  max,
  step,
  disabled = false,
  helperText,
  tooltip,
  example,
  useEnhancedHelper = true,
}: EnhancedFormInputProps) => {
  const inputClass = `w-full px-4 py-3 rounded-xl border ${
    error 
      ? "border-red-500 dark:border-red-500" 
      : disabled
        ? "border-gray-200 dark:border-gray-600"
        : "border-gray-300 dark:border-gray-700"
  } ${
    disabled 
      ? "bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
      : "bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600"
  } placeholder-gray-400 dark:placeholder-gray-500 ${
    disabled 
      ? "" 
      : "focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
  } transition-all ${className}`;

  const registerOptions = {
    required,
    ...(type === "number" && { valueAsNumber: true }),
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
  };

  // Get enhanced helper data if available
  const enhancedHelper = useEnhancedHelper ? getEnhancedFieldHelper(name) : null;

  // Debug logging
  if (useEnhancedHelper && process.env.NODE_ENV === 'development') {
    console.log(`Field: ${name}, has helper:`, !!enhancedHelper, enhancedHelper?.title);
  }

  const renderHelper = () => {
    if (enhancedHelper) {
      return (
        <EnhancedHelperContent
          title={enhancedHelper.title}
          sections={enhancedHelper.sections}
          position="bottom"
          maxWidth="max-w-4xl"
          className="relative z-20"
        />
      );
    } else if (tooltip) {
      return (
        <Tooltip 
          content={tooltip} 
          type="help" 
          position="top"
          maxWidth="max-w-sm"
          delay={200}
        />
      );
    }
    return null;
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
        {renderHelper()}
      </div>
      
      {type === "select" ? (
        <select
          {...register(name, { required })}
          className={inputClass}
          defaultValue=""
          disabled={disabled}
        >
          <option value="" disabled>
            Select...
          </option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          {...register(name, registerOptions)}
          className={inputClass}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
      )}

      {/* Enhanced helper text with better styling */}
      {helperText && (
        <div className="mt-2 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/30">
          <FiInfo className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            {helperText}
          </p>
        </div>
      )}

      {/* Enhanced example with better formatting */}
      {example && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Example:</span> 
            <span className="ml-1 font-mono">{example}</span>
          </p>
        </div>
      )}

      {/* Error message with enhanced styling */}
      {error && (
        <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700/30">
          <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {error.type === "required"
              ? "This field is required"
              : error.message || "Invalid input"}
          </p>
        </div>
      )}
    </div>
  );
};