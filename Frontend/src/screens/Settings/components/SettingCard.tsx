import { motion } from "framer-motion";

interface SettingCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SettingCard = ({ children, className = "" }: SettingCardProps) => {
  const hoverEffect = {
    scale: 1.02,
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { type: "spring", stiffness: 400, damping: 10 },
  };

  return (
    <motion.div
      className={`bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 ${className}`}
      whileHover={hoverEffect}
    >
      {children}
    </motion.div>
  );
};
