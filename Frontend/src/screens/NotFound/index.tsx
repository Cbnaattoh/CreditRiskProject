import { motion } from "framer-motion";
import { FiAlertTriangle, FiHome, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/utils/Logo";
import ParticlesBackground from "../Authentication/Login-SignUp/components/particlesBackground";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-6 transition-colors duration-500 bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Animated background elements */}
      <ParticlesBackground />
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-20 bg-indigo-200 dark:bg-indigo-400"
        animate={{
          x: [0, 30, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full filter blur-3xl opacity-15 bg-purple-200 dark:bg-purple-400"
        animate={{
          x: [0, -20, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-indigo-300 dark:bg-indigo-400 opacity-30"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 right-1/3 w-6 h-6 rounded-full bg-purple-300 dark:bg-purple-400 opacity-25"
        animate={{
          y: [0, 15, 0],
          x: [0, 10, 0],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl border p-12 transition-all duration-500 bg-white/90 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50 shadow-indigo-500/20 dark:shadow-indigo-500/10"
      >
        {/* Glass morphism effect */}
        <div className="absolute inset-0 rounded-3xl transition-opacity duration-500 bg-gradient-to-br from-white/60 via-indigo-50/30 to-purple-50/40 dark:from-gray-800/50 dark:via-gray-900/30 dark:to-indigo-900/40" />

        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Logo size="lg" />
            </motion.div>
          </div>

          {/* Animated 404 graphic */}
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative inline-block mb-8"
          >
            <div className="absolute inset-0 bg-red-500 dark:bg-red-400 rounded-full filter blur-xl opacity-20"></div>
            <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-2 shadow-xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/30 border-red-200/50 dark:border-red-700/50">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <FiAlertTriangle className="text-red-600 dark:text-red-400 text-5xl" />
              </motion.div>
            </div>
            <motion.div
              className="absolute -top-2 -right-2 text-2xl font-bold text-red-600 dark:text-red-400 bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-full border border-red-200/50 dark:border-red-700/50 shadow-lg backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              404
            </motion.div>
          </motion.div>

          <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-xl mb-8 leading-relaxed text-gray-600 dark:text-gray-300">
            Our risk algorithms couldn't hedge against this missing page.
          </p>

          {/* Search bar */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileFocus={{ scale: 1.02 }}
            className="relative max-w-md mx-auto mb-10"
          >
            <input
              type="text"
              placeholder="Search RiskGuard..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/50 border-gray-300/70 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 hover:border-gray-400/80 dark:hover:border-gray-500/70 shadow-lg"
            />
            <FiSearch className="absolute left-4 top-4 text-gray-400 dark:text-gray-500 text-xl" />
          </motion.div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/home")}
              className="flex items-center justify-center px-8 py-4 rounded-2xl font-semibold shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white shadow-indigo-500/30 dark:shadow-indigo-500/25"
            >
              <FiHome className="mr-2" />
              Back to Safety
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="px-8 py-4 rounded-2xl font-semibold shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-400/30 transition-all duration-300 bg-white/80 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/70 backdrop-blur-sm"
            >
              Recalibrate
            </motion.button>
          </div>

          {/* Risk assessment joke */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-2xl border inline-block shadow-lg backdrop-blur-sm bg-blue-50/80 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-700/30"
          >
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Risk Assessment:</span> This 404
              error carries a risk score of 0.04% (negligible)
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        <p>© {new Date().getFullYear()} RiskGuard Pro Quantum</p>
        <p className="mt-1">All dimensions secured</p>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
