import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../Home/components/Sidebar";
import Header from "../../Home/components/Header";
import { ThemeToggle } from "../../Settings/components/ThemeToggle";
import TimedLogout from "../../../components/utils/common/TimedLogout";
import { useAuth } from "../../Authentication/Login-SignUp/components/hooks/useAuth";
import { useToast } from "../../../components/utils/Toast";
import { motion, AnimatePresence } from "framer-motion";

const MainLayout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Authentication hooks
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);

    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Authentication handlers
  const handleLogout = async () => {
    try {
      await logout();
      showToast("Session expired. You have been logged out.", "info");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Error during logout. Please try again.", "error");
    }
  };

  const handleSessionExtended = () => {
    console.log("Session extended successfully");
    showToast("Session refreshed and extended", "success");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar isMobile={isMobile} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-transparent to-purple-50/10 dark:from-indigo-900/10 dark:via-transparent dark:to-purple-900/5 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <ThemeToggle />
        </motion.div>
      </AnimatePresence>

      <TimedLogout
        isActive={!!user}
        onLogout={handleLogout}
        onSessionExtended={handleSessionExtended}
        showToast={showToast}
        sessionDuration={15}
        warningThreshold={5}
        gracePeriod={120}
        variant="default"
        enableActivityDetection={true}
        debugMode={false}
      />
    </div>
  );
};

export default MainLayout;
