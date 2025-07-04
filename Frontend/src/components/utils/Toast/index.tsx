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
  const baseStyles = "rounded-xl shadow-lg overflow-hidden backdrop-blur-sm";
  const typeStyles = {
    success: "bg-green-50/95 border border-green-200",
    error: "bg-red-50/95 border border-red-200",
    info: "bg-blue-50/95 border border-blue-200",
    warning: "bg-amber-50/95 border border-amber-200",
  };
  return `${baseStyles} ${typeStyles[type]}`;
};

const getProgressBarColor = (type: ToastType): string => {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
  };
  return colors[type];
};

const getIcon = (type: ToastType) => {
  const iconClass = "flex-shrink-0";
  const icons = {
    success: <CheckIcon className={`${iconClass} text-green-600`} />,
    error: <AlertIcon className={`${iconClass} text-red-600`} />,
    info: <InfoIcon className={`${iconClass} text-blue-600`} />,
    warning: <WarningIcon className={`${iconClass} text-amber-600`} />,
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
        transform transition-all duration-300 ease-out w-full max-w-sm
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
        {/* Progress bar */}
        <div className="h-1 w-full bg-black/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${getProgressBarColor(
              type
            )}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Toast content */}
        <div className="p-4 flex items-start gap-3">
          <div className="mt-0.5">{getIcon(type)}</div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 break-words">
              {message}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="ml-2 p-1.5 rounded-full hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Close notification"
            type="button"
          >
            <CloseIcon className="text-gray-500 hover:text-gray-700" />
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
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
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
      <div className="space-y-2 pointer-events-auto">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              zIndex: 1000 + index,
              animationDelay: `${index * 100}ms`,
            }}
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
