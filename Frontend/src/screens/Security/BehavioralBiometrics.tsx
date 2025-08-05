import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiActivity,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiEdit,
  FiEye,
  FiFilter,
  FiSearch,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  useGetBehavioralBiometricsQuery,
  useGetHighRiskUsersQuery,
  useUpdateConfidenceScoreMutation,
} from '../../components/redux/features/api/security/securityApi';
import type { BehavioralBiometric } from '../../components/redux/features/api/security/securityApi';
import { formatDistanceToNow } from 'date-fns';

interface EditConfidenceModalProps {
  biometric: BehavioralBiometric | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, score: number) => void;
}

const EditConfidenceModal: React.FC<EditConfidenceModalProps> = ({
  biometric,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [newScore, setNewScore] = useState(0);

  React.useEffect(() => {
    if (biometric) {
      setNewScore(biometric.confidence_score);
    }
  }, [biometric]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (biometric) {
      onUpdate(biometric.id, newScore);
      onClose();
    }
  };

  if (!isOpen || !biometric) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Update Confidence Score
        </h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            User: {biometric.user_email}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current Score: {(biometric.confidence_score * 100).toFixed(1)}%
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Confidence Score
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={newScore}
              onChange={(e) => setNewScore(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium">{(newScore * 100).toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const BiometricCard: React.FC<{
  biometric: BehavioralBiometric;
  onEdit: (biometric: BehavioralBiometric) => void;
}> = ({ biometric, onEdit }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <FiTrendingUp className="w-4 h-4 text-green-500" />;
    if (score >= 0.5) return <FiActivity className="w-4 h-4 text-yellow-500" />;
    return <FiTrendingDown className="w-4 h-4 text-red-500" />;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <FiUser className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {biometric.user_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {biometric.user_email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(biometric.risk_level)}`}>
            {biometric.risk_level} RISK
          </span>
          <button
            onClick={() => onEdit(biometric)}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <FiEdit className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Score</span>
          <div className="flex items-center gap-2">
            {getConfidenceIcon(biometric.confidence_score)}
            <span className="font-medium text-gray-900 dark:text-white">
              {(biometric.confidence_score * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              biometric.confidence_score >= 0.8 ? 'bg-green-500' :
              biometric.confidence_score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${biometric.confidence_score * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Typing Pattern</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {Object.keys(biometric.typing_pattern || {}).length > 0 ? 'Available' : 'No data'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Mouse Movement</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {Object.keys(biometric.mouse_movement || {}).length > 0 ? 'Available' : 'No data'}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>Last Updated</span>
            <span>{formatDistanceToNow(new Date(biometric.last_updated), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BehavioralBiometrics: React.FC = () => {
  const [filters, setFilters] = useState({
    risk_level: '',
    is_active: '',
    search: '',
  });
  const [editingBiometric, setEditingBiometric] = useState<BehavioralBiometric | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: biometrics = [],
    isLoading,
    error,
    refetch,
  } = useGetBehavioralBiometricsQuery({
    risk_level: filters.risk_level || undefined,
    is_active: filters.is_active ? filters.is_active === 'true' : undefined,
  });

  const {
    data: highRiskUsers = [],
    isLoading: highRiskLoading,
  } = useGetHighRiskUsersQuery();

  const [updateConfidence] = useUpdateConfidenceScoreMutation();

  const filteredBiometrics = useMemo(() => {
    if (!filters.search) return biometrics;
    return biometrics.filter(biometric =>
      biometric.user_email.toLowerCase().includes(filters.search.toLowerCase()) ||
      biometric.user_name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [biometrics, filters.search]);

  const handleEditConfidence = (biometric: BehavioralBiometric) => {
    setEditingBiometric(biometric);
    setIsEditModalOpen(true);
  };

  const handleUpdateConfidence = async (id: number, confidence_score: number) => {
    try {
      await updateConfidence({ id, confidence_score }).unwrap();
    } catch (error) {
      console.error('Failed to update confidence score:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load behavioral data
          </h3>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FiActivity className="w-8 h-8 text-blue-500" />
            Behavioral Biometrics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage user behavioral patterns
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <FiUser className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Profiles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {biometrics.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <FiAlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Risk</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {highRiskUsers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Monitoring</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {biometrics.filter(b => b.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FiSearch className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filters.risk_level}
            onChange={(e) => setFilters(prev => ({ ...prev, risk_level: e.target.value }))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <select
            value={filters.is_active}
            onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.value }))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Biometrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredBiometrics.map((biometric) => (
            <BiometricCard
              key={biometric.id}
              biometric={biometric}
              onEdit={handleEditConfidence}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredBiometrics.length === 0 && (
        <div className="text-center py-12">
          <FiActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No behavioral profiles found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or refresh the data
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <EditConfidenceModal
        biometric={editingBiometric}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBiometric(null);
        }}
        onUpdate={handleUpdateConfidence}
      />
    </div>
  );
};

export default BehavioralBiometrics;