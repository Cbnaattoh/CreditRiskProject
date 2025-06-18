import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
  FiAlertCircle,
  FiCheck,
  FiArrowRight,
  FiShield,
} from "react-icons/fi";
import Logo from "../../../components/utils/Logo";
import { useNavigate } from "react-router-dom";
import ParticlesBackground from "./components/particlesBackground";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  twoFASchema,
  registrationSchema,
} from "../../../components/utils/schemas/authSchemas";
import {
  useLoginMutation,
  useVerifyMFAMutation,
  useSetupMFAMutation,
  useVerifyMFASetupMutation,
} from "../../../components/redux/features/auth/authApi";
import {
  clearMFAState,
  logout,
} from "../../../components/redux/features/auth/authSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../components/utils/hooks";
import { useToast, ToastContainer } from "../../../components/utils/Toast";
import MFAForm from "./components/MFAForm";

// Types
interface MFASetupData {
  uri: string;
  secret: string;
  backup_codes: string[];
}

type MFAStep = "login" | "setup" | "verify" | "backup";
type FormStep = 1 | 2;
type ActiveTab = "login" | "register";

// Constants
const USER_TYPES = [
  { value: "Admin", label: "Administrator" },
  { value: "User", label: "Standard User" },
  { value: "Analyst", label: "Risk Analyst" },
  { value: "Auditor", label: "Compliance Auditor" },
] as const;

const FEATURES = [
  {
    icon: "📊",
    title: "Real-Time Analytics",
    desc: "Instant risk scoring",
  },
  {
    icon: "🔒",
    title: "Bank-Level Security",
    desc: "256-bit encryption",
  },
  {
    icon: "🤖",
    title: "AI Predictions",
    desc: "Machine learning models",
  },
] as const;

const ANIMATION_VARIANTS = {
  pageEnter: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.6, ease: "easeOut" },
  },
  formSlide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  errorShake: {
    animate: { x: [-10, 10, -10, 10, 0] },
    transition: { duration: 0.5 },
  },
} as const;

// Custom Hooks
const useAuthRedirect = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const mfaRequired = useAppSelector((state) => state.auth.requiresMFA);

  useEffect(() => {
    if (isAuthenticated && !mfaRequired) {
      navigate("/home");
    }
  }, [isAuthenticated, mfaRequired, navigate]);
};

const useFormManagement = () => {
  const loginMethods = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const registerMethods = useForm({
    resolver: zodResolver(registrationSchema),
    mode: "onChange",
  });

  const mfaFormMethods = useForm({
    resolver: zodResolver(twoFASchema),
    mode: "onChange",
  });

  const resetForms = useCallback(() => {
    loginMethods.reset();
    mfaFormMethods.reset();
  }, [loginMethods, mfaFormMethods]);

  return { loginMethods, mfaFormMethods, registerMethods, resetForms };
};

// Main Component
const Login: React.FC = () => {
  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<string>("Admin");
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [shake, setShake] = useState(false);
  const [mfaStep, setMfaStep] = useState<MFAStep>("login");
  const [mfaSetupData, setMfaSetupData] = useState<MFASetupData | null>(null);
  const [isSettingUpMFA, setIsSettingUpMFA] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toasts, removeToast, success, error, info } = useToast();
  const { loginMethods, mfaFormMethods, registerMethods, resetForms } = useFormManagement();

  // Selectors
  const tempToken = useAppSelector((state) => state.auth.tempToken);
  const uid = useAppSelector((state) => state.auth.uid);

  // API hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyMFA, { isLoading: isMFALoading }] = useVerifyMFAMutation();
  const [setupMFA, { isLoading: isMFASetupLoading }] = useSetupMFAMutation();
  const [verifyMFASetup] = useVerifyMFASetupMutation();

  // Custom hooks
  useAuthRedirect();

  // Computed values
  const isLoading = useMemo(
    () => isLoginLoading || isMFALoading || isMFASetupLoading || isSettingUpMFA,
    [isLoginLoading, isMFALoading, isMFASetupLoading, isSettingUpMFA]
  );

  // Error handling
  const handleApiError = useCallback(
    (err: any, formType: "login" | "mfa") => {
      console.error(`${formType} error:`, err);

      const errorMessage =
        err?.data?.detail ||
        err?.data?.message ||
        err?.message ||
        "An unknown error occurred";

      const methods = formType === "login" ? loginMethods : mfaFormMethods;
      methods.setError("root", { message: errorMessage });

      error(errorMessage);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (err?.status === 401) {
        dispatch(logout());
        if (formStep === 2) {
          handleBackToLogin();
        }
      }
    },
    [loginMethods, mfaFormMethods, error, dispatch, formStep]
  );

  // MFA Setup
  const handleMFASetup = useCallback(async () => {
    try {
      setIsSettingUpMFA(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const setupResult = await setupMFA({
        enable: true,
        backup_codes_acknowledged: false,
      }).unwrap();

      setMfaSetupData({
        uri: setupResult.uri,
        secret: setupResult.secret,
        backup_codes: setupResult.backup_codes || [],
      });

      setMfaStep("setup");
      setFormStep(2);
      success("Scan the QR code with your authenticator app");
    } catch (setupError: any) {
      console.error("MFA Setup Error:", setupError);
      handleApiError(setupError, "login");

      if (setupError?.status === 401) {
        dispatch(logout());
        navigate("/");
      }
    } finally {
      setIsSettingUpMFA(false);
    }
  }, [setupMFA, success, handleApiError, dispatch, navigate]);

  // Login submission
  const handleLoginSubmit = useCallback(
    async (data: any) => {
      try {
        const result = await login({
          email: data.email,
          password: data.password,
          enableMFA: data.enableMFA,
        }).unwrap();

        console.log("Login result:", result);

        if (result.requiresMFA) {
          setFormStep(2);
          setMfaStep("verify");
          info("Two-factor authentication required. Please enter your code.");
          return;
        }

        if (data.enableMFA && !result.user.mfa_enabled) {
          await handleMFASetup();
          return;
        }

        success("Login successful! Redirecting...");
        setTimeout(() => navigate("/home"), 1500);
      } catch (err: any) {
        console.error("Login error:", err);
        handleApiError(err, "login");
      }
    },
    [login, info, handleMFASetup, success, navigate, handleApiError]
  );

  // MFA submission
  const handleMFASubmit = useCallback(
    async (data: any) => {
      try {
        const token = Object.values(data.code || {})
          .join("")
          .trim();

        if (token.length !== 6 || !/^[0-9]{6}$/.test(token)) {
          mfaFormMethods.setError("root", {
            type: "manual",
            message: "Please enter all 6 digits of the code correctly.",
          });
          return;
        }

        if (mfaStep === "verify") {
          await verifyMFA({
            token: token,
            uid: uid || "",
            tempToken: tempToken || "",
          }).unwrap();

          success("Verification successful! Redirecting...");
          setTimeout(() => navigate("/home"), 1500);
        } else if (mfaStep === "setup") {
          await verifyMFASetup({ token: token }).unwrap();

          success("MFA setup completed successfully!");
          setMfaStep("backup");
          info("Please save your backup codes in a secure location");
        }
      } catch (err: any) {
        console.error("MFA verification error:", err);
        handleApiError(err, "mfa");
      }
    },
    [
      mfaFormMethods,
      mfaStep,
      verifyMFA,
      uid,
      tempToken,
      success,
      navigate,
      verifyMFASetup,
      info,
      handleApiError,
    ]
  );

  // Navigation handlers
  const handleForgotPassword = useCallback(() => {
    info("Redirecting to password recovery");
    setTimeout(() => navigate("/forgot-password"), 500);
  }, [info, navigate]);

  const handleBackToLogin = useCallback(() => {
    setFormStep(1);
    setMfaStep("login");
    setMfaSetupData(null);
    resetForms();
    dispatch(clearMFAState());
    info("Returned to login form");
  }, [resetForms, dispatch, info]);

  const handleBackupCodesAcknowledged = useCallback(() => {
    success("MFA setup complete! You can now log in.");
    handleBackToLogin();
    dispatch(clearMFAState());
  }, [success, handleBackToLogin, dispatch]);

  // Background effect
  useEffect(() => {
    document.body.className = "bg-gradient-to-br from-gray-50 to-indigo-50";
    return () => {
      document.body.className = "";
    };
  }, []);

  // Render functions
  const renderLoginForm = () => (
    <FormProvider {...loginMethods}>
      <motion.form
        key="login"
        {...ANIMATION_VARIANTS.formSlide}
        onSubmit={loginMethods.handleSubmit(handleLoginSubmit)}
        className="w-full"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
        <p className="text-gray-600 mb-8">Sign in to your RiskGuard account</p>

        {loginMethods.formState.errors.root && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start"
          >
            <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
            <div>{loginMethods.formState.errors.root.message}</div>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-medium mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                {...loginMethods.register("email")}
                placeholder="your@email.com"
                className={`pl-10 w-full px-4 py-3 rounded-xl border ${
                  loginMethods.formState.errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400`}
              />
            </div>
            {loginMethods.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {loginMethods.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-medium mb-2"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                {...loginMethods.register("password")}
                placeholder="••••••••"
                className={`pl-10 w-full px-4 py-3 rounded-xl border ${
                  loginMethods.formState.errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FiEyeOff className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {loginMethods.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="enableMFA"
              className="ml-2 block text-sm text-gray-700"
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
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-indigo-600 hover:text-indigo-900 font-medium cursor-pointer"
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
              className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${
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

  const renderRegisterForm = () => (
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

        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              {...registerMethods.register("name")}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              {...registerMethods.register("email")}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                {...registerMethods.register("password")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                placeholder="••••••••"
              />
              <FiLock className="absolute left-3 top-3.5 text-gray-400" />
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
            </ul>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...registerMethods.register("acceptTerms")}
              id="terms"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{" "}
              <a href="#" className="text-indigo-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-indigo-600 hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
          >
            Create Account
          </motion.button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("login")}
                className="text-indigo-600 hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </FormProvider>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
      <ParticlesBackground />

      {/* Animated Background Elements */}
      <motion.div
        className={`absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full filter blur-3xl opacity-20${
          shake ? " animate-shake" : ""
        }`}
        animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20"
        animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      <motion.div
        {...ANIMATION_VARIANTS.pageEnter}
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-sm bg-opacity-90 border border-white border-opacity-20"
      >
        <div className="flex flex-col md:flex-row">
          {/* Left Side Panel */}
          <motion.div
            className="w-full md:w-2/5 bg-gradient-to-br from-indigo-900 to-blue-800 p-10 flex flex-col justify-between relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black opacity-5 to-transparent z-0" />
            <div className="relative z-10">
              <Logo />
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white mt-8 leading-tight"
              >
                RiskGuard <span className="text-blue-300">Pro</span>
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-blue-100 mt-2 text-lg"
              >
                AI-Powered Credit Risk Platform
              </motion.p>
            </div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 grid gap-4"
            >
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white bg-opacity-10 p-4 rounded-xl backdrop-blur-sm border border-white border-opacity-10"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{feature.icon}</span>
                    <div>
                      <div className="text-blue-700 font-medium">
                        {feature.title}
                      </div>
                      <div className="text-blue-400 text-sm">
                        {feature.desc}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* User Type Selector */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8"
            >
              <div className="flex items-center bg-blue-700 bg-opacity-30 rounded-xl p-4 border border-blue-400 border-opacity-20">
                <FiUser className="text-white mr-3 text-lg" />
                <div className="w-full">
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full p-2 border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2 bg-white bg-opacity-90 relative z-[9999]"
                    style={{ position: "relative", zIndex: 9999 }}
                  >
                    {USER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side Form Panel */}
          <div className="w-full md:w-3/5 p-10 flex flex-col justify-center">
            {/* Tab Navigation */}
            <motion.div className="flex border-b border-gray-200 mb-8">
              {(["login", "register"] as const).map((tab) => (
                <motion.button
                  key={tab}
                  className={`relative py-3 px-6 font-medium text-sm uppercase tracking-wider ${
                    activeTab === tab
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab === "login" ? "Sign In" : "Register"}
                  {activeTab === tab && (
                    <motion.div
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
                      layoutId="underline"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>

            {/* Form Content */}
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                formStep === 1 ? (
                  renderLoginForm()
                ) : (
                  <MFAForm
                    mfaFormMethods={mfaFormMethods}
                    mfaStep={mfaStep}
                    mfaSetupData={mfaSetupData}
                    handleMFASubmit={handleMFASubmit}
                    handleBackToLogin={handleBackToLogin}
                    isLoading={isLoading}
                    backupCodes={mfaSetupData?.backup_codes || []}
                    handleBackupCodesAcknowledged={
                      handleBackupCodesAcknowledged
                    }
                  />
                )
              ) : (
                renderRegisterForm()
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400"
      >
        © {new Date().getFullYear()} RiskGuard Pro. All rights reserved.
      </motion.div>
    </div>
  );
};

export default Login;
