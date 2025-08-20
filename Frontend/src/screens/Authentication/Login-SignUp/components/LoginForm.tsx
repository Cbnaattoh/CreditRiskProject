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
  FiUser,
  FiShield,
  FiCheckCircle,
  FiX,
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
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        key="login"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your RiskGuard account</p>
        </div>

        <FormProvider {...loginMethods}>
          <form
            onSubmit={loginMethods.handleSubmit(handleSubmitWithRememberMe)}
            className="space-y-6"
          >
            {/* Account Credentials Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <FiUser className="mr-2 text-blue-600 dark:text-blue-400" />
                Account Credentials
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Enter your registered email and password to access your account.
              </p>
              
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
                    <input
                      type="email"
                      id="email"
                      {...loginMethods.register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      disabled={isLoading}
                      placeholder="your@email.com"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl transition-all ${
                        loginMethods.formState.errors.email
                          ? "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/10"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 hover:border-gray-400 dark:hover:border-gray-500 ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  {loginMethods.formState.errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center"
                    >
                      <FiAlertCircle className="mr-1 flex-shrink-0" size={14} />
                      {loginMethods.formState.errors.email.message}
                    </motion.p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      {...loginMethods.register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters",
                        },
                      })}
                      disabled={isLoading}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl transition-all ${
                        loginMethods.formState.errors.password
                          ? "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/10"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 hover:border-gray-400 dark:hover:border-gray-500 ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {loginMethods.formState.errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center"
                    >
                      <FiAlertCircle className="mr-1 flex-shrink-0" size={14} />
                      {loginMethods.formState.errors.password.message}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Options Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <FiShield className="mr-2 text-green-600 dark:text-green-400" />
                Security Options
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure your security preferences and account access settings.
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    {...loginMethods.register("rememberMe")}
                    disabled={isLoading}
                    className="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 transition-colors"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-3 text-sm text-gray-700 dark:text-gray-300 select-none"
                  >
                    Remember me for 30 days
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors underline decoration-dotted underline-offset-4"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Submit Button Section */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FiCheckCircle className="mr-2 text-gray-600 dark:text-gray-400" />
                Access Your Account
              </h3>
              
              <motion.button
                type="submit"
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-75"
                    : "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 dark:from-indigo-500 dark:via-purple-500 dark:to-blue-500 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-blue-600 hover:shadow-xl hover:shadow-indigo-500/25"
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
                    Sign In to Dashboard 
                    <FiArrowRight className="ml-2" />
                  </span>
                )}
              </motion.button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                By signing in, you agree to our{" "}
                <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </form>
        </FormProvider>
      </motion.div>
    </div>
  );
};

export { rememberMeHelpers };
export default LoginForm;