import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiFileText,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiClock,
  FiSend,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiChevronRight,
  FiEye,
  FiDownload,
  FiChevronDown,
  FiMessageSquare,
  FiEdit3,
} from 'react-icons/fi';
import {
  useStartReviewMutation,
  useCompleteReviewMutation,
  useGetApplicationReviewsQuery,
  useAddApplicationCommentMutation,
  type CreditApplication,
  useVerifyDocumentMutation,
} from '../redux/features/api/applications/applicationsApi';

// Type definitions - avoiding import issues
interface ApplicationReview {
  id: number;
  application: string;
  reviewer: string;
  reviewer_name: string;
  application_reference: string;
  review_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
  decision?: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'ESCALATE';
  risk_assessment_score?: number;
  creditworthiness_rating?: string;
  general_remarks?: string;
  strengths?: string;
  concerns?: string;
  recommendation?: string;
  additional_info_required?: string;
  documents_required?: string[];
  review_started_at?: string;
  review_completed_at?: string;
  estimated_processing_days?: number;
  requires_second_opinion: boolean;
  second_reviewer?: string;
  second_review_comments?: string;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
  review_duration?: {
    days: number;
    hours: number;
    minutes: number;
  };
}

interface ReviewCompletionData {
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'ESCALATE';
  remarks?: string;
  risk_assessment_score?: number;
  creditworthiness_rating?: string;
  strengths?: string;
  concerns?: string;
  recommendation?: string;
  additional_info_required?: string;
  documents_required?: string[];
}
import ApplicationStatusTracker from '../ApplicationStatusTracker';

interface ApplicationReviewComponentProps {
  application: CreditApplication;
  onReviewCompleted?: () => void;
  isAnalyst: boolean;
}

const ApplicationReviewComponent: React.FC<ApplicationReviewComponentProps> = ({
  application,
  onReviewCompleted,
  isAnalyst,
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'applicant', 'financial', 'documents']));
  const [reviewData, setReviewData] = useState<Partial<ReviewCompletionData>>({
    decision: 'APPROVE',
    risk_assessment_score: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: reviews,
    isLoading: reviewsLoading,
  } = useGetApplicationReviewsQuery(application.id);

  const [startReview, { isLoading: startingReview }] = useStartReviewMutation();
  const [completeReview, { isLoading: completingReview }] = useCompleteReviewMutation();
  const [verifyDocument, { isLoading: verifyingDocument }] = useVerifyDocumentMutation();
  const [addComment, { isLoading: addingComment }] = useAddApplicationCommentMutation();

  const existingReview = reviews?.[0];
  const canStartReview = isAnalyst && !existingReview && application.status === 'SUBMITTED';
  const canCompleteReview = isAnalyst && existingReview?.review_status === 'IN_PROGRESS';

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleStartReview = async () => {
    try {
      await startReview({
        applicationId: application.id,
        estimatedDays: 5,
      }).unwrap();
      setShowReviewForm(true);
    } catch (error) {
      console.error('Failed to start review:', error);
    }
  };

  const handleVerifyDocument = async (documentId: number) => {
    try {
      console.log('Verifying document:', documentId);
      await verifyDocument({
        applicationId: application.id,
        documentId,
        verified: true,
        verificationNotes: 'Verified by analyst'
      }).unwrap();
      
      // Success feedback
      alert('Document verified successfully!');
    } catch (error: any) {
      console.error('Failed to verify document:', error);
      if (error?.data?.error) {
        alert(`Error: ${error.data.error}`);
      } else {
        alert('Failed to verify document. Please try again.');
      }
    }
  };

  const handleCompleteReview = async () => {
    if (!reviewData.decision || !reviewData.remarks) {
      return;
    }

    setIsSubmitting(true);
    try {
      await completeReview({
        applicationId: application.id,
        completionData: reviewData as ReviewCompletionData,
      }).unwrap();

      setShowReviewForm(false);
      setReviewData({ decision: 'APPROVE', risk_assessment_score: 50 });
      onReviewCompleted?.();
    } catch (error) {
      console.error('Failed to complete review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'APPROVE':
        return <FiCheck className="text-green-500" />;
      case 'REJECT':
        return <FiX className="text-red-500" />;
      case 'REQUEST_INFO':
        return <FiAlertCircle className="text-orange-500" />;
      case 'ESCALATE':
        return <FiTrendingUp className="text-purple-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'APPROVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'REJECT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'REQUEST_INFO':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'ESCALATE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
  };

  const SectionHeader: React.FC<{
    title: string;
    section: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }> = ({ title, section, icon, badge, badgeColor = 'bg-blue-100 text-blue-800' }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-lg"
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        {badge && (
          <span className={`px-2 py-1 text-xs rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      {expandedSections.has(section) ? (
        <FiChevronDown className="w-5 h-5 text-gray-500" />
      ) : (
        <FiChevronRight className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Application Review
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {application.reference_number}
            </p>
          </div>
          
          {existingReview ? (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDecisionColor(existingReview.decision || 'PENDING')}`}>
              <div className="flex items-center space-x-2">
                {getDecisionIcon(existingReview.decision || 'PENDING')}
                <span>{existingReview.decision?.replace('_', ' ') || 'In Progress'}</span>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              Not Started
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Application Overview */}
        <div>
          <SectionHeader
            title="Application Overview"
            section="overview"
            icon={<FiFileText className="w-5 h-5 text-blue-500" />}
            badge={`${application.loan_amount ? `GHS ${Number(application.loan_amount).toLocaleString()}` : 'Amount not specified'}`}
          />
          
          <AnimatePresence>
            {expandedSections.has('overview') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg mt-2 border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Applicant
                      </label>
                      <div className="mt-1">
                        <div className="flex items-center space-x-2">
                          <FiUser className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.applicant_info ? 
                              `${application.applicant_info.first_name} ${application.applicant_info.last_name}` :
                              'Unknown'
                            }
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {application.applicant_info?.email || 'No email'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Risk Score
                      </label>
                      <div className="mt-1">
                        {application.ml_assessment ? (
                          <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-sm font-medium ${getRiskScoreColor(application.ml_assessment.credit_score || 0)}`}>
                            <span>{application.ml_assessment.credit_score}</span>
                            <span className="text-xs">({application.ml_assessment.category})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Not assessed</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Submission Date
                      </label>
                      <div className="mt-1">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {application.submission_date ? 
                            new Date(application.submission_date).toLocaleDateString() :
                            'Not submitted'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Applicant Information */}
        <div>
          <SectionHeader
            title="Applicant Information"
            section="applicant"
            icon={<FiUser className="w-5 h-5 text-green-500" />}
            badge={application.applicant_info?.email || 'No email'}
          />
          
          <AnimatePresence>
            {expandedSections.has('applicant') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg mt-2 border border-gray-200 dark:border-gray-600">
                  {application.applicant_info && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Personal Details
                        </label>
                        <div className="mt-1 space-y-1">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <strong>Name:</strong> {application.applicant_info.first_name} {application.applicant_info.middle_name} {application.applicant_info.last_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Email:</strong> {application.applicant_info.email}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Phone:</strong> {application.applicant_info.phone_number}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Date of Birth:</strong> {application.applicant_info.date_of_birth}
                          </div>
                        </div>
                      </div>

                      {application.applicant_info.address && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Address
                          </label>
                          <div className="mt-1 text-sm text-gray-900 dark:text-white">
                            <div>{application.applicant_info.address.street_address}</div>
                            <div>{application.applicant_info.address.city}, {application.applicant_info.address.state}</div>
                            <div>{application.applicant_info.address.country} {application.applicant_info.address.postal_code}</div>
                          </div>
                        </div>
                      )}

                      {application.applicant_info.employment_history && application.applicant_info.employment_history[0] && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Employment
                          </label>
                          <div className="mt-1 space-y-1">
                            <div className="text-sm text-gray-900 dark:text-white">
                              <strong>Company:</strong> {application.applicant_info.employment_history[0].employer_name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Position:</strong> {application.applicant_info.employment_history[0].job_title}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Type:</strong> {application.applicant_info.employment_history[0].employment_type}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Income:</strong> GHS {application.applicant_info.employment_history[0].monthly_income ? Number(application.applicant_info.employment_history[0].monthly_income).toLocaleString() : 'Not provided'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Verified:</strong> {application.applicant_info.employment_history[0].income_verified ? '✅ Yes' : '❌ No'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Financial Information */}
        <div>
          <SectionHeader
            title="Financial Information"
            section="financial"
            icon={<FiTrendingUp className="w-5 h-5 text-yellow-500" />}
          />
          
          <AnimatePresence>
            {expandedSections.has('financial') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg mt-2 border border-gray-200 dark:border-gray-600">
                  {application.applicant_info?.financial_info && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Assets
                        </label>
                        <div className="mt-1 space-y-1">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <strong>Total Assets:</strong> GHS {application.applicant_info.financial_info.total_assets ? Number(application.applicant_info.financial_info.total_assets).toLocaleString() : 'Not provided'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Liquid Assets:</strong> GHS {application.applicant_info.financial_info.liquid_assets ? Number(application.applicant_info.financial_info.liquid_assets).toLocaleString() : 'Not provided'}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Liabilities
                        </label>
                        <div className="mt-1 space-y-1">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <strong>Total Liabilities:</strong> GHS {application.applicant_info.financial_info.total_liabilities ? Number(application.applicant_info.financial_info.total_liabilities).toLocaleString() : 'Not provided'}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Net Worth
                        </label>
                        <div className="mt-1">
                          {application.applicant_info.financial_info.total_assets && application.applicant_info.financial_info.total_liabilities ? (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              GHS {(Number(application.applicant_info.financial_info.total_assets) - Number(application.applicant_info.financial_info.total_liabilities)).toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 dark:text-gray-400">Cannot calculate</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Documents */}
        <div>
          <SectionHeader
            title="Documents"
            section="documents"
            icon={<FiFileText className="w-5 h-5 text-indigo-500" />}
            badge={`${application.documents?.length || 0} files`}
          />
          
          <AnimatePresence>
            {expandedSections.has('documents') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg mt-2 border border-gray-200 dark:border-gray-600">
                  {application.documents && application.documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {application.documents.map((document, index) => (
                        <motion.div 
                          key={index} 
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                <FiFileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                                  {document.document_type?.replace(/_/g, ' ') || 'Unknown Document'}
                                </span>
                                {document.file_name && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {document.file_name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                document.is_verified ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              }`}>
                                {document.is_verified ? 'Verified' : 'Pending Verification'}
                              </span>
                              {!document.is_verified && isAnalyst && (
                                <motion.button
                                  onClick={() => handleVerifyDocument(document.id)}
                                  className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="Mark as verified"
                                >
                                  <FiCheck className="w-3 h-3" />
                                </motion.button>
                              )}
                            </div>
                          </div>
                          
                          {/* Document Actions */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {document.uploaded_at && (
                                <span>Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              {document.file_url && (
                                <motion.button
                                  onClick={() => window.open(document.file_url, '_blank')}
                                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <FiEye className="w-3 h-3" />
                                  <span>View</span>
                                </motion.button>
                              )}
                              {document.file_url && (
                                <motion.a
                                  href={document.file_url}
                                  download={document.file_name}
                                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <FiDownload className="w-3 h-3" />
                                  <span>Download</span>
                                </motion.a>
                              )}
                            </div>
                          </div>
                          
                          {document.verification_notes && (
                            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Notes:</span> {document.verification_notes}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No documents uploaded yet
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Existing Review Details */}
        {existingReview && (
          <div>
            <SectionHeader
              title="Review Details"
              section="review"
              icon={<FiEdit3 className="w-5 h-5 text-purple-500" />}
              badge={existingReview.review_status}
              badgeColor="bg-purple-100 text-purple-800"
            />
            
            <AnimatePresence>
              {expandedSections.has('review') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg mt-2 border border-gray-200 dark:border-gray-600 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Reviewer
                        </label>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">
                          {existingReview.reviewer_name}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Risk Assessment Score
                        </label>
                        <div className="mt-1">
                          {existingReview.risk_assessment_score && (
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getRiskScoreColor(existingReview.risk_assessment_score)}`}>
                              {existingReview.risk_assessment_score}/100
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {existingReview.general_remarks && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          General Remarks
                        </label>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          {existingReview.general_remarks}
                        </div>
                      </div>
                    )}

                    {existingReview.strengths && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center">
                          <FiTrendingUp className="w-3 h-3 mr-1" />
                          Strengths
                        </label>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          {existingReview.strengths}
                        </div>
                      </div>
                    )}

                    {existingReview.concerns && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center">
                          <FiTrendingDown className="w-3 h-3 mr-1" />
                          Concerns
                        </label>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                          {existingReview.concerns}
                        </div>
                      </div>
                    )}

                    {existingReview.additional_info_required && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Additional Information Required
                        </label>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          {existingReview.additional_info_required}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Application Status Tracker */}
        <div>
          <SectionHeader
            title="Status & Activity Tracking"
            section="tracking"
            icon={<FiClock className="w-5 h-5 text-orange-500" />}
          />
          
          <AnimatePresence>
            {expandedSections.has('tracking') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2">
                  <ApplicationStatusTracker
                    applicationId={application.id}
                    currentStatus={application.status}
                    isClient={!isAnalyst}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {canStartReview && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartReview}
              disabled={startingReview}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <FiSend className="w-4 h-4" />
              <span>{startingReview ? 'Starting Review...' : 'Start Review'}</span>
            </motion.button>
          )}

          {canCompleteReview && !showReviewForm && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowReviewForm(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <FiCheck className="w-4 h-4" />
              <span>Complete Review</span>
            </motion.button>
          )}

          {/* Review Form */}
          <AnimatePresence>
            {showReviewForm && canCompleteReview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Complete Review</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Decision *
                      </label>
                      <select
                        value={reviewData.decision}
                        onChange={(e) => setReviewData({
                          ...reviewData,
                          decision: e.target.value as ReviewCompletionData['decision']
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="APPROVE">Approve</option>
                        <option value="REJECT">Reject</option>
                        <option value="REQUEST_INFO">Request More Information</option>
                        <option value="ESCALATE">Escalate to Senior Analyst</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Risk Assessment Score (1-100)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={reviewData.risk_assessment_score || ''}
                        onChange={(e) => setReviewData({
                          ...reviewData,
                          risk_assessment_score: parseInt(e.target.value) || undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      General Remarks *
                    </label>
                    <textarea
                      value={reviewData.remarks || ''}
                      onChange={(e) => setReviewData({ ...reviewData, remarks: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none"
                      placeholder="Provide your review comments here..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Strengths
                      </label>
                      <textarea
                        value={reviewData.strengths || ''}
                        onChange={(e) => setReviewData({ ...reviewData, strengths: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none"
                        placeholder="Positive aspects of the application..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Concerns
                      </label>
                      <textarea
                        value={reviewData.concerns || ''}
                        onChange={(e) => setReviewData({ ...reviewData, concerns: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none"
                        placeholder="Areas of concern or risk..."
                      />
                    </div>
                  </div>

                  {reviewData.decision === 'REQUEST_INFO' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional Information Required
                      </label>
                      <textarea
                        value={reviewData.additional_info_required || ''}
                        onChange={(e) => setReviewData({ ...reviewData, additional_info_required: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white resize-none"
                        placeholder="Specify what additional information is needed..."
                      />
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCompleteReview}
                      disabled={isSubmitting || !reviewData.decision || !reviewData.remarks}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReviewComponent;