import { motion } from "framer-motion";

interface ToggleSwitchProps {
  isOn: boolean;
  toggle: () => void;
  color: string;
}

export const ToggleSwitch = ({ isOn, toggle, color }: ToggleSwitchProps) => {
  const tapEffect = {
    scale: 0.98,
    transition: { type: "spring", stiffness: 1000, damping: 20 },
  };

  return (
    <motion.div
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
        isOn ? `bg-gradient-to-r ${color}` : "bg-gray-200 dark:bg-gray-600"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={tapEffect}
      onClick={toggle}
    >
      <motion.span
        className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-100 shadow-lg transition-all ${
          isOn ? "translate-x-7" : "translate-x-1"
        }`}
        layout
      />
    </motion.div>
  );
};
