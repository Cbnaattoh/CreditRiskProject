import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowRight } from 'react-icons/fi';
import Logo from '../../../../components/utils/Logo';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('user@example.com');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || !newPassword || !confirmPassword) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Password reset successful');
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-indigo-50 relative overflow-hidden">
      {/* Background elements */}
      <motion.div 
        className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20"
        animate={{
          x: [0, -20, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
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
        
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"
            >
              <FiCheck className="h-8 w-8 text-green-600" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Updated!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            
            <motion.button
              type="button"
              onClick={() => window.location.href = '/login'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
            >
              Continue to Login
            </motion.button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
              <p className="text-gray-600">
                Enter the verification code sent to <span className="font-medium text-indigo-600">{email}</span> and your new password
              </p>
            </div>
            
            <div>
              <label htmlFor="otp" className="block text-gray-700 text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {newPassword && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${passwordStrength < 50 ? 'bg-red-400' : passwordStrength < 80 ? 'bg-yellow-400' : 'bg-green-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Password strength: {passwordStrength < 50 ? 'Weak' : passwordStrength < 80 ? 'Moderate' : 'Strong'}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading || !otp || !newPassword || newPassword !== confirmPassword}
              className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${
                isLoading || !otp || !newPassword || newPassword !== confirmPassword ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Reset Password <FiArrowRight className="ml-2" />
                </span>
              )}
            </motion.button>
            
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Didn't receive code?{' '}
                <button 
                  type="button"
                  className="text-indigo-600 hover:underline font-medium"
                >
                  Resend code
                </button>
              </p>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;