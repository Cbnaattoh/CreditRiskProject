import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiMail,
  FiEye,
  FiChevronDown,
  FiX,
} from "react-icons/fi";
import { RiShieldKeyholeLine } from "react-icons/ri";
import { IoMdColorPalette } from "react-icons/io";
import { FaChartLine, FaRegChartBar } from "react-icons/fa";
import { Tooltip } from "@mui/material";

interface Applicant {
  id: string;
  fullName: string;
  email: string;
  applicationDate: string;
  riskScore: number;
  confidenceScore: number;
  employmentType: string;
  monthlyIncome: string;
  existingDebts: string;
  bankStatement: string;
  phone: string;
}

const Applicants: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Sample data
  const applicants: Applicant[] = [
    {
      id: "1",
      fullName: "John Doe",
      email: "jd@gmail.com",
      applicationDate: "30/07/25",
      riskScore: 72,
      confidenceScore: 81,
      employmentType: "Self Employed",
      monthlyIncome: "GHS 250,000",
      existingDebts: "GHS 250,000",
      bankStatement: "Uploaded",
      phone: "+23345678967",
    },
    {
      id: "2",
      fullName: "John Doe",
      email: "jd@gmail.com",
      applicationDate: "30/07/25",
      riskScore: 40,
      confidenceScore: 81,
      employmentType: "Self Employed",
      monthlyIncome: "GHS 250,000",
      existingDebts: "GHS 250,000",
      bankStatement: "Uploaded",
      phone: "+23345678967",
    },
    {
      id: "3",
      fullName: "John Doe",
      email: "jd@gmail.com",
      applicationDate: "14/05/25",
      riskScore: 81,
      confidenceScore: 60,
      employmentType: "Self Employed",
      monthlyIncome: "GHS 250,000",
      existingDebts: "GHS 250,000",
      bankStatement: "Uploaded",
      phone: "+23345678967",
    },
  ];

  const filteredApplicants = applicants.filter(
    (applicant) =>
      applicant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsDetailOpen(true);
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "bg-red-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-green-500";
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6 transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-indigo-100 dark:bg-indigo-900/20 opacity-10 dark:opacity-5"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              width: Math.random() * 400 + 100,
              height: Math.random() * 400 + 100,
            }}
            animate={{
              x: [null, Math.random() * 100],
              y: [null, Math.random() * 100],
            }}
            transition={{
              duration: 40 + Math.random() * 40,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Applicants
          </motion.h1>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <motion.div
              className="relative flex-grow md:w-64"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email or role"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </motion.div>

            <motion.button
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus size={18} />
              <span>Add User</span>
            </motion.button>
          </div>
        </div>

        {/* Applicants Table */}
        <motion.div
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Application Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Risk Score
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confidence Score
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApplicants.map((applicant, index) => (
                  <motion.tr
                    key={applicant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                          {applicant.fullName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {applicant.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {applicant.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {applicant.applicationDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mr-2">
                          <div
                            className={`h-full rounded-full ${getRiskColor(
                              applicant.riskScore
                            )}`}
                            style={{ width: `${applicant.riskScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {applicant.riskScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mr-2">
                          <div
                            className={`h-full rounded-full ${getConfidenceColor(
                              applicant.confidenceScore
                            )}`}
                            style={{ width: `${applicant.confidenceScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {applicant.confidenceScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(applicant)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Applicant Details Modal */}
        <AnimatePresence>
          {isDetailOpen && selectedApplicant && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
              >
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Applicant Details
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedApplicant.fullName}'s application information
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDetailOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiX className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Applicant Overview */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Applicant Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Full Name
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.fullName}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Email
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Phone
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Application Date
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.applicationDate}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Employment Details */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Employment Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Employment Type
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.employmentType}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Monthly Income
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.monthlyIncome}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Existing Debts
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.existingDebts}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Bank Statement
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedApplicant.bankStatement}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Risk & Confidence */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Risk & Confidence
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Risk Score
                              </span>
                              <span className="text-sm font-bold">
                                {selectedApplicant.riskScore}%
                              </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className={`h-full rounded-full ${getRiskColor(
                                  selectedApplicant.riskScore
                                )}`}
                                style={{
                                  width: `${selectedApplicant.riskScore}%`,
                                }}
                              />
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {selectedApplicant.riskScore >= 70
                                ? "High Risk"
                                : selectedApplicant.riskScore >= 40
                                ? "Medium Risk"
                                : "Low Risk"}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confidence Score
                              </span>
                              <span className="text-sm font-bold">
                                {selectedApplicant.confidenceScore}%
                              </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className={`h-full rounded-full ${getConfidenceColor(
                                  selectedApplicant.confidenceScore
                                )}`}
                                style={{
                                  width: `${selectedApplicant.confidenceScore}%`,
                                }}
                              />
                            </div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {selectedApplicant.confidenceScore >= 80
                                ? "High Confidence"
                                : selectedApplicant.confidenceScore >= 60
                                ? "Medium Confidence"
                                : "Low Confidence"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            SHAP Insight
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Low income increases high risk
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Actions */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Actions
                        </h3>
                        <div className="space-y-3">
                          <motion.button
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiDownload size={18} />
                            <span>Download Report (PDF)</span>
                          </motion.button>
                          <motion.button
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FiMail size={18} />
                            <span>Contact Applicant</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Logs */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Logs
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Form submitted
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              30/05/2025
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Document upload
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              30/05/2025
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Risk Visualization */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Risk Factors
                        </h3>
                        <div className="h-40 flex items-center justify-center">
                          <div className="text-center">
                            <FaChartLine className="mx-auto text-4xl text-indigo-600 dark:text-indigo-400 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Risk factor visualization
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Applicants;
