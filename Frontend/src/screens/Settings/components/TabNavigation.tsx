import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useMotionValue, useTransform, animate } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TabNavigation = ({
  tabs,
  activeTab,
  setActiveTab,
}: TabNavigationProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    [
      "rgba(99, 102, 241, 0.1)",
      "rgba(255, 255, 255, 0)",
      "rgba(99, 102, 241, 0.1)",
    ]
  );

  const tapEffect = {
    scale: 0.98,
    transition: { type: "spring", stiffness: 1000, damping: 20 },
  };

  return (
    <div className="relative px-6 md:px-8 pt-6 md:pt-8">
      <motion.div className="flex justify-center" ref={constraintsRef}>
        <motion.div
          className="flex bg-gray-100/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full p-1 shadow-inner border border-white/20 dark:border-gray-600/30"
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          style={{ x, background }}
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => {
                animate(x, 0, { type: "spring" });
                setActiveTab(tab.id);
              }}
              className={`relative z-10 px-6 py-3 rounded-full flex items-center justify-center transition-all ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              }`}
              whileHover={isDragging ? {} : { scale: 1.05 }}
              whileTap={tapEffect}
            >
              <span className="mr-2">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${tab.color} z-[-1]`}
                  transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.6,
                  }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};
