import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiHelpCircle,
  FiBook,
  FiMessageSquare,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiPlay,
  FiBookmark,
  FiThumbsUp,
  FiThumbsDown,
} from "react-icons/fi";

interface HelpTip {
  id: string;
  title: string;
  content: string;
  type: "tip" | "tutorial" | "warning" | "info";
  relatedLinks?: Array<{
    title: string;
    url: string;
  }>;
}

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
  tips?: HelpTip[];
}

const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  context = "general",
  tips = []
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ [key: string]: boolean | null }>({});

  // Default help tips based on context
  const getContextualTips = (context: string): HelpTip[] => {
    const contextTips: { [key: string]: HelpTip[] } = {
      general: [
        {
          id: "navigation",
          title: "Navigation Basics",
          content: "Use the sidebar to navigate between different sections. The dashboard provides an overview of all your activities and recent updates.",
          type: "info",
          relatedLinks: [
            { title: "Full User Guide", url: "/home/help" },
            { title: "Video Tutorial", url: "#" }
          ]
        },
        {
          id: "search",
          title: "Global Search",
          content: "Press Ctrl+K or click the search icon to quickly find applications, customers, or any content across the platform.",
          type: "tip",
          relatedLinks: [
            { title: "Search Tips", url: "/home/help" }
          ]
        }
      ],
      applications: [
        {
          id: "create-app",
          title: "Creating Applications",
          content: "Click the 'New Application' button to start the application process. Fill out all required fields marked with an asterisk (*) before submitting.",
          type: "tutorial",
          relatedLinks: [
            { title: "Application Guide", url: "/home/help" },
            { title: "Required Documents", url: "/home/help" }
          ]
        },
        {
          id: "status-tracking",
          title: "Status Tracking",
          content: "Applications move through different stages: Draft → Submitted → Under Review → Approved/Rejected. You can track progress in real-time.",
          type: "info"
        },
        {
          id: "document-upload",
          title: "Document Upload Tips",
          content: "Ensure documents are clear, in PDF or JPG format, and under 10MB. Bank statements should be from the last 3 months for best results.",
          type: "warning",
          relatedLinks: [
            { title: "Supported Formats", url: "/home/help" }
          ]
        }
      ],
      riskanalysis: [
        {
          id: "risk-scores",
          title: "Understanding Risk Scores",
          content: "Risk scores range from 0-100, where higher scores indicate higher risk. Scores above 70 are typically considered high risk and may require additional review.",
          type: "info",
          relatedLinks: [
            { title: "Risk Scoring Guide", url: "/home/help" },
            { title: "Factor Analysis", url: "/home/help" }
          ]
        },
        {
          id: "run-analysis",
          title: "Running Risk Analysis",
          content: "Click 'Run Risk Analysis' to generate a comprehensive risk assessment. This uses AI models to analyze various factors and provide detailed insights.",
          type: "tutorial"
        },
        {
          id: "interpreting-results",
          title: "Interpreting Results",
          content: "Focus on key risk factors highlighted in red or orange. These have the most impact on the final risk score and should be reviewed carefully.",
          type: "tip"
        }
      ],
      explainability: [
        {
          id: "shap-values",
          title: "SHAP Value Interpretation",
          content: "SHAP values show how each feature contributes to the final prediction. Positive values increase risk, negative values decrease it.",
          type: "info",
          relatedLinks: [
            { title: "SHAP Guide", url: "/home/help" },
            { title: "Feature Importance", url: "/home/help" }
          ]
        },
        {
          id: "bias-analysis",
          title: "Bias Detection",
          content: "Our models are continuously monitored for bias. The fairness metrics help ensure equitable treatment across all demographic groups.",
          type: "info"
        },
        {
          id: "counterfactuals",
          title: "What-If Scenarios",
          content: "Counterfactual explanations show what changes would be needed to achieve a different outcome, helping understand decision boundaries.",
          type: "tutorial"
        }
      ]
    };

    return contextTips[context] || contextTips.general;
  };

  const currentTips = tips.length > 0 ? tips : getContextualTips(context);
  const currentTip = currentTips[currentTipIndex];

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % currentTips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + currentTips.length) % currentTips.length);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tip": return "💡";
      case "tutorial": return "🎯";
      case "warning": return "⚠️";
      case "info": return "ℹ️";
      default: return "💡";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tip": return "from-yellow-500 to-orange-500";
      case "tutorial": return "from-blue-500 to-indigo-500";
      case "warning": return "from-red-500 to-pink-500";
      case "info": return "from-green-500 to-teal-500";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const handleFeedback = (helpful: boolean) => {
    setFeedback({ ...feedback, [currentTip.id]: helpful });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FiHelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Quick Help</h2>
                  <p className="opacity-90 text-sm">
                    {context.charAt(0).toUpperCase() + context.slice(1)} • {currentTips.length} tips available
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentTips.length > 0 && (
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                {/* Tip Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getTypeColor(currentTip.type)} flex items-center justify-center text-white shadow-lg`}>
                    <span className="text-lg">{getTypeIcon(currentTip.type)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {currentTip.title}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                      currentTip.type === 'tip' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      currentTip.type === 'tutorial' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      currentTip.type === 'warning' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {currentTip.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Tip Content */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {currentTip.content}
                  </p>
                </div>

                {/* Related Links */}
                {currentTip.relatedLinks && currentTip.relatedLinks.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Related Resources
                    </h4>
                    <div className="space-y-2">
                      {currentTip.relatedLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors text-sm group"
                        >
                          <FiExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          <span>{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Was this helpful?
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFeedback(true)}
                      className={`p-2 rounded-lg transition-colors ${
                        feedback[currentTip.id] === true
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <FiThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className={`p-2 rounded-lg transition-colors ${
                        feedback[currentTip.id] === false
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <FiThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation */}
            {currentTips.length > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={prevTip}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <FiChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  {currentTips.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTipIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentTipIndex
                          ? 'bg-indigo-600 dark:bg-indigo-400'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextTip}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <span>Next</span>
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors text-sm">
                  <FiBook className="h-4 w-4" />
                  <span>Full Help Center</span>
                </button>
                <button className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors text-sm">
                  <FiMessageSquare className="h-4 w-4" />
                  <span>Contact Support</span>
                </button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentTipIndex + 1} of {currentTips.length}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HelpModal;