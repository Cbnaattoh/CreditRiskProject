import React, { useEffect, useState, useCallback, useRef } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

interface ToastContainerProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

// Toast configuration
const TOAST_CONFIG = {
  duration: 5000,
  progressUpdateInterval: 50,
  exitDelay: 300,
} as const;

// Icon components
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width="20"
    height="20"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width="20"
    height="20"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width="20"
    height="20"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WarningIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width="20"
    height="20"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width="16"
    height="16"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// Utility functions
const getToastStyles = (type: ToastType): string => {
  const baseStyles =
    "rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border relative";
  const typeStyles = {
    success:
      "bg-green-50/90 dark:bg-green-900/30 border-green-200/50 dark:border-green-700/30 shadow-green-500/20 dark:shadow-green-500/10",
    error:
      "bg-red-50/90 dark:bg-red-900/30 border-red-200/50 dark:border-red-700/30 shadow-red-500/20 dark:shadow-red-500/10",
    info: "bg-blue-50/90 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-700/30 shadow-blue-500/20 dark:shadow-blue-500/10",
    warning:
      "bg-amber-50/90 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-700/30 shadow-amber-500/20 dark:shadow-amber-500/10",
  };
  return `${baseStyles} ${typeStyles[type]}`;
};

const getProgressBarColor = (type: ToastType): string => {
  const colors = {
    success: "bg-gradient-to-r from-green-500 to-emerald-500",
    error: "bg-gradient-to-r from-red-500 to-rose-500",
    info: "bg-gradient-to-r from-blue-500 to-indigo-500",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500",
  };
  return colors[type];
};

const getIcon = (type: ToastType) => {
  const iconClass = "flex-shrink-0";
  const icons = {
    success: (
      <CheckIcon
        className={`${iconClass} text-green-600 dark:text-green-400`}
      />
    ),
    error: (
      <AlertIcon className={`${iconClass} text-red-600 dark:text-red-400`} />
    ),
    info: (
      <InfoIcon className={`${iconClass} text-blue-600 dark:text-blue-400`} />
    ),
    warning: (
      <WarningIcon
        className={`${iconClass} text-amber-600 dark:text-amber-400`}
      />
    ),
  };
  return icons[type];
};

// Individual Toast Component
const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = TOAST_CONFIG.duration,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const progressRef = useRef<NodeJS.Timeout>();
  const dismissRef = useRef<NodeJS.Timeout>();
  const exitRef = useRef<NodeJS.Timeout>();

  const handleClose = useCallback(() => {
    if (isExiting) return;

    setIsExiting(true);
    setIsVisible(false);

    exitRef.current = setTimeout(() => {
      onClose?.();
    }, TOAST_CONFIG.exitDelay);
  }, [isExiting, onClose]);

  useEffect(() => {
    // Auto dismiss timer
    dismissRef.current = setTimeout(handleClose, duration);

    // Progress bar timer
    const progressStep = 100 / (duration / TOAST_CONFIG.progressUpdateInterval);
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - progressStep;
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, TOAST_CONFIG.progressUpdateInterval);

    // Cleanup function
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (dismissRef.current) clearTimeout(dismissRef.current);
      if (exitRef.current) clearTimeout(exitRef.current);
    };
  }, [duration, handleClose]);

  return (
    <div
      className={`
        transform transition-all duration-500 ease-out w-full max-w-sm
        ${
          isVisible
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={getToastStyles(type)}>
        {/* Glass morphism effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 via-white/30 to-white/20 dark:from-gray-800/50 dark:via-gray-900/30 dark:to-gray-800/20" />

        {/* Progress bar */}
        <div className="relative h-1 w-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${getProgressBarColor(
              type
            )}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Toast content */}
        <div className="relative p-5 flex items-start gap-4">
          <div className="mt-0.5 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
            {getIcon(type)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white break-words leading-relaxed">
              {message}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="ml-2 p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 backdrop-blur-sm border border-white/20 dark:border-gray-600/20 shadow-sm"
            aria-label="Close notification"
            type="button"
          >
            <CloseIcon className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<
  ToastContainerProps & {
    toasts: ToastProps[];
    removeToast: (id: string) => void;
  }
> = ({ toasts, removeToast, position = "top-right" }) => {
  const getPositionStyles = (): string => {
    const positions = {
      "top-right": "top-6 right-6",
      "top-left": "top-6 left-6",
      "bottom-right": "bottom-6 right-6",
      "bottom-left": "bottom-6 left-6",
    };
    return positions[position];
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed z-50 ${getPositionStyles()} pointer-events-none`}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="space-y-3 pointer-events-auto">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              zIndex: 1000 + index,
              animationDelay: `${index * 100}ms`,
            }}
            className="animate-in slide-in-from-right-full duration-500 ease-out"
          >
            <Toast {...toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newToast: ToastProps = {
        id,
        message,
        type,
        duration: duration || TOAST_CONFIG.duration,
      };

      setToasts((prev) => {
        const updatedToasts = [...prev, newToast];
        return updatedToasts.slice(-5);
      });
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "success", duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "error", duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "info", duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) =>
      showToast(message, "warning", duration),
    [showToast]
  );

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    info,
    warning,
  };
};
