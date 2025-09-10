import React, { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useToast, ToastContainer } from "../../components/utils/Toast";
import StepIndicator from "./components/StepIndicator";
import ButtonGroup from "./components/ButtonGroup";
import { PersonalInfoStep } from "./components/Steps/PersonalInfo";
import { EmploymentStep } from "./components/Steps/Employment";
import { FinancialsStep } from "./components/Steps/Financial";
import { DocumentsStep } from "./components/Steps/Documents";
import ReviewStep from "./components/Steps/Review";
import type {
  FormData,
  FormStep,
  UploadedFile,
  FormSubmissionResult,
  ApiError,
} from "./components/types";
import { FormDataTransformer } from "./components/types";
import { useAuth } from "../Authentication/Login-SignUp/components/hooks/useAuth";
import { useCreateApplicationMutation, useUploadDocumentMutation } from "../../components/redux/features/api/applications/applicationsApi";
import {
  loanApplicationSchema,
  validatePersonalInfoStep,
  validateEmploymentStep,
  validateFinancialStep,
  validateCompleteForm
} from "../../schemas/validationSchemas";
import { useFormValidation } from "../../hooks/useFormValidation";

// Enhanced form validation using Zod with step-by-step validation
const validateFormDataByStep = (data: FormData, step: number): { isValid: boolean; errors: string[] } => {
  let validationResult;

  switch (step) {
    case 0: // Personal Info step
      validationResult = validatePersonalInfoStep(data);
      break;
    case 1: // Employment step
      validationResult = validateEmploymentStep(data);
      break;
    case 2: // Financial step
      validationResult = validateFinancialStep(data);
      break;
    case 4: // Final review - validate complete form
      validationResult = validateCompleteForm(data);
      break;
    default:
      return { isValid: true, errors: [] };
  }

  if (!validationResult.isValid) {
    const errorMessages = Object.values(validationResult.errors).map(error => error.message);
    return { isValid: false, errors: errorMessages };
  }

  return { isValid: true, errors: [] };
};

const STEPS: FormStep[] = [
  { label: "Personal Info", isActive: true },
  { label: "Employment", isActive: false },
  { label: "Financials", isActive: false },
  { label: "Documents", isActive: false },
  { label: "Review", isActive: false },
];

const Applications: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [createApplication, { isLoading: isCreating }] = useCreateApplicationMutation();
  const [uploadDocument] = useUploadDocumentMutation();

  // Toast system
  const { success, error, info, toasts, removeToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(loanApplicationSchema),
    mode: 'onChange',
    defaultValues: {
      annualIncome: 0,
      loanAmount: 0,
      interestRate: 0,
      dti: 0,
      creditHistoryLength: 0,
      totalAccounts: 0,
      delinquencies2yr: 0,
      inquiries6mo: 0,
      revolvingAccounts12mo: 0,
      publicRecords: 0,
      openAccounts: 0,
      collections12mo: 0,
    }
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [prefilledFields, setPrefilledFields] = useState<Record<string, boolean>>({});
  const hasPrefilledRef = useRef(false);
  const hasShownToastRef = useRef(false);

  // Initialize form validation hook
  const { validateStep, getValidationStatus } = useFormValidation({
    trigger,
    errors
  });

  // Get current validation status
  const validationStatus = getValidationStatus();


  useEffect(() => {
    if (isAuthenticated && user && user.id !== 'guest' && !hasPrefilledRef.current) {
      const fieldsToDisable: Record<string, boolean> = {};

      // Prefill basic user information
      if (user.first_name) {
        setValue('firstName', user.first_name);
        fieldsToDisable.firstName = true;
      }
      if (user.last_name) {
        setValue('lastName', user.last_name);
        fieldsToDisable.lastName = true;
      }
      if (user.email) {
        setValue('email', user.email);
        fieldsToDisable.email = true;
      }

      // Prefill phone if available
      if (user.phone_number) {
        setValue('phone', user.phone_number);
        fieldsToDisable.phone = true;
      }
      // Prefill national ID if available
      if (user.ghana_card_number) {
        setValue('nationalIDNumber', user.ghana_card_number);
        fieldsToDisable.nationalIDNumber = true;
      }

      // Update prefilled fields state
      setPrefilledFields(fieldsToDisable);


      // Mark as prefilled to prevent re-running
      hasPrefilledRef.current = true;

      // Show prefilled notification only once
      if (!hasShownToastRef.current) {
        success('Form prefilled with your account information');
        hasShownToastRef.current = true;
      }
    }
  }, [isAuthenticated, user?.id, success]);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      // Get current form data
      const formData = watch();

      // Map step index to validation type
      const stepValidationMap = ['personal', 'employment', 'financial', 'complete'] as const;
      const validationType = stepValidationMap[currentStep];

      // Only validate steps that have validation rules
      if (validationType) {
        const isStepValid = await validateStep(validationType, formData);

        if (!isStepValid) {
          error('Please fix the validation errors before proceeding');
          return;
        }
      }

      setCurrentStep(currentStep + 1);

      // Show success message for step completion
      const stepNames = ['Personal Information', 'Employment', 'Financial Information', 'Documents'];
      if (currentStep < stepNames.length) {
        success(`${stepNames[currentStep]} completed! ✅`);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    const formData = watch();

    setIsSavingDraft(true);

    try {
      // Create comprehensive draft structure including financial data
      const draftData = {
        // Personal info (required fields with safe defaults)
        applicant_info: {
          first_name: formData.firstName || 'Draft',
          last_name: formData.lastName || 'User',
          middle_name: formData.otherNames || '',
          email: formData.email || user?.email || 'draft@example.com',
          phone_number: formData.phone || user?.phone_number || '+233200000000',
          date_of_birth: formData.dob || '1990-01-01',
          gender: formData.gender || 'O' as const,
          marital_status: formData.maritalStatus || 'S' as const,
          national_id: formData.nationalIDNumber || `DRAFT-${Date.now()}-TEMP`,
          // Include financial info if provided
          financial_info: {
            total_assets: formData.totalAssets || '0.00',
            total_liabilities: formData.totalLiabilities || '0.00',
            monthly_expenses: formData.monthlyExpenses || '0.00',
            has_bankruptcy: formData.hasBankruptcy === 'true' || false
          }
        },
        // Financial/ML model fields (save whatever user has entered)
        annual_income: formData.annualIncome || null,
        loan_amount: formData.loanAmount || null,
        interest_rate: formData.interestRate || null,
        debt_to_income_ratio: formData.dti || null,
        credit_history_length: formData.creditHistoryLength || null,
        revolving_utilization: formData.revolvingUtilization || null,
        max_bankcard_balance: formData.maxBankcardBalance || null,
        delinquencies_2yr: formData.delinquencies2yr || 0,
        total_accounts: formData.totalAccounts || null,
        inquiries_6mo: formData.inquiries6mo || 0,
        revolving_accounts_12mo: formData.revolvingAccounts12mo || 0,
        employment_length: formData.employmentLength || '',
        job_title: formData.jobTitle || '',
        public_records: formData.publicRecords || 0,
        open_accounts: formData.openAccounts || null,
        home_ownership: formData.homeOwnership || '',
        collections_12mo: formData.collections12mo || 0,
        // Application metadata
        status: 'DRAFT' as const,
        is_priority: false,
        notes: `Draft saved on ${new Date().toLocaleString()} - Step ${currentStep + 1}/${STEPS.length}`
      };

      const result = await createApplication(draftData).unwrap();
      setApplicationId(result.id!);

      success('Draft saved successfully! 📝');
    } catch (error: any) {
      console.error('Draft save error:', error);
      const apiError = error?.data as ApiError;
      let errorMessage = 'Failed to save draft';

      if (apiError?.detail) {
        errorMessage = apiError.detail;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      error(`❌ ${errorMessage}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Comprehensive Zod validation before transformation
      const isFormValid = await validateStep('complete', data);
      if (!isFormValid) {
        throw new Error('Please fix all validation errors before submitting the application');
      }

      // Transform form data to backend API structure using the transformer
      const applicationData = FormDataTransformer.toBackendFormat(data);


      const result = await createApplication(applicationData).unwrap();
      setApplicationId(result.id!);

      // Upload documents if any
      if (uploadedFiles.length > 0) {
        // Map frontend categories to backend document types
        const categoryToDocumentTypeMap: Record<string, string> = {
          'identity': 'ID',
          'income': 'PROOF_OF_INCOME',
          'financial': 'BANK_STATEMENT',
          'credit': 'CREDIT_REPORT',
          'collateral': 'PROPERTY_DEED',
          'business': 'BUSINESS_REGISTRATION'
        };

        const uploadPromises = uploadedFiles.map(file =>
          uploadDocument({
            applicationId: result.id!,
            file: file,
            documentType: categoryToDocumentTypeMap[file.category || ''] || 'OTHER'
          })
        );
        await Promise.all(uploadPromises);
      }

      success('Application submitted successfully!');

      // Reset form after successful submission
      setTimeout(() => {
        reset();
        setUploadedFiles([]);
        setCurrentStep(0);
        setApplicationId(null);
        hasPrefilledRef.current = false;
        hasShownToastRef.current = false;
      }, 2000);

    } catch (error: any) {
      console.error('Form submission error:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      // Enhanced error handling
      const apiError = error?.data as ApiError;
      let errorMessage = 'Failed to submit application. Please try again.';

      if (apiError?.detail) {
        errorMessage = apiError.detail;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      } else if (apiError?.errors) {
        // Handle field-specific errors
        const fieldErrors = Object.entries(apiError.errors)
          .map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`;
            }
            return `${field}: ${errors}`;
          })
          .join('; ');
        errorMessage = `Validation errors: ${fieldErrors}`;
      } else if (apiError?.applicant_info) {
        // Handle applicant-specific errors
        const applicantErrors = Object.entries(apiError.applicant_info)
          .map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`;
            }
            return `${field}: ${errors}`;
          })
          .join('; ');
        errorMessage = `Applicant validation errors: ${applicantErrors}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Show more detailed error for debugging
      if (process.env.NODE_ENV === 'development') {
        errorMessage += ` (Debug: ${JSON.stringify(apiError || error)})`;
      }

      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, category?: string) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files).map((file) => {
          // Create a proper UploadedFile object
          const uploadedFile: UploadedFile = Object.assign(
            new File([file], file.name, { type: file.type }),
            {
              id: Math.random().toString(36).substring(2, 9),
              uploadDate: new Date(),
              status: "completed" as const,
              category: category || 'OTHER',
            }
          );
          return uploadedFile;
        });

        setUploadedFiles((prev) => [...prev, ...newFiles]);

        success(`${newFiles.length} file(s) uploaded successfully!`);
      }
    },
    []
  );


  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const renderStep = () => {
    const commonProps = { register, errors };
    const formValues = watch();

    switch (currentStep) {
      case 0:
        return <PersonalInfoStep {...commonProps} setValue={setValue} watch={watch} prefilledFields={prefilledFields} />;
      case 1:
        return <EmploymentStep {...commonProps} />;
      case 2:
        return <FinancialsStep {...commonProps} />;
      case 3:
        return (
          <DocumentsStep
            uploadedFiles={uploadedFiles}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
          />
        );
      case 4:
        return (
          <ReviewStep formValues={formValues} uploadedFiles={uploadedFiles} />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <main className="overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* Progress Summary */}
          {currentStep === 0 && (
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What You'll Need</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Personal Info</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">ID, address, contact details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Employment</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Job, income, employer details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Financials</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Assets, debts, expenses</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Documents</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">ID, income proof, bank statements</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <StepIndicator
              steps={STEPS.map((step, i) => ({
                ...step,
                isActive: i === currentStep,
                isCompleted: i < currentStep,
              }))}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />
          </div>

          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{
                  opacity: 0,
                  x: currentStep > STEPS.indexOf(STEPS[currentStep]) ? 50 : -50,
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{
                  opacity: 0,
                  x: currentStep > STEPS.indexOf(STEPS[currentStep]) ? -50 : 50,
                }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <ButtonGroup
            onPrevious={currentStep > 0 ? handlePrevious : undefined}
            onNext={currentStep < STEPS.length - 1 ? handleNext : undefined}
            onSubmit={handleSubmit(onSubmit)}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting || isCreating}
            isSavingDraft={isSavingDraft}
            currentStep={currentStep}
            totalSteps={STEPS.length}
          />
        </div>
      </main>
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
    </div>
  );
};

export default Applications;
