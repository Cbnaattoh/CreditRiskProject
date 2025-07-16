import type { UseFormRegister, FieldError } from "react-hook-form";
import type { FormData } from "../types";

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
  min?: number;
  max?: number;
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
}: FormInputProps) => {
  const inputClass = `w-full px-4 py-3 rounded-xl border ${
    error 
      ? "border-red-500 dark:border-red-500" 
      : "border-gray-300 dark:border-gray-700"
  } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 ${className}`;

  const registerOptions = {
    required,
    ...(type === "number" && { valueAsNumber: true }),
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      {type === "select" ? (
        <select
          {...register(name, { required })}
          className={inputClass}
          defaultValue=""
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
        />
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