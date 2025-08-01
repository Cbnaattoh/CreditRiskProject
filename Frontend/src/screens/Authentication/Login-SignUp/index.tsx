import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  useLoginMutation,
  useVerifyMFAMutation,
  useSetupMFAMutation,
  useVerifyMFASetupMutation,
} from "../../../components/redux/features/auth/authApi";
import {
  clearMFAState,
  logout,
} from "../../../components/redux/features/auth/authSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../components/utils/hooks";
import { store } from "../../../components/redux/store";
import { useToast, ToastContainer } from "../../../components/utils/Toast";
import MFAForm from "./components/MFAForm";
import TabNavigation from "./components/TabNavigation";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import SidePanel from "./components/SidePanel";
import BackgroundElements from "./components/BackgroundElements";
import type {
  MFASetupData,
  MFAStep,
  FormStep,
  ActiveTab,
} from "./components/types";
import { ANIMATION_VARIANTS } from "./components/constants";
import { useAuthRedirect } from "./components/hooks/useAuthRedirect";
import { useFormManagement } from "./components/hooks/useFormManagement";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<string>("Admin");
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [shake, setShake] = useState(false);
  const [mfaStep, setMfaStep] = useState<MFAStep>("login");
  const [mfaSetupData, setMfaSetupData] = useState<MFASetupData | null>(null);
  const [isSettingUpMFA, setIsSettingUpMFA] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const { toasts, removeToast, success, error, info } = useToast();
  const { loginMethods, mfaFormMethods, registerMethods, resetForms } =
    useFormManagement();

  const tempToken = useAppSelector((state) => state.auth.tempToken);
  const uid = useAppSelector((state) => state.auth.uid);

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyMFA, { isLoading: isMFALoading }] = useVerifyMFAMutation();
  const [setupMFA, { isLoading: isMFASetupLoading }] = useSetupMFAMutation();
  const [verifyMFASetup] = useVerifyMFASetupMutation();

  useAuthRedirect();

  const isLoading = useMemo(
    () => isLoginLoading || isMFALoading || isMFASetupLoading || isSettingUpMFA,
    [isLoginLoading, isMFALoading, isMFASetupLoading, isSettingUpMFA]
  );

  const handleBackToLogin = useCallback(() => {
    setFormStep(1);
    setMfaStep("login");
    setMfaSetupData(null);
    resetForms();
    dispatch(clearMFAState());
    info("Returned to login form");
  }, [resetForms, dispatch, info]);

  const handleApiError = useCallback(
    (err: any, formType: "login" | "mfa") => {
      console.error(`${formType} error:`, err);
      console.error("🔴 Error details:", {
        status: err?.status,
        data: err?.data,
        detail: err?.data?.detail,
        message: err?.message,
        originalError: err
      });

      // Create more descriptive error messages
      let errorMessage = "An unknown error occurred";
      
      if (err?.status === 401) {
        if (formStep === 2) {
          handleBackToLogin();
          return;
        }
        // Login authentication failed - handle different error structures
        let authErrorMessage = null;
        
        // Check for direct detail message
        if (err?.data?.detail?.includes("Invalid email or password")) {
          authErrorMessage = "The email or password you entered is incorrect. Please check your credentials and try again.";
        }
        // Check for serializer non_field_errors (common in DRF)
        else if (err?.data?.non_field_errors?.length > 0) {
          const firstError = err.data.non_field_errors[0];
          if (firstError.includes("Invalid email or password") || firstError.includes("Invalid credentials")) {
            authErrorMessage = "The email or password you entered is incorrect. Please check your credentials and try again.";
          } else {
            authErrorMessage = firstError;
          }
        }
        // Check for other error structures
        else if (err?.data?.detail) {
          authErrorMessage = err.data.detail;
        }
        
        errorMessage = authErrorMessage || "Login failed. Please check your credentials.";
      } else if (err?.status === 429) {
        errorMessage = "Account temporarily locked due to multiple failed attempts. Please try again later.";
      } else if (err?.status === 400) {
        errorMessage = err?.data?.detail || err?.data?.message || "Invalid request. Please check your input.";
      } else if (err?.status === 500) {
        // Handle specific login failure that comes as 500 error
        if (err?.data?.detail === 'Login failed') {
          errorMessage = "The email or password you entered is incorrect. Please check your credentials and try again.";
        } else {
          errorMessage = "Server error occurred. Please try again later.";
        }
      } else if (err?.status === 403) {
        errorMessage = "Access denied. Please check your credentials.";
      } else if (!err?.status && err?.data?.detail) {
        // Handle cases where status might be undefined but we have error details
        if (err.data.detail.includes("Invalid email or password")) {
          errorMessage = "The email or password you entered is incorrect. Please check your credentials and try again.";
        } else {
          errorMessage = err.data.detail;
        }
      } else {
        errorMessage = err?.data?.detail || err?.data?.message || err?.message || "An unexpected error occurred";
      }

      // Only show toast message, remove form error display
      error(errorMessage);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    },
    [formStep, handleBackToLogin, error]
  );

  const handleMFASetup = useCallback(
    async (mfaEnabled: boolean, mfaFullyConfigured: boolean) => {
      try {
        setIsSettingUpMFA(true);

        const freshAuthState = store.getState().auth;

        if (!freshAuthState?.isAuthenticated) {
          throw new Error("User not authenticated");
        }

        if (!freshAuthState?.token) {
          throw new Error("No authentication token available");
        }

        if (freshAuthState?.tokenExpired) {
          throw new Error("Authentication token has expired");
        }

        let setupResult;
        try {
          setupResult = await setupMFA({ enable: true }).unwrap();
          console.log('🔵 MFA Setup API Response:', setupResult);
        } catch (apiError) {
          console.error("❌ MFA Setup API call failed:", apiError);
          
          // Provide more specific error messages
          if (apiError?.status === 401) {
            throw new Error("Authentication expired. Please log in again.");
          } else if (apiError?.status === 403) {
            throw new Error("You don't have permission to setup MFA.");
          } else if (apiError?.data?.detail) {
            throw new Error(apiError.data.detail);
          }
          
          throw apiError;
        }

        // Validate response structure
        if (!setupResult) {
          throw new Error("No response from setup API");
        }

        if (!setupResult.uri || !setupResult.secret) {
          console.error("❌ Invalid response structure:", setupResult);
          throw new Error("Invalid setup response - missing QR code or secret");
        }

        setMfaSetupData({
          uri: setupResult.uri,
          secret: setupResult.secret,
          backup_codes: setupResult.backup_codes || [],
        });

        setMfaStep("setup");
        setFormStep(2);

        success("Scan the QR code with your authenticator app");
      } catch (setupError: any) {
        console.error("❌ MFA Setup Error:", setupError);

        if (setupError?.status === 401) {
          error("Session expired. Please log in again.");
          dispatch(logout());
          navigate("/");
          return;
        }

        // Handle other specific errors
        if (setupError?.status === 400) {
          const errorDetail = setupError?.data?.detail;
          if (errorDetail === "MFA is already fully configured") {
            info("MFA is already set up. Redirecting to verification.");
            setMfaStep("verify");
            setFormStep(2);
            return;
          }
        }

        handleApiError(setupError, "login");
      } finally {
        setIsSettingUpMFA(false);
      }
    },
    [
      setupMFA,
      success,
      error,
      info,
      dispatch,
      navigate,
      setMfaSetupData,
      setMfaStep,
      setFormStep,
      setIsSettingUpMFA,
      handleApiError,
    ]
  );

  const handleLoginSubmit = useCallback(
    async (data: any) => {
      try {

        const result = await login({
          email: data.email,
          password: data.password,
          enableMFA: data.enableMFA,
        }).unwrap();

        console.log('🔵 Login result:', result);

        // Handle MFA verification requirement (for users with completed MFA)
        if (result.requires_mfa && result.temp_token) {
          success("Login successful!");
          setFormStep(2);
          setMfaStep("verify");
          setTimeout(() => {
            info("Two-factor authentication required. Please enter your code.");
          }, 500);
          return;
        }

        // Handle MFA setup requirement (for users who need to complete MFA setup)
        if (result.requires_mfa_setup || result.limited_access || result.token_type === 'mfa_setup') {
          success("Login successful! Please complete your MFA setup.");
          setTimeout(() => {
            info("Redirecting to dashboard with limited access. Complete MFA setup to unlock all features.");
          }, 500);
          setTimeout(() => navigate("/home"), 1500);
          return;
        }

        // Standard successful login with full access
        if (result.access && result.token_type !== 'mfa_setup') {
          success("Login successful!");
          setTimeout(() => {
            info("Login successful! Redirecting to dashboard...");
          }, 500);
          setTimeout(() => navigate("/home"), 1500);
          return;
        }

        // Fallback for other successful logins
        success("Login successful!");
        setTimeout(() => {
          info("Redirecting to dashboard...");
        }, 500);
        setTimeout(() => navigate("/home"), 1500);
      } catch (err: any) {
        console.error("❌ Login error:", err);
        console.error("🔴 LOGIN SPECIFIC - Error structure:", {
          status: err?.status,
          data: err?.data,
          detail: err?.data?.detail,
          non_field_errors: err?.data?.non_field_errors,
          message: err?.message,
          name: err?.name,
          originalError: err
        });
        handleApiError(err, "login");
      }
    },
    [login, handleMFASetup, navigate, success, error, info, handleApiError]
  );

  const handleMFASubmit = useCallback(
    async (data: any) => {
      try {
        const { code, useBackupCode } = data;
        const token = typeof code === 'string' ? code.trim() : 
          Object.values(code || {}).join("").trim();

        // Validate input based on whether it's a backup code or TOTP
        if (useBackupCode) {
          if (token.length !== 8 || !/^[A-Fa-f0-9]{8}$/i.test(token)) {
            mfaFormMethods.setError("root", {
              type: "manual",
              message: "Please enter a valid 8-character backup code.",
            });
            return;
          }
        } else {
          if (token.length !== 6 || !/^[0-9]{6}$/.test(token)) {
            mfaFormMethods.setError("root", {
              type: "manual",
              message: "Please enter all 6 digits of the code correctly.",
            });
            return;
          }
        }

        if (mfaStep === "verify") {
          const verificationData: any = {
            uid: uid || "",
            temp_token: tempToken || "",
          };
          
          // Use appropriate field based on input type
          if (useBackupCode) {
            verificationData.backup_code = token.toUpperCase();
          } else {
            verificationData.token = token;
          }

          console.log("🔵 Calling verifyMFA with:", verificationData);
          const result = await verifyMFA(verificationData).unwrap();
          console.log("🟢 MFA verification successful:", result);
          
          // Only show success message after API confirms success
          success("Verification successful! Redirecting...");
          setTimeout(() => navigate("/home"), 1500);
        } else if (mfaStep === "setup") {
          await verifyMFASetup({ token }).unwrap();

          success("MFA verified successfully!");
          info("Please save your backup codes in a secure location");
          setMfaStep("backup");
        }
      } catch (err: any) {
        console.error("🔴 CATCH BLOCK REACHED - MFA verification error:", err);
        console.error("🔴 Error structure:", {
          status: err?.status,
          data: err?.data,
          detail: err?.data?.detail,
          message: err?.message
        });
        
        // Handle specific error types using toast messages
        if (err?.data?.detail?.includes('backup code')) {
          error("Invalid or already used backup code. Please try another one.");
        } else if (err?.data?.detail?.includes('Invalid verification code')) {
          error("Invalid verification code. Please check your authenticator app and try again.");
        } else if (err?.data?.detail?.includes('Invalid or expired token')) {
          error("Your session has expired. Please log in again.");
          // Redirect to login after a short delay
          setTimeout(() => {
            setFormStep(1);
            setMfaStep("login");
          }, 2000);
        } else {
          handleApiError(err, "mfa");
        }
      }
    },
    [
      mfaFormMethods,
      mfaStep,
      verifyMFA,
      uid,
      tempToken,
      success,
      navigate,
      verifyMFASetup,
      info,
      handleApiError,
    ]
  );

  const handleContactSupport = useCallback((method: 'email' | 'phone', message: string) => {
    const supportRequest = {
      method,
      message,
      userEmail: loginMethods.getValues('email'),
      timestamp: new Date().toISOString(),
      issue: 'MFA Access Recovery'
    };
    
    console.log('Support request:', supportRequest);
    
    // In a real application, you would send this to your support system
    // For now, we'll just show a success message
    success(`${method === 'email' ? 'Email' : 'Phone'} support request submitted successfully!`);
    
    // You could also store this in localStorage for tracking
    const existingRequests = JSON.parse(localStorage.getItem('supportRequests') || '[]');
    existingRequests.push(supportRequest);
    localStorage.setItem('supportRequests', JSON.stringify(existingRequests));
  }, [loginMethods, success]);

  const handleForgotPassword = useCallback(() => {
    info("Redirecting to password recovery");
    setTimeout(() => navigate("/forgot-password"), 1500);
  }, [info, navigate]);


  const handleBackupCodesAcknowledged = useCallback(async () => {
    try {
      await setupMFA({
        enable: true,
        backup_codes_acknowledged: true,
      }).unwrap();

      success("MFA setup complete! You can now log in.");
      setTimeout(() => navigate("/home"), 1000);
    } catch (err: any) {
      console.error("Backup acknowledgment failed:", err);
      handleApiError(err, "mfa");
    }
  }, [setupMFA, navigate, success, handleApiError]);

  useEffect(() => {
    document.body.className =
      "bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900";
    return () => {
      document.body.className = "";
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900">
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
      <BackgroundElements shake={shake} />

      <motion.div
        {...ANIMATION_VARIANTS.pageEnter}
        className="w-full max-w-6xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-gray-200/50 dark:border-gray-700/50"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 dark:from-indigo-900/20 dark:via-transparent dark:to-purple-900/10 pointer-events-none" />

        <div className="flex flex-col md:flex-row relative">
          {/* Left Side Panel */}
          <SidePanel userType={userType} setUserType={setUserType} />

          {/* Right Side Form Panel */}
          <div className="w-full md:w-3/5 p-10 flex flex-col justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            {/* Tab Navigation */}
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Form Content */}
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                formStep === 1 ? (
                  <LoginForm
                    loginMethods={loginMethods}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    handleLoginSubmit={handleLoginSubmit}
                    handleForgotPassword={handleForgotPassword}
                    isLoading={isLoading}
                    showSuccessToast={success}
                    showErrorToast={error}
                    showInfoToast={info}
                  />
                ) : (
                  <MFAForm
                    mfaFormMethods={mfaFormMethods}
                    mfaStep={mfaStep}
                    mfaSetupData={mfaSetupData}
                    handleMFASubmit={handleMFASubmit}
                    handleBackToLogin={handleBackToLogin}
                    isLoading={isLoading}
                    backupCodes={mfaSetupData?.backup_codes || []}
                    handleBackupCodesAcknowledged={
                      handleBackupCodesAcknowledged
                    }
                    userEmail={loginMethods.getValues('email')}
                    onContactSupport={handleContactSupport}
                    showSuccessToast={success}
                    showErrorToast={error}
                  />
                )
              ) : (
                <RegisterForm
                  registerMethods={registerMethods}
                  setActiveTab={setActiveTab}
                  showSuccessToast={success}
                  showErrorToast={error}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400 dark:text-gray-500"
      >
        © {new Date().getFullYear()} RiskGuard. All rights reserved.
      </motion.div>
    </div>
  );
};

export default Login;
