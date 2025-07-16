import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUser, 
  FiDollarSign, 
  FiBriefcase, 
  FiFileText, 
  FiCheck, 
  FiEdit3, 
  FiDownload,
  FiShield,
  FiEye,
  FiCalendar,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTrendingUp,
  FiCreditCard,
  FiHome,
  FiClock,
  FiActivity,
  FiBarChart,
  FiPieChart,
  FiTarget,
  FiArrowRight,
  FiStar,
  FiCheckCircle
} from "react-icons/fi";

// Mock data for demonstration
const mockFormValues = {
  firstName: "John",
  lastName: "Doe",
  dob: "1990-05-15",
  email: "john.doe@example.com",
  phone: "+233 24 123 4567",
  address: "123 Main St, Kumasi, Ghana",
  employmentStatus: "Full-time",
  occupation: "Software Engineer",
  employer: "Tech Solutions Ltd",
  yearsEmployed: "3",
  annualIncome: "120000",
  collections12mo: "0",
  dti: "25",
  loanAmount: "50000",
  interestRate: "12.5",
  creditHistoryLength: "5",
  revolvingUtilization: "30",
  maxBankcardBalance: "15000",
  delinquencies2yr: "0",
  totalAccounts: "8",
  inquiries6mo: "1",
  revolvingAccounts12mo: "2",
  employmentLength: "3+ years",
  publicRecords: "0",
  openAccounts: "6",
  homeOwnership: "Rent"
};

const mockUploadedFiles = [
  { id: "1", name: "National_ID_Card.pdf", category: "identity", size: 2048576 },
  { id: "2", name: "Pay_Stub_January.pdf", category: "income", size: 1536000 },
  { id: "3", name: "Pay_Stub_February.pdf", category: "income", size: 1612800 },
  { id: "4", name: "Bank_Statement_6mo.pdf", category: "financial", size: 3072000 },
  { id: "5", name: "Credit_Report.pdf", category: "credit", size: 2560000 }
];

type ReviewStepProps = {
  formValues?: any;
  uploadedFiles?: any[];
};

export default function ReviewStep({ 
  formValues = mockFormValues, 
  uploadedFiles = mockUploadedFiles 
}: ReviewStepProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["personal", "employment", "financial", "documents"])
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return "Not specified";
    return `GHC ${Number(amount).toLocaleString()}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      identity: FiUser,
      income: FiDollarSign,
      financial: FiTrendingUp,
      credit: FiCreditCard,
      collateral: FiHome,
      business: FiBriefcase
    };
    return icons[category as keyof typeof icons] || FiFileText;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      identity: "from-blue-500 to-cyan-500",
      income: "from-green-500 to-emerald-500",
      financial: "from-purple-500 to-pink-500",
      credit: "from-orange-500 to-red-500",
      collateral: "from-indigo-500 to-purple-500",
      business: "from-teal-500 to-blue-500"
    };
    return colors[category as keyof typeof colors] || "from-gray-500 to-gray-600";
  };

  const getCompletionScore = () => {
    const totalFields = Object.keys(formValues).length;
    const completedFields = Object.values(formValues).filter(val => val && val !== "").length;
    return Math.round((completedFields / totalFields) * 100);
  };

  const completionScore = getCompletionScore();

  const sections = [
    {
      id: "personal",
      title: "Personal Information",
      icon: FiUser,
      color: "from-blue-500 to-cyan-500",
      items: [
        { label: "Full Name", value: `${formValues.firstName || ""} ${formValues.lastName || ""}`.trim() || "Not provided", icon: FiUser },
        { label: "Date of Birth", value: formValues.dob ? new Date(formValues.dob).toLocaleDateString() : "Not provided", icon: FiCalendar },
        { label: "Email Address", value: formValues.email || "Not provided", icon: FiMail },
        { label: "Phone Number", value: formValues.phone || "Not provided", icon: FiPhone },
        { label: "Address", value: formValues.address || "Not provided", icon: FiMapPin }
      ]
    },
    {
      id: "employment",
      title: "Employment Information",
      icon: FiBriefcase,
      color: "from-green-500 to-emerald-500",
      items: [
        { label: "Employment Status", value: formValues.employmentStatus || "Not provided", icon: FiActivity },
        { label: "Occupation", value: formValues.occupation || "Not provided", icon: FiBriefcase },
        { label: "Employer", value: formValues.employer || "Not provided", icon: FiBriefcase },
        { label: "Years at Current Job", value: formValues.yearsEmployed ? `${formValues.yearsEmployed} years` : "Not provided", icon: FiClock },
        { label: "Employment Length", value: formValues.employmentLength || "Not provided", icon: FiClock }
      ]
    },
    {
      id: "financial",
      title: "Financial Information",
      icon: FiDollarSign,
      color: "from-purple-500 to-pink-500",
      items: [
        { label: "Annual Income", value: formatCurrency(formValues.annualIncome), icon: FiDollarSign },
        { label: "Requested Loan Amount", value: formatCurrency(formValues.loanAmount), icon: FiTarget },
        { label: "Interest Rate", value: formValues.interestRate ? `${formValues.interestRate}%` : "Not provided", icon: FiTrendingUp },
        { label: "Debt-to-Income Ratio", value: formValues.dti ? `${formValues.dti}%` : "Not provided", icon: FiPieChart },
        { label: "Credit History Length", value: formValues.creditHistoryLength ? `${formValues.creditHistoryLength} years` : "Not provided", icon: FiClock },
        { label: "Revolving Utilization Rate", value: formValues.revolvingUtilization ? `${formValues.revolvingUtilization}%` : "Not provided", icon: FiBarChart },
        { label: "Maximum Bankcard Balance", value: formatCurrency(formValues.maxBankcardBalance), icon: FiCreditCard },
        { label: "Collections (12 months)", value: formValues.collections12mo || "Not provided", icon: FiActivity },
        { label: "Delinquencies (2 years)", value: formValues.delinquencies2yr || "Not provided", icon: FiActivity },
        { label: "Total Accounts", value: formValues.totalAccounts || "Not provided", icon: FiBarChart },
        { label: "Open Accounts", value: formValues.openAccounts || "Not provided", icon: FiBarChart },
        { label: "Recent Inquiries (6 months)", value: formValues.inquiries6mo || "Not provided", icon: FiActivity },
        { label: "New Revolving Accounts (12 months)", value: formValues.revolvingAccounts12mo || "Not provided", icon: FiActivity },
        { label: "Public Records", value: formValues.publicRecords || "Not provided", icon: FiFileText },
        { label: "Home Ownership", value: formValues.homeOwnership || "Not provided", icon: FiHome }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Application Review
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please review your information before submitting your loan application
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <FiCheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{completionScore}%</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Complete</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Application Summary Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Loan Application Summary</h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-indigo-100 dark:text-indigo-200">Applicant</p>
                <p className="font-medium">{formValues.firstName} {formValues.lastName}</p>
              </div>
              <div>
                <p className="text-indigo-100 dark:text-indigo-200">Loan Amount</p>
                <p className="font-medium">{formatCurrency(formValues.loanAmount)}</p>
              </div>
              <div>
                <p className="text-indigo-100 dark:text-indigo-200">Interest Rate</p>
                <p className="font-medium">{formValues.interestRate}%</p>
              </div>
              <div>
                <p className="text-indigo-100 dark:text-indigo-200">Documents</p>
                <p className="font-medium">{uploadedFiles.length} files uploaded</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <FiStar className="h-12 w-12 text-yellow-300 mb-2" />
            <p className="text-sm text-indigo-100 dark:text-indigo-200">Premium Application</p>
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <motion.div
              key={section.id}
              layout
              className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            >
              {/* Section Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center`}>
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.items.length} fields
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <FiCheck className="h-5 w-5 text-green-500" />
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiArrowRight className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {section.items.map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                <item.icon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {item.label}
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white font-medium">
                                  {item.value}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Documents Section */}
      <motion.div
        layout
        className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        <div 
          className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          onClick={() => toggleSection("documents")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <FiFileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Uploaded Documents
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadedFiles.length} files uploaded
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <FiCheck className="h-5 w-5 text-green-500" />
              <motion.div
                animate={{ rotate: expandedSections.has("documents") ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiArrowRight className="h-5 w-5 text-gray-400" />
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expandedSections.has("documents") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 border-t border-gray-200/50 dark:border-gray-700/50">
                {uploadedFiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {uploadedFiles.map((file, index) => {
                      const CategoryIcon = getCategoryIcon(file.category);
                      const categoryColor = getCategoryColor(file.category);
                      
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColor} flex items-center justify-center flex-shrink-0`}>
                                <CategoryIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h6 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.name}>
                                  {file.name}
                                </h6>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatFileSize(file.size)} • {file.category}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="Preview"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="Download"
                              >
                                <FiDownload className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No documents uploaded yet
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200/50 dark:border-green-700/50">
        <div className="flex items-start space-x-3">
          <FiShield className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              Secure Application Processing
            </h4>
            <p className="text-green-700 dark:text-green-300 text-sm mb-3">
              Your application and all uploaded documents are protected with bank-level encryption. 
              Our advanced AI system will now process your information for instant credit assessment.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-green-600 dark:text-green-400">
              <span className="flex items-center">
                <FiCheck className="h-4 w-4 mr-1" />
                SSL Encrypted
              </span>
              <span className="flex items-center">
                <FiCheck className="h-4 w-4 mr-1" />
                GDPR Compliant
              </span>
              <span className="flex items-center">
                <FiCheck className="h-4 w-4 mr-1" />
                AI-Powered Analysis
              </span>
              <span className="flex items-center">
                <FiCheck className="h-4 w-4 mr-1" />
                Instant Decision
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {/* <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FiEdit3 className="h-5 w-5" />
          <span>Edit Application</span>
        </button>
        
        <div className="flex space-x-4">
          <button
            type="button"
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
          >
            <FiDownload className="h-5 w-5" />
            <span>Download PDF</span>
          </button>
          
          <button
            type="button"
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
          >
            <FiCheckCircle className="h-5 w-5" />
            <span>Submit Application</span>
          </button>
        </div>
      </div> */}
    </div>
  );
}