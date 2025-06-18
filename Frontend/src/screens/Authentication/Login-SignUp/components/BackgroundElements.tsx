import React from "react";
import { motion } from "framer-motion";
import ParticlesBackground from "./particlesBackground";

interface BackgroundElementsProps {
  shake: boolean;
}

const BackgroundElements: React.FC<BackgroundElementsProps> = ({ shake }) => {
  return (
    <>
      <ParticlesBackground />

      {/* Animated Background Elements */}
      <motion.div
        className={`absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full filter blur-3xl opacity-20${
          shake ? " animate-shake" : ""
        }`}
        animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20"
        animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </>
  );
};

export default BackgroundElements;
