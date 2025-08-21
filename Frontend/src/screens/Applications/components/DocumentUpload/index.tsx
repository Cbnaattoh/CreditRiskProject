import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../../../components/utils/Toast";
import {
  FiUpload,
  FiX,
  FiCheck,
  FiFileText,
  FiDollarSign,
  FiUser,
  FiShield,
  FiCreditCard,
  FiTrendingUp,
  FiHome,
  FiBriefcase,
  FiAlertCircle,
  FiDownload,
  FiEye,
} from "react-icons/fi";
import type { UploadedFile } from "../types";

type DocumentCategory = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  documents: string[];
  color: string;
  maxFiles?: number;
};

type DocumentUploadProps = {
  uploadedFiles: UploadedFile[];
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => void;
  removeFile: (id: string) => void;
};

type PreviewModalProps = {
  file: UploadedFile | null;
  isOpen: boolean;
  onClose: () => void;
};

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: "identity",
    title: "Identity Verification",
    description: "Government-issued identification documents",
    icon: FiUser,
    required: true,
    documents: ["National ID", "Passport", "Driver's License"],
    color: "from-blue-500 to-cyan-500",
    maxFiles: 2,
  },
  {
    id: "income",
    title: "Income Documentation",
    description: "Proof of income and employment status",
    icon: FiDollarSign,
    required: true,
    documents: [
      "Pay Stubs (3 months)",
      "Employment Letter",
      "Tax Returns",
      "Bank Statements",
    ],
    color: "from-green-500 to-emerald-500",
    maxFiles: 6,
  },
  {
    id: "financial",
    title: "Financial Statements",
    description: "Banking and financial records",
    icon: FiTrendingUp,
    required: true,
    documents: [
      "Bank Statements (6 months)",
      "Investment Portfolio",
      "Other Assets",
    ],
    color: "from-purple-500 to-pink-500",
    maxFiles: 10,
  },
  {
    id: "credit",
    title: "Credit History",
    description: "Credit reports and payment history",
    icon: FiCreditCard,
    required: true,
    documents: ["Credit Report", "Loan History", "Credit Card Statements"],
    color: "from-orange-500 to-red-500",
    maxFiles: 5,
  },
  {
    id: "collateral",
    title: "Collateral Documentation",
    description: "Asset documentation for secured loans",
    icon: FiHome,
    required: false,
    documents: [
      "Property Deed",
      "Vehicle Title",
      "Asset Valuation",
      "Insurance Documents",
    ],
    color: "from-indigo-500 to-purple-500",
    maxFiles: 8,
  },
  {
    id: "business",
    title: "Business Documents",
    description: "For business loan applications",
    icon: FiBriefcase,
    required: false,
    documents: [
      "Business Registration",
      "Financial Statements",
      "Tax Returns",
      "Business Plan",
    ],
    color: "from-teal-500 to-blue-500",
    maxFiles: 12,
  },
];

const PreviewModal: React.FC<PreviewModalProps> = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  const renderPreview = () => {
    const fileType = file.type.toLowerCase();
    const fileUrl = URL.createObjectURL(file);

    if (fileType.startsWith('image/')) {
      return (
        <img
          src={fileUrl}
          alt={file.name}
          className="max-w-full max-h-[70vh] object-contain"
          onError={() => error('Failed to load image preview')}
        />
      );
    } else if (fileType === 'application/pdf') {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[70vh] border-0"
          title={file.name}
        />
      );
    } else if (fileType.includes('text/') || fileType.includes('csv')) {
      return (
        <div className="bg-gray-100 p-4 rounded-lg h-[70vh] overflow-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            Preview not available for this file type. Click download to view.
          </pre>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 rounded-lg">
          <FiFileText className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Preview not available</p>
          <p className="text-sm text-gray-500">
            File type: {file.type || 'Unknown'}
          </p>
          <p className="text-sm text-gray-500">
            Size: {formatFileSize(file.size)}
          </p>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.type || 'Unknown type'} • Uploaded {file.uploadDate.toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const url = URL.createObjectURL(file);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = file.name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  success('Download started');
                }}
                className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Download"
              >
                <FiDownload className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="p-6 overflow-auto">
            {renderPreview()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const DocumentUpload = ({
  uploadedFiles,
  handleFileUpload,
  removeFile,
}: DocumentUploadProps) => {
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["identity", "income"])
  );
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Toast system
  const { success, error } = useToast();

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent, categoryId: string) => {
      e.preventDefault();
      setDraggedCategory(categoryId);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedCategory(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, categoryId: string) => {
      e.preventDefault();
      setDraggedCategory(null);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const mockEvent = {
          target: {
            files: e.dataTransfer.files,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(mockEvent, categoryId);
      }
    },
    [handleFileUpload]
  );

  const getCategoryFiles = (categoryId: string) => {
    return uploadedFiles.filter((file) => file.category === categoryId);
  };

  const getCompletionPercentage = () => {
    const requiredCategories = DOCUMENT_CATEGORIES.filter(
      (cat) => cat.required
    );
    const completedCategories = requiredCategories.filter(
      (cat) => getCategoryFiles(cat.id).length > 0
    );
    return Math.round(
      (completedCategories.length / requiredCategories.length) * 100
    );
  };

  const handlePreviewFile = (file: UploadedFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Document Upload
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload required documents for credit risk assessment
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {completionPercentage}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Complete
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Document Categories */}
      <div className="space-y-4">
        {DOCUMENT_CATEGORIES.map((category) => {
          const categoryFiles = getCategoryFiles(category.id);
          const isExpanded = expandedCategories.has(category.id);
          const isDragging = draggedCategory === category.id;
          const isComplete = categoryFiles.length > 0;

          return (
            <motion.div
              key={category.id}
              layout
              className={`bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border transition-all duration-300 ${
                isDragging
                  ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20"
                  : "border-gray-200/50 dark:border-gray-700/50"
              }`}
            >
              {/* Category Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-t-xl"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}
                    >
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {category.title}
                        </h4>
                        {category.required && (
                          <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                            Required
                          </span>
                        )}
                        {isComplete && (
                          <FiCheck className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {categoryFiles.length} files
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {category.maxFiles
                          ? `Max ${category.maxFiles}`
                          : "No limit"}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiUpload className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Category Content */}
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
                      {/* Document Types */}
                      <div className="mb-4 pt-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Accepted Documents:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {category.documents.map((doc) => (
                            <span
                              key={doc}
                              className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                            >
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Upload Area */}
                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                          isDragging
                            ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                        onDragOver={(e) => handleDragOver(e, category.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, category.id)}
                      >
                        <div className="flex justify-center mb-4">
                          <FiUpload
                            className={`h-10 w-10 transition-colors ${
                              isDragging
                                ? "text-indigo-500 dark:text-indigo-400"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {isDragging
                            ? "Drop files here"
                            : "Drag and drop files here or"}
                        </p>
                        <label className="cursor-pointer inline-block">
                          <span className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl">
                            Browse Files
                          </span>
                          <input
                            ref={(el) =>
                              (fileInputRefs.current[category.id] = el)
                            }
                            type="file"
                            multiple
                            onChange={(e) => handleFileUpload(e, category.id)}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          PDF, DOC, XLS, JPG, PNG up to 10MB each
                        </p>
                      </div>

                      {/* Uploaded Files */}
                      {categoryFiles.length > 0 && (
                        <div className="mt-6">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Uploaded Files ({categoryFiles.length})
                          </h5>
                          <div className="space-y-2">
                            {categoryFiles.map((file) => (
                              <motion.div
                                key={file.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                              >
                                <div className="flex items-center min-w-0 flex-1">
                                  <div className="flex-shrink-0 mr-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                                      <FiFileText className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h6
                                      className="text-sm font-medium text-gray-900 dark:text-white truncate"
                                      title={file.name}
                                    >
                                      {file.name || "Untitled File"}
                                    </h6>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatFileSize(file.size || 0)} •
                                      Uploaded {new Date().toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewFile(file)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Preview"
                                  >
                                    <FiEye className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = URL.createObjectURL(file);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = file.name;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                      success('Download started');
                                    }}
                                    className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Download"
                                  >
                                    <FiDownload className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(file.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Remove"
                                  >
                                    <FiX className="h-4 w-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Upload Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200/50 dark:border-indigo-700/50">
        <div className="flex items-start space-x-3">
          <FiShield className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
              Secure Document Processing
            </h4>
            <p className="text-indigo-700 dark:text-indigo-300 text-sm mb-3">
              Your documents are encrypted and processed using industry-standard
              security protocols. All uploaded files are automatically scanned
              for authenticity and completeness.
            </p>
            <div className="flex items-center space-x-4 text-sm text-indigo-600 dark:text-indigo-400">
              <span>• 256-bit SSL encryption</span>
              <span>• GDPR compliant</span>
              <span>• Auto-delete after processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </div>
  );
};
