import React from "react";
import { motion } from "framer-motion";
import { FormProvider } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import {
  FiLock,
  FiCheck,
  FiUser,
  FiMail,
  FiPhone,
  FiImage,
} from "react-icons/fi";
import { ANIMATION_VARIANTS } from "./constants";
import type { ActiveTab } from "./types";

interface RegisterFormProps {
  registerMethods: UseFormReturn<any>;
  setActiveTab: (tab: ActiveTab) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  registerMethods,
  setActiveTab,
}) => {
  return (
    <FormProvider {...registerMethods}>
      <motion.div
        key="register"
        {...ANIMATION_VARIANTS.formSlide}
        className="w-full"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Create Account
        </h2>
        <p className="text-gray-600 mb-8">
          Join our platform to access advanced credit risk analysis tools.
        </p>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...registerMethods.register("firstName")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                  placeholder="John"
                />
                <FiUser className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...registerMethods.register("lastName")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                  placeholder="Doe"
                />
                <FiUser className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                {...registerMethods.register("email")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                placeholder="your@email.com"
              />
              <FiMail className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                {...registerMethods.register("phoneNumber")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                placeholder="+1 (555) 123-4567"
              />
              <FiPhone className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          {/* Account Security */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                {...registerMethods.register("password")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                placeholder="••••••••"
              />
              <FiLock className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            <ul className="text-xs text-gray-500 mt-2 space-y-1">
              <li className="flex items-center">
                <FiCheck className="mr-1 text-green-500" /> At least 8
                characters
              </li>
              <li className="flex items-center">
                <FiCheck className="mr-1 text-green-500" /> One uppercase letter
              </li>
              <li className="flex items-center">
                <FiCheck className="mr-1 text-green-500" /> One number
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                {...registerMethods.register("confirmPassword")}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 pl-10"
                placeholder="••••••••"
              />
              <FiLock className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          {/* Profile Details */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Profile Picture
            </label>
            <div className="relative">
              <input
                type="file"
                {...registerMethods.register("profilePicture")}
                accept="image/*"
                className="w-full px-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <FiImage className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              User Type
            </label>
            <select
              {...registerMethods.register("userType")}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
              defaultValue="Administrator"
            >
              <option value="User">Client User</option>
              <option value="Manager">Compliance Auditor</option>
              <option value="Analyst">Risk Analyst</option>
            </select>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...registerMethods.register("mfaEnabled")}
                id="mfa"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="mfa" className="ml-2 block text-sm text-gray-700">
                Enable Multi-Factor Authentication (MFA)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...registerMethods.register("termsAccepted")}
                id="terms"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700"
              >
                I agree to the{" "}
                <a href="#" className="text-indigo-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-indigo-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
          >
            Create Account
          </motion.button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("login")}
                className="text-indigo-600 hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </FormProvider>
  );
};

export default RegisterForm;
