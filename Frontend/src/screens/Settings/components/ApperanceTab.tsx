import { motion } from "framer-motion";
import { useState } from "react";
import {
  FiSun,
  FiMoon,
  FiMonitor
} from "react-icons/fi";
import {IoMdColorPalette} from "react-icons/io"
import {BiFontSize,} from "react-icons/bi"
import { FaCheck } from "react-icons/fa";
import { SettingCard } from "./SettingCard";
import { useTheme } from "../hooks/useTheme";

export const AppearanceTab = () => {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState("medium");

  const themeOptions = [
    {
      id: "light",
      icon: <FiSun size={24} />,
      label: "Light",
      desc: "Bright and clean",
    },
    {
      id: "dark",
      icon: <FiMoon size={24} />,
      label: "Dark",
      desc: "Easy on the eyes",
    },
    {
      id: "system",
      icon: <FiMonitor size={24} />,
      label: "System",
      desc: "Match device setting",
    },
  ];

  return (
    <motion.div
      key="appearance"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="space-y-8"
    >
      <motion.h3
        className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Appearance Settings
      </motion.h3>

      {/* Theme Selection */}
      <SettingCard>
        <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <IoMdColorPalette className="mr-2 text-indigo-600 dark:text-indigo-400" />
          Theme Preferences
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => setTheme(option.id as any)}
              className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                theme === option.id
                  ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md"
                  : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <span className="mb-3">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {option.desc}
              </span>
              {theme === option.id && (
                <motion.div className="mt-3 text-indigo-600 dark:text-indigo-400">
                  <FaCheck />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </SettingCard>

      {/* Font Size */}
      <SettingCard>
        <h4 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <BiFontSize className="mr-2 text-indigo-600 dark:text-indigo-400" />
          Text Size
        </h4>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            {["small", "medium", "large"].map((size) => (
              <motion.button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-6 py-3 rounded-lg border-2 transition-all ${
                  fontSize === size
                    ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md"
                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </motion.button>
            ))}
          </div>
          <div className="mt-4">
            <div
              className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-all ${
                fontSize === "small"
                  ? "text-sm"
                  : fontSize === "medium"
                  ? "text-base"
                  : "text-lg"
              }`}
            >
              <p className="font-medium">Preview Text</p>
              <p className="text-gray-600 dark:text-gray-400">
                This is how your text will appear at this size setting.
              </p>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Accent Color */}
      <SettingCard>
        <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
          Accent Color
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {["indigo", "blue", "green", "red", "purple", "amber"].map(
            (color) => (
              <motion.button
                key={color}
                className={`h-10 rounded-full bg-${color}-500 border-2 ${
                  color === "indigo"
                    ? "border-indigo-700 dark:border-indigo-300"
                    : "border-transparent"
                }`}
              />
            )
          )}
        </div>
      </SettingCard>
    </motion.div>
  );
};
