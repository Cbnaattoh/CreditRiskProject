import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { FormProvider } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";
import { ANIMATION_VARIANTS } from "./constants";

interface LoginFormProps {
  loginMethods: UseFormReturn<any>;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  handleLoginSubmit: (data: any) => Promise<void>;
  handleForgotPassword: () => void;
  isLoading: boolean;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showInfoToast: (message: string) => void;
}

const rememberMeHelpers = {
  saveCredentials: (email: string, rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberMe");
    }
  },

  loadSavedCredentials: () => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberMe = localStorage.getItem("rememberMe") === "true";

    return {
      email: rememberedEmail || "",
      rememberMe: rememberMe,
    };
  },

  clearSavedCredentials: () => {
    localStorage.removeItem("rememberedEmail");
    localStorage.removeItem("rememberMe");
  },
};

const LoginForm: React.FC<LoginFormProps> = ({
  loginMethods,
  showPassword,
  setShowPassword,
  handleLoginSubmit,
  handleForgotPassword,
  isLoading,
  // showSuccessToast,
  // showErrorToast,
  // showInfoToast
}) => {
  useEffect(() => {
    const savedCredentials = rememberMeHelpers.loadSavedCredentials();
    if (savedCredentials.rememberMe && savedCredentials.email) {
      loginMethods.setValue("email", savedCredentials.email);
      loginMethods.setValue("rememberMe", true);
    }
  }, [loginMethods]);

  const handleSubmitWithRememberMe = async (data: any) => {
    try {
      rememberMeHelpers.saveCredentials(data.email, data.rememberMe);
      await handleLoginSubmit(data);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  return (
    <FormProvider {...loginMethods}>
      <motion.form
        key="login"
        {...ANIMATION_VARIANTS.formSlide}
        onSubmit={loginMethods.handleSubmit(handleSubmitWithRememberMe)}
        className="w-full"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome Back</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Sign in to your RiskGuard account</p>


        <div className="space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                id="email"
                {...loginMethods.register("email")}
                placeholder="your@email.com"
                className={`pl-10 w-full px-4 py-3 rounded-xl border ${
                  loginMethods.formState.errors.email
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-700"
                } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600`}
              />
            </div>
            {loginMethods.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {loginMethods.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                {...loginMethods.register("password")}
                placeholder="••••••••"
                className={`pl-10 w-full px-4 py-3 rounded-xl border ${
                  loginMethods.formState.errors.password
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-700"
                } bg-white dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all hover:border-gray-400 dark:hover:border-gray-600`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                ) : (
                  <FiEye className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                )}
              </button>
            </div>
            {loginMethods.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {loginMethods.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* MFA Setup Checkbox */}
          <div className="flex items-center mt-4">
            <input
              id="enableMFA"
              type="checkbox"
              {...loginMethods.register("enableMFA")}
              className="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            />
            <label
              htmlFor="enableMFA"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Set up Two-Factor Authentication
            </label>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                {...loginMethods.register("rememberMe")}
                className="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium cursor-pointer transition-colors"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading || !loginMethods.formState.isValid}
              className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all ${
                isLoading || !loginMethods.formState.isValid
                  ? "opacity-80 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Continue <FiArrowRight className="ml-2" />
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.form>
    </FormProvider>
  );
};

export { rememberMeHelpers };
export default LoginForm;