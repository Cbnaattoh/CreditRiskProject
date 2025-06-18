import React from "react";
import { motion } from "framer-motion";
import { FiUser } from "react-icons/fi";
import Logo from "../../../../components/utils/Logo";
import { FEATURES, USER_TYPES } from "./constants";

interface SidePanelProps {
  userType: string;
  setUserType: (type: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ userType, setUserType }) => {
  return (
    <motion.div
      className="w-full md:w-2/5 bg-gradient-to-br from-indigo-900 to-blue-800 p-10 flex flex-col justify-between relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black opacity-5 to-transparent z-0" />
      <div className="relative z-10">
        <Logo />
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-white mt-8 leading-tight"
        >
          RiskGuard <span className="text-blue-300">Pro</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-blue-100 mt-2 text-lg"
        >
          AI-Powered Credit Risk Platform
        </motion.p>
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 grid gap-4"
      >
        {FEATURES.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white bg-opacity-10 p-4 rounded-xl backdrop-blur-sm border border-white border-opacity-10"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{feature.icon}</span>
              <div>
                <div className="text-blue-700 font-medium">{feature.title}</div>
                <div className="text-blue-400 text-sm">{feature.desc}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* User Type Selector */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-8"
      >
        <div className="flex items-center bg-blue-700 bg-opacity-30 rounded-xl p-4 border border-blue-400 border-opacity-20">
          <FiUser className="text-white mr-3 text-lg" />
          <div className="w-full">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full p-2 border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2 bg-white bg-opacity-90 relative z-[9999]"
              style={{ position: "relative", zIndex: 9999 }}
            >
              {USER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SidePanel;
