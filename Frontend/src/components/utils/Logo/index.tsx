import React from "react";
import { motion } from "framer-motion";
import logo from "../../../assets//creditrisklogo.png"

const Logo: React.FC = () => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.1 }}
      className="flex items-center justify-center"
    >
      <img
        src={logo}
        alt="Credit Risk Logo"
        className="h-12 w-12 transition-all duration-300 hover:rotate-12"
      />
      <motion.span
        className="ml-2 text-xl font-bold text-indigo-600"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        RiskGuard
      </motion.span>
    </motion.div>
  );
};

export default Logo;
