import React, { useState, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
// Temporarily disable risk API to focus on ML assessment data
// import { 
//   useGetRiskAnalysisQuery,
//   useRunRiskAnalysisMutation,
//   useGetRiskAssessmentQuery,
//   useGetModelPredictionsQuery 
// } from "../../components/redux/features/api/risk/riskApi";
// import type { RiskAnalysisData } from "../../components/redux/features/api/risk/riskApi";
import { useGetApplicationQuery, useGetApplicationMLAssessmentQuery } from "../../components/redux/features/api/applications/applicationsApi";
import RiskLevelChart from "./components/RiskLevelChart";
import ConfidenceScore from "./components/ConfidenceScore";
import ComparativeAnalysisTable from "./components/ComparativeAnalysisTable";
import DownloadReportButton from "./components/DownloadReportButton";
import { FiRefreshCw, FiAlertCircle, FiPlay, FiBarChart, FiTrendingUp, FiShield } from "react-icons/fi";
import { toast } from "react-hot-toast";

/**
 * Application-specific Risk Analysis component
 * This component handles the /risk-analysis/:applicationId route
 */
const ApplicationRisk: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [selectedView, setSelectedView] = useState<'overview' | 'factors'>('overview');
  
  if (!applicationId) {
    return <Navigate to="/home/loan-applications" replace />;
  }
  
  // API queries using the applicationId from URL params
  const { 
    data: application, 
    isLoading: applicationLoading, 
    error: applicationError 
  } = useGetApplicationQuery(applicationId);
  
  // Get ML Assessment data (primary source of truth)
  const { 
    data: mlAssessment, 
    isLoading: mlAssessmentLoading,
    error: mlAssessmentError 
  } = useGetApplicationMLAssessmentQuery(applicationId);
  
  // Dummy implementations to replace risk API calls
  const riskAnalysis = null;
  const analysisLoading = false;
  const analysisError = null;
  const refetchAnalysis = () => {};
  
  const riskAssessment = null;
  const assessmentLoading = false;
  
  const modelPredictions = null;
  const predictionsLoading = false;
  
  // Dummy implementation for run analysis
  const runAnalysis = async () => {};
  const isRunningAnalysis = false;
  
  const handleRunAnalysis = async () => {
    if (!applicationId) return;
    
    try {
      await runAnalysis({ applicationId }).unwrap();
      toast.success('Risk analysis completed successfully');
      refetchAnalysis();
    } catch (error) {
      toast.error('Failed to run risk analysis');
    }
  };
  
  // Enhanced risk factors using ML assessment data
  const keyRiskFactors = useMemo(() => {
    const factors = [];
    
    // ML Assessment based factors (primary)
    if (mlAssessment) {
      // Credit Score Factor
      const creditScoreImpact = mlAssessment.credit_score >= 700 ? 0.2 : 
                               mlAssessment.credit_score >= 600 ? 0.5 : 0.8;
      factors.push({
        factor: "Credit Score Assessment",
        impact: creditScoreImpact > 0.6 ? 'High' : creditScoreImpact > 0.3 ? 'Medium' : 'Low',
        trend: mlAssessment.risk_level === 'Low Risk' ? 'Improving' : 'Concerning',
        value: creditScoreImpact,
        source: 'ML Model',
        details: `${mlAssessment.credit_score} (${mlAssessment.category})`
      });

      // Model Confidence Factor
      const confidenceFactor = 1 - (mlAssessment.confidence / 100);
      factors.push({
        factor: "Model Confidence",
        impact: confidenceFactor > 0.4 ? 'High' : confidenceFactor > 0.2 ? 'Medium' : 'Low',
        trend: mlAssessment.confidence >= 80 ? 'Stable' : 'Uncertain',
        value: confidenceFactor,
        source: 'ML Model',
        details: `${mlAssessment.confidence.toFixed(1)}% confidence`
      });

      // Ghana Employment Factor
      if (mlAssessment.ghana_employment_score) {
        const employmentRisk = 1 - (mlAssessment.ghana_employment_score / 100);
        factors.push({
          factor: "Employment Stability (Ghana)",
          impact: employmentRisk > 0.6 ? 'High' : employmentRisk > 0.3 ? 'Medium' : 'Low',
          trend: mlAssessment.ghana_job_stability_score && mlAssessment.ghana_job_stability_score > 70 ? 'Stable' : 'Variable',
          value: employmentRisk,
          source: 'Ghana ML Model',
          details: `${mlAssessment.ghana_job_category} - ${mlAssessment.ghana_employment_score}/100`
        });
      }

      // Risk Level Factor
      const riskLevelValue = mlAssessment.risk_level === 'High Risk' ? 0.9 :
                            mlAssessment.risk_level === 'Medium Risk' ? 0.6 : 0.3;
      factors.push({
        factor: "Overall Risk Assessment",
        impact: riskLevelValue > 0.7 ? 'High' : riskLevelValue > 0.4 ? 'Medium' : 'Low',
        trend: 'Current',
        value: riskLevelValue,
        source: 'ML Model',
        details: mlAssessment.risk_level
      });
    }

    // Application data factors
    if (application) {
      // Debt-to-Income if available
      if (application.debt_to_income_ratio) {
        const dtiRisk = application.debt_to_income_ratio / 100;
        factors.push({
          factor: "Debt-to-Income Ratio",
          impact: dtiRisk > 0.5 ? 'High' : dtiRisk > 0.3 ? 'Medium' : 'Low',
          trend: dtiRisk > 0.4 ? 'Concerning' : 'Acceptable',
          value: dtiRisk,
          source: 'Application Data',
          details: `${application.debt_to_income_ratio}%`
        });
      }

      // Credit History Length
      if (application.credit_history_length) {
        const historyRisk = Math.max(0, 1 - (application.credit_history_length / 10));
        factors.push({
          factor: "Credit History Length",
          impact: historyRisk > 0.6 ? 'High' : historyRisk > 0.3 ? 'Medium' : 'Low',
          trend: application.credit_history_length >= 5 ? 'Established' : 'Limited',
          value: historyRisk,
          source: 'Application Data',
          details: `${application.credit_history_length} years`
        });
      }

      // Delinquencies
      if (application.delinquencies_2yr !== null && application.delinquencies_2yr !== undefined) {
        const delinquencyRisk = Math.min(1, application.delinquencies_2yr * 0.3);
        factors.push({
          factor: "Recent Delinquencies",
          impact: delinquencyRisk > 0.5 ? 'High' : delinquencyRisk > 0.2 ? 'Medium' : 'Low',
          trend: application.delinquencies_2yr === 0 ? 'Clean' : 'Concerning',
          value: delinquencyRisk,
          source: 'Application Data',
          details: `${application.delinquencies_2yr} in last 2 years`
        });
      }
    }

    // Fallback to traditional risk analysis if available
    if (factors.length === 0 && riskAnalysis?.risk_explanation?.key_factors) {
      return Object.entries(riskAnalysis.risk_explanation.key_factors)
        .map(([factor, data]: [string, any]) => {
          const importance = Math.abs(data.importance || data.shap_value || 0);
          return {
            factor: factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            impact: importance > 0.7 ? 'High' : importance > 0.4 ? 'Medium' : 'Low',
            trend: data.trend || 'Stable',
            value: importance,
            source: 'Risk Analysis',
            details: 'Traditional risk assessment'
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    }

    // Final fallback for demo purposes
    if (factors.length === 0) {
      return [
        {
          factor: "High Debt-to-Income Ratio",
          impact: "High",
          trend: "Increasing",
          value: 0.75,
          source: 'Demo Data',
          details: 'Sample risk factor'
        },
        {
          factor: "Short Credit History",
          impact: "Medium",
          trend: "Stable",
          value: 0.45,
          source: 'Demo Data',
          details: 'Sample risk factor'
        }
      ];
    }

    return factors.sort((a, b) => b.value - a.value).slice(0, 6);
  }, [mlAssessment, application, riskAnalysis]);
  
  const isLoading = applicationLoading || mlAssessmentLoading;
  
  // Enhanced confidence score using ML assessment data first
  const confidenceScore = mlAssessment?.confidence ? 
    Math.round(mlAssessment.confidence) : 
    modelPredictions?.[0]?.confidence ? 
    Math.round(modelPredictions[0].confidence * 100) : 82;
  
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
                Risk Analysis Dashboard
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
                  Comprehensive analysis of the applicant's credit risk profile
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              {!riskAnalysis && !analysisLoading && (
                <button
                  onClick={handleRunAnalysis}
                  disabled={isRunningAnalysis}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunningAnalysis ? (
                    <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FiPlay className="h-4 w-4 mr-2" />
                  )}
                  {isRunningAnalysis ? 'Running Analysis...' : 'Run Risk Analysis'}
                </button>
              )}
              {riskAnalysis && (
                <button
                  onClick={refetchAnalysis}
                  disabled={analysisLoading}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <FiRefreshCw className={`h-4 w-4 mr-2 ${analysisLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
            </div>
          </div>
          
          {/* Enhanced Status Indicators with ML Data */}
          {(mlAssessment || riskAssessment) && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FiShield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Credit Score
                  </p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                    {mlAssessment?.credit_score || 
                     (riskAssessment?.risk_score ? Math.round(riskAssessment.risk_score) : 'N/A')}
                  </p>
                  {mlAssessment && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {mlAssessment.category}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FiBarChart className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Risk Level
                  </p>
                  <p className={`text-lg font-bold ${
                    mlAssessment?.risk_level === 'Low Risk' ? 'text-green-600 dark:text-green-400' :
                    mlAssessment?.risk_level === 'Medium Risk' ? 'text-yellow-600 dark:text-yellow-400' :
                    mlAssessment?.risk_level === 'High Risk' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-700 dark:text-gray-200'
                  }`}>
                    {mlAssessment?.risk_level || riskAssessment?.risk_rating || 'Pending'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FiTrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Confidence
                  </p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                    {confidenceScore}%
                  </p>
                </div>
              </div>

              {mlAssessment && (
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="h-5 w-5 mr-3 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${
                      mlAssessment.processing_status === 'COMPLETED' ? 'bg-green-500' :
                      mlAssessment.processing_status === 'FAILED' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ML Status
                    </p>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                      {mlAssessment.processing_status}
                    </p>
                    {mlAssessment.model_version && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        v{mlAssessment.model_version}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* View Selector */}
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedView('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedView === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FiBarChart className="h-4 w-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setSelectedView('factors')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedView === 'factors'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FiTrendingUp className="h-4 w-4 inline mr-2" />
                Risk Factors
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
            <p className="text-gray-600 dark:text-gray-300">Loading risk analysis data...</p>
          </motion.div>
        )}
        
        {/* Error State */}
        {(applicationError || mlAssessmentError) && (
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
              Unable to load risk analysis data. Please try refreshing the page.
            </p>
          </motion.div>
        )}

        {/* Content */}
        {!isLoading && !applicationError && (
          <>
            {selectedView === 'overview' && (
              <>
                {/* Risk Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Risk Level Distribution
                    </h2>
                    <div className="h-64">
                      <RiskLevelChart 
                        riskAssessment={riskAssessment}
                        riskAnalysis={riskAnalysis}
                        mlAssessment={mlAssessment}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <ConfidenceScore 
                      score={confidenceScore}
                      modelPredictions={modelPredictions}
                      mlAssessment={mlAssessment}
                    />
                  </motion.div>
                </div>
                
                {/* Comparative Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <ComparativeAnalysisTable 
                    riskAnalysis={riskAnalysis}
                    application={application}
                    mlAssessment={mlAssessment}
                  />
                </motion.div>
              </>
            )}

            {selectedView === 'factors' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Key Risk Factors Analysis
                </h2>
                {mlAssessment && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiShield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ML-Enhanced Risk Analysis
                      </p>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      This analysis uses Ghana-specialized machine learning model v{mlAssessment.model_version} 
                      with {mlAssessment.model_accuracy ? `${mlAssessment.model_accuracy}%` : 'high'} accuracy. 
                      Assessment completed on {new Date(mlAssessment.prediction_timestamp).toLocaleDateString()}.
                    </p>
                  </div>
                )}
                
                {!mlAssessment && !riskAnalysis?.risk_explanation && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Showing computed factors from application data - ML assessment recommended for comprehensive analysis
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {keyRiskFactors.map((item, index) => {
                    const impactColor = {
                      'High': 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
                      'Medium': 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
                      'Low': 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    }[item.impact];
                    
                    const impactTextColor = {
                      'High': 'text-red-700 dark:text-red-300',
                      'Medium': 'text-yellow-700 dark:text-yellow-300',
                      'Low': 'text-green-700 dark:text-green-300'
                    }[item.impact];
                    
                    return (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-lg hover:shadow-md transition-all ${impactColor}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Risk Factor
                          </span>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              item.impact === 'High' ? 'bg-red-500' :
                              item.impact === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className={`text-xs font-semibold ${impactTextColor}`}>
                              {item.impact}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm leading-tight">
                          {item.factor}
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Impact Level:</span>
                            <span className={`font-semibold ${impactTextColor}`}>{item.impact}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{item.trend}</span>
                          </div>
                          
                          {/* Impact Strength Bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  item.impact === 'High' ? 'bg-red-500' :
                                  item.impact === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, item.value * 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span>0%</span>
                              <span>{(item.value * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            
          </>
        )}

        {/* Action Buttons */}
        {!isLoading && !applicationError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-end"
          >
            <DownloadReportButton
              riskData={{
                riskLevel: mlAssessment?.risk_level || riskAssessment?.risk_rating || "Pending Analysis",
                confidenceScore: confidenceScore,
                riskScore: mlAssessment?.credit_score || riskAssessment?.risk_score,
                applicationRef: application?.reference_number,
                applicantName: application?.applicant_info 
                  ? `${application.applicant_info.first_name} ${application.applicant_info.last_name}`
                  : 'Unknown',
                metrics: riskAnalysis ? [] : [
                  {
                    name: "Monthly Income",
                    applicantValue: "GHS 4,000",
                    portfolioAvg: "GHS 3,200",
                    comparison: "better",
                  },
                ],
                keyFactors: keyRiskFactors,
                hasRealData: !!(riskAnalysis || mlAssessment),
                mlAssessment: mlAssessment ? {
                  creditScore: mlAssessment.credit_score,
                  category: mlAssessment.category,
                  riskLevel: mlAssessment.risk_level,
                  confidence: mlAssessment.confidence,
                  modelVersion: mlAssessment.model_version,
                  modelAccuracy: mlAssessment.model_accuracy,
                  ghanaJobCategory: mlAssessment.ghana_job_category,
                  ghanaEmploymentScore: mlAssessment.ghana_employment_score,
                  assessmentDate: mlAssessment.prediction_timestamp
                } : undefined
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ApplicationRisk;