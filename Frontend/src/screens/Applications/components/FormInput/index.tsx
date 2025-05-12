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
  const inputClass = `w-full px-4 py-3 rounded-lg border ${
    error ? "border-red-500" : "border-gray-300"
  } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${className}`;

  const registerOptions = {
    required,
    ...(type === "number" && { valueAsNumber: true }),
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
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
        <p className="mt-1 text-sm text-red-600">
          {error.type === "required"
            ? "This field is required"
            : error.message || "Invalid input"}
        </p>
      )}
    </div>
  );
};
