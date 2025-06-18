import React from "react";
import { motion } from "framer-motion";
import { FormProvider } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { FiLock, FiCheck } from "react-icons/fi";
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
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              {...registerMethods.register("name")}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              {...registerMethods.register("email")}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-gray-400"
              placeholder="your@email.com"
            />
          </div>

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

          <div className="flex items-center">
            <input
              type="checkbox"
              {...registerMethods.register("acceptTerms")}
              id="terms"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
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
