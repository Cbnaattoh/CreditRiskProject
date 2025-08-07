import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  usePredictCreditScoreMutation, 
  useGetModelHealthQuery,
  type MLPredictionInput,
  type MLPredictionOutput 
} from '../../../components/redux/features/api/ml/mlApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../components/redux/features/auth/authSlice';

interface MLCreditScoreWidgetProps {
  userType: 'admin' | 'staff' | 'client';
  className?: string;
}

const MLCreditScoreWidget: React.FC<MLCreditScoreWidgetProps> = ({ 
  userType, 
  className = '' 
}) => {
  const user = useSelector(selectCurrentUser);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<MLPredictionInput>>({
    employment_length: '5 years',
    job_title: 'Software Engineer',
    home_ownership: 'RENT',
    delinquencies_2yr: 0,
    inquiries_6mo: 0,
    revolving_accounts_12mo: 0,
    public_records: 0,
    collections_12mo: 0,
  });

  const [predictCreditScore, { 
    data: prediction, 
    isLoading: isPredicting, 
    error: predictionError 
  }] = usePredictCreditScoreMutation();

  const { 
    data: modelHealth, 
    isLoading: isHealthLoading 
  } = useGetModelHealthQuery();

  const handleInputChange = (field: keyof MLPredictionInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }

    try {
      await predictCreditScore(formData as MLPredictionInput).unwrap();
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  const isFormValid = () => {
    const required = [
      'annual_income', 'loan_amount', 'interest_rate', 
      'debt_to_income_ratio', 'credit_history_length', 'total_accounts'
    ];
    return required.every(field => formData[field as keyof MLPredictionInput]);
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low risk': return 'text-green-600 bg-green-50';
      case 'medium risk': return 'text-yellow-600 bg-yellow-50';
      case 'high risk': return 'text-red-600 bg-red-50';
      case 'very high risk': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'exceptional': return 'text-green-700 bg-green-100';
      case 'very good': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Sample data for demo purposes (only show for client users)
  const sampleFormData: MLPredictionInput = {
    annual_income: 150000,
    loan_amount: 75000,
    interest_rate: 12.5,
    debt_to_income_ratio: 25,
    credit_history_length: 7,
    total_accounts: 8,
    employment_length: '5 years',
    job_title: 'Software Engineer',
    home_ownership: 'RENT',
    revolving_utilization: 15,
    open_accounts: 5,
    delinquencies_2yr: 0,
    inquiries_6mo: 1,
    revolving_accounts_12mo: 1,
    public_records: 0,
    collections_12mo: 0,
  };

  const loadSampleData = () => {
    setFormData(sampleFormData);
  };

  if (userType === 'client') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Credit Assessment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get your credit score prediction</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {modelHealth?.status === 'healthy' && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">AI Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Button */}
        {!showForm && (
          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
            >
              Calculate My Credit Score
            </motion.button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Powered by Ghana-specialized ML model
            </p>
          </div>
        )}

        {/* Prediction Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900 dark:text-white">Credit Information</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={loadSampleData}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Load Sample
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Annual Income (GHS)
                    </label>
                    <input
                      type="number"
                      value={formData.annual_income || ''}
                      onChange={(e) => handleInputChange('annual_income', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="150000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Loan Amount (GHS)
                    </label>
                    <input
                      type="number"
                      value={formData.loan_amount || ''}
                      onChange={(e) => handleInputChange('loan_amount', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="75000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.interest_rate || ''}
                      onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="12.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Debt-to-Income Ratio (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.debt_to_income_ratio || ''}
                      onChange={(e) => handleInputChange('debt_to_income_ratio', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="25"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Credit History (Years)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.credit_history_length || ''}
                      onChange={(e) => handleInputChange('credit_history_length', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="7"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Accounts
                    </label>
                    <input
                      type="number"
                      value={formData.total_accounts || ''}
                      onChange={(e) => handleInputChange('total_accounts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="8"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Job Title
                    </label>
                    <select
                      value={formData.job_title || ''}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Job Title</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Banker">Banker</option>
                      <option value="Government Worker">Government Worker</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Home Ownership
                    </label>
                    <select
                      value={formData.home_ownership || ''}
                      onChange={(e) => handleInputChange('home_ownership', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="OWN">Own</option>
                      <option value="RENT">Rent</option>
                      <option value="MORTGAGE">Mortgage</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isPredicting || !isFormValid()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    {isPredicting ? 'Analyzing...' : 'Get Credit Score'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prediction Results */}
        <AnimatePresence>
          {prediction && prediction.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800"
            >
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {prediction.credit_score}
                </div>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(prediction.category)}`}>
                  {prediction.category}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getRiskColor(prediction.risk_level)}`}>
                    {prediction.risk_level}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Risk Level</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {prediction.confidence?.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Confidence</div>
                </div>
              </div>

              {prediction.ghana_employment_analysis && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ghana Employment Analysis
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div><strong>Category:</strong> {prediction.ghana_employment_analysis.job_category}</div>
                    <div><strong>Stability Score:</strong> {prediction.ghana_employment_analysis.stability_score}</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {(predictionError || (prediction && !prediction.success)) && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-sm text-red-700 dark:text-red-300">
              {prediction?.error || 'Failed to get credit score prediction'}
            </div>
          </div>
        )}
      </div>
    );
  }

  // For admin/staff users - show model health and statistics
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ML Model Status</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ghana-specialized credit scoring</p>
          </div>
        </div>
      </div>

      {isHealthLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      ) : modelHealth ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              modelHealth.status === 'healthy' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {modelHealth.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{modelHealth.accuracy}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Accuracy</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{modelHealth.ghana_employment_categories}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Job Categories</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div><strong>Model:</strong> {modelHealth.model_type}</div>
            <div><strong>Version:</strong> {modelHealth.version}</div>
            <div><strong>Features:</strong> {modelHealth.features_count}</div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-red-600 dark:text-red-400">
          Failed to load model status
        </div>
      )}
    </div>
  );
};

export default MLCreditScoreWidget;