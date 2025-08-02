import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiCheck, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import Logo from "../../../../components/utils/Logo";
import { useRequestPasswordResetMutation } from "../../../../components/redux/features/auth/authApi";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [requestPasswordReset, { isLoading }] = useRequestPasswordResetMutation();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      await requestPasswordReset({ email }).unwrap();
      setIsEmailSent(true);
      setError("");
    } catch (err: any) {
      const errorMessage = err?.data?.detail || err?.data?.email?.[0] || "Failed to send reset email. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Enhanced background elements */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 bg-indigo-200 dark:bg-indigo-400"
        animate={{
          x: [0, 30, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full filter blur-3xl opacity-15 bg-purple-200 dark:bg-purple-400"
        animate={{
          x: [0, -20, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-indigo-300 dark:bg-indigo-400 opacity-30"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 right-1/3 w-6 h-6 rounded-full bg-purple-300 dark:bg-purple-400 opacity-25"
        animate={{
          y: [0, 15, 0],
          x: [0, 10, 0],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl border p-8 transition-all duration-500 bg-white/90 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50 shadow-indigo-500/20 dark:shadow-indigo-500/10"
      >
        {/* Glass morphism effect */}
        <div className="absolute inset-0 rounded-3xl transition-opacity duration-500 bg-gradient-to-br from-white/60 via-indigo-50/30 to-purple-50/40 dark:from-gray-800/50 dark:via-gray-900/30 dark:to-indigo-900/40" />

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Logo />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            {isEmailSent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 shadow-lg bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600"
                >
                  <FiCheck className="h-10 w-10 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold mb-3 text-gray-800 dark:text-white">
                  Check Your Email
                </h2>
                <p className="mb-8 leading-relaxed text-gray-600 dark:text-gray-300">
                  We've sent a password reset link to{" "}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {email}
                  </span>
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl p-6 mb-8 text-left border bg-blue-50/80 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-700/30 backdrop-blur-sm"
                >
                  <p className="text-sm mb-3 text-blue-700 dark:text-blue-300">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  <motion.button
                    type="button"
                    onClick={() => setIsEmailSent(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm font-semibold transition-colors text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    try another email address
                  </motion.button>
                </motion.div>

                <motion.button
                  type="button"
                  onClick={() => window.location.href = "/"}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 rounded-2xl font-semibold shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white shadow-indigo-500/30 dark:shadow-indigo-500/25"
                >
                  Back to Login
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-3 text-gray-800 dark:text-white">
                    Forgot Password?
                  </h2>
                  <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                    Enter your email and we'll send you a link to reset your
                    password
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.9 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 rounded-2xl flex items-start border bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-200/50 dark:border-red-700/30"
                    >
                      <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
                      <div className="font-medium">{error}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200"
                  >
                    Email Address
                  </label>
                  <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="your@email.com"
                      className="pl-12 w-full px-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-400/80 dark:hover:border-gray-500/70"
                    />
                  </motion.div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white shadow-indigo-500/30 dark:shadow-indigo-500/25 ${
                    isLoading ? "opacity-80 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 mr-3"
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
                      </motion.svg>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Send Reset Link
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <FiArrowRight className="ml-2" />
                      </motion.div>
                    </span>
                  )}
                </motion.button>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remember your password?{" "}
                    <motion.a
                      href="/"
                      whileHover={{ scale: 1.05 }}
                      className="font-semibold transition-colors text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      Log in
                    </motion.a>
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
