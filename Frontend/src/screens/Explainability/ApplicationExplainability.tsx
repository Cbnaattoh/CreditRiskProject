import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  useGetRiskExplanationQuery,
  useGenerateRiskExplanationMutation,
  useGetModelPredictionsQuery,
  useGetCounterfactualExplanationsQuery 
} from "../../components/redux/features/api/risk/riskApi";
import { useGetApplicationQuery } from "../../components/redux/features/api/applications/applicationsApi";
import ShapFeatureImpact from "./components/ShapFeatureImpact";
import FeatureImportanceScatterMatrix from "./components/FeatureImportanceHeatmap";
import BiasFairnessAssessment from "./components/BiasFairnessAssessment";
import { FiRefreshCw, FiAlertCircle, FiEye, FiTrendingUp, FiBarChart } from "react-icons/fi";
import { toast } from "react-hot-toast";

/**
 * Application-specific Explainability component
 * This component handles the /explainability/:applicationId route
 */
const ApplicationExplainability: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [selectedView, setSelectedView] = useState<'shap' | 'features' | 'bias'>('shap');
  
  if (!applicationId) {
    return <Navigate to="/home/loan-applications" replace />;
  }
  
  // API queries using the applicationId from URL params
  const { 
    data: application, 
    isLoading: applicationLoading, 
    error: applicationError 
  } = useGetApplicationQuery(applicationId);
  
  const { 
    data: riskExplanation, 
    isLoading: explanationLoading, 
    error: explanationError,
    refetch: refetchExplanation
  } = useGetRiskExplanationQuery(applicationId);
  
  const { 
    data: modelPredictions, 
    isLoading: predictionsLoading 
  } = useGetModelPredictionsQuery(applicationId);
  
  const { 
    data: counterfactuals, 
    isLoading: counterfactualsLoading 
  } = useGetCounterfactualExplanationsQuery(applicationId);
  
  const [generateExplanation, { isLoading: isGenerating }] = useGenerateRiskExplanationMutation();
  
  const handleGenerateExplanation = async () => {
    try {
      await generateExplanation(applicationId).unwrap();
      toast.success('Risk explanation generated successfully');
      refetchExplanation();
    } catch (error) {
      toast.error('Failed to generate explanation');
    }
  };
  
  const isLoading = applicationLoading || explanationLoading || predictionsLoading || counterfactualsLoading;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Model Explainability
              </h1>
              <div className="mt-2 space-y-1">
                {application && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Application: <span className="font-medium">{application.reference_number}</span>
                    {application.applicant_info && (
                      <span className="ml-2">
                        ({application.applicant_info.first_name} {application.applicant_info.last_name})
                      </span>
                    )}
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-300">
                  Understand how the model makes decisions and assess its fairness
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              {!riskExplanation && !explanationLoading && (
                <button
                  onClick={handleGenerateExplanation}
                  disabled={isGenerating}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FiBarChart className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Explanation'}
                </button>
              )}
              {riskExplanation && (
                <button
                  onClick={refetchExplanation}
                  disabled={explanationLoading}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <FiRefreshCw className={`h-4 w-4 mr-2 ${explanationLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
            </div>
          </div>
          
          {/* View Selector */}
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedView('shap')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedView === 'shap'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FiEye className="h-4 w-4 inline mr-2" />
                SHAP Analysis
              </button>
              <button
                onClick={() => setSelectedView('features')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedView === 'features'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FiTrendingUp className="h-4 w-4 inline mr-2" />
                Feature Importance
              </button>
              <button
                onClick={() => setSelectedView('bias')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedView === 'bias'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FiBarChart className="h-4 w-4 inline mr-2" />
                Bias Assessment
              </button>
            </nav>
          </div>
        </motion.div>
        
        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center"
          >
            <FiRefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading explainability data...</p>
          </motion.div>
        )}
        
        {/* Error State */}
        {(applicationError || explanationError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8"
          >
            <div className="flex items-center justify-center text-red-500 mb-4">
              <FiAlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Error Loading Data
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Unable to load explainability data. Please try refreshing the page.
            </p>
          </motion.div>
        )}
        
        {/* Content */}
        {!isLoading && !applicationError && !explanationError && (
          <>
            {selectedView === 'shap' && (
              <>
                <ShapFeatureImpact 
                  riskExplanation={riskExplanation}
                  modelPredictions={modelPredictions}
                />
                
                {/* Risk Summary */}
                {riskExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Risk Explanation Summary
                    </h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {riskExplanation.summary}
                      </p>
                    </div>
                    
                    {riskExplanation.primary_factors && riskExplanation.primary_factors.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                          Primary Risk Factors
                        </h4>
                        <div className="space-y-2">
                          {riskExplanation.primary_factors.map(([factor, data], index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <span className={`text-sm font-semibold ${
                                data.importance > 0 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {data.importance > 0 ? '+' : ''}{(data.importance * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      Generated: {new Date(riskExplanation.generated_at).toLocaleString()}
                    </div>
                  </motion.div>
                )}
                
                {/* Counterfactuals */}
                {counterfactuals && counterfactuals.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      What-If Scenarios
                    </h3>
                    <div className="space-y-4">
                      {counterfactuals.slice(0, 3).map((counterfactual, index) => (
                        <div key={counterfactual.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {counterfactual.scenario}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {counterfactual.original_score.toFixed(0)} → {counterfactual.projected_score.toFixed(0)}
                              </span>
                              <span className={`text-sm font-semibold ${
                                counterfactual.score_change && counterfactual.score_change > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {counterfactual.score_change && counterfactual.score_change > 0 ? '+' : ''}
                                {counterfactual.score_change?.toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {counterfactual.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            )}
            
            {selectedView === 'features' && (
              <FeatureImportanceScatterMatrix 
                riskExplanation={riskExplanation}
                modelPredictions={modelPredictions}
              />
            )}
            
            {selectedView === 'bias' && (
              <BiasFairnessAssessment 
                riskExplanation={riskExplanation}
                application={application}
              />
            )}
          </>
        )}

        {/* Additional Explanation Section */}
        {!isLoading && !applicationError && !explanationError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              How to Interpret These Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">SHAP Values</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
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
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Feature Importance
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Shows which factors most influence the decision</li>
                  <li>Helps identify key risk drivers</li>
                  <li>Enables targeted risk mitigation strategies</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Fairness Metrics
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Disparate Impact Ratio measures adverse impact</li>
                  <li>Statistical Parity checks for equal outcomes</li>
                  <li>Values outside thresholds may indicate bias</li>
                </ul>
              </div>
            </div>
            
            {/* Model Information */}
            {modelPredictions && modelPredictions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Model Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Model Version:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {modelPredictions[0].model_version}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(modelPredictions[0].confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Prediction Date:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(modelPredictions[0].prediction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ApplicationExplainability;