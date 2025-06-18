import { motion } from "framer-motion";
import { FiAlertTriangle, FiHome, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Logo from "../../components/utils/Logo";
import ParticlesBackground from "../Authentication/Login-SignUp/components/particlesBackground";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex flex-col items-center justify-center relative overflow-hidden p-6">
      {/* Animated background elements */}
      <ParticlesBackground />
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full filter blur-3xl opacity-20"
        animate={{
          x: [0, 20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20"
        animate={{
          x: [0, -20, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-sm bg-opacity-90 border border-white border-opacity-20"
      >
        <div className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          {/* Animated 404 graphic */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative inline-block mb-8"
          >
            <div className="absolute inset-0 bg-red-500 rounded-full filter blur-xl opacity-20"></div>
            <div className="relative flex items-center justify-center w-32 h-32 bg-gradient-to-br from-red-100 to-red-50 rounded-full border-2 border-red-200">
              <FiAlertTriangle className="text-red-600 text-5xl" />
              <motion.div
                className="absolute text-6xl font-bold text-red-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                404
              </motion.div>
            </div>
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">
             Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Our risk algorithms couldn't hedge against this missing page.
          </p>

          {/* Search bar */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative max-w-md mx-auto mb-10"
          >
            <input
              type="text"
              placeholder="Search RiskGuard..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <FiSearch className="absolute left-4 top-3.5 text-gray-400 text-xl" />
          </motion.div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/home")}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all"
            >
              <FiHome className="mr-2" />
              Back to Safety
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
            >
              Recalibrate
            </motion.button>
          </div>

          {/* Risk assessment joke */}
          <div className="mt-12 p-4 bg-blue-50 rounded-xl border border-blue-100 inline-block">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Risk Assessment:</span> This 404
              error carries a risk score of 0.04% (negligible)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-gray-500"
      >
        <p>© {new Date().getFullYear()} RiskGuard Pro Quantum</p>
        <p className="mt-1">All dimensions secured</p>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
