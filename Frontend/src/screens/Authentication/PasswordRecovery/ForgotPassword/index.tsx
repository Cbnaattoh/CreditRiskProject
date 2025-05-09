import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiCheck, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import Logo from "../../../../components/utils/Logo";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Reset email sent to:", email);
      setIsEmailSent(true);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-indigo-50 relative overflow-hidden">
      {/* Background elements */}
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full filter blur-3xl opacity-20"
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
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-sm bg-opacity-90 border border-white border-opacity-20 p-8"
      >
        <div className="flex justify-center mb-6">
          <Logo />
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
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"
              >
                <FiCheck className="h-8 w-8 text-green-600" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to{" "}
                <span className="font-medium text-indigo-600">{email}</span>
              </p>

              <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-blue-700">
                  Didn't receive the email? Check your spam folder or
                </p>
                <motion.button
                  type="button"
                  onClick={() => setIsEmailSent(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  try another email address
                </motion.button>
              </div>

              <motion.button
                type="button"
                onClick={() => (window.location.href = "/")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
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
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Forgot Password?
                </h2>
                <p className="text-gray-600">
                  Enter your email and we'll send you a link to reset your
                  password
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 bg-red-50 text-red-600 rounded-lg flex items-start"
                >
                  <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
                  <div>{error}</div>
                </motion.div>
              )}

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

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${
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
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Send Reset Link <FiArrowRight className="ml-2" />
                  </span>
                )}
              </motion.button>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <a
                    href="/login"
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Log in
                  </a>
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
