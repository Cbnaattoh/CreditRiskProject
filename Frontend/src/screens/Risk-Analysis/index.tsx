import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
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
import { FiRefreshCw, FiAlertCircle, FiPlay, FiBarChart, FiTrendingUp, FiShield, FiActivity, FiCpu, FiStar, FiAward, FiZap } from "react-icons/fi";
import { toast } from "react-hot-toast";

const PredictionOutcome: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('id');
  const [selectedView, setSelectedView] = useState<'overview' | 'factors'>('overview');
  
  // API queries
  const { 
    data: application, 
    isLoading: applicationLoading, 
    error: applicationError 
  } = useGetApplicationQuery(applicationId || '', { skip: !applicationId });
  
  // Dummy implementations to replace risk API calls
  const riskAnalysis = null;
  const analysisLoading = false;
  const analysisError = null;
  const refetchAnalysis = () => {};
  
  const riskAssessment = null;
  const assessmentLoading = false;
  
  const modelPredictions = null;
  const predictionsLoading = false;

  // Get ML Assessment data (primary source of truth)
  const { 
    data: mlAssessment, 
    isLoading: mlAssessmentLoading,
    error: mlAssessmentError 
  } = useGetApplicationMLAssessmentQuery(applicationId || '', { skip: !applicationId });

  // Debug ML Assessment query (temporary)
  console.log('🔍 ML Assessment Query Debug:', {
    applicationId,
    mlAssessment,
    mlAssessmentLoading,
    mlAssessmentError,
    hasMLAssessment: !!mlAssessment
  });
  
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
    
    // Debug logging
    console.log('🔍 Risk Analysis Debug:', {
      mlAssessment,
      application,
      riskAnalysis,
      applicationId
    });
    
    // ML Assessment based factors (primary)
    if (mlAssessment) {
      console.log('✅ Using ML Assessment data for risk factors');
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
      console.log('📋 Adding factors from application data');
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
      console.log('⚡ Using traditional risk analysis data');
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
      console.log('⚠️ Using demo/sample data - no real data available');
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

    const finalFactors = factors.sort((a, b) => b.value - a.value).slice(0, 6);
    console.log('📊 Final risk factors:', finalFactors);
    return finalFactors;
  }, [mlAssessment, application, riskAnalysis]);
  
  if (!applicationId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <FiAlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Application Selected
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please select an application from the applications list to view risk analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const isLoading = applicationLoading || mlAssessmentLoading;
  
  // Enhanced confidence score using ML assessment data first
  const confidenceScore = mlAssessment?.confidence ? 
    Math.round(mlAssessment.confidence) : 
    modelPredictions?.[0]?.confidence ? 
    Math.round(modelPredictions[0].confidence * 100) : 82;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/10 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 overflow-hidden"
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-indigo-400/10"></div>
          
          {/* Animated background dots */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="absolute top-12 right-12 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <FiActivity className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  Risk Analysis Dashboard
                </h1>
                {mlAssessment && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium rounded-full flex items-center space-x-1"
                  >
                    <FiZap className="h-3 w-3" />
                    <span>AI-Powered</span>
                  </motion.div>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {application && (
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {application.applicant_info?.first_name?.[0]}{application.applicant_info?.last_name?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Application: <span className="font-bold text-blue-600 dark:text-blue-400">{application.reference_number}</span>
                      </p>
                      {application.applicant_info && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {application.applicant_info.first_name} {application.applicant_info.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Comprehensive AI-powered analysis of the applicant's credit risk profile
                </p>
              </div>
            </div>
            <div className="mt-6 sm:mt-0 flex items-center space-x-4">
              {!riskAnalysis && !analysisLoading && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRunAnalysis}
                  disabled={isRunningAnalysis}
                  className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white text-sm font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform-gpu"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  {isRunningAnalysis ? (
                    <FiRefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FiPlay className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  )}
                  <span className="relative z-10">
                    {isRunningAnalysis ? 'Running Analysis...' : 'Run Risk Analysis'}
                  </span>
                </motion.button>
              )}
              {riskAnalysis && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={refetchAnalysis}
                  disabled={analysisLoading}
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <FiRefreshCw className={`h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200 ${analysisLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </motion.button>
              )}
            </div>
          </div>
          </div>
          
          {/* Premium Status Indicators with ML Data */}
          {(mlAssessment || riskAssessment) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="group relative p-6 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300/60 dark:hover:border-blue-600/60 transition-all duration-300 hover:shadow-xl backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FiShield className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Credit Score
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {mlAssessment?.credit_score || 
                       (riskAssessment?.risk_score ? Math.round(riskAssessment.risk_score) : 'N/A')}
                    </p>
                    {mlAssessment && (
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg inline-block">
                        {mlAssessment.category}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="group relative p-6 bg-gradient-to-br from-white via-emerald-50/50 to-green-50/30 dark:from-gray-800 dark:via-emerald-900/20 dark:to-green-900/10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 transition-all duration-300 hover:shadow-xl backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                      mlAssessment?.risk_level === 'Low Risk' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                      mlAssessment?.risk_level === 'Medium Risk' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                      mlAssessment?.risk_level === 'High Risk' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                      'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}>
                      <FiBarChart className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Risk Level
                    </p>
                    <p className={`text-2xl font-bold mb-1 ${
                      mlAssessment?.risk_level === 'Low Risk' ? 'text-green-600 dark:text-green-400' :
                      mlAssessment?.risk_level === 'Medium Risk' ? 'text-yellow-600 dark:text-yellow-400' :
                      mlAssessment?.risk_level === 'High Risk' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-700 dark:text-gray-200'
                    }`}>
                      {mlAssessment?.risk_level || riskAssessment?.risk_rating || 'Pending'}
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="group relative p-6 bg-gradient-to-br from-white via-amber-50/50 to-yellow-50/30 dark:from-gray-800 dark:via-amber-900/20 dark:to-yellow-900/10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 hover:border-amber-300/60 dark:hover:border-amber-600/60 transition-all duration-300 hover:shadow-xl backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FiTrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Confidence
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {confidenceScore}%
                      </p>
                      <div className="flex items-center space-x-1">
                        {[...Array(Math.floor(confidenceScore / 20))].map((_, i) => (
                          <FiStar key={i} className="h-3 w-3 text-amber-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {mlAssessment && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="group relative p-6 bg-gradient-to-br from-white via-purple-50/50 to-indigo-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-indigo-900/10 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 hover:border-purple-300/60 dark:hover:border-purple-600/60 transition-all duration-300 hover:shadow-xl backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                        <FiCpu className="h-5 w-5 text-white" />
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${
                          mlAssessment.processing_status === 'COMPLETED' ? 'bg-green-400' :
                          mlAssessment.processing_status === 'FAILED' ? 'bg-red-400' :
                          'bg-yellow-400'
                        }`}></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        ML Status
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {mlAssessment.processing_status}
                      </p>
                      {mlAssessment.model_version && (
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg">
                            v{mlAssessment.model_version}
                          </p>
                          <FiAward className="h-3 w-3 text-purple-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* Premium View Selector */}
          <div className="mt-8">
            <div className="p-1 bg-gray-100/80 dark:bg-gray-700/60 rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50">
              <nav className="flex space-x-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedView('overview')}
                  className={`relative flex-1 flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    selectedView === 'overview'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                >
                  {selectedView === 'overview' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <FiBarChart className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">Overview</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedView('factors')}
                  className={`relative flex-1 flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    selectedView === 'factors'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                >
                  {selectedView === 'factors' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <FiTrendingUp className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">Risk Factors</span>
                </motion.button>
              </nav>
            </div>
          </div>
        </motion.div>
        
        {/* Premium Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 animate-pulse"></div>
            
            {/* Loading animation */}
            <div className="relative z-10">
              <div className="relative mx-auto mb-6 w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                <FiActivity className="absolute inset-0 m-auto h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent mb-2"
              >
                Loading Risk Analysis
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 font-medium"
              >
                Analyzing ML assessment data and risk factors...
              </motion.p>
              
              {/* Progress dots */}
              <div className="flex justify-center space-x-2 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Premium Error State */}
        {(applicationError || mlAssessmentError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-red-200/50 dark:border-red-700/50 p-8 overflow-hidden"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                    <FiAlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold text-gray-900 dark:text-white text-center mb-3"
              >
                Error Loading Data
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 dark:text-gray-300 text-center mb-6 font-medium"
              >
                Unable to load risk analysis data. Please try refreshing the page.
              </motion.p>
              
              {mlAssessmentError && !mlAssessment && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <FiAlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Partial Data Available
                    </p>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    ML assessment data unavailable. Traditional risk analysis may still be accessible.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Premium ML Assessment Promotion */}
        {!isLoading && !mlAssessment && !mlAssessmentLoading && application && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-blue-200/50 dark:border-blue-700/50 p-8 overflow-hidden shadow-xl"
          >
            {/* Background decorations */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
            
            <div className="relative z-10 flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiCpu className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <FiZap className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 dark:from-blue-100 dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                    Enhanced AI Risk Analysis Available
                  </h3>
                  <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold rounded-full">
                    NEW
                  </div>
                </div>
                
                <p className="text-blue-700 dark:text-blue-300 mb-4 font-medium leading-relaxed">
                  Get comprehensive ML-powered risk assessment with Ghana-specialized analysis. 
                  This will provide more accurate risk scoring and detailed insights.
                </p>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <FiActivity className="h-4 w-4" />
                    <span className="font-medium">Real-time Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <FiShield className="h-4 w-4" />
                    <span className="font-medium">Ghana-Specialized</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <FiAward className="h-4 w-4" />
                    <span className="font-medium">95% Accuracy</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRunAnalysis}
                  disabled={isRunningAnalysis}
                  className="relative px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform-gpu overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center space-x-2">
                    {isRunningAnalysis ? (
                      <FiRefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <FiZap className="h-5 w-5" />
                    )}
                    <span>{isRunningAnalysis ? 'Generating...' : 'Generate ML Assessment'}</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {!isLoading && !applicationError && (
          <>
            {selectedView === 'overview' && (
              <>
                {/* Premium Risk Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 overflow-hidden"
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                            <FiBarChart className="h-5 w-5 text-white" />
                          </div>
                          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                            Risk Level Distribution
                          </h2>
                        </div>
                        {mlAssessment && (
                          <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full">
                            AI-Powered
                          </div>
                        )}
                      </div>
                      
                      <div className="h-72 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-700/30 dark:to-blue-900/30 rounded-xl"></div>
                        <div className="relative z-10 h-full p-4">
                          <RiskLevelChart 
                            riskAssessment={riskAssessment}
                            riskAnalysis={riskAnalysis}
                            mlAssessment={mlAssessment}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl"></div>
                    <div className="relative z-10">
                      <ConfidenceScore 
                        score={confidenceScore}
                        modelPredictions={modelPredictions}
                        mlAssessment={mlAssessment}
                      />
                    </div>
                  </motion.div>
                </div>
                
                {/* Premium Comparative Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative z-10">
                    <ComparativeAnalysisTable 
                      riskAnalysis={riskAnalysis}
                      application={application}
                      mlAssessment={mlAssessment}
                    />
                  </div>
                </motion.div>
              </>
            )}

            {selectedView === 'factors' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 overflow-hidden"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5"></div>
                
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Key Risk Factors Analysis
                  </h2>
                  {mlAssessment && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 dark:text-green-400">ML Powered</span>
                    </div>
                  )}
                </div>
                
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
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Risk Factor
                            </span>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              item.source === 'ML Model' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                              item.source === 'Ghana ML Model' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                              item.source === 'Application Data' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {item.source}
                            </span>
                          </div>
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
                          
                          {/* Details */}
                          {item.details && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                              <span className="font-medium">Details:</span> {item.details}
                            </div>
                          )}
                          
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

export default PredictionOutcome;
