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
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        registerMethods.setError("confirmPassword", {
          type: "manual",
          message: "Passwords do not match",
        });
        return;
      }

      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || "",
        password: data.password,
        confirmPassword: data.confirmPassword,
        userType: data.userType,
        mfaEnabled: data.enableMFA || false,
        termsAccepted: data.acceptTerms,
        profilePicture: data.profilePicture?.[0] || null,
      };

      console.log("Submitting registration data:", {
        ...registrationData,
        profilePicture: registrationData.profilePicture
          ? "File selected"
          : "No file",
        password: "***",
        confirmPassword: "***",
      });

      // Register user with all data including profile picture
      const result = await register(registrationData).unwrap();

      // Handle successful registration
      success(result.message || "Account created successfully!");

      if (result.requiresVerification) {
        success("Please check your email to verify your account.");
      }

      // Check if user is logged in automatically after registration
      if (result.token && result.user) {
        // Auto-login successful
        setTimeout(() => {
          window.location.href = "/home";
        }, 2000);
      } else {
        // Registration successful but no auto-login, redirect to login
        setTimeout(() => {
          setActiveTab("login");
          success(
            "Registration successful! You can now log in with your credentials."
          );
        }, 1500);
      }
    } catch (err: any) {
      console.error("Registration error:", err);

      // Handle different types of errors
      if (err.status === 400 && err.data?.errors) {
        // Handle validation errors from the backend
        const errors = err.data.errors;

        Object.keys(errors).forEach((field) => {
          const errorMessages = errors[field];

          // Map backend field names to frontend field names
          const fieldMapping: Record<string, string> = {
            terms_accepted: "acceptTerms",
            mfa_enabled: "enableMFA",
            first_name: "firstName",
            last_name: "lastName",
            phone_number: "phoneNumber",
            confirm_password: "confirmPassword",
            user_type: "userType",
            profile_picture: "profilePicture",
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
        // Handle conflict
        const errorMessage =
          err.data?.detail || "User with this email already exists.";
        registerMethods.setError("email", {
          type: "manual",
          message: errorMessage,
        });
        error(errorMessage);
      } else if (err.status === 500) {
        // Handle server errors
        error("Server error occurred. Please try again later.");
      } else if (
        err.data &&
        typeof err.data === "string" &&
        err.data.includes("JSON parse error")
      ) {
        // Handle the specific JSON parse error
        error(
          "There was an issue processing your profile picture. Please try with a different image or without an image."
        );
        registerMethods.setError("profilePicture", {
          type: "manual",
          message:
            "Please try with a different image or remove the profile picture.",
        });
      } else {
        // Handle other errors
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
                  {...registerMethods.register("firstName", {
                    required: "First name is required",
                  })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                  placeholder="John"
                />
                <FiUser className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {registerMethods.formState.errors.firstName && (
                <p className="text-red-500 text-xs mt-1">
                  {registerMethods.formState.errors.firstName.message}
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
                  {...registerMethods.register("lastName", {
                    required: "Last name is required",
                  })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                  placeholder="Doe"
                />
                <FiUser className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {registerMethods.formState.errors.lastName && (
                <p className="text-red-500 text-xs mt-1">
                  {registerMethods.formState.errors.lastName.message}
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
                {...registerMethods.register("phoneNumber")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                placeholder="+1 (555) 123-4567"
              />
              <FiPhone className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            {registerMethods.formState.errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">
                {registerMethods.formState.errors.phoneNumber.message}
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
                {...registerMethods.register("confirmPassword")}
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
            {registerMethods.formState.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {registerMethods.formState.errors.confirmPassword.message}
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
                {...registerMethods.register("profilePicture")}
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
              {...registerMethods.register("userType")}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
              defaultValue="User"
            >
              <option value="Administrator">Administrator</option>
              <option value="User">Client User</option>
              <option value="Manager">Compliance Auditor</option>
              <option value="Analyst">Risk Analyst</option>
            </select>
            {registerMethods.formState.errors.userType && (
              <p className="text-red-500 text-xs mt-1">
                {registerMethods.formState.errors.userType.message}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...registerMethods.register("enableMFA")}
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
                {...registerMethods.register("acceptTerms")}
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
            {registerMethods.formState.errors.acceptTerms && (
              <p className="text-red-500 text-xs ml-6">
                {registerMethods.formState.errors.acceptTerms.message}
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
