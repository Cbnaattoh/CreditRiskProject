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
} from "react-icons/fi";
import { ANIMATION_VARIANTS } from "./constants";
import type { ActiveTab } from "./types";
import { useRegisterMutation } from "../../../../components/redux/features/auth/authApi";
import { useToast } from "../../../../components/utils/Toast";
import type { RegisterCredentials } from "../../../../components/redux/features/auth/authApi";

interface RegisterFormProps {
  registerMethods: UseFormReturn<any>;
  setActiveTab: (tab: ActiveTab) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  registerMethods,
  setActiveTab,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();
  const { success, error } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      if (data.password !== data.confirm_password) {
        registerMethods.setError("confirm_password", {
          type: "manual",
          message: "Passwords do not match",
        });
        return;
      }

      const credentials: RegisterCredentials = {
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

      console.log("Submitting credentials:", {
        first_name: credentials.first_name,
        email: credentials.email,
        profile_picture: credentials.profile_picture?.name || "None",
        password: "***",
      });

      const result = await register(credentials).unwrap();
      success(result.message || "Account created successfully!");

      if (result.requiresVerification) {
        success("Please check your email to verify your account.");
      }

      if (result.access && result.user) {
        setTimeout(() => {
          window.location.href = "/home";
        }, 2000);
      } else {
        setTimeout(() => {
          setActiveTab("login");
          success(
            "Registration successful! You can now log in with your credentials."
          );
        }, 1500);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.status === 400 && err.data?.errors) {
        const errors = err.data.errors;

        Object.keys(errors).forEach((field) => {
          const errorMessages = errors[field];

          const fieldMapping: Record<string, string> = {
            terms_accepted: "terms_accepted",
            mfa_enabled: "mfa_enabled",
            first_name: "first_name",
            last_name: "last_name",
            phone_number: "phone_number",
            confirm_password: "confirm_password",
            user_type: "user_type",
            profile_picture: "profile_picture",
          };

          const frontendField = fieldMapping[field] || field;

          if (Array.isArray(errorMessages)) {
            registerMethods.setError(frontendField as any, {
              type: "manual",
              message: errorMessages[0],
            });
          } else if (typeof errorMessages === "string") {
            registerMethods.setError(frontendField as any, {
              type: "manual",
              message: errorMessages,
            });
          }
        });

        error("Please fix the errors below and try again.");
      } else if (err.status === 409) {
        const errorMessage =
          err.data?.detail || "User with this email already exists.";
        registerMethods.setError("email", {
          type: "manual",
          message: errorMessage,
        });
        error(errorMessage);
      } else if (err.status === 500) {
        error("Server error occurred. Please try again later.");
      } else if (
        err.data &&
        typeof err.data === "string" &&
        err.data.includes("JSON parse error")
      ) {
        error(
          "There was an issue processing your profile picture. Please try with a different image or without an image."
        );
        registerMethods.setError("profilePicture", {
          type: "manual",
          message:
            "Please try with a different image or remove the profile picture.",
        });
      } else {
        const errorMessage =
          err?.data?.detail ||
          err?.data?.message ||
          err?.message ||
          "Registration failed. Please try again.";

        error(errorMessage);
        registerMethods.setError("root", {
          type: "manual",
          message: errorMessage,
        });
      }
    }
  };

  return (
    <FormProvider {...registerMethods}>
      <motion.div
        key="register"
        {...ANIMATION_VARIANTS.formSlide}
        className="w-full"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Create Account
        </h2>
        <p className="text-gray-600 mb-8">
          Join our platform to access advanced credit risk analysis tools.
        </p>

        {registerMethods.formState.errors.root && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start"
          >
            <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
            <div>{registerMethods.formState.errors.root.message}</div>
          </motion.div>
        )}

        <form
          onSubmit={registerMethods.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                First Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...registerMethods.register("first_name", {
                    required: "First name is required",
                  })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                  placeholder="John"
                />
                <FiUser className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {registerMethods.formState.errors.first_name && (
                <p className="text-red-500 text-xs mt-1">
                  {registerMethods.formState.errors.first_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Last Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...registerMethods.register("last_name", {
                    required: "Last name is required",
                  })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                  placeholder="Doe"
                />
                <FiUser className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {registerMethods.formState.errors.last_name && (
                <p className="text-red-500 text-xs mt-1">
                  {registerMethods.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                {...registerMethods.register("email")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                placeholder="your@email.com"
              />
              <FiMail className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            {registerMethods.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {registerMethods.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                {...registerMethods.register("phone_number")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                placeholder="+1 (555) 123-4567"
              />
              <FiPhone className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            {registerMethods.formState.errors.phone_number && (
              <p className="text-red-500 text-xs mt-1">
                {registerMethods.formState.errors.phone_number.message}
              </p>
            )}
          </div>

          {/* Account Security */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...registerMethods.register("password")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10 pr-10"
                placeholder="••••••••"
              />
              <FiLock className="absolute left-3 top-3.5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li className="flex items-center">
                <FiCheck className="mr-1 text-green-500" /> At least 8
                characters
              </li>
              <li className="flex items-center">
                <FiCheck className="mr-1 text-green-500" /> One uppercase letter
              </li>
              <li className="flex items-center">
                <FiCheck className="mr-1 text-green-500" /> One number
              </li>
              <li className="flex items-center">
                <FiCheck className="mr-1 text-green-500" /> One special
                character
              </li>
            </ul>
            {registerMethods.formState.errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {registerMethods.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...registerMethods.register("confirm_password")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10 pr-10"
                placeholder="••••••••"
              />
              <FiLock className="absolute left-3 top-3.5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {registerMethods.formState.errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">
                {registerMethods.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* Profile Details */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Profile Picture
            </label>
            <div className="relative">
              <input
                type="file"
                {...registerMethods.register("profile_picture")}
                accept="image/*"
                className="w-full px-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <FiImage className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              User Type *
            </label>
            <select
              {...registerMethods.register("user_type")}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
              defaultValue="User"
            >
              <option value="ADMIN">Administrator</option>
              <option value="CLIENT">Client User</option>
              <option value="AUDITOR">Compliance Auditor</option>
              <option value="ANALYST">Risk Analyst</option>
            </select>
            {registerMethods.formState.errors.user_type && (
              <p className="text-red-500 text-xs mt-1">
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
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="mfa" className="ml-2 block text-sm text-gray-700">
                Enable Multi-Factor Authentication (MFA)
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                {...registerMethods.register("terms_accepted")}
                id="terms"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700"
              >
                I agree to the{" "}
                <a href="#" className="text-indigo-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-indigo-600 hover:underline">
                  Privacy Policy
                </a>{" "}
                *
              </label>
            </div>
            {registerMethods.formState.errors.terms_accepted && (
              <p className="text-red-500 text-xs ml-6">
                {registerMethods.formState.errors.terms_accepted.message}
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-indigo-600 hover:underline font-medium"
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
