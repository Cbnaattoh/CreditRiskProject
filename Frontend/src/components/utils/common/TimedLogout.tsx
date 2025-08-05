import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiClock,
  FiAlertTriangle,
  FiShield,
  FiActivity,
  FiLogOut,
  FiRefreshCw,
  FiX,
  FiPause,
  FiPlay,
  FiZap,
  FiEye,
  FiMousePointer,
} from "react-icons/fi";
import { FaKeyboard } from "react-icons/fa";
import { useSessionManager } from "../hooks/useSessionManager";

// Types
interface TimedLogoutProps {
  isActive: boolean;
  onLogout: () => void;
  onSessionExtended: () => void;
  showToast: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
  warningThreshold?: number;
  sessionDuration?: number;
  gracePeriod?: number;
  variant?: "default" | "critical" | "minimal";
  enableActivityDetection?: boolean;
  debugMode?: boolean;
}

interface ActivityStats {
  mouseMovements: number;
  keystrokes: number;
  clicks: number;
  scrolls: number;
  totalEvents: number;
  lastActivity: Date;
}

const TimedLogout: React.FC<TimedLogoutProps> = ({
  isActive,
  onLogout,
  onSessionExtended,
  showToast,
  warningThreshold = 5,
  sessionDuration = 30,
  gracePeriod = 120,
  variant = "default",
  enableActivityDetection = true,
  debugMode = false,
}) => {
  // State management
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration * 60);
  const [showWarning, setShowWarning] = useState(false);
  const [showFinalWarning, setShowFinalWarning] = useState(false);
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState(gracePeriod);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    mouseMovements: 0,
    keystrokes: 0,
    clicks: 0,
    scrolls: 0,
    totalEvents: 0,
    lastActivity: new Date(),
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActivityMonitor, setShowActivityMonitor] = useState(debugMode);

  // Refs for timers and activity tracking
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Variant configurations
  const variantConfig = {
    default: {
      warningGradient: "from-amber-500 via-orange-500 to-red-500",
      criticalGradient: "from-red-500 via-red-600 to-red-700",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      ringColor: "ring-amber-500 dark:ring-amber-400",
    },
    critical: {
      warningGradient: "from-red-500 via-red-600 to-red-700",
      criticalGradient: "from-red-600 via-red-700 to-red-800",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      ringColor: "ring-red-500 dark:ring-red-400",
    },
    minimal: {
      warningGradient: "from-gray-500 via-gray-600 to-gray-700",
      criticalGradient: "from-gray-600 via-gray-700 to-gray-800",
      iconBg: "bg-gray-100 dark:bg-gray-800",
      iconColor: "text-gray-600 dark:text-gray-400",
      ringColor: "ring-gray-500 dark:ring-gray-400",
    },
  };

  const styles = variantConfig[variant];

  // Auto logout handler
  const handleAutoLogout = useCallback(async () => {
    setIsProcessing(true);
    showToast("Session expired. Logging out...", "info");

    // Simulate logout process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onLogout();
    setIsProcessing(false);
  }, [onLogout, showToast]);

  // Session timer management
  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    setTimeRemaining(sessionDuration * 60);
    setShowWarning(false);
    setShowFinalWarning(false);
  }, [sessionDuration]);

  // Define session timer
  const startSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    sessionTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;

        if (newTime === warningThreshold * 60) {
          setShowWarning(true);
          showToast(
            `Session expires in ${warningThreshold} minutes`,
            "warning"
          );
        }

        if (newTime === 0) {
          setShowFinalWarning(true);
          setGracePeriodRemaining(gracePeriod);
          showToast(
            "Session expired! Extend now or you will be logged out.",
            "error"
          );

          const graceTimer = setInterval(() => {
            setGracePeriodRemaining((graceRemaining) => {
              if (graceRemaining <= 1) {
                clearInterval(graceTimer);
                handleAutoLogout();
                return 0;
              }
              return graceRemaining - 1;
            });
          }, 1000);
        }

        return newTime;
      });
    }, 1000);
  }, [warningThreshold, gracePeriod, showToast, handleAutoLogout]);

  // Activity detection
  const updateActivityStats = useCallback(
    (eventType: keyof Omit<ActivityStats, "totalEvents" | "lastActivity">) => {
      if (!enableActivityDetection) return;

      const now = new Date();
      const secondsSinceLastActivity =
        (now.getTime() - lastActivityRef.current.getTime()) / 1000;

      if (secondsSinceLastActivity < 0.5) return;

      lastActivityRef.current = now;

      setActivityStats((prev) => ({
        ...prev,
        [eventType]: prev[eventType] + 1,
        totalEvents: prev.totalEvents + 1,
        lastActivity: now,
      }));

      // Reset session timer on any activity
      if (isActive && !isSessionPaused) {
        
        // Clear existing timer
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
        }
        
        // Reset time and restart timer
        setTimeRemaining(sessionDuration * 60);
        setShowWarning(false);
        setShowFinalWarning(false);
        
        // Start new timer
        startSessionTimer();
      }
    },
    [enableActivityDetection, isActive, isSessionPaused, sessionDuration, startSessionTimer]
  );

  // Activity event handlers
  const handleMouseMove = useCallback(
    () => updateActivityStats("mouseMovements"),
    [updateActivityStats]
  );
  const handleKeyDown = useCallback(
    () => updateActivityStats("keystrokes"),
    [updateActivityStats]
  );
  const handleClick = useCallback(
    () => updateActivityStats("clicks"),
    [updateActivityStats]
  );
  const handleScroll = useCallback(
    () => updateActivityStats("scrolls"),
    [updateActivityStats]
  );

  // Setup activity listeners
  useEffect(() => {
    if (!enableActivityDetection || !isActive) {
      return;
    }


    const events = [
      ["mousemove", handleMouseMove],
      ["keydown", handleKeyDown],
      ["click", handleClick],
      ["scroll", handleScroll],
      ["touchstart", handleClick],
      ["touchmove", handleMouseMove],
      ["focus", handleClick],
      ["visibilitychange", handleClick],
    ] as const;

    events.forEach(([event, handler]) => {
      if (event === "visibilitychange") {
        document.addEventListener(event, handler, { passive: true });
      } else {
        document.addEventListener(event, handler, { passive: true });
        window.addEventListener(event, handler, { passive: true });
      }
    });

    // Test initial activity detection

    return () => {
      events.forEach(([event, handler]) => {
        if (event === "visibilitychange") {
          document.removeEventListener(event, handler);
        } else {
          document.removeEventListener(event, handler);
          window.removeEventListener(event, handler);
        }
      });
    };
  }, [
    enableActivityDetection,
    isActive,
    handleMouseMove,
    handleKeyDown,
    handleClick,
    handleScroll,
  ]);

  // Session manager hook
  const { extendSession, hasRefreshToken } = useSessionManager();

  // Session extension handler
  const handleExtendSession = useCallback(async () => {
    setIsProcessing(true);
    showToast("Extending session...", "info");

    try {
      const success = await extendSession();
      if (success) {
        resetSessionTimer();
        onSessionExtended();
        showToast("Session extended successfully!", "success");
      } else {
        showToast("Failed to extend session. Please login again.", "error");
        setTimeout(() => {
          handleAutoLogout();
        }, 2000);
      }
    } catch (error) {
      console.error('Session extension error:', error);
      showToast("Failed to extend session. Please login again.", "error");
      setTimeout(() => {
        handleAutoLogout();
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  }, [extendSession, resetSessionTimer, onSessionExtended, showToast]);

  // Pause/Resume session
  const toggleSessionPause = useCallback(() => {
    setIsSessionPaused((prev) => {
      const newState = !prev;
      if (newState) {
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
        }
        showToast("Session timer paused", "info");
      } else {
        startSessionTimer();
        showToast("Session timer resumed", "info");
      }
      return newState;
    });
  }, [startSessionTimer, showToast]);

  // Initialize session timer
  useEffect(() => {
    
    if (isActive && !isSessionPaused) {
      startSessionTimer();
    } else {
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isActive, isSessionPaused, startSessionTimer]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Get urgency level
  const getUrgencyLevel = () => {
    if (timeRemaining <= 0) return "critical";
    if (timeRemaining <= warningThreshold * 60) return "warning";
    return "normal";
  };

  const urgencyLevel = getUrgencyLevel();

  // Animation variants
  const modalVariants = {
    hidden: { scale: 0.8, y: 50, opacity: 0, rotateX: -15 },
    visible: {
      scale: 1,
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    exit: {
      scale: 0.8,
      y: 50,
      opacity: 0,
      rotateX: 15,
      transition: { duration: 0.3 },
    },
  };

  const pulseVariants = {
    normal: { scale: 1 },
    pulse: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.6, repeat: Infinity },
    },
  };

  return (
    <>
      {/* Session Status Indicator */}
      <AnimatePresence>
        {isActive && (showActivityMonitor || urgencyLevel !== "normal") && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50"
          >
            <motion.div
              variants={pulseVariants}
              animate={urgencyLevel === "critical" ? "pulse" : "normal"}
              className={`p-3 rounded-xl backdrop-blur-xl shadow-lg border ${
                urgencyLevel === "critical"
                  ? "bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : urgencyLevel === "warning"
                  ? "bg-amber-50/90 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  : "bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                  <FiClock className={`h-4 w-4 ${styles.iconColor}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isSessionPaused ? "Paused" : "Session time"}
                  </div>
                </div>
                {debugMode && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-2 border-l border-gray-200 dark:border-gray-700">
                    Events: {activityStats.totalEvents}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Monitor (Debug Mode) */}
      <AnimatePresence>
        {showActivityMonitor && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Activity Monitor
                </h3>
                <button
                  onClick={() => setShowActivityMonitor(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiMousePointer className="h-3 w-3 text-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Mouse
                    </span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {activityStats.mouseMovements}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaKeyboard className="h-3 w-3 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Keys
                    </span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {activityStats.keystrokes}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiActivity className="h-3 w-3 text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Clicks
                    </span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {activityStats.clicks}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-gray-500 dark:text-gray-400">
                    Last: {activityStats.lastActivity.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarning && !showFinalWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute inset-0 bg-black/40 dark:bg-black/60"
              onClick={() => setShowWarning(false)}
            />

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${styles.warningGradient}`}
              />

              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center flex-1">
                    <div
                      className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} ring-2 ring-white/50 dark:ring-gray-800/50 shadow-lg`}
                    >
                      <FiAlertTriangle
                        className={`h-6 w-6 ${styles.iconColor}`}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Session Warning
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Your session will expire soon
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWarning(false)}
                    className="ml-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Time Remaining
                      </span>
                    </div>
                    <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleExtendSession}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isProcessing ? "Extending..." : "Extend Session"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Warning Modal */}
      <AnimatePresence>
        {showFinalWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute inset-0 bg-black/60 dark:bg-black/80"
            />

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${styles.criticalGradient}`}
              />

              <div className="p-8">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 ring-4 ring-red-200 dark:ring-red-800/50 shadow-lg"
                  >
                    <FiZap className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </motion.div>

                  <h3 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                    Session Expired!
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Extend your session now or you will be automatically logged
                    out
                  </p>
                </div>

                <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {formatTime(gracePeriodRemaining)}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Time remaining to extend session
                    </div>
                  </div>

                  <div className="mt-4 bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FiShield className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-800 dark:text-red-200">
                        Your session will be terminated for security
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={handleAutoLogout}
                    disabled={isProcessing}
                    className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiLogOut className="mr-2 h-4 w-4 inline" />
                    Logout Now
                  </button>
                  <button
                    onClick={handleExtendSession}
                    disabled={isProcessing}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Extending...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="mr-2 h-4 w-4" />
                        Extend Session
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Controls (Debug Mode) */}
      {debugMode && (
        <div className="fixed bottom-4 left-4 z-50 space-y-2">
          <button
            onClick={toggleSessionPause}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-lg border border-gray-200 dark:border-gray-700"
          >
            {isSessionPaused ? (
              <FiPlay className="h-4 w-4" />
            ) : (
              <FiPause className="h-4 w-4" />
            )}
            <span>{isSessionPaused ? "Resume" : "Pause"}</span>
          </button>
          <button
            onClick={() => setShowActivityMonitor(!showActivityMonitor)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <FiEye className="h-4 w-4" />
            <span>Monitor</span>
          </button>
        </div>
      )}
    </>
  );
};

export default TimedLogout;
