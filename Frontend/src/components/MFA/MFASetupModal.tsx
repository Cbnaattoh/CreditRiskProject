import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiShield,
  FiSmartphone,
  FiCheck,
  FiCopy,
  FiRefreshCw,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { useSetupMFAMutation, useVerifyMFASetupMutation } from "../redux/features/auth/authApi";
import { useAppDispatch } from "../utils/hooks";
import { completeMFASetup } from "../redux/features/auth/authSlice";

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type SetupStep = "info" | "setup" | "verify" | "success";

export const MFASetupModal: React.FC<MFASetupModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const dispatch = useAppDispatch();
  const [currentStep, setCurrentStep] = useState<SetupStep>("info");
  const [setupData, setSetupData] = useState<{
    qr_code?: string;
    secret?: string;
    backup_codes?: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const [setupMFA, { isLoading: isSettingUp, error: setupError }] = useSetupMFAMutation();
  const [verifyMFASetup, { isLoading: isVerifying, error: verifyError }] = useVerifyMFASetupMutation();

  const handleStartSetup = async () => {
    try {
      const result = await setupMFA({ enable: true }).unwrap();
      setSetupData(result);
      setCurrentStep("setup");
    } catch (error) {
      console.error("MFA setup failed:", error);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) return;

    try {
      const result = await verifyMFASetup({ token: verificationCode }).unwrap();
      setCurrentStep("success");
      
      // Give user time to see success message before closing
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("MFA verification failed:", error);
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleClose = () => {
    setCurrentStep("info");
    setSetupData(null);
    setVerificationCode("");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep("info");
      setSetupData(null);
      setVerificationCode("");
    }
  }, [isOpen]);

  const renderStep = () => {
    switch (currentStep) {
      case "info":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Enable Multi-Factor Authentication
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Multi-factor authentication adds an extra layer of security to your account by requiring a verification code from your mobile device.
            </p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Download an authenticator app (Google Authenticator, Authy, etc.)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Scan the QR code with your authenticator app
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enter the verification code to complete setup
                </span>
              </div>
            </div>
            <button
              onClick={handleStartSetup}
              disabled={isSettingUp}
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSettingUp ? (
                <FiRefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                "Start Setup"
              )}
            </button>
          </div>
        );

      case "setup":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSmartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Scan QR Code
            </h3>
            
            {setupData?.qr_code && (
              <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                <img
                  src={setupData.qr_code}
                  alt="MFA QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            )}
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Scan this QR code with your authenticator app, or manually enter the secret key below:
            </p>
            
            {setupData?.secret && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                    {setupData.secret}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {copySuccess ? (
                      <FiCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FiCopy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setCurrentStep("verify")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Continue to Verification
            </button>
          </div>
        );

      case "verify":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Enter Verification Code
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enter the 6-digit code from your authenticator app to complete the setup.
            </p>
            
            <div className="mb-6">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                maxLength={6}
                autoComplete="off"
              />
            </div>
            
            {verifyError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-center">
                <FiAlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-400 text-sm">
                  Invalid verification code. Please try again.
                </span>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentStep("setup")}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isVerifying ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify & Complete"
                )}
              </button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              MFA Setup Complete!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your account is now protected with multi-factor authentication. You'll need to enter a code from your authenticator app when signing in.
            </p>
            
            {setupData?.backup_codes && setupData.backup_codes.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Save Your Backup Codes
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {setupData.backup_codes.map((code, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center text-green-600 dark:text-green-400">
              <FiCheck className="w-5 h-5 mr-2" />
              <span className="font-medium">Redirecting to dashboard...</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={currentStep === "success" ? undefined : handleClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6"
            >
              {currentStep !== "success" && (
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              )}
              
              {renderStep()}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};