import React from "react";
import type { UseFormRegister, FieldError } from "react-hook-form";
import type { FormData } from "../types";
import { FiInfo } from "react-icons/fi";
import Tooltip from "../../../../components/common/Tooltip";

type FormInputProps = {
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
};

export const FormInput = ({
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
}: FormInputProps) => {
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

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
        {tooltip && (
          <Tooltip 
            content={tooltip} 
            type="help" 
            position="top"
            maxWidth="max-w-sm"
            delay={200}
          />
        )}
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
      {helperText && (
        <div className="mt-2 flex items-start gap-2">
          <FiInfo className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {helperText}
          </p>
        </div>
      )}
      {example && (
        <div className="mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            <span className="font-medium">Example:</span> {example}
          </p>
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error.type === "required"
            ? "This field is required"
            : error.message || "Invalid input"}
        </p>
      )}
    </div>
  );
};