import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiLock,
  FiImage,
  FiCheck,
  FiX,
  FiArrowRight,
  FiArrowLeft,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiUpload,
  FiEye,
  FiEyeOff,
  FiShield,
} from "react-icons/fi";
import type { ActiveTab } from "./types";
// Note: We'll use our own registration logic instead of authApi.register
import type { RegisterRequest } from "../../../../components/redux/features/user/types/user";
import { useAppDispatch } from "../../../../components/utils/hooks";
import { setCredentials } from "../../../../components/redux/features/auth/authSlice";
import type { User } from "../../../../components/redux/features/auth/authApi";
import { 
  frontendRegistrationSchema,
  type FrontendRegistrationFormData 
} from "../../../../components/utils/schemas/authSchemas";
import { 
  Step2PersonalIdentity, 
  Step3GhanaCardVerification, 
  Step4AccountSecurity, 
  Step5ProfileCompletion, 
  Step6Verification 
} from './RegistrationSteps';
import {
  useValidateStep1Mutation,
  useValidateStep2Mutation,
  useProcessGhanaCardTextractMutation,
  useValidateStep4Mutation,
  useSendVerificationCodeMutation,
  useVerifyCodeMutation,
  useCompleteRegistrationMutation,
  RegistrationService,
  RegistrationAnalytics,
  type ValidationResponse,
  type OCRProcessingResponse,
  type PasswordStrengthResponse,
} from "../../../../services/registrationApi";

interface RegistrationWizardProps {
  setActiveTab: (tab: ActiveTab) => void;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
}

// Use the existing form data type from the schema
type RegistrationData = FrontendRegistrationFormData;

interface StepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface TextractResult {
  name: string;
  cardNumber: string;
  confidence: number;
  verified: boolean;
}

const STEPS = [
  { id: 1, title: "Basic Info", icon: FiMail, description: "Contact details" },
  { id: 2, title: "Identity", icon: FiUser, description: "Personal information" },
  { id: 3, title: "Ghana Card", icon: FiCreditCard, description: "Document verification" },
  { id: 4, title: "Security", icon: FiLock, description: "Account protection" },
  { id: 5, title: "Profile", icon: FiImage, description: "Finalize account" },
  { id: 6, title: "Verify", icon: FiShield, description: "Account activation" },
];

const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  setActiveTab,
  showSuccessToast,
  showErrorToast,
}) => {
  const dispatch = useAppDispatch();
  const methods = useForm<RegistrationData>({
    resolver: zodResolver(frontendRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      password: "",
      confirm_password: "",
      user_type: "CLIENT",
      enable_mfa: false,
      terms_accepted: false,
      profile_picture: undefined,
      ghana_card_number: "",
      ghana_card_front_image: undefined,
      ghana_card_back_image: undefined,
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepValidations, setStepValidations] = useState<Record<number, StepValidation>>({});
  const [isValidating, setIsValidating] = useState(false);
  // We'll implement our own registration submission instead of using authApi.register

  // Progressive validation mutations
  const [validateStep1, { isLoading: isValidatingStep1 }] = useValidateStep1Mutation();
  const [validateStep2, { isLoading: isValidatingStep2 }] = useValidateStep2Mutation();
  const [processTextract, { isLoading: isProcessingTextractApi }] = useProcessGhanaCardTextractMutation();
  const [validateStep4, { isLoading: isValidatingStep4 }] = useValidateStep4Mutation();
  const [sendVerificationCode] = useSendVerificationCodeMutation();
  const [verifyCode] = useVerifyCodeMutation();
  const [completeRegistration, { isLoading: isSubmittingRegistration }] = useCompleteRegistrationMutation();

  // Image previews
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [ghanaCardFrontPreview, setGhanaCardFrontPreview] = useState<string | null>(null);
  const [ghanaCardBackPreview, setGhanaCardBackPreview] = useState<string | null>(null);

  // OCR and verification states
  const [textractResults, setTextractResults] = useState<TextractResult | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [currentProcessingStage, setCurrentProcessingStage] = useState(0);
  const [nameVerificationStatus, setNameVerificationStatus] = useState<"pending" | "success" | "warning" | "error">("pending");
  const [verificationBlocker, setVerificationBlocker] = useState<{
    blocked: boolean;
    reason: string;
    actionRequired: string;
    canRetry: boolean;
  } | null>(null);

  // Security states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Verification states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isSendingEmailOTP, setIsSendingEmailOTP] = useState(false);
  const [isSendingPhoneOTP, setIsSendingPhoneOTP] = useState(false);
  const [emailOtpExpiry, setEmailOtpExpiry] = useState<number>();
  const [phoneOtpExpiry, setPhoneOtpExpiry] = useState<number>();

  // Error handling and retry states
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');

  // Component lifecycle tracking
  useEffect(() => {
    RegistrationAnalytics.trackEvent('wizard_mounted', {
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    // Export analytics on page unload
    const handleBeforeUnload = () => {
      const analytics = RegistrationAnalytics.exportAnalytics();
      console.log('Registration Analytics Export:', analytics);
      
      // In production, you might want to send this to your analytics service
      // sendAnalyticsToServer(analytics);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      RegistrationAnalytics.trackEvent('wizard_unmounted', {});
    };
  }, []);

  // Network monitoring
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced error handling with user-friendly messages
  const handleValidationError = (error: any, step: number): StepValidation => {
    console.error(`Step ${step} validation error:`, error);
    setLastError(error?.data?.detail || error?.message || 'Unknown error');
    
    let userFriendlyMessage = "Something went wrong. Please try again.";
    
    if (networkStatus === 'offline') {
      userFriendlyMessage = "You're offline. Please check your internet connection.";
    } else if (error?.status === 429) {
      userFriendlyMessage = "Too many requests. Please wait a moment and try again.";
    } else if (error?.status === 500) {
      userFriendlyMessage = "Server is temporarily unavailable. Please try again in a few minutes.";
    } else if (error?.status === 400) {
      userFriendlyMessage = "Please check your input and try again.";
    } else if (error?.data?.detail) {
      userFriendlyMessage = RegistrationService.translateErrorMessage(error.data.detail);
    }
    
    return {
      isValid: false,
      errors: [userFriendlyMessage],
      warnings: retryCount > 0 ? [`Attempt ${retryCount + 1} of 3`] : [],
    };
  };

  // Retry mechanism with exponential backoff
  const retryWithBackoff = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        setRetryCount(0); // Reset on success
        setLastError(null);
        return result;
      } catch (error: any) {
        lastError = error;
        setRetryCount(attempt);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };

  const validateStep = async (step: number): Promise<StepValidation> => {
    const data = methods.getValues();
    const startTime = Date.now();
    
    // Track validation start
    RegistrationAnalytics.trackValidationStart(step);
    
    try {
      switch (step) {
        case 1: // Basic Information - Use backend validation with retry
          try {
            const result = await retryWithBackoff(() => 
              validateStep1({
                email: data.email,
                phone_number: data.phone_number,
                terms_accepted: data.terms_accepted || false,
              }).unwrap()
            );
            
            const validationResult = {
              isValid: result.valid,
              errors: Object.values(result.errors).flat(),
              warnings: Object.values(result.warnings).flat(),
            };
            
            // Track validation completion
            RegistrationAnalytics.trackValidationComplete(1, result.valid, Date.now() - startTime);
            
            return validationResult;
          } catch (error: any) {
            RegistrationAnalytics.trackError(error, `Step ${1} validation`);
            return handleValidationError(error, 1);
          }

        case 2: // Personal Identity - Use backend validation with retry
          try {
            const result = await retryWithBackoff(() => 
              validateStep2({
                first_name: data.first_name,
                last_name: data.last_name,
                ghana_card_number: data.ghana_card_number,
              }).unwrap()
            );
            
            const validationResult = {
              isValid: result.valid,
              errors: Object.values(result.errors).flat(),
              warnings: Object.values(result.warnings).flat(),
            };
            
            // Track validation completion
            RegistrationAnalytics.trackValidationComplete(2, result.valid, Date.now() - startTime);
            
            return validationResult;
          } catch (error: any) {
            RegistrationAnalytics.trackError(error, `Step ${2} validation`);
            return handleValidationError(error, 2);
          }

        case 3: // Ghana Card Verification - Check images and OCR status
          const errors: string[] = [];
          const warnings: string[] = [];
          
          if (!data.ghana_card_front_image || data.ghana_card_front_image.length === 0) {
            errors.push("Ghana Card front image is required");
          }
          if (!data.ghana_card_back_image || data.ghana_card_back_image.length === 0) {
            errors.push("Ghana Card back image is required");
          }
          
          // Validate images if present
          if (data.ghana_card_front_image?.[0]) {
            const frontValidation = RegistrationService.validateImageFile(data.ghana_card_front_image[0]);
            if (!frontValidation.valid) {
              errors.push(`Front image: ${frontValidation.error}`);
            }
          }
          
          if (data.ghana_card_back_image?.[0]) {
            const backValidation = RegistrationService.validateImageFile(data.ghana_card_back_image[0]);
            if (!backValidation.valid) {
              errors.push(`Back image: ${backValidation.error}`);
            }
          }
          
          if (nameVerificationStatus === "error") {
            errors.push("Name verification failed. Please ensure names match your Ghana Card");
          }
          if (nameVerificationStatus === "warning") {
            warnings.push("Name similarity is low. Please verify your information is correct");
          }
          
          const validationResult = { isValid: errors.length === 0, errors, warnings };
          
          // Track step 3 validation completion
          RegistrationAnalytics.trackValidationComplete(3, validationResult.isValid, Date.now() - startTime);
          
          return validationResult;

        case 4: // Account Security - Use backend validation with retry
          try {
            const result = await retryWithBackoff(() => 
              validateStep4({
                password: data.password,
                confirm_password: data.confirm_password,
                enable_mfa: data.enable_mfa,
              }).unwrap()
            );
            
            const validationResult = {
              isValid: result.valid,
              errors: Object.values(result.errors).flat(),
              warnings: Object.values(result.warnings).flat(),
            };
            
            // Track validation completion
            RegistrationAnalytics.trackValidationComplete(4, result.valid, Date.now() - startTime);
            
            return validationResult;
          } catch (error: any) {
            RegistrationAnalytics.trackError(error, `Step ${4} validation`);
            return handleValidationError(error, 4);
          }

        case 5: // Profile Completion - Optional step
          const profileResult = { isValid: true, errors: [], warnings: [] };
          RegistrationAnalytics.trackValidationComplete(5, true, Date.now() - startTime);
          return profileResult;
          
        default:
          return { isValid: true, errors: [], warnings: [] };
      }
    } catch (error: any) {
      console.error("Validation error:", error);
      return {
        isValid: false,
        errors: ["Validation failed. Please try again."],
        warnings: [],
      };
    }
  };

  // Enterprise-grade verification validation
  const validateVerificationResults = (result: any, inputFirstName: string, inputLastName: string, inputCardNumber: string): {
    isValid: boolean;
    blocker?: {
      blocked: boolean;
      reason: string;
      actionRequired: string;
      canRetry: boolean;
    };
  } => {
    const { verification_status, results } = result;
    
    // Critical failure - system error
    if (!results || verification_status === 'error') {
      return {
        isValid: false,
        blocker: {
          blocked: true,
          reason: "Ghana Card processing failed due to technical issues",
          actionRequired: "Please retake clear photos of your Ghana Card and try again",
          canRetry: true
        }
      };
    }

    // Always validate that user input matches extracted data, regardless of backend status
    // This is our business rule enforcement
    
    // Name validation - enforce business rule that input must match extracted data
    if (results.extracted_name) {
      const inputName = `${inputFirstName} ${inputLastName}`.trim().toLowerCase();
      const extractedName = results.extracted_name.toLowerCase();
      
      // Check for exact match or if backend successfully verified despite differences
      const isExactMatch = inputName === extractedName;
      
      // If names don't match exactly AND backend didn't verify them, block progression
      if (!isExactMatch && !results.name_verified) {
        // Calculate similarity score for better error messaging
        const similarity = results.similarity_score || 0;
        
        let reason: string;
        let actionRequired: string;
        
        if (similarity < 0.3) {
          // Very low similarity - user entered wrong information
          reason = `Your entered name "${inputFirstName} ${inputLastName}" does not match your Ghana Card which shows "${results.extracted_name}". Please correct your information to match your official document.`;
          actionRequired = "Go back and update your name to match exactly what appears on your Ghana Card. The Ghana Card is the authoritative source.";
        } else if (similarity < 0.6) {
          // Moderate similarity - likely spelling or formatting issues in user input
          reason = `Your entered name "${inputFirstName} ${inputLastName}" doesn't closely match your Ghana Card which shows "${results.extracted_name}". Please check for spelling differences or formatting.`;
          actionRequired = "Go back and correct your name to match your Ghana Card exactly, including proper spelling and formatting.";
        } else {
          // High similarity but still flagged - minor differences in user input
          reason = `Minor differences detected between your entered name "${inputFirstName} ${inputLastName}" and your Ghana Card "${results.extracted_name}".`;
          actionRequired = "Please go back and ensure your entered name matches your Ghana Card exactly, or retake photos if the extraction appears incorrect.";
        }

        return {
          isValid: false,
          blocker: {
            blocked: true,
            reason,
            actionRequired,
            canRetry: true
          }
        };
      }
    }

    // Card number validation - enforce business rule that input must match extracted data
    if (results.extracted_number) {
      // Use the passed card number parameter
      const extractedCardNumber = results.extracted_number;
      
      // Normalize both numbers for comparison
      const inputNormalized = inputCardNumber.toUpperCase().replace(/[-\s]/g, '');
      const extractedNormalized = extractedCardNumber.toUpperCase().replace(/[-\s]/g, '');
      
      // Check for exact match or if backend verified despite differences
      const isExactMatch = inputNormalized === extractedNormalized;
      
      // If card numbers don't match exactly AND backend didn't verify them, block progression
      if (!isExactMatch && !results.number_verified) {
        return {
          isValid: false,
          blocker: {
            blocked: true,
            reason: `Your entered Ghana Card number "${inputCardNumber}" does not match what we extracted from your card: "${results.extracted_number}". Please correct your information to match your official document.`,
            actionRequired: "Go back and update your Ghana Card number to match exactly what appears on your card. If the extraction appears incorrect, retake clearer photos.",
            canRetry: true
          }
        };
      }
    }

    // Warning status - partial verification
    if (verification_status === 'warning') {
      // For warnings, we'll allow progression but show concern
      return { isValid: true };
    }

    // Success
    return { isValid: true };
  };

  const processTextractBackend = async (frontImage: File, backImage: File) => {
    setIsProcessingOCR(true);
    setCurrentProcessingStage(0); // Start with upload stage
    const startTime = Date.now();
    
    // Track Textract processing start
    RegistrationAnalytics.trackTextractStart();
    
    // Simulate stage progression with realistic timing
    const progressStages = async () => {
      // Stage 0: Upload (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      setCurrentProcessingStage(1);
      
      // Stage 1: Front image analysis (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      setCurrentProcessingStage(2);
      
      // Stage 2: Back image analysis (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      setCurrentProcessingStage(3);
      
      // Stage 3: Verification (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentProcessingStage(4);
      
      // Stage 4: Finalization (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
    };
    
    // Start stage progression
    progressStages();
    
    try {
      const data = methods.getValues();
      
      // Validate images before processing
      const frontValidation = RegistrationService.validateImageFile(frontImage);
      const backValidation = RegistrationService.validateImageFile(backImage);
      
      if (!frontValidation.valid) {
        throw new Error(`Front image validation failed: ${frontValidation.error}`);
      }
      
      if (!backValidation.valid) {
        throw new Error(`Back image validation failed: ${backValidation.error}`);
      }
      
      // Create FormData for Textract processing
      const formData = RegistrationService.createTextractFormData(
        frontImage, 
        backImage,
        {
          first_name: data.first_name,
          last_name: data.last_name,
          ghana_card_number: data.ghana_card_number,
        }
      );

      // Use retry mechanism for Textract processing
      const result = await retryWithBackoff(() => processTextract(formData).unwrap(), 2, 2000);
      
      // Process Textract results
      const textractResult: TextractResult = {
        name: result.results.extracted_name || "Unknown",
        cardNumber: result.results.extracted_number || "Unknown",
        confidence: result.results.confidence,
        verified: result.results.name_verified && result.results.number_verified,
      };

      setTextractResults(textractResult);
      
      
      // Enterprise-grade validation
      const validationResult = validateVerificationResults(result, data.first_name, data.last_name, data.ghana_card_number);
      
      if (validationResult.isValid) {
        setNameVerificationStatus("success");
        setVerificationBlocker(null); // Clear any previous blocker
        showSuccessToast("Ghana Card verification successful!");
        RegistrationAnalytics.trackTextractComplete(true, result.results.confidence, Date.now() - startTime);
      } else {
        // Set verification blocker
        setVerificationBlocker(validationResult.blocker || null);
        setNameVerificationStatus("error");
        
        // Show comprehensive error message
        if (validationResult.blocker) {
          showErrorToast(validationResult.blocker.reason);
        }
        RegistrationAnalytics.trackTextractComplete(false, result.results.confidence, Date.now() - startTime);
      }
      
      // Show detailed recommendations if any
      if (result.recommendations && result.recommendations.length > 0) {
        const recommendationMessage = `📋 Recommendations:\n${result.recommendations.map(r => `• ${r}`).join('\n')}`;
        console.log(recommendationMessage);
      }
      
    } catch (error: any) {
      console.error("Textract processing failed:", error);
      setNameVerificationStatus("error");
      
      // Track Textract failure
      RegistrationAnalytics.trackTextractComplete(false, 0, Date.now() - startTime);
      RegistrationAnalytics.trackError(error, 'Textract processing');
      
      // Enhanced error message extraction
      let errorMessage = "Textract processing failed. Please try again with clearer images.";
      
      if (networkStatus === 'offline') {
        errorMessage = "You're offline. Please check your internet connection and try again.";
      } else if (error?.status === 413) {
        errorMessage = "Image files are too large. Please compress them and try again.";
      } else if (error?.status === 415) {
        errorMessage = "Image format not supported. Please use JPEG, PNG, or WebP images.";
      } else if (error?.status === 429) {
        errorMessage = "Too many OCR requests. Please wait a moment and try again.";
      } else if (error?.status === 500) {
        errorMessage = "OCR service is temporarily unavailable. Please try again in a few minutes.";
      } else if (error.data?.error) {
        errorMessage = RegistrationService.translateErrorMessage(error.data.error);
      } else if (error.message.includes("validation failed")) {
        errorMessage = error.message;
      }
      
      showErrorToast(errorMessage);
      
      // Set a placeholder Textract result for error state
      setTextractResults({
        name: "Processing Failed",
        cardNumber: "Processing Failed",
        confidence: 0,
        verified: false,
      });
      
    } finally {
      setIsProcessingOCR(false);
      setCurrentProcessingStage(0); // Reset stage
    }
  };

  const handleNext = async () => {
    setIsValidating(true);
    const validation = await validateStep(currentStep);
    setStepValidations(prev => ({ ...prev, [currentStep]: validation }));
    
    if (validation.isValid) {
      // Special handling for Ghana Card step (step 3)
      if (currentStep === 3) {
        const frontImage = methods.getValues("ghana_card_front_image")?.[0];
        const backImage = methods.getValues("ghana_card_back_image")?.[0];
        
        if (frontImage && backImage) {
          // Process Textract first
          await processTextractBackend(frontImage, backImage);
          
          // Check if verification is blocked after processing
          if (verificationBlocker?.blocked) {
            setIsValidating(false);
            showErrorToast(`Verification failed: ${verificationBlocker.reason}`);
            return; // Block progression
          }
          
          // Also check verification status
          if (nameVerificationStatus === "error") {
            setIsValidating(false);
            showErrorToast("Ghana Card verification failed. Please resolve the issues before continuing.");
            return; // Block progression
          }
        }
      }
      
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      // Show first error
      if (validation.errors.length > 0) {
        showErrorToast(validation.errors[0]);
      }
    }
    setIsValidating(false);
  };

  const handlePrevious = () => {
    // Clear verification blocker when moving away from Ghana Card step
    if (currentStep === 3) {
      setVerificationBlocker(null);
      setNameVerificationStatus("pending");
    }
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Verification functions
  const handleSendEmailOTP = async () => {
    if (isSendingEmailOTP) return; // Prevent multiple clicks
    
    setIsSendingEmailOTP(true);
    try {
      const email = methods.getValues("email");
      if (!email) {
        setLastError("Email address is required");
        return;
      }

      const response = await sendVerificationCode({ 
        type: 'email',
        contact_info: email
      }).unwrap();
      
      if (response.success) {
        setEmailVerificationSent(true);
        setEmailOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        setLastError(null);
      }
    } catch (error: any) {
      console.error("Email verification error:", error);
      setLastError(error?.data?.message || "Failed to send verification code");
    } finally {
      setIsSendingEmailOTP(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    if (isSendingPhoneOTP) return; // Prevent multiple clicks
    
    setIsSendingPhoneOTP(true);
    try {
      const phone = methods.getValues("phone");
      if (!phone) {
        setLastError("Phone number is required");
        return;
      }

      const response = await sendVerificationCode({ 
        type: 'phone',
        contact_info: phone
      }).unwrap();
      
      if (response.success) {
        setPhoneVerificationSent(true);
        setPhoneOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        setLastError(null);
      }
    } catch (error: any) {
      console.error("Phone verification error:", error);
      setLastError(error?.data?.message || "Failed to send verification code");
    } finally {
      setIsSendingPhoneOTP(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (emailOTP.length !== 6) return;

    setIsVerifyingEmail(true);
    try {
      const email = methods.getValues("email");
      const response = await verifyCode({
        type: 'email',
        code: emailOTP,
        contact_info: email
      }).unwrap();
      
      if (response.success) {
        setEmailVerified(true);
        setLastError(null);
      }
    } catch (error: any) {
      console.error("Email verification error:", error);
      setLastError(error?.data?.message || "Invalid verification code");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (phoneOTP.length !== 6) return;

    setIsVerifyingPhone(true);
    try {
      const phone = methods.getValues("phone");
      const response = await verifyCode({
        type: 'phone',
        code: phoneOTP,
        contact_info: phone
      }).unwrap();
      
      if (response.success) {
        setPhoneVerified(true);
        setLastError(null);
      }
    } catch (error: any) {
      console.error("Phone verification error:", error);
      setLastError(error?.data?.message || "Invalid verification code");
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleFinalSubmit = async () => {
    const data = methods.getValues();
    const startTime = Date.now();
    
    // Track registration start
    RegistrationAnalytics.trackRegistrationStart();
    
    try {
      
      if (data.password !== data.confirm_password) {
        methods.setError("confirm_password", {
          type: "manual",
          message: "Passwords do not match",
        });
        return;
      }

      // Validate Ghana Card fields are provided
      if (!data.ghana_card_number) {
        methods.setError("ghana_card_number", {
          type: "manual",
          message: "Ghana Card number is required",
        });
        return;
      }

      if (!data.ghana_card_front_image || data.ghana_card_front_image.length === 0) {
        methods.setError("ghana_card_front_image", {
          type: "manual",
          message: "Ghana Card front image is required",
        });
        return;
      }

      if (!data.ghana_card_back_image || data.ghana_card_back_image.length === 0) {
        methods.setError("ghana_card_back_image", {
          type: "manual",
          message: "Ghana Card back image is required",
        });
        return;
      }

      // Create FormData for submission using our registration service
      const formData = new FormData();
      
      // Add basic fields
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      formData.append("email", data.email);
      formData.append("phone_number", data.phone_number || "");
      formData.append("password", data.password);
      formData.append("confirm_password", data.confirm_password);
      formData.append("user_type", data.user_type);
      formData.append("enable_mfa", data.enable_mfa ? "true" : "false");
      formData.append("terms_accepted", data.terms_accepted ? "true" : "false");
      
      // Add Ghana Card fields
      formData.append("ghana_card_number", data.ghana_card_number);
      
      
      // Only send images if Textract hasn't been processed yet
      if (textractResults && (textractResults.verification_status === 'success' || textractResults.verified === true)) {
        // Include flag to skip Textract processing and include results
        formData.append("skip_textract_processing", "true");
        formData.append("textract_results", JSON.stringify(textractResults));
        formData.append("ghana_card_verified", "true");
      } else {
        // Include images for Textract processing
        if (data.ghana_card_front_image?.[0]) {
          formData.append("ghana_card_front_image", data.ghana_card_front_image[0]);
        }
        
        if (data.ghana_card_back_image?.[0]) {
          formData.append("ghana_card_back_image", data.ghana_card_back_image[0]);
        }
      }
      
      // Add profile picture if provided
      if (data.profile_picture?.[0]) {
        formData.append("profile_picture", data.profile_picture[0]);
      }
      
      // Add registration metadata
      formData.append("client_timestamp", Date.now().toString());
      formData.append("registration_version", "2.0");

      const result = await completeRegistration(formData).unwrap();

      if (result?.access && result?.refresh) {
        const user: User = {
          id: result.id!,
          email: result.email!,
          name: `${result.first_name} ${result.last_name}`.trim(),
          role: result.user_type!,
          is_verified: result.is_verified,
        };

        dispatch(
          setCredentials({
            user,
            token: result.access,
            refreshToken: result.refresh,
          })
        );

        // Track successful registration
        RegistrationAnalytics.trackRegistrationComplete(true, Date.now() - startTime);
        
        showSuccessToast(result.message || "Account created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = "/home";
        }, 2000);
        return;
      }
      if (result?.requiresVerification) {
        showSuccessToast(
          result.message ||
            "Registration successful! Please check your email to verify your account. Redirecting to login..."
        );
        setTimeout(() => {
          setActiveTab("login");
        }, 2500);
        return;
      }

      if ((result as any)?.errors) {
        showErrorToast("Registration failed. Please check your inputs.");
        return;
      }

      // Fallback for other successful registration cases
      showSuccessToast(
        result.message || "Registration successful! Please log in to continue."
      );
      setTimeout(() => {
        setActiveTab("login");
      }, 2000);
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Track registration failure
      RegistrationAnalytics.trackRegistrationComplete(false, Date.now() - startTime);
      RegistrationAnalytics.trackError(err, 'Final registration');

      // Create more descriptive error messages
      let errorMessage = "Registration failed. Please try again.";

      if (err.status === 400) {
        if (err.data?.errors) {
          // Handle field-specific errors
          const errors = err.data.errors;
          
          // Check for Ghana Card specific errors
          if (errors.ghana_card_front_image) {
            const ghanaCardError = Array.isArray(errors.ghana_card_front_image) ? errors.ghana_card_front_image[0] : errors.ghana_card_front_image;
            methods.setError("ghana_card_front_image", {
              type: "manual",
              message: ghanaCardError,
            });
            errorMessage = "Ghana Card front verification failed. Please check the front image and ensure names match exactly.";
          } else if (errors.ghana_card_back_image) {
            const ghanaCardError = Array.isArray(errors.ghana_card_back_image) ? errors.ghana_card_back_image[0] : errors.ghana_card_back_image;
            methods.setError("ghana_card_back_image", {
              type: "manual",
              message: ghanaCardError,
            });
            errorMessage = "Ghana Card back verification failed. Please check the back image and ensure the card number is clear.";
          } else if (errors.ghana_card_number) {
            const ghanaCardNumberError = Array.isArray(errors.ghana_card_number) ? errors.ghana_card_number[0] : errors.ghana_card_number;
            methods.setError("ghana_card_number", {
              type: "manual",
              message: ghanaCardNumberError,
            });
            
            // Check if it's a duplicate Ghana Card number error
            if (ghanaCardNumberError.includes("already exists")) {
              errorMessage = "This Ghana Card number is already registered with another account. Each Ghana Card can only be used once.";
            } else {
              errorMessage = "Ghana Card number format is invalid. Please check and try again.";
            }
          } else {
            const firstError = Object.values(errors)[0];
            const firstErrorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            errorMessage = `Registration failed: ${firstErrorMessage}`;
          }
        } else {
          errorMessage = err.data?.detail || "Invalid registration data. Please check your input and try again.";
        }
      } else if (err.status === 409) {
        errorMessage = "An account with this email already exists. Please use a different email or try logging in.";
      } else if (err.status === 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (
        err.data &&
        typeof err.data === "string" &&
        err.data.includes("JSON parse error")
      ) {
        errorMessage = "There was an issue processing your profile picture. Please try with a different image or without an image.";
      } else {
        errorMessage = err?.data?.detail || err?.data?.message || "Registration failed. Please try again.";
      }

      // Only show toast message, no form errors
      showErrorToast(errorMessage);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo methods={methods} />;
      case 2:
        return <Step2PersonalIdentity methods={methods} />;
      case 3:
        return (
          <div className="space-y-6">
            <Step3GhanaCardVerification
              methods={methods}
              frontPreview={ghanaCardFrontPreview}
              setFrontPreview={setGhanaCardFrontPreview}
              backPreview={ghanaCardBackPreview}
              setBackPreview={setGhanaCardBackPreview}
              isProcessingOCR={isProcessingOCR || isProcessingTextractApi}
              ocrResults={textractResults}
              verificationStatus={nameVerificationStatus}
              onProcessOCR={processTextractBackend}
              currentProcessingStage={currentProcessingStage}
            />
            
            {/* Enterprise-Grade Verification Blocker UI */}
            {verificationBlocker?.blocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      Verification Required
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p className="mb-2">{verificationBlocker.reason}</p>
                      <p className="font-medium">Action Required:</p>
                      <p>{verificationBlocker.actionRequired}</p>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-3">
                      {/* Go Back to Correct Information Button */}
                      <button
                        onClick={() => {
                          setCurrentStep(2); // Go back to personal info step
                          setVerificationBlocker(null); // Clear the blocker
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Correct My Information
                      </button>
                      
                      {/* Retry Photo Button */}
                      {verificationBlocker.canRetry && (
                        <button
                          onClick={() => {
                            // Clear current images and results
                            setGhanaCardFrontPreview(null);
                            setGhanaCardBackPreview(null);
                            setTextractResults(null);
                            setNameVerificationStatus("pending");
                            setVerificationBlocker(null);
                            methods.setValue("ghana_card_front_image", []);
                            methods.setValue("ghana_card_back_image", []);
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Retake Photos
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Success message when verification passes */}
            {nameVerificationStatus === "success" && !verificationBlocker?.blocked && textractResults && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-800">Verification Successful</h3>
                    <div className="mt-2 text-sm text-green-700 space-y-1">
                      <p>✓ Name verified: <span className="font-medium">{textractResults.name}</span></p>
                      <p>✓ Card number verified: <span className="font-medium">{textractResults.cardNumber}</span></p>
                      <p>✓ Confidence score: <span className="font-medium">{Math.round(textractResults.confidence)}%</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <Step4AccountSecurity
            methods={methods}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            passwordStrength={passwordStrength}
            setPasswordStrength={setPasswordStrength}
          />
        );
      case 5:
        return (
          <Step5ProfileCompletion
            methods={methods}
            profilePreview={profilePreview}
            setProfilePreview={setProfilePreview}
          />
        );
      case 6:
        return (
          <Step6Verification
            methods={methods}
            emailVerificationSent={emailVerificationSent}
            phoneVerificationSent={phoneVerificationSent}
            emailOTP={emailOTP}
            setEmailOTP={setEmailOTP}
            phoneOTP={phoneOTP}
            setPhoneOTP={setPhoneOTP}
            onSendEmailOTP={handleSendEmailOTP}
            onSendPhoneOTP={handleSendPhoneOTP}
            onVerifyEmailOTP={handleVerifyEmailOTP}
            onVerifyPhoneOTP={handleVerifyPhoneOTP}
            onFinalSubmit={handleFinalSubmit}
            isLoading={isSubmittingRegistration}
            isVerifyingEmail={isVerifyingEmail}
            isVerifyingPhone={isVerifyingPhone}
            isSendingEmailOTP={isSendingEmailOTP}
            isSendingPhoneOTP={isSendingPhoneOTP}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            emailOtpExpiry={emailOtpExpiry}
            phoneOtpExpiry={phoneOtpExpiry}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="w-full max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= currentStep || isCompleted;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isCurrent
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : isAccessible
                          ? "border-gray-300 text-gray-500 hover:border-indigo-300"
                          : "border-gray-200 text-gray-300"
                      }`}
                    >
                      {isCompleted ? (
                        <FiCheck size={20} />
                      ) : (
                        <step.icon size={20} />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${isCurrent ? "text-indigo-600" : "text-gray-500"}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400">{step.description}</div>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        completedSteps.includes(step.id) ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <FiArrowLeft className="mr-2" />
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isValidating || isProcessingOCR || isValidatingStep1 || isValidatingStep2 || isValidatingStep4 || isProcessingTextractApi || (currentStep === 3 && verificationBlocker?.blocked)}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {(isValidating || isValidatingStep1 || isValidatingStep2 || isValidatingStep4) ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Validating...
                </>
              ) : (isProcessingOCR || isProcessingTextractApi) ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (currentStep === 3 && verificationBlocker?.blocked) ? (
                <>
                  <FiX className="mr-2" />
                  Verification Required
                </>
              ) : (
                <>
                  Next
                  <FiArrowRight className="ml-2" />
                </>
              )}
            </button>
          ) : null}
        </div>

        {/* Network Status Indicator */}
        {networkStatus === 'offline' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiX className="text-red-500 mr-2" />
              <span className="font-medium text-red-800">You're offline</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Please check your internet connection and try again.
            </p>
          </div>
        )}

        {/* Retry Mechanism */}
        {lastError && retryCount > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiLoader className="animate-spin text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">Retrying... (Attempt {retryCount + 1} of 3)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRetryCount(0);
                  setLastError(null);
                }}
                className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step Validation Feedback */}
        {stepValidations[currentStep] && (
          <div className="mt-4">
            {stepValidations[currentStep].errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FiX className="text-red-500 mr-2" />
                  <span className="font-medium text-red-800">Please fix the following issues:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {stepValidations[currentStep].errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {stepValidations[currentStep].warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-2">
                <div className="flex items-center mb-2">
                  <FiAlertCircle className="text-yellow-500 mr-2" />
                  <span className="font-medium text-yellow-800">Recommendations:</span>
                </div>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  {stepValidations[currentStep].warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </FormProvider>
  );
};

// Step Components (to be implemented separately for cleaner code)
const Step1BasicInfo: React.FC<{ methods: any }> = ({ methods }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Let's Get Started
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your basic contact information to begin your account setup.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <FiMail className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              {...methods.register("email", { required: true })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <FiPhone className="absolute left-3 top-3 text-gray-400" />
            <input
              type="tel"
              {...methods.register("phone_number", { required: true })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+233 XX XXX XXXX"
            />
          </div>
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            {...methods.register("terms_accepted", { required: true })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
          />
          <label className="ml-3 text-sm text-gray-700 dark:text-gray-300">
            I agree to the{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Privacy Policy
            </a>{" "}
            *
          </label>
        </div>
      </div>
    </div>
  );
};

export default RegistrationWizard;