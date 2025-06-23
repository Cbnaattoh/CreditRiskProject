import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id?: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
  position = "top-right",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isVisible && onClose) {
      const timer = setTimeout(() => onClose(), 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.max(prev - 100 / (duration / 100), 0));
    }, 100);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const getToastStyles = () => {
    const baseStyles = "rounded-xl shadow-lg overflow-hidden";
    const typeStyles = {
      success: "bg-green-50 border border-green-100",
      error: "bg-red-50 border border-red-100",
      info: "bg-blue-50 border border-blue-100",
      warning: "bg-amber-50 border border-amber-100",
    };
    return `${baseStyles} ${typeStyles[type]}`;
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconClass = "flex-shrink-0";
    switch (type) {
      case "success":
        return (
          <FiCheckCircle
            className={`${iconClass} text-green-500`}
            size={iconSize}
          />
        );
      case "error":
        return (
          <FiAlertCircle
            className={`${iconClass} text-red-500`}
            size={iconSize}
          />
        );
      case "info":
        return (
          <FiInfo className={`${iconClass} text-blue-500`} size={iconSize} />
        );
      case "warning":
        return (
          <FiAlertTriangle
            className={`${iconClass} text-amber-500`}
            size={iconSize}
          />
        );
      default:
        return null;
    }
  };

  const getProgressBarColor = () => {
    switch (type) {
      case "success":
        return "bg-green-400";
      case "error":
        return "bg-red-400";
      case "info":
        return "bg-blue-400";
      case "warning":
        return "bg-amber-400";
      default:
        return "bg-gray-400";
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      default:
        return "top-4 right-4";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position.includes("top") ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position.includes("top") ? -20 : 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`fixed z-50 ${getPositionStyles()} w-full max-w-xs`}
        >
          <div className={getToastStyles()}>
            {/* Progress bar */}
            <div className="h-1 w-full bg-opacity-30 overflow-hidden">
              <motion.div
                className={`h-full ${getProgressBarColor()}`}
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: duration / 1000 }}
              />
            </div>

            {/* Toast content */}
            <div className="p-4 flex items-start">
              <div className="mr-3 mt-0.5">{getIcon()}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{message}</p>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close toast"
              >
                <FiX className="text-gray-500" size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ToastContainerProps {
  toasts: ToastProps[];
  removeToast: (id: string) => void;
  position?: ToastProps["position"];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  removeToast,
  position = "top-right",
}) => {
  const getContainerStyles = () => {
    switch (position) {
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      default:
        return "top-4 right-4";
    }
  };

  return (
    <div className={`fixed z-50 ${getContainerStyles()} space-y-2`}>
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{
              opacity: 0,
              y: position.includes("top") ? -20 : 20,
              scale: 0.95,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: position.includes("top") ? -20 : 20,
              scale: 0.95,
            }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-xs"
            style={{
              zIndex: 1000 + index,
            }}
          >
            <div className={getToastStyles(toast.type)}>
              {/* Progress bar */}
              <div className="h-1 w-full bg-opacity-30 overflow-hidden">
                <motion.div
                  className={`h-full ${getProgressBarColor(toast.type)}`}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{
                    duration: (toast.duration || 5000) / 1000,
                    ease: "linear",
                  }}
                />
              </div>

              {/* Toast content */}
              <div className="p-4 flex items-start">
                <div className="mr-3 mt-0.5">{getIcon(toast.type)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => toast.id && removeToast(toast.id)}
                  className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close toast"
                >
                  <FiX className="text-gray-500" size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  function getToastStyles(type: ToastType) {
    const baseStyles = "rounded-xl shadow-lg overflow-hidden";
    const typeStyles = {
      success: "bg-green-50 border border-green-100",
      error: "bg-red-50 border border-red-100",
      info: "bg-blue-50 border border-blue-100",
      warning: "bg-amber-50 border border-amber-100",
    };
    return `${baseStyles} ${typeStyles[type]}`;
  }

  function getProgressBarColor(type: ToastType) {
    switch (type) {
      case "success":
        return "bg-green-400";
      case "error":
        return "bg-red-400";
      case "info":
        return "bg-blue-400";
      case "warning":
        return "bg-amber-400";
      default:
        return "bg-gray-400";
    }
  }

  function getIcon(type: ToastType) {
    const iconSize = 20;
    const iconClass = "flex-shrink-0";
    switch (type) {
      case "success":
        return (
          <FiCheckCircle
            className={`${iconClass} text-green-500`}
            size={iconSize}
          />
        );
      case "error":
        return (
          <FiAlertCircle
            className={`${iconClass} text-red-500`}
            size={iconSize}
          />
        );
      case "info":
        return (
          <FiInfo className={`${iconClass} text-blue-500`} size={iconSize} />
        );
      case "warning":
        return (
          <FiAlertTriangle
            className={`${iconClass} text-amber-500`}
            size={iconSize}
          />
        );
      default:
        return null;
    }
  }
};

// Hook to manage toast state
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (
    message: string,
    type: ToastType = "info",
    options?: Omit<ToastProps, "message" | "type">
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, ...options };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, (options?.duration || 5000) + 500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (
      message: string,
      options?: Omit<ToastProps, "message" | "type">
    ) => showToast(message, "success", options),
    error: (message: string, options?: Omit<ToastProps, "message" | "type">) =>
      showToast(message, "error", options),
    info: (message: string, options?: Omit<ToastProps, "message" | "type">) =>
      showToast(message, "info", options),
    warning: (
      message: string,
      options?: Omit<ToastProps, "message" | "type">
    ) => showToast(message, "warning", options),
  };
};
