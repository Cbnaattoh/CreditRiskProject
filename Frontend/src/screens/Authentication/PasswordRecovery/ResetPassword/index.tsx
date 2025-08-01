import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiArrowRight,
  FiAlertCircle,
} from "react-icons/fi";
import { useSearchParams, useNavigate } from "react-router-dom";
import Logo from "../../../../components/utils/Logo";
import { useConfirmPasswordResetMutation } from "../../../../components/redux/features/auth/authApi";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [uid, setUid] = useState("");
  const [confirmPasswordReset, { isLoading }] = useConfirmPasswordResetMutation();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const uidParam = searchParams.get('uid');
    
    if (!tokenParam || !uidParam) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }
    
    setToken(tokenParam);
    setUid(uidParam);
  }, [searchParams]);

  // Password strength calculator
  React.useEffect(() => {
    let strength = 0;
    if (newPassword.length > 0) strength += 20;
    if (newPassword.length >= 8) strength += 30;
    if (/[A-Z]/.test(newPassword)) strength += 15;
    if (/[0-9]/.test(newPassword)) strength += 15;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 20;
    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return "from-red-400 to-red-500";
    if (passwordStrength < 80) return "from-yellow-400 to-orange-500";
    return "from-emerald-400 to-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 50) return "Weak";
    if (passwordStrength < 80) return "Moderate";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token || !uid) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 50) {
      setError("Password is too weak. Please choose a stronger password.");
      return;
    }

    try {
      await confirmPasswordReset({
        token,
        uid,
        new_password: newPassword,
        confirm_password: confirmPassword
      }).unwrap();
      setIsSuccess(true);
      setError("");
    } catch (err: any) {
      const errorMessage = err?.data?.detail || 
                          err?.data?.new_password?.[0] || 
                          err?.data?.token?.[0] || 
                          err?.data?.uid?.[0] ||
                          "Failed to reset password. Please try again.";
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
            {isSuccess ? (
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
                  Password Updated!
                </h2>
                <p className="mb-8 leading-relaxed text-gray-600 dark:text-gray-300">
                  Your password has been successfully reset. You can now log in
                  with your new password.
                </p>

                <motion.button
                  type="button"
                  onClick={() => navigate("/")}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 rounded-2xl font-semibold shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white shadow-indigo-500/30 dark:shadow-indigo-500/25"
                >
                  <span className="flex items-center justify-center">
                    Continue to Login
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <FiArrowRight className="ml-2" />
                    </motion.div>
                  </span>
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
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-3 text-gray-800 dark:text-white">
                    Reset Password
                  </h2>
                  <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                    Enter your new password to complete the reset process
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
                    htmlFor="newPassword"
                    className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200"
                  >
                    New Password
                  </label>
                  <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-12 pr-12 w-full px-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-400/80 dark:hover:border-gray-500/70"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FiEyeOff className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <FiEye className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </motion.button>
                  </motion.div>
                  {newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="mt-3"
                    >
                      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${getPasswordStrengthColor()}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <div className="text-xs font-medium mt-2 text-gray-600 dark:text-gray-400">
                        Password strength: {getPasswordStrengthText()}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200"
                  >
                    Confirm Password
                  </label>
                  <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-12 pr-12 w-full px-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-400/80 dark:hover:border-gray-500/70"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <FiEye className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </motion.button>
                  </motion.div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 text-xs text-red-500 dark:text-red-400"
                    >
                      Passwords do not match
                    </motion.div>
                  )}
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={
                    isLoading ||
                    !newPassword ||
                    newPassword !== confirmPassword ||
                    !token ||
                    !uid
                  }
                  className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white shadow-indigo-500/30 dark:shadow-indigo-500/25 ${
                    isLoading ||
                    !newPassword ||
                    newPassword !== confirmPassword ||
                    !token ||
                    !uid
                      ? "opacity-80 cursor-not-allowed"
                      : ""
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
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Reset Password
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
                    Need a new reset link?{" "}
                    <motion.button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      whileHover={{ scale: 1.05 }}
                      className="font-semibold transition-colors text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      Request new reset
                    </motion.button>
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

export default ResetPassword;
