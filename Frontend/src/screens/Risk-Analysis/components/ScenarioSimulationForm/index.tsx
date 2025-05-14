import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { FiRefreshCw } from "react-icons/fi";

interface FormData {
  monthlyIncome: number;
  loanAmount: number;
  jobType: string;
  loanTerm: number;
}

const ScenarioSimulationForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>();
  const [result, setResult] = useState<{
    riskChange: number;
    newRiskLevel: string;
  } | null>(null);

  const handleRecalculate = (data: FormData) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const riskChange = Math.floor(Math.random() * 20) - 10; // Random change between -10 and +10
        const newRiskLevel =
          riskChange > 0
            ? "Increased"
            : riskChange < 0
            ? "Decreased"
            : "No Change";
        setResult({ riskChange, newRiskLevel });
        resolve(null);
      }, 1500);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Scenario Simulation
      </h3>

      <form onSubmit={handleSubmit(handleRecalculate)} className="space-y-4">
        <div>
          <label
            htmlFor="monthlyIncome"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Monthly Income (GHS)
          </label>
          <input
            type="number"
            id="monthlyIncome"
            {...register("monthlyIncome", { valueAsNumber: true })}
            placeholder="3000"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="loanAmount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Loan Amount (GHS)
          </label>
          <input
            type="number"
            id="loanAmount"
            {...register("loanAmount", { valueAsNumber: true })}
            placeholder="300"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="jobType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Employment Status
          </label>
          <select
            id="jobType"
            {...register("jobType")}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="employed">Employed</option>
            <option value="self-employed">Self-Employed</option>
            <option value="unemployed">Unemployed</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="loanTerm"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Loan Term (months)
          </label>
          <input
            type="number"
            id="loanTerm"
            {...register("loanTerm", { valueAsNumber: true })}
            placeholder="12"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="pt-2">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium hover:from-indigo-700 hover:to-blue-700 transition-colors ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <FiRefreshCw className="animate-spin h-5 w-5 mr-2" />
                Simulating...
              </span>
            ) : (
              "Simulate Scenario"
            )}
          </motion.button>
        </div>
      </form>

      {result && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200"
        >
          <h4 className="font-medium text-gray-900 mb-1">Simulation Result</h4>
          <p className="text-sm">
            Risk score would {result.newRiskLevel.toLowerCase()} by{" "}
            {Math.abs(result.riskChange)}%
          </p>
          <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                result.riskChange > 0 ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.abs(result.riskChange)}%` }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ScenarioSimulationForm;
