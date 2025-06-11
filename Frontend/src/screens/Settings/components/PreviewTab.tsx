import { motion } from "framer-motion";
import { useState } from "react";
import {
  FiEdit,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import { SettingCard } from "./SettingCard";

export const PreviewTab = () => {
  const [gender, setGender] = useState("male");
  const [maritalStatus, setMaritalStatus] = useState("married");

  return (
    <motion.div
      key="preview"
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
        Profile Preview
      </motion.h3>

      {/* Basic Information */}
      <SettingCard>
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Basic Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
              Afriyle
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Other Names
            </label>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
              Kelvin
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["male", "female", "other"].map((option) => (
              <motion.button
                key={option}
                onClick={() => setGender(option)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  gender === option
                    ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md"
                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Marital Status
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["single", "married", "divorced", "widowed"].map((status) => (
              <motion.button
                key={status}
                onClick={() => setMaritalStatus(status)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  maritalStatus === status
                    ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md"
                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>
      </SettingCard>

      {/* Contact Information */}
      <SettingCard>
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Contact Information
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium flex items-center justify-between">
              <span>jon@gmail.com</span>
              <div className="flex space-x-2">
                <motion.button className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg">
                  <FiEdit />
                </motion.button>
                <motion.button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <FiX />
                </motion.button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium flex items-center justify-between">
              <span>+1 (555) 123-4567</span>
              <div className="flex space-x-2">
                <motion.button className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg">
                  <FiEdit />
                </motion.button>
                <motion.button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <FiX />
                </motion.button>
              </div>
            </div>
          </div>

          <motion.button className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-dashed border-indigo-200 dark:border-indigo-700/50 text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-center">
            <span className="mr-2">+</span>
            Add New Contact Method
          </motion.button>
        </div>
      </SettingCard>

      {/* Address Information */}
      <SettingCard>
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Address Information
        </h4>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
                United States
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State/Region
              </label>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
                California
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Street Address
            </label>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
              123 Main St, Apt 4B
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
                San Francisco
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ZIP Code
              </label>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-medium">
                94107
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-4">
            <motion.button className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">
              Cancel
            </motion.button>
            <motion.button className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all font-medium">
              Save Changes
            </motion.button>
          </div>
        </div>
      </SettingCard>

      {/* Social Media Connections */}
      <SettingCard>
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Social Connections
        </h4>

        <div className="space-y-4">
          {[
            { name: "Google", connected: true, color: "bg-red-500" },
            { name: "Facebook", connected: true, color: "bg-blue-600" },
            { name: "Twitter", connected: false, color: "bg-blue-400" },
            {
              name: "GitHub",
              connected: false,
              color: "bg-gray-800 dark:bg-gray-700",
            },
          ].map((social, index) => (
            <motion.div
              key={social.name}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-full ${social.color} flex items-center justify-center text-white`}
                >
                  {social.name.charAt(0)}
                </div>
                <span className="font-medium">{social.name}</span>
              </div>
              {social.connected ? (
                <motion.button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-700/50">
                  Disconnect
                </motion.button>
              ) : (
                <motion.button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium border border-indigo-200 dark:border-indigo-700/50">
                  Connect
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </SettingCard>

      {/* Account Actions */}
      <SettingCard>
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Account Actions
        </h4>

        <div className="space-y-4">
          <motion.button className="w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between text-red-600 dark:text-red-400">
            <span>Delete Account</span>
            <FiChevronRight />
          </motion.button>

          <motion.button className="w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span>Deactivate Account</span>
            <FiChevronRight />
          </motion.button>

          <motion.button className="w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span>Export Data</span>
            <FiChevronRight />
          </motion.button>
        </div>
      </SettingCard>
    </motion.div>
  );
};
