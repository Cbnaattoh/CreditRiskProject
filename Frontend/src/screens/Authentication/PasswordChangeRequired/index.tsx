import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiArrowRight,
  FiAlertCircle,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Logo from "../../../components/utils/Logo";
import { useChangePasswordRequiredMutation } from "../../../components/redux/features/auth/authApi";
import {
  selectCurrentUser,
  selectTemporaryPassword,
  selectPasswordExpired,
  selectCreatedByAdmin,
} from "../../../components/redux/features/auth/authSlice";

const PasswordChangeRequired: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isTemporary = useSelector(selectTemporaryPassword);
  const isExpired = useSelector(selectPasswordExpired);
  const createdByAdmin = useSelector(selectCreatedByAdmin);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [changePasswordRequired, { isLoading }] = useChangePasswordRequiredMutation();

  // Password strength calculator
  useEffect(() => {
    let strength = 0;
    if (newPassword.length > 0) strength += 20;
    if (newPassword.length >= 8) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 20;
    if (/[a-z]/.test(newPassword)) strength += 15;
    if (/[0-9]/.test(newPassword)) strength += 10;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 10;
    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "from-red-400 to-red-500";
    if (passwordStrength < 70) return "from-yellow-400 to-orange-500";
    return "from-emerald-400 to-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 70) return "Moderate";
    return "Strong";
  };

  const getPageTitle = () => {
    if (isTemporary) return "Change Temporary Password";
    if (isExpired) return "Password Expired";
    return "Change Password Required";
  };

  const getPageDescription = () => {
    if (isTemporary && createdByAdmin) {
      return "Your account was created by an administrator. You must change your temporary password to continue.";
    }
    if (isExpired) {
      return "Your password has expired for security reasons. Please create a new password to continue.";
    }
    return "You must change your password before accessing the system.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordStrength < 40) {
      setError("Password is too weak. Please choose a stronger password.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    try {
      await changePasswordRequired({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap();
      setIsSuccess(true);
      setError("");
      
      // Redirect to dashboard after successful change
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.data?.detail || 
                          err?.data?.current_password?.[0] || 
                          err?.data?.new_password?.[0] ||
                          err?.data?.non_field_errors?.[0] ||
                          "Failed to change password. Please try again.";
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

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl border p-8 transition-all duration-500 bg-white/90 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50 shadow-indigo-500/20 dark:shadow-indigo-500/10"
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
                  Your password has been successfully changed. You can now access the system with full privileges.
                </p>

                <div className="flex items-center justify-center space-x-2 text-indigo-600 dark:text-indigo-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <FiArrowRight className="h-5 w-5" />
                  </motion.div>
                  <span>Redirecting to dashboard...</span>
                </div>
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
                  <motion.div
                    className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-gradient-to-br from-amber-400 to-orange-500"
                  >
                    <FiShield className="h-8 w-8 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3 text-gray-800 dark:text-white">
                    {getPageTitle()}
                  </h2>
                  <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                    {getPageDescription()}
                  </p>
                </div>

                {(isTemporary || createdByAdmin) && (
                  <div className="rounded-2xl p-4 mb-6 text-left border bg-blue-50/80 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-700/30 backdrop-blur-sm">
                    <div className="flex items-start">
                      <FiInfo className="mt-0.5 mr-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Welcome to the team!</strong> Your account was created by an administrator. 
                          This temporary password ensures your account remains secure.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                    htmlFor="currentPassword"
                    className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200"
                  >
                    {isTemporary ? "Temporary Password" : "Current Password"}
                  </label>
                  <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
                    </div>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-12 pr-12 w-full px-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-400/80 dark:hover:border-gray-500/70"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <FiEyeOff className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <FiEye className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </motion.button>
                  </motion.div>
                </div>

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
                      type={showNewPassword ? "text" : "password"}
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
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
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
                    Confirm New Password
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    passwordStrength < 40
                  }
                  className={`w-full py-4 px-6 rounded-2xl font-semibold shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white shadow-indigo-500/30 dark:shadow-indigo-500/25 ${
                    isLoading ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    passwordStrength < 40
                      ? "opacity-50 cursor-not-allowed"
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
                      Updating Password...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Update Password
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <FiArrowRight className="ml-2" />
                      </motion.div>
                    </span>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default PasswordChangeRequired;