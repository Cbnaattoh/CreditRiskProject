import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiActivity,
  FiMessageCircle,
} from 'react-icons/fi';
import {
  useGetApplicationStatusHistoryQuery,
  useGetApplicationActivitiesQuery,
  useGetApplicationCommentsQuery,
  useAddApplicationCommentMutation,
} from '../redux/features/api/applications/applicationsApi';

// Type definitions - avoiding import issues
interface ApplicationStatusHistory {
  id: number;
  application: string;
  previous_status?: string;
  new_status: string;
  status_display: {
    previous?: string;
    new: string;
  };
  changed_by?: string;
  changed_by_name: string;
  changed_at: string;
  reason?: string;
  system_generated: boolean;
}

interface ApplicationActivity {
  id: number;
  application: string;
  activity_type: string;
  activity_display: string;
  user?: string;
  user_name: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface ApplicationComment {
  id: number;
  application: string;
  author?: string;
  author_name: string;
  author_role: string;
  comment_type: 'INTERNAL' | 'CLIENT_VISIBLE' | 'CLIENT_MESSAGE' | 'SYSTEM';
  comment_type_display: string;
  content: string;
  parent_comment?: number;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at?: string;
  read_by?: string;
  attachment?: string;
  replies: ApplicationComment[];
}

interface ApplicationStatusTrackerProps {
  applicationId: string;
  currentStatus: string;
  isClient: boolean;
}

const ApplicationStatusTracker: React.FC<ApplicationStatusTrackerProps> = ({
  applicationId,
  currentStatus,
  isClient,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'activities' | 'comments'>('status');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');

  const {
    data: statusHistory,
    isLoading: statusLoading,
    error: statusError,
  } = useGetApplicationStatusHistoryQuery(applicationId);

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useGetApplicationActivitiesQuery(applicationId);

  const {
    data: comments,
    isLoading: commentsLoading,
    error: commentsError,
  } = useGetApplicationCommentsQuery(applicationId);

  const [addComment, { isLoading: addingComment }] = useAddApplicationCommentMutation();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FiFileText className="text-gray-500" />;
      case 'SUBMITTED':
        return <FiClock className="text-blue-500" />;
      case 'UNDER_REVIEW':
        return <FiUser className="text-yellow-500" />;
      case 'APPROVED':
        return <FiCheckCircle className="text-green-500" />;
      case 'REJECTED':
        return <FiXCircle className="text-red-500" />;
      case 'NEEDS_INFO':
        return <FiAlertCircle className="text-orange-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'NEEDS_INFO':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;

    try {
      console.log('Adding comment:', {
        applicationId,
        content: commentContent.trim(),
        commentType: isClient ? 'CLIENT_MESSAGE' : 'CLIENT_VISIBLE',
      });

      const result = await addComment({
        applicationId,
        content: commentContent.trim(),
        commentType: isClient ? 'CLIENT_MESSAGE' : 'CLIENT_VISIBLE',
      }).unwrap();

      console.log('Comment added successfully:', result);
      setCommentContent('');
      setShowCommentForm(false);
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Show user-friendly error message
      if (error?.data?.detail) {
        alert(`Error: ${error.data.detail}`);
      } else if (error?.message) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Failed to add comment. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const TabButton: React.FC<{
    tab: 'status' | 'activities' | 'comments';
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = ({ tab, label, icon, count }) => (
    <motion.button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg font-medium transition-all duration-300 relative overflow-hidden ${
        activeTab === tab
          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {activeTab === tab && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500"
          layoutId="activeTab"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className="relative flex items-center space-x-2 text-sm">
        {icon}
        <span className="hidden sm:inline">{label}</span>
        {count !== undefined && count > 0 && (
          <span className={`px-1.5 py-0.5 text-xs rounded-full font-semibold ${
            activeTab === tab ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
          }`}>
            {count}
          </span>
        )}
      </div>
    </motion.button>
  );

  return (
    <motion.div 
      className="bg-gradient-to-r from-white via-blue-50/20 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-700/50 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Modern Header with Status Timeline */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Application Progress</h3>
              <p className="text-indigo-100 text-sm">Track your application journey</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              {getStatusIcon(currentStatus)}
              <span className="font-medium">{currentStatus.replace('_', ' ')}</span>
            </div>
            <div className="text-indigo-100 text-xs">Current Status</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Compact Tab Navigation */}
        <div className="flex space-x-1 mb-6 p-1 bg-white dark:bg-gray-800/50 rounded-xl shadow-inner border border-gray-100 dark:border-gray-700">
          <TabButton
            tab="status"
            label="Progress"
            icon={<FiCalendar className="w-4 h-4" />}
            count={statusHistory?.length}
          />
          <TabButton
            tab="activities"
            label="Activity"
            icon={<FiActivity className="w-4 h-4" />}
            count={activities?.length}
          />
          <TabButton
            tab="comments"
            label="Messages"
            icon={<FiMessageCircle className="w-4 h-4" />}
            count={comments?.filter(c => c.comment_type === 'CLIENT_VISIBLE' || c.comment_type === 'CLIENT_MESSAGE')?.length}
          />
        </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'status' && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[200px]"
          >
            {statusLoading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">Loading...</div>
                </div>
              </div>
            ) : statusError ? (
              <div className="text-center py-12">
                <FiAlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-500 font-medium">Failed to load status history</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-gray-300"></div>
                
                <div className="space-y-6">
                  {statusHistory?.map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      className="relative flex items-start space-x-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          {getStatusIcon(item.new_status)}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {item.status_display.previous && (
                              <>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                  {item.status_display.previous}
                                </span>
                                <FiChevronDown className="w-3 h-3 text-gray-400" />
                              </>
                            )}
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.new_status)}`}>
                              {item.status_display.new}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(item.changed_at)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Updated by <span className="font-medium text-indigo-600">{item.changed_by_name}</span>
                        </p>
                        {item.reason && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              <span className="font-medium">Note:</span> {item.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'activities' && (
          <motion.div
            key="activities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[200px]"
          >
            {activitiesLoading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">Loading...</div>
                </div>
              </div>
            ) : activitiesError ? (
              <div className="text-center py-12">
                <FiAlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-500 font-medium">Failed to load activities</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities?.length === 0 ? (
                  <div className="text-center py-12">
                    <FiActivity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No activities yet</p>
                  </div>
                ) : (
                  activities?.map((activity, index) => (
                    <motion.div 
                      key={activity.id} 
                      className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                        <FiActivity className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {activity.activity_display}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {activity.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            by <span className="font-medium text-indigo-600">{activity.user_name}</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'comments' && (
          <motion.div
            key="comments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[200px]"
          >
            {commentsLoading ? (
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">Loading...</div>
                </div>
              </div>
            ) : commentsError ? (
              <div className="text-center py-12">
                <FiAlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-500 font-medium">Failed to load messages</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add Comment Button */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  {showCommentForm ? (
                    <motion.div 
                      className="space-y-3 bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700/50"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder={isClient ? "Ask a question or provide additional information..." : "Add a comment..."}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none transition-all"
                        rows={3}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {isClient ? "💡 Your message will be sent to the risk analyst" : "✍️ Add your comment"}
                        </span>
                        <div className="flex space-x-2">
                          <motion.button
                            onClick={handleAddComment}
                            disabled={addingComment || !commentContent.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {addingComment ? 'Sending...' : 'Send'}
                          </motion.button>
                          <button
                            onClick={() => {
                              setShowCommentForm(false);
                              setCommentContent('');
                            }}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      onClick={() => setShowCommentForm(true)}
                      className="w-full px-6 py-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <FiMessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{isClient ? "💬 Ask a question" : "💭 Add a comment"}</span>
                      </div>
                    </motion.button>
                  )}
                </div>

                {/* Comments List */}
                {comments?.length === 0 ? (
                  <div className="text-center py-12">
                    <FiMessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-gray-400 text-sm mt-1">Start a conversation with your risk analyst</p>
                  </div>
                ) : (
                  comments?.filter(c => isClient ? (c.comment_type === 'CLIENT_VISIBLE' || c.comment_type === 'CLIENT_MESSAGE') : true)
                    ?.map((comment, index) => (
                    <motion.div 
                      key={comment.id} 
                      className={`rounded-xl p-4 shadow-sm border ${
                        comment.comment_type === 'CLIENT_MESSAGE' 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 ml-8' 
                          : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            comment.comment_type === 'CLIENT_MESSAGE' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-500 text-white'
                          }`}>
                            {comment.comment_type === 'CLIENT_MESSAGE' ? <FiUser className="w-4 h-4" /> : <FiUser className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {comment.author_name}
                            </span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                              comment.comment_type === 'CLIENT_MESSAGE' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {comment.author_role}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed ml-11">
                        {comment.content}
                      </p>
                      
                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-11 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-3">
                          {comment.replies.map((reply) => (
                            <motion.div 
                              key={reply.id} 
                              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                                    {reply.author_name}
                                  </span>
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                                    {reply.author_role}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                {reply.content}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ApplicationStatusTracker;