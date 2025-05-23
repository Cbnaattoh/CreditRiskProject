import React from "react";
import { motion } from "framer-motion";
import ShapFeatureImpact from "./components/ShapFeatureImpact";
import FeatureImportanceScatterMatrix from "./components/FeatureImportanceHeatmap";
import BiasFairnessAssessment from "./components/BiasFairnessAssessment";

const PredictionExplainability: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Model Explainability
          </h1>
          <p className="text-gray-600 mt-2">
            Understand how the model makes decisions and assess its fairness
          </p>
        </motion.div>

        {/* SHAP Feature Impact */}
        <ShapFeatureImpact />

        {/* Feature Importance and Bias Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureImportanceScatterMatrix />
          <BiasFairnessAssessment />
        </div>

        {/* Additional Explanation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How to Interpret These Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">SHAP Values</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>
                  Positive values indicate features increasing credit risk
                </li>
                <li>
                  Negative values indicate features decreasing credit risk
                </li>
                <li>Magnitude shows relative importance</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Fairness Metrics
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Disparate Impact Ratio measures adverse impact</li>
                <li>Statistical Parity checks for equal outcomes</li>
                <li>Values outside thresholds may indicate bias</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PredictionExplainability;
