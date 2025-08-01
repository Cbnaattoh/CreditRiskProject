import React, { useState } from "react";
import { motion } from "framer-motion";
import { FormProvider } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import {
  FiLock,
  FiCheck,
  FiUser,
  FiMail,
  FiPhone,
  FiImage,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiAlertCircle,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import { ANIMATION_VARIANTS } from "./constants";
import type { ActiveTab } from "./types";
import { useRegisterMutation } from "../../../../components/redux/features/auth/authApi";
import type { RegisterRequest } from "../../../../components/redux/features/user/types/user";
import { useAppDispatch } from "../../../../components/utils/hooks";
import { setCredentials } from "../../../../components/redux/features/auth/authSlice";
import type { User } from "../../../../components/redux/features/auth/authApi";

interface RegisterFormProps {
  registerMethods: UseFormReturn<any>;
  setActiveTab: (tab: ActiveTab) => void;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  registerMethods,
  setActiveTab,
  showSuccessToast,
  showErrorToast,
}) => {
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [register, { isLoading }] = useRegisterMutation();

  const PASSWORD_REQUIREMENTS = [
    { key: "length", label: "At least 8 characters", regex: /.{8,}/ },
    { key: "uppercase", label: "One uppercase letter", regex: /[A-Z]/ },
    { key: "number", label: "One number", regex: /\d/ },
    {
      key: "special",
      label: "One special character",
      regex: /[!@#$%^&*(),.?":{}|<>]/,
    },
  ];

  const passwordStrength = {
    score: PASSWORD_REQUIREMENTS.filter((req) => req.regex.test(password))
      .length,
    requirements: PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      met: req.regex.test(password),
    })),
  };

  const handleSubmit = async (data: any) => {
    try {
      if (data.password !== data.confirm_password) {
        registerMethods.setError("confirm_password", {
          type: "manual",
          message: "Passwords do not match",
        });
        return;
      }

      const credentials: RegisterRequest = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone_number || "",
        password: data.password,
        confirm_password: data.confirm_password,
        user_type: data.user_type,
        mfa_enabled: data.mfa_enabled || false,
        terms_accepted: data.terms_accepted || false,
        profile_picture: data.profile_picture?.[0] || undefined,
      };

      const result = await register(credentials).unwrap();
      console.log("🔎 Registration response:", result);

      if (result?.access && result?.refresh) {
        const user: User = {
          id: result.id!,
          email: result.email!,
          name: `${result.first_name} ${result.last_name}`.trim(),
          role: result.user_type!,
          is_verified: result.is_verified,
        };

        dispatch(
          setCredentials({
            user,
            token: result.access,
            refreshToken: result.refresh,
          })
        );

        showSuccessToast(result.message || "Account created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = "/home";
        }, 2000);
        return;
      }
      if (result?.requiresVerification) {
        showSuccessToast(
          result.message ||
            "Registration successful! Please check your email to verify your account. Redirecting to login..."
        );
        setTimeout(() => {
          setActiveTab("login");
        }, 2500);
        return;
      }

      if ((result as any)?.errors) {
        showErrorToast("Registration failed. Please check your inputs.");
        return;
      }

      // Fallback for other successful registration cases
      showSuccessToast(
        result.message || "Registration successful! Please log in to continue."
      );
      setTimeout(() => {
        setActiveTab("login");
      }, 2000);
    } catch (err: any) {
      console.error("Registration error:", err);

      // Create more descriptive error messages
      let errorMessage = "Registration failed. Please try again.";

      if (err.status === 400) {
        if (err.data?.errors) {
          // Handle field-specific errors
          const errors = err.data.errors;
          const firstError = Object.values(errors)[0];
          const firstErrorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          errorMessage = `Registration failed: ${firstErrorMessage}`;
        } else {
          errorMessage = err.data?.detail || "Invalid registration data. Please check your input and try again.";
        }
      } else if (err.status === 409) {
        errorMessage = "An account with this email already exists. Please use a different email or try logging in.";
      } else if (err.status === 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (
        err.data &&
        typeof err.data === "string" &&
        err.data.includes("JSON parse error")
      ) {
        errorMessage = "There was an issue processing your profile picture. Please try with a different image or without an image.";
      } else {
        errorMessage = err?.data?.detail || err?.data?.message || "Registration failed. Please try again.";
      }

      // Only show toast message, no form errors
      showErrorToast(errorMessage);
    }
  };

  return (
    <FormProvider {...registerMethods}>
      <motion.div
        key="register"
        {...ANIMATION_VARIANTS.formSlide}
        className="w-full"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Create Account
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Join our platform to access advanced credit risk analysis tools.
        </p>


        <form
          onSubmit={registerMethods.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                First Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...registerMethods.register("first_name", {
                    required: "First name is required",
                    minLength: {
                      value: 2,
                      message: "Must be at least 2 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Cannot exceed 50 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z\s'-]+$/,
                      message: "Contains invalid characters",
                    },
                  })}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    registerMethods.formState.errors.first_name
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 pl-10 ${
                    isLoading ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                  placeholder="John"
                />
                <FiUser className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
              </div>
              {registerMethods.formState.errors.first_name && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                  <FiX className="mr-1" />
                  {registerMethods.formState.errors.first_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                Last Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...registerMethods.register("last_name", {
                    required: "Last name is required",
                    minLength: {
                      value: 2,
                      message: "Must be at least 2 characters",
                    },
                    maxLength: {
                      value: 50,
                      message: "Cannot exceed 50 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z\s'-]+$/,
                      message: "Contains invalid characters",
                    },
                  })}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    registerMethods.formState.errors.last_name
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 pl-10 ${
                    isLoading ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                  placeholder="Doe"
                />
                <FiUser className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
              </div>
              {registerMethods.formState.errors.last_name && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                  <FiX className="mr-1" />
                  {registerMethods.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                {...registerMethods.register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl border ${
                  registerMethods.formState.errors.email
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-700"
                } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 pl-10 ${
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                placeholder="your@email.com"
              />
              <FiMail className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
            </div>
            {registerMethods.formState.errors.email && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                <FiX className="mr-1" />
                {registerMethods.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                {...registerMethods.register("phone_number", {
                  pattern: {
                    value: /^[\+]?[1-9][\d]{0,15}$/,
                    message: "Invalid phone number",
                  },
                })}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl border ${
                  registerMethods.formState.errors.phone_number
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-700"
                } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 pl-10 ${
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                placeholder="+1 (555) 123-4567"
              />
              <FiPhone className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
            </div>
            {registerMethods.formState.errors.phone_number && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                <FiX className="mr-1" />
                {registerMethods.formState.errors.phone_number.message}
              </p>
            )}
          </div>

          {/* Account Security */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...registerMethods.register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Must be at least 8 characters",
                  },
                  maxLength: {
                    value: 50,
                    message: "Cannot exceed 50 characters",
                  },
                  pattern: {
                    value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
                    message:
                      "Must contain uppercase, number, and special character",
                  },
                })}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  registerMethods.formState.errors.password
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-700"
                } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 pl-10 pr-10 ${
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                placeholder="••••••••"
              />
              <FiLock className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                disabled={isLoading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center mb-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength.score <= 2
                          ? "bg-red-500"
                          : passwordStrength.score <= 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${(passwordStrength.score / 4) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                    {passwordStrength.score <= 2
                      ? "Weak"
                      : passwordStrength.score <= 3
                      ? "Medium"
                      : "Strong"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {passwordStrength.requirements.map((req) => (
                    <div key={req.key} className="flex items-center text-xs">
                      {req.met ? (
                        <FiCheck className="mr-2 text-green-500 dark:text-green-400" />
                      ) : (
                        <FiX className="mr-2 text-red-500 dark:text-red-400" />
                      )}
                      <span
                        className={
                          req.met
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {registerMethods.formState.errors.password && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                <FiX className="mr-1" />
                {registerMethods.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...registerMethods.register("confirm_password", {
                  required: "Please confirm your password",
                })}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl border ${
                  registerMethods.formState.errors.confirm_password
                    ? "border-red-500 dark:border-red-500"
                    : registerMethods.watch("confirm_password") &&
                      registerMethods.watch("confirm_password") ===
                        registerMethods.watch("password")
                    ? "border-green-500 dark:border-green-500"
                    : "border-gray-300 dark:border-gray-700"
                } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 pl-10 pr-10 ${
                  isLoading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                placeholder="••••••••"
              />
              <FiLock className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                disabled={isLoading}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
              {registerMethods.watch("confirm_password") &&
                registerMethods.watch("confirm_password") ===
                  registerMethods.watch("password") && (
                  <FiCheckCircle className="absolute right-10 top-3.5 text-green-500 dark:text-green-400" />
                )}
            </div>
            {registerMethods.formState.errors.confirm_password && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                <FiX className="mr-1" />
                {registerMethods.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* Profile Details */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              {profilePreview && (
                <div className="relative">
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePreview(null);
                      registerMethods.setValue("profile_picture", undefined);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    disabled={isLoading}
                  >
                    <FiX size={12} />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="file"
                    {...registerMethods.register("profile_picture", {
                      onChange: (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) =>
                            setProfilePreview(event.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      },
                    })}
                    accept="image/*"
                    disabled={isLoading}
                    className={`w-full px-10 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-gray-700 dark:file:text-indigo-300 dark:hover:file:bg-gray-600 ${
                      isLoading ? "opacity-80 cursor-not-allowed" : ""
                    } bg-white dark:bg-gray-800/50 backdrop-blur-sm`}
                  />
                  <FiImage className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
                {registerMethods.formState.errors.profile_picture && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                    <FiX className="mr-1" />
                    {registerMethods.formState.errors.profile_picture.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              User Type *
            </label>
            <select
              {...registerMethods.register("user_type", {
                required: "Please select a user type",
              })}
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-xl border ${
                registerMethods.formState.errors.user_type
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600 ${
                isLoading ? "opacity-80 cursor-not-allowed" : ""
              }`}
              defaultValue="CLIENT"
            >
              <option value="CLIENT">Client User</option>
              <option value="AUDITOR">Compliance Auditor</option>
              <option value="ANALYST">Risk Analyst</option>
            </select>
            {registerMethods.formState.errors.user_type && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center">
                <FiX className="mr-1" />
                {registerMethods.formState.errors.user_type.message}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...registerMethods.register("mfa_enabled")}
                id="mfa"
                disabled={isLoading}
                className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-gray-300 dark:border-gray-600 rounded ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <label
                htmlFor="mfa"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Request Multi-Factor Authentication (MFA) Setup
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  You'll complete MFA setup after registration for enhanced security
                </span>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                {...registerMethods.register("terms_accepted", {
                  required: "You must accept the terms and conditions",
                })}
                id="terms"
                disabled={isLoading}
                className={`h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-gray-300 dark:border-gray-600 rounded mt-0.5 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>{" "}
                *
              </label>
            </div>
            {registerMethods.formState.errors.terms_accepted && (
              <p className="text-red-600 dark:text-red-400 text-xs ml-6 flex items-center">
                <FiX className="mr-1" />
                {registerMethods.formState.errors.terms_accepted.message}
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </motion.button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                disabled={isLoading}
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </FormProvider>
  );
};

export default RegisterForm;
