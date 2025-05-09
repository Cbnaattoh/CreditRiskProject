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

// Particle background component
const ParticlesBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: 0,
          }}
          animate={{
            x: [null, Math.random() * 100],
            y: [null, Math.random() * 100],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 20 + Math.random() * 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
          className="absolute rounded-full bg-indigo-200"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
          }}
        />
      ))}
    </div>
  );
};

const Login: React.FC = () => {
  // State management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState("Admin");
  const [activeTab, setActiveTab] = useState("login");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formStep, setFormStep] = useState(1);
  const [rememberMe, setRememberMe] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  // Password strength calculator
  useEffect(() => {
    let strength = 0;
    if (password.length > 0) strength += 20;
    if (password.length >= 8) strength += 30;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call with 3D loading animation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate 2FA step if enabled
      if (enable2FA && formStep === 1) {
        setFormStep(2);
        setIsLoading(false);
        return;
      }

      console.log("Login successful:", { email, userType, enable2FA });
      // Redirect would happen here
      navigate("/dashboard")
    } catch (err) {
      setError("Invalid credentials. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  }

  // Background gradient animation
  useEffect(() => {
    document.body.className = "bg-gradient-to-br from-gray-50 to-indigo-50";
    return () => {
      document.body.className = "";
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
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

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-sm bg-opacity-90 border border-white border-opacity-20"
      >
        <div className="flex flex-col md:flex-row">
          {/* Branding Panel - Enhanced with 3D effect */}
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

            {/* Animated feature cards */}
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

            {/* User type selector with smooth transition */}
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


          {/* Login Form Panel */}
          <div className="w-full md:w-3/5 p-10 flex flex-col justify-center">
            {/* Animated tabs */}
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
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="w-full"
                >
                  {formStep === 1 ? (
                    <>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Welcome Back
                      </h2>
                      <p className="text-gray-600 mb-8">
                        Sign in to your RiskGuard account
                      </p>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start"
                        >
                          <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
                          <div>{error}</div>
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
                              value={email}
                              onChange={handleEmailChange}
                              placeholder="your@email.com"
                              className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
                            />
                          </div>
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
                              value={password}
                              onChange={handlePasswordChange}
                              placeholder="••••••••"
                              className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
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
                          {password && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-2"
                            >
                              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full ${
                                    passwordStrength < 50
                                      ? "bg-red-400"
                                      : passwordStrength < 80
                                      ? "bg-yellow-400"
                                      : "bg-green-500"
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${passwordStrength}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Password strength:{" "}
                                {passwordStrength < 50
                                  ? "Weak"
                                  : passwordStrength < 80
                                  ? "Moderate"
                                  : "Strong"}
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              id="remember"
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
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
                            disabled={isLoading}
                            className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${
                              isLoading ? "opacity-80 cursor-not-allowed" : ""
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
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-6"
                    >
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

                      <div className="grid grid-cols-6 gap-3">
                        {[...Array(6)].map((_, i) => (
                          <input
                            key={i}
                            type="text"
                            maxLength={1}
                            className="w-full h-16 text-3xl text-center rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                          />
                        ))}
                      </div>

                      <div className="pt-4 flex space-x-3">
                        <motion.button
                          type="button"
                          onClick={() => setFormStep(1)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                        >
                          Back
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isLoading}
                          className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                        >
                          Verify
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.form>
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
