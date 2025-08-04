import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiBook,
  FiHelpCircle,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiUsers,
  FiBarChart,
  FiFileText,
  FiCreditCard,
  FiTrendingUp,
  FiEye,
  FiChevronRight,
  FiPlay,
  FiDownload,
  FiExternalLink,
  FiMail,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiArrowRight,
  FiZap,
  FiStar,
  FiGlobe,
  FiX,
} from "react-icons/fi";

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  readTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  content: string;
}

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Help categories with comprehensive content
  const helpCategories: HelpCategory[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Learn the basics of using the Credit Risk Assessment Platform",
      icon: <FiBook className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
      articles: [
        {
          id: "platform-overview",
          title: "Platform Overview",
          description: "Understanding the main features and capabilities",
          readTime: "5 min",
          difficulty: "Beginner",
          tags: ["overview", "basics", "introduction"],
          content: "Welcome to the Credit Risk Assessment Platform! This comprehensive guide will walk you through the main features and help you get started with risk assessment and analysis."
        },
        {
          id: "first-login",
          title: "Your First Login",
          description: "Step-by-step guide for new users",
          readTime: "3 min",
          difficulty: "Beginner",
          tags: ["login", "setup", "authentication"],
          content: "Learn how to log in, set up your profile, and navigate the dashboard for the first time."
        },
        {
          id: "dashboard-navigation",
          title: "Dashboard Navigation",
          description: "Master the interface and find what you need",
          readTime: "7 min",
          difficulty: "Beginner",
          tags: ["navigation", "interface", "dashboard"],
          content: "Discover how to efficiently navigate through different sections of the platform and customize your workspace."
        }
      ]
    },
    {
      id: "applications",
      title: "Credit Applications",
      description: "Managing and processing credit applications effectively",
      icon: <FiFileText className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
      articles: [
        {
          id: "create-application",
          title: "Creating Applications",
          description: "How to create and submit new credit applications",
          readTime: "10 min",
          difficulty: "Intermediate",
          tags: ["applications", "creation", "forms"],
          content: "Learn the complete process of creating credit applications, including required documentation and data validation."
        },
        {
          id: "application-status",
          title: "Application Status Tracking",
          description: "Monitor application progress and status changes",
          readTime: "6 min",
          difficulty: "Beginner",
          tags: ["status", "tracking", "workflow"],
          content: "Understand different application statuses and how to track progress through the approval workflow."
        },
        {
          id: "document-management",
          title: "Document Management",
          description: "Upload, verify, and manage application documents",
          readTime: "8 min",
          difficulty: "Intermediate",
          tags: ["documents", "upload", "verification"],
          content: "Master document handling, including upload requirements, verification processes, and security measures."
        }
      ]
    },
    {
      id: "risk-analysis",
      title: "Risk Analysis",
      description: "Advanced risk assessment and scoring methodologies",
      icon: <FiBarChart className="h-6 w-6" />,
      color: "from-purple-500 to-purple-600",
      articles: [
        {
          id: "risk-scores",
          title: "Understanding Risk Scores",
          description: "How risk scores are calculated and interpreted",
          readTime: "12 min",
          difficulty: "Intermediate",
          tags: ["risk", "scoring", "interpretation"],
          content: "Dive deep into risk scoring methodologies, factors considered, and how to interpret results for decision making."
        },
        {
          id: "ml-models",
          title: "Machine Learning Models",
          description: "AI-powered risk assessment explained",
          readTime: "15 min",
          difficulty: "Advanced",
          tags: ["machine learning", "AI", "models"],
          content: "Understand how our AI models work, their accuracy, and how they enhance traditional risk assessment methods."
        },
        {
          id: "risk-factors",
          title: "Key Risk Factors",
          description: "Important factors in credit risk assessment",
          readTime: "9 min",
          difficulty: "Intermediate",
          tags: ["factors", "analysis", "assessment"],
          content: "Learn about the most important risk factors and how they impact overall risk assessment scores."
        }
      ]
    },
    {
      id: "explainability",
      title: "AI Explainability",
      description: "Understanding AI decisions and model transparency",
      icon: <FiEye className="h-6 w-6" />,
      color: "from-orange-500 to-orange-600",
      articles: [
        {
          id: "shap-analysis",
          title: "SHAP Value Analysis",
          description: "Understanding feature importance and model decisions",
          readTime: "11 min",
          difficulty: "Advanced",
          tags: ["SHAP", "explainability", "features"],
          content: "Learn how SHAP values help explain individual predictions and understand feature contributions to model decisions."
        },
        {
          id: "bias-detection",
          title: "Bias Detection & Fairness",
          description: "Ensuring fair and unbiased AI decisions",
          readTime: "13 min",
          difficulty: "Advanced",
          tags: ["bias", "fairness", "ethics"],
          content: "Understand how we detect and mitigate bias in AI models to ensure fair treatment across all demographics."
        },
        {
          id: "counterfactuals",
          title: "Counterfactual Explanations",
          description: "What-if scenarios and alternative outcomes",
          readTime: "10 min",
          difficulty: "Intermediate",
          tags: ["counterfactuals", "scenarios", "alternatives"],
          content: "Explore how counterfactual explanations help understand what changes could lead to different outcomes."
        }
      ]
    },
    {
      id: "security",
      title: "Security & Compliance",
      description: "Data protection, privacy, and regulatory compliance",
      icon: <FiShield className="h-6 w-6" />,
      color: "from-red-500 to-red-600",
      articles: [
        {
          id: "data-security",
          title: "Data Security Measures",
          description: "How we protect your sensitive information",
          readTime: "8 min",
          difficulty: "Beginner",
          tags: ["security", "encryption", "protection"],
          content: "Learn about our comprehensive security measures including encryption, access controls, and monitoring."
        },
        {
          id: "compliance",
          title: "Regulatory Compliance",
          description: "Meeting industry standards and regulations",
          readTime: "12 min",
          difficulty: "Intermediate",
          tags: ["compliance", "regulations", "standards"],
          content: "Understand how the platform meets various regulatory requirements and industry standards."
        },
        {
          id: "user-permissions",
          title: "User Roles & Permissions",
          description: "Managing access control and user privileges",
          readTime: "7 min",
          difficulty: "Intermediate",
          tags: ["permissions", "roles", "access"],
          content: "Master user role management, permission settings, and access control mechanisms."
        }
      ]
    },
    {
      id: "account",
      title: "Account Management",
      description: "Profile settings, preferences, and account security",
      icon: <FiSettings className="h-6 w-6" />,
      color: "from-indigo-500 to-indigo-600",
      articles: [
        {
          id: "profile-settings",
          title: "Profile Configuration",
          description: "Customize your profile and preferences",
          readTime: "5 min",
          difficulty: "Beginner",
          tags: ["profile", "settings", "preferences"],
          content: "Learn how to update your profile information, set preferences, and customize your experience."
        },
        {
          id: "mfa-setup",
          title: "Multi-Factor Authentication",
          description: "Enhance your account security with MFA",
          readTime: "6 min",
          difficulty: "Intermediate",
          tags: ["MFA", "security", "authentication"],
          content: "Set up multi-factor authentication to add an extra layer of security to your account."
        },
        {
          id: "notifications",
          title: "Notification Preferences",
          description: "Manage alerts and notification settings",
          readTime: "4 min",
          difficulty: "Beginner",
          tags: ["notifications", "alerts", "preferences"],
          content: "Configure notification preferences to stay informed about important updates and activities."
        }
      ]
    }
  ];

  // Filter articles based on search query
  const filteredResults = searchQuery.trim() 
    ? helpCategories.flatMap(category => 
        category.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        ).map(article => ({ ...article, category: category.title }))
      )
    : [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Advanced": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 p-6 transition-all duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 mb-6 shadow-2xl">
            <FiHelpCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent mb-4">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Find answers, learn features, and get the most out of your Credit Risk Assessment Platform
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative max-w-2xl mx-auto mb-12"
        >
          <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-6 w-6" />
            <input
              type="text"
              placeholder="Search for help articles, guides, or topics..."
              className="w-full pl-14 pr-6 py-5 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all text-gray-900 dark:text-white shadow-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence>
          {searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Search Results ({filteredResults.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResults.map((article, index) => (
                  <motion.div
                    key={`${article.id}-search`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedArticle(article)}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                        {article.difficulty}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{article.readTime}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        {article.category}
                      </span>
                      <FiChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Grid */}
        {!searchQuery.trim() && (
          <>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12"
            >
              Browse by Category
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {helpCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/30 p-8 hover:shadow-2xl hover:scale-105 transition-all duration-500 cursor-pointer group"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${category.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {category.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                      {category.articles.length} articles
                    </span>
                    <FiArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Quick Actions */}
        {!searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <FiMessageSquare className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-xl font-semibold mb-2">Contact Support</h3>
                <p className="opacity-90 mb-4">Get personalized help from our support team</p>
                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105">
                  Start Chat
                </button>
              </div>
              <div className="text-center">
                <FiPlay className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-xl font-semibold mb-2">Video Tutorials</h3>
                <p className="opacity-90 mb-4">Watch step-by-step video guides</p>
                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105">
                  Watch Now
                </button>
              </div>
              <div className="text-center">
                <FiDownload className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-xl font-semibold mb-2">User Manual</h3>
                <p className="opacity-90 mb-4">Download comprehensive documentation</p>
                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105">
                  Download PDF
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contact Information */}
        {!searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/30 dark:border-gray-700/30 p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Need More Help?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/80 transition-all duration-300">
                <FiMail className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Email Support</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Get help via email</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">support@creditrisk.ai</p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/80 transition-all duration-300">
                <FiPhone className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Phone Support</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">Call us directly</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">+1 (555) 123-4567</p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/80 transition-all duration-300">
                <FiClock className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Business Hours</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">We're here to help</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">24/7 Support</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const category = helpCategories.find(c => c.id === selectedCategory);
                if (!category) return null;

                return (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-4">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${category.color} shadow-lg`}>
                          <div className="text-white">
                            {category.icon}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {category.title}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-300">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiX className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {category.articles.map((article) => (
                        <motion.div
                          key={article.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedArticle(article)}
                          className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                              {article.difficulty}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{article.readTime}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {article.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {article.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-lg"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedArticle.difficulty)}`}>
                        {selectedArticle.difficulty}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedArticle.readTime} read
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {selectedArticle.title}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      {selectedArticle.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-4"
                  >
                    <FiX className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                      {selectedArticle.content}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {selectedArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Was this article helpful?
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors">
                          <FiCheckCircle className="h-5 w-5" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors">
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Help;