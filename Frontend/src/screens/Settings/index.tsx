import { useState} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./components/ThemeToggle";
import { TabNavigation } from "./components/TabNavigation";
import { AccountTab } from "./components/AccountTab";
import { SecurityTab } from "./components/SecurityTab";
import { AppearanceTab } from "./components/ApperanceTab";
import { PreviewTab } from "./components/PreviewTab";
import {FiUser, FiLayout} from "react-icons/fi"
import {RiShieldKeyholeLine} from "react-icons/ri";
import {IoMdColorPalette} from "react-icons/io"

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    {
      id: "account",
      label: "Account",
      icon: <FiUser />,
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "security",
      label: "Security",
      icon: <RiShieldKeyholeLine />,
      color: "from-blue-500 to-teal-600",
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <IoMdColorPalette />,
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "preview",
      label: "Preview",
      icon: <FiLayout />,
      color: "from-emerald-500 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-indigo-100 dark:bg-indigo-900/20 opacity-10 dark:opacity-5"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              width: Math.random() * 400 + 100,
              height: Math.random() * 400 + 100,
            }}
            animate={{
              x: [null, Math.random() * 100],
              y: [null, Math.random() * 100],
            }}
            transition={{
              duration: 40 + Math.random() * 40,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
          />
        ))}
      </div>

      <ThemeToggle />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="max-w-6xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50"
      >
        <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="p-6 md:p-8 pt-4 md:pt-6">
          <AnimatePresence mode="wait">
            {activeTab === "account" && <AccountTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "appearance" && <AppearanceTab />}
            {activeTab === "preview" && <PreviewTab />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountSettings;