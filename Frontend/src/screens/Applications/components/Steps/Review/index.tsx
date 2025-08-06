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

// Mock data for demonstration - Updated to match new form structure
const mockFormValues = {
  firstName: "John",
  lastName: "Doe",
  dob: "1990-05-15",
  email: "john.doe@example.com",
  phone: "+233 24 123 4567",
  // Legacy string format for backward compatibility
  address: "123 Main St, Kumasi, Ghana",
  // New structured address format
  addresses: [
    {
      address_type: "HOME",
      street_address: "123 Main Street, Tech Valley",
      city: "Kumasi",
      state_province: "Ashanti Region",
      postal_code: "00233",
      country: "Ghana",
      is_primary: true
    }
  ],
  employmentStatus: "Full-time",
  occupation: "Software Engineer",
  jobTitle: "Software Engineer",  // NEW: Ghana employment analysis field
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
  employmentLength: "5 years",  // Updated format
  publicRecords: "0",
  openAccounts: "6",
  homeOwnership: "RENT"  // Updated to match ML model format
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
    if (amount === null || amount === undefined || amount === "" || isNaN(Number(amount))) return "Not provided";
    return `GHC ${Number(amount).toLocaleString()}`;
  };

  const formatAddress = (addressData: any) => {
    // Handle case where address is a simple string (legacy format)
    if (typeof addressData === 'string') {
      return addressData || "Not provided";
    }

    // Handle case where address is an array of address objects
    if (Array.isArray(addressData) && addressData.length > 0) {
      const primaryAddress = addressData.find(addr => addr.is_primary) || addressData[0];
      return formatSingleAddress(primaryAddress);
    }

    // Handle case where address is a single address object
    if (addressData && typeof addressData === 'object') {
      return formatSingleAddress(addressData);
    }

    return "Not provided";
  };

  const formatSingleAddress = (address: any) => {
    if (!address) return "Not provided";
    
    const parts = [];
    if (address.street_address || address.streetAddress) parts.push(address.street_address || address.streetAddress);
    if (address.city) parts.push(address.city);
    if (address.state_province || address.stateProvince || address.state) {
      parts.push(address.state_province || address.stateProvince || address.state);
    }
    if (address.postal_code || address.postalCode) parts.push(address.postal_code || address.postalCode);
    if (address.country) parts.push(address.country);

    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  const renderDetailedAddress = (addressData: any) => {
    // Handle string address - no detailed breakdown available
    if (typeof addressData === 'string') {
      return null;
    }

    let address = addressData;
    // Handle array of addresses - use primary or first
    if (Array.isArray(addressData) && addressData.length > 0) {
      address = addressData.find(addr => addr.is_primary) || addressData[0];
    }

    // Only show detailed breakdown if we have structured address data
    if (!address || typeof address !== 'object') {
      return null;
    }

    const hasDetailedInfo = address.street_address || address.streetAddress || 
                           address.city || address.state_province || address.stateProvince || 
                           address.postal_code || address.postalCode || address.country;

    if (!hasDetailedInfo) return null;

    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
        {address.address_type && (
          <div className="flex items-center">
            <span className="font-medium w-16">Type:</span>
            <span>{address.address_type === 'HOME' ? 'Home' : address.address_type === 'WORK' ? 'Work' : 'Other'}</span>
          </div>
        )}
        {(address.street_address || address.streetAddress) && (
          <div className="flex items-center">
            <span className="font-medium w-16">Street:</span>
            <span>{address.street_address || address.streetAddress}</span>
          </div>
        )}
        {address.city && (
          <div className="flex items-center">
            <span className="font-medium w-16">City:</span>
            <span>{address.city}</span>
          </div>
        )}
        {(address.state_province || address.stateProvince || address.state) && (
          <div className="flex items-center">
            <span className="font-medium w-16">State:</span>
            <span>{address.state_province || address.stateProvince || address.state}</span>
          </div>
        )}
        {(address.postal_code || address.postalCode) && (
          <div className="flex items-center">
            <span className="font-medium w-16">Postal:</span>
            <span>{address.postal_code || address.postalCode}</span>
          </div>
        )}
        {address.country && (
          <div className="flex items-center">
            <span className="font-medium w-16">Country:</span>
            <span>{address.country}</span>
          </div>
        )}
        {address.is_primary && (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <FiCheckCircle className="h-3 w-3 mr-1" />
            <span className="text-xs">Primary Address</span>
          </div>
        )}
      </div>
    );
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
        { 
          label: "Address", 
          value: formatAddress(formValues.address || formValues.addresses), 
          icon: FiMapPin,
          isAddress: true,
          fullAddress: formValues.address || formValues.addresses
        }
      ]
    },
    {
      id: "employment",
      title: "Employment Information",
      icon: FiBriefcase,
      color: "from-green-500 to-emerald-500",
      items: [
        { label: "Employment Status", value: formValues.employmentStatus || "Not provided", icon: FiActivity },
        { label: "Job Title", value: formValues.jobTitle || "Not provided", icon: FiBriefcase },
        { label: "Occupation", value: formValues.occupation || "Not provided", icon: FiBriefcase },
        { label: "Employer", value: formValues.employer || "Not provided", icon: FiBriefcase },
        { label: "Years at Current Job", value: formValues.yearsEmployed != null && formValues.yearsEmployed !== "" && !isNaN(Number(formValues.yearsEmployed)) ? `${formValues.yearsEmployed} years` : "Not provided", icon: FiClock },
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
        { label: "Interest Rate", value: formValues.interestRate != null && formValues.interestRate !== "" && !isNaN(Number(formValues.interestRate)) ? `${formValues.interestRate}%` : "Not provided", icon: FiTrendingUp },
        { label: "Debt-to-Income Ratio", value: formValues.dti != null && formValues.dti !== "" && !isNaN(Number(formValues.dti)) ? `${formValues.dti}%` : "Not provided", icon: FiPieChart },
        { label: "Credit History Length", value: formValues.creditHistoryLength != null && formValues.creditHistoryLength !== "" && !isNaN(Number(formValues.creditHistoryLength)) ? `${formValues.creditHistoryLength} years` : "Not provided", icon: FiClock },
        { label: "Credit Utilization Rate", value: formValues.revolvingUtilization != null && formValues.revolvingUtilization !== "" && !isNaN(Number(formValues.revolvingUtilization)) ? `${formValues.revolvingUtilization}%` : "Not provided", icon: FiBarChart },
        { label: "Maximum Balance on Bankcards", value: formatCurrency(formValues.maxBankcardBalance), icon: FiCreditCard },
        { label: "Collections in Past 12 Months", value: formValues.collections12mo != null && formValues.collections12mo !== "" && !isNaN(Number(formValues.collections12mo)) ? formValues.collections12mo : "Not provided", icon: FiActivity },
        { label: "Delinquencies in Past 2 Years", value: formValues.delinquencies2yr != null && formValues.delinquencies2yr !== "" && !isNaN(Number(formValues.delinquencies2yr)) ? formValues.delinquencies2yr : "Not provided", icon: FiActivity },
        { label: "Total Number of Accounts", value: formValues.totalAccounts != null && formValues.totalAccounts !== "" && !isNaN(Number(formValues.totalAccounts)) ? formValues.totalAccounts : "Not provided", icon: FiBarChart },
        { label: "Number of Open Accounts", value: formValues.openAccounts != null && formValues.openAccounts !== "" && !isNaN(Number(formValues.openAccounts)) ? formValues.openAccounts : "Not provided", icon: FiBarChart },
        { label: "Credit Inquiries in Last 6 Months", value: formValues.inquiries6mo != null && formValues.inquiries6mo !== "" && !isNaN(Number(formValues.inquiries6mo)) ? formValues.inquiries6mo : "Not provided", icon: FiActivity },
        { label: "New Revolving Accounts (Last 12 Months)", value: formValues.revolvingAccounts12mo != null && formValues.revolvingAccounts12mo !== "" && !isNaN(Number(formValues.revolvingAccounts12mo)) ? formValues.revolvingAccounts12mo : "Not provided", icon: FiActivity },
        { label: "Public Records", value: formValues.publicRecords != null && formValues.publicRecords !== "" && !isNaN(Number(formValues.publicRecords)) ? formValues.publicRecords : "Not provided", icon: FiFileText },
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
                            className={`group p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 ${item.isAddress ? 'md:col-span-2' : ''}`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                <item.icon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {item.label}
                                </p>
                                {item.isAddress && item.fullAddress ? (
                                  <div className="space-y-2">
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                                      {item.value}
                                    </p>
                                    {renderDetailedAddress(item.fullAddress)}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                                    {item.value}
                                  </p>
                                )}
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

      {/* Ghana ML Model Features */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
        <div className="flex items-start space-x-3">
          <FiTarget className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🇬🇭 Ghana-Specific Credit Analysis
            </h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
              Your application will be analyzed using our advanced ML model trained specifically for Ghana's 
              economic landscape. Your job title "{formValues.jobTitle || 'Not specified'}" will be assessed 
              for employment stability and income expectations within Ghana's job market.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <FiCheck className="h-4 w-4 mr-2" />
                <span>18 Ghana Job Categories</span>
              </div>
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <FiCheck className="h-4 w-4 mr-2" />
                <span>98.4% Model Accuracy</span>
              </div>
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <FiCheck className="h-4 w-4 mr-2" />
                <span>Sector-Specific Income Validation</span>
              </div>
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <FiCheck className="h-4 w-4 mr-2" />
                <span>Employment Stability Scoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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