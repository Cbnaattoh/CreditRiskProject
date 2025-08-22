import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiArchive, FiAlertTriangle, FiX } from 'react-icons/fi';

interface NotificationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type: 'delete' | 'archive' | 'clear' | 'deleteAll';
  isLoading?: boolean;
  itemCount?: number;
  destructive?: boolean;
}

export const NotificationConfirmModal: React.FC<NotificationConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  type,
  isLoading = false,
  itemCount,
  destructive = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <FiTrash2 className="w-6 h-6 text-red-500" />;
      case 'archive':
        return <FiArchive className="w-6 h-6 text-blue-500" />;
      case 'clear':
        return <FiAlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'deleteAll':
        return <FiTrash2 className="w-6 h-6 text-red-500" />;
      default:
        return <FiAlertTriangle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getDefaultConfirmText = () => {
    switch (type) {
      case 'delete':
        return destructive ? 'Delete Permanently' : 'Delete';
      case 'archive':
        return 'Archive';
      case 'clear':
        return 'Clear All';
      case 'deleteAll':
        return destructive ? 'Delete All Permanently' : 'Delete All';
      default:
        return 'Confirm';
    }
  };

  const getButtonStyles = () => {
    if (destructive || type === 'delete' || type === 'deleteAll') {
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
    }
    switch (type) {
      case 'archive':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white';
      case 'clear':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {getIcon()}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {description}
              </p>
              
              {itemCount !== undefined && itemCount > 0 && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {itemCount} notification{itemCount !== 1 ? 's' : ''} will be affected
                  </p>
                </div>
              )}

              {destructive && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FiAlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getButtonStyles()}`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  confirmText || getDefaultConfirmText()
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );

  // Render modal using portal to ensure it appears above all other content
  return createPortal(modalContent, document.body);
};