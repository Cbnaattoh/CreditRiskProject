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
  useProcessGhanaCardOCRMutation,
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

interface OCRResult {
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
      mfa_enabled: false,
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
  const [processOCR, { isLoading: isProcessingOCRApi }] = useProcessGhanaCardOCRMutation();
  const [validateStep4, { isLoading: isValidatingStep4 }] = useValidateStep4Mutation();
  const [sendVerificationCode] = useSendVerificationCodeMutation();
  const [verifyCode] = useVerifyCodeMutation();
  const [completeRegistration, { isLoading: isSubmittingRegistration }] = useCompleteRegistrationMutation();

  // Image previews
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [ghanaCardFrontPreview, setGhanaCardFrontPreview] = useState<string | null>(null);
  const [ghanaCardBackPreview, setGhanaCardBackPreview] = useState<string | null>(null);

  // OCR and verification states
  const [ocrResults, setOcrResults] = useState<OCRResult | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [nameVerificationStatus, setNameVerificationStatus] = useState<"pending" | "success" | "warning" | "error">("pending");

  // Security states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Verification states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");

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
                mfa_enabled: data.mfa_enabled,
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

  const processOCRBackend = async (frontImage: File, backImage: File) => {
    setIsProcessingOCR(true);
    const startTime = Date.now();
    
    // Track OCR processing start
    RegistrationAnalytics.trackOCRStart();
    
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
      
      // Create FormData for OCR processing
      const formData = RegistrationService.createOCRFormData(
        frontImage, 
        backImage,
        {
          first_name: data.first_name,
          last_name: data.last_name,
          ghana_card_number: data.ghana_card_number,
        }
      );

      // Use retry mechanism for OCR processing
      const result = await retryWithBackoff(() => processOCR(formData).unwrap(), 2, 2000);
      
      // Process OCR results
      const ocrResult: OCRResult = {
        name: result.results.extracted_name || "Unknown",
        cardNumber: result.results.extracted_number || "Unknown",
        confidence: result.results.confidence,
        verified: result.results.name_verified && result.results.number_verified,
      };

      setOcrResults(ocrResult);
      
      // Set verification status based on backend result
      if (result.verification_status === "success") {
        setNameVerificationStatus("success");
        showSuccessToast("Ghana Card verification successful!");
        RegistrationAnalytics.trackOCRComplete(true, result.results.confidence, Date.now() - startTime);
      } else if (result.verification_status === "warning") {
        setNameVerificationStatus("warning");
        showErrorToast("Verification completed with warnings. Please review the results.");
        RegistrationAnalytics.trackOCRComplete(false, result.results.confidence, Date.now() - startTime);
      } else {
        setNameVerificationStatus("error");
        showErrorToast("Verification failed. Please check your images and try again.");
        RegistrationAnalytics.trackOCRComplete(false, result.results.confidence, Date.now() - startTime);
      }
      
      // Show detailed recommendations if any
      if (result.recommendations && result.recommendations.length > 0) {
        const recommendationMessage = `📋 Recommendations:\n${result.recommendations.map(r => `• ${r}`).join('\n')}`;
        console.log(recommendationMessage);
      }
      
    } catch (error: any) {
      console.error("OCR processing failed:", error);
      setNameVerificationStatus("error");
      
      // Track OCR failure
      RegistrationAnalytics.trackOCRComplete(false, 0, Date.now() - startTime);
      RegistrationAnalytics.trackError(error, 'OCR processing');
      
      // Enhanced error message extraction
      let errorMessage = "OCR processing failed. Please try again with clearer images.";
      
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
      
      // Set a placeholder OCR result for error state
      setOcrResults({
        name: "Processing Failed",
        cardNumber: "Processing Failed",
        confidence: 0,
        verified: false,
      });
      
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleNext = async () => {
    setIsValidating(true);
    const validation = await validateStep(currentStep);
    setStepValidations(prev => ({ ...prev, [currentStep]: validation }));
    
    if (validation.isValid) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
      
      // Process OCR when moving from step 3
      if (currentStep === 3) {
        const frontImage = methods.getValues("ghana_card_front_image")?.[0];
        const backImage = methods.getValues("ghana_card_back_image")?.[0];
        if (frontImage && backImage) {
          await processOCRBackend(frontImage, backImage);
        }
      }
      
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
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    const data = methods.getValues();
    const startTime = Date.now();
    
    // Track registration start
    RegistrationAnalytics.trackRegistrationStart();
    
    try {
      // Debug: Log all form data
      console.log("🔍 Form submission data:", data);
      console.log("🔍 Ghana Card Number:", data.ghana_card_number);
      console.log("🔍 Ghana Card Front Image:", data.ghana_card_front_image);
      console.log("🔍 Ghana Card Back Image:", data.ghana_card_back_image);
      
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
      formData.append("enable_mfa", data.mfa_enabled ? "true" : "false");
      formData.append("terms_accepted", data.terms_accepted ? "true" : "false");
      
      // Add Ghana Card fields
      formData.append("ghana_card_number", data.ghana_card_number);
      
      if (data.ghana_card_front_image?.[0]) {
        formData.append("ghana_card_front_image", data.ghana_card_front_image[0]);
      }
      
      if (data.ghana_card_back_image?.[0]) {
        formData.append("ghana_card_back_image", data.ghana_card_back_image[0]);
      }
      
      // Add profile picture if provided
      if (data.profile_picture?.[0]) {
        formData.append("profile_picture", data.profile_picture[0]);
      }
      
      // Add registration metadata
      formData.append("client_timestamp", Date.now().toString());
      formData.append("registration_version", "2.0");

      // Debug: Log the FormData being sent
      console.log("🚀 Sending registration FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const result = await completeRegistration(formData).unwrap();
      console.log("🔎 Registration response:", result);

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
          <Step3GhanaCardVerification
            methods={methods}
            frontPreview={ghanaCardFrontPreview}
            setFrontPreview={setGhanaCardFrontPreview}
            backPreview={ghanaCardBackPreview}
            setBackPreview={setGhanaCardBackPreview}
            isProcessingOCR={isProcessingOCR || isProcessingOCRApi}
            ocrResults={ocrResults}
            verificationStatus={nameVerificationStatus}
            onProcessOCR={processOCRBackend}
          />
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
            emailVerificationSent={emailVerificationSent}
            phoneVerificationSent={phoneVerificationSent}
            emailOTP={emailOTP}
            setEmailOTP={setEmailOTP}
            phoneOTP={phoneOTP}
            setPhoneOTP={setPhoneOTP}
            onFinalSubmit={handleFinalSubmit}
            isLoading={isSubmittingRegistration}
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
              disabled={isValidating || isProcessingOCR || isValidatingStep1 || isValidatingStep2 || isValidatingStep4 || isProcessingOCRApi}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {(isValidating || isValidatingStep1 || isValidatingStep2 || isValidatingStep4) ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Validating...
                </>
              ) : (isProcessingOCR || isProcessingOCRApi) ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Processing...
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