import React, { useState, useEffect } from "react";
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
} from "../../../components/utils/schemas/authSchemas";
import {
  useLoginMutation,
  useVerifyMFAMutation,
  useSetupMFAMutation,
} from "../../../components/redux/features/auth/authApi";
import {
  setCredentials,
  setMFARequired,
  selectRequiresMFA,
  selectTempToken,
  selectMFAMethods,
} from "../../../components/redux/features/auth/authSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../components/utils/hooks";

const Login: React.FC = () => {
  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("Admin");
  const [activeTab, setActiveTab] = useState("login");
  const [formStep, setFormStep] = useState(1);
  const [shake, setShake] = useState(false);
  const [mfaStep, setMfaStep] = useState<"login" | "setup" | "verify">("login");
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const mfaRequired = useAppSelector(selectRequiresMFA);
  // const requiresMFA = useAppSelector(selectRequiresMFA);
  const tempToken = useAppSelector(selectTempToken);
  const mfaMethods = useAppSelector(selectMFAMethods);

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyMFA, { isLoading: isMFALoading }] = useVerifyMFAMutation();
  const [setupMFA, { isLoading: isMFASetupLoading }] = useSetupMFAMutation();

  const loginMethods = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const mfaFormMethods = useForm({
    resolver: zodResolver(twoFASchema),
    mode: "onChange",
  });

  const isLoading = isLoginLoading || isMFALoading || isMFASetupLoading;

  // Handle MFA requirement changes
  useEffect(() => {
    if (mfaRequired && formStep === 1) {
      setFormStep(2);
      setMfaStep("verify");
    }
  }, [mfaRequired, formStep]);

  const handleLoginSubmit = async (data: any) => {
    try {
      const result = await login({
        email: data.email,
        password: data.password,
        enableMFA: data.enableMFA,
      }).unwrap();

      if (result.requiresMFA) {
        // If MFA is enabled, show verification
        dispatch(
          setMFARequired({
            tempToken: result.tempToken || "",
            mfaMethods: result.mfaMethods || ["totp"],
          })
        );
        setFormStep(2);
        setMfaStep("verify");
      } else if (data.enableMFA) {
        // If user wants to setup MFA
        const setupResult = await setupMFA().unwrap();
        setQrCode(setupResult.qr_code);
        setBackupCodes(setupResult.backup_codes);
        setMfaStep("setup");
        setFormStep(2);
      } else {
        // Regular login
        dispatch(
          setCredentials({
            user: result.user,
            token: result.token || "",
          })
        );
        navigate("/home");
      }
    } catch (err) {
      handleApiError(err, "login");
    }
  };

  const handleMFASubmit = async (data: any) => {
    try {
      let result;

      if (mfaStep === "verify") {
        // Verify MFA code
        result = await verifyMFA({
          code: data.code,
          tempToken: tempToken || "",
        }).unwrap();
      } else {
        // Setup MFA with verification
        result = await verifyMFA({
          code: data.code,
          tempToken: "setup", // Special token for setup flow
        }).unwrap();
      }

      dispatch(
        setCredentials({
          user: result.user,
          token: result.token,
        })
      );

      // Show backup codes if this was a setup flow
      if (mfaStep === "setup") {
        setMfaStep("backup");
      } else {
        navigate("/home");
      }
    } catch (err) {
      handleApiError(err, "mfa");
    }
  };

  // API Error handling Logic
  const handleApiError = (err: any, formType: "login" | "mfa") => {
    const errorMessage =
      err.data?.message || err.error || "An unknown error occurred";

    if (formType === "login") {
      loginMethods.setError("root", { message: errorMessage });
    } else {
      mfaFormMethods.setError("root", { message: errorMessage });
    }

    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Forgot-Password Page Navigation Logic
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // Back-To-Login Page Navigation Logic
  const handleBackToLogin = () => {
    setFormStep(1);
    setMfaStep("login");
    mfaFormMethods.reset();
  };

  // Background gradient animation
  useEffect(() => {
    document.body.className = "bg-gradient-to-br from-gray-50 to-indigo-50";
    return () => {
      document.body.className = "";
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ParticlesBackground />
      <motion.div
        className={`absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full filter blur-3xl opacity-20${
          shake ? "animate-shake" : ""
        }`}
        animate={{
          x: [0, 20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20"
        animate={{
          x: [0, -20, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-sm bg-opacity-90 border border-white border-opacity-20"
      >
        <div className="flex flex-col md:flex-row">
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 grid gap-4"
            >
              {[
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
              ].map((feature, index) => (
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
                      <div className="text-black font-medium">
                        {feature.title}
                      </div>
                      <div className="text-blue-700 text-sm">
                        {feature.desc}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8"
            >
              <div className="flex items-center bg-blue-700 bg-opacity-30 rounded-xl p-4 border border-blue-400 border-opacity-20">
                <FiUser className="text-white mr-3 text-lg" />
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="bg-white bg-opacity-90 rounded-lg px-4 py-2 border border-blue-300 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                >
                  <option value="Admin">Administrator</option>
                  <option value="User">Standard User</option>
                  <option value="Analyst">Risk Analyst</option>
                  <option value="Auditor">Compliance Auditor</option>
                </select>
              </div>
            </motion.div>
          </motion.div>

          <div className="w-full md:w-3/5 p-10 flex flex-col justify-center">
            <motion.div className="flex border-b border-gray-200 mb-8">
              {["login", "register"].map((tab) => (
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

            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                formStep === 1 ? (
                  <FormProvider {...loginMethods}>
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={loginMethods.handleSubmit(handleLoginSubmit)}
                      className="w-full"
                    >
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Welcome Back
                      </h2>
                      <p className="text-gray-600 mb-8">
                        Sign in to your RiskGuard account
                      </p>

                      {loginMethods.formState.errors.root && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start"
                        >
                          <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            {loginMethods.formState.errors.root.message}
                          </div>
                        </motion.div>
                      )}

                      <div className="space-y-6">
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

                        <div className="flex items-center mt-4">
                          <input
                            id="enableMFA"
                            type="checkbox"
                            // checked={enable2FA}
                            // onChange={(e) => setEnable2FA(e.target.checked)}
                            {...loginMethods.register("enableMFA" as const)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="enableMFA"
                            className="ml-2 block text-sm text-gray-700"
                          >
                            Set up Two-Factor Authentication
                          </label>
                        </div>

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

                        <div className="pt-2">
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={
                              isLoading || !loginMethods.formState.isValid
                            }
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
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
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
                ) : (
                  <FormProvider {...mfaFormMethods}>
                    <motion.div
                      key="mfa"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      {mfaStep === "setup" && (
                        <>
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h2 className="text-2xl font-bold text-gray-800">
                                Set Up Two-Factor Authentication
                              </h2>
                              <p className="text-gray-600">
                                Scan the QR code with your authenticator app
                              </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                              <FiShield className="text-blue-600 text-xl" />
                            </div>
                          </div>

                          <div className="flex flex-col items-center">
                            <div
                              className="mb-4 p-2 bg-white rounded-lg"
                              dangerouslySetInnerHTML={{ __html: qrCode }}
                            />
                            <div className="text-sm text-gray-600 mb-4">
                              <FiKey className="inline mr-2" />
                              Secret: {backupCodes[0]?.split("-").join(" ")}
                            </div>
                          </div>
                        </>
                      )}

                      {mfaStep === "verify" && (
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                              Two-Factor Authentication
                            </h2>
                            <p className="text-gray-600">
                              Enter the 6-digit code from your authenticator app
                            </p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-full">
                            <FiShield className="text-blue-600 text-xl" />
                          </div>
                        </div>
                      )}

                      {mfaFormMethods.formState.errors.root && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start"
                        >
                          <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            {mfaFormMethods.formState.errors.root.message}
                          </div>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-6 gap-3">
                        {[...Array(6)].map((_, i) => (
                          <input
                            key={i}
                            type="text"
                            maxLength={1}
                            {...mfaFormMethods.register(`code.${i}`)}
                            className={`w-full h-16 text-3xl text-center rounded-lg border-2 ${
                              mfaFormMethods.formState.errors.code
                                ? "border-red-500"
                                : "border-gray-300"
                            } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none`}
                          />
                        ))}
                      </div>

                      <div className="pt-4 flex space-x-3">
                        <motion.button
                          type="button"
                          onClick={handleBackToLogin}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                        >
                          Back
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={mfaFormMethods.handleSubmit(handleMFASubmit)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={
                            isLoading || !mfaFormMethods.formState.isValid
                          }
                          className={`flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors ${
                            isLoading || !mfaFormMethods.formState.isValid
                              ? "opacity-80 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {isLoading ? "Verifying..." : "Verify"}
                        </motion.button>
                      </div>

                      {mfaStep === "setup" && (
                        <div className="mt-4 text-sm text-gray-500">
                          <p>
                            Can't scan the QR code? Enter this secret manually:
                          </p>
                          <div className="mt-2 p-3 bg-gray-100 rounded-lg font-mono">
                            {backupCodes[0]}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </FormProvider>
                )
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full"
                >
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    Create Account
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Join our platform to access advanced credit risk analysis
                    tools.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
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
                          <FiCheck className="mr-1 text-green-500" /> One
                          uppercase letter
                        </li>
                        <li className="flex items-center">
                          <FiCheck className="mr-1 text-green-500" /> One number
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="terms"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

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
