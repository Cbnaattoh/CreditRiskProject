import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiAlertTriangle, FiMail, FiPhone, FiHelpCircle } from 'react-icons/fi';

interface MFARecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onContactSupport: (method: 'email' | 'phone', message: string) => void;
}

export const MFARecoveryModal: React.FC<MFARecoveryModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onContactSupport
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone' | null>(null);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'options' | 'contact' | 'submitted'>('options');

  const handleSubmit = () => {
    if (selectedMethod && message.trim()) {
      onContactSupport(selectedMethod, message);
      setStep('submitted');
    }
  };

  const handleClose = () => {
    setStep('options');
    setSelectedMethod(null);
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <FiAlertTriangle className="text-amber-600 dark:text-amber-400 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                MFA Recovery Help
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Can't access your authenticator?
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiX className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {step === 'options' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Try These Options First:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Use a backup code if you saved them</li>
                  <li>• Check if you have the authenticator app on another device</li>
                  <li>• Look for the QR code or secret key you may have saved</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Still can't access your account?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Our support team can help you regain access to your account. Choose how you'd like to contact us:
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSelectedMethod('email');
                      setStep('contact');
                    }}
                    className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <FiMail className="text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Email Support</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          We'll respond within 24 hours
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMethod('phone');
                      setStep('contact');
                    }}
                    className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <FiPhone className="text-green-600 dark:text-green-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">Phone Support</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Call back request - available business hours
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'contact' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <FiHelpCircle />
                <span>Contact method: {selectedMethod === 'email' ? 'Email' : 'Phone'} Support</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describe your issue
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your MFA access issue. Include any error messages you're seeing and what you've already tried."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={4}
                />
              </div>

              {userEmail && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Account email: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{userEmail}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('options')}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          )}

          {step === 'submitted' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-green-800 dark:text-green-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Request Submitted</span>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">
                  Your {selectedMethod} support request has been submitted successfully.
                </p>
                <p>
                  {selectedMethod === 'email' 
                    ? 'You should receive a response within 24 hours.'
                    : 'Our team will call you back during business hours.'
                  }
                </p>
              </div>

              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};