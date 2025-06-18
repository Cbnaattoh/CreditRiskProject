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
import { useToast, ToastContainer } from "../../../components/utils/Toast";
import MFAForm from "./components/MFAForm";

// Import modular components
import TabNavigation from "./components/TabNavigation";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import SidePanel from "./components/SidePanel";
import BackgroundElements from "./components/BackgroundElements";

// Import types and constants
import type {
  MFASetupData,
  MFAStep,
  FormStep,
  ActiveTab,
} from "./components//types";
import { ANIMATION_VARIANTS } from "./components/constants";

// Import hooks
import { useAuthRedirect } from "./components/hooks/useAuthRedirect";
import { useFormManagement } from "./components/hooks/useFormManagement";

const Login: React.FC = () => {
  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<string>("Admin");
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [shake, setShake] = useState(false);
  const [mfaStep, setMfaStep] = useState<MFAStep>("login");
  const [mfaSetupData, setMfaSetupData] = useState<MFASetupData | null>(null);
  const [isSettingUpMFA, setIsSettingUpMFA] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toasts, removeToast, success, error, info } = useToast();
  const { loginMethods, mfaFormMethods, registerMethods, resetForms } =
    useFormManagement();

  // Selectors
  const tempToken = useAppSelector((state) => state.auth.tempToken);
  const uid = useAppSelector((state) => state.auth.uid);

  // API hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyMFA, { isLoading: isMFALoading }] = useVerifyMFAMutation();
  const [setupMFA, { isLoading: isMFASetupLoading }] = useSetupMFAMutation();
  const [verifyMFASetup] = useVerifyMFASetupMutation();

  // Custom hooks
  useAuthRedirect();

  // Computed values
  const isLoading = useMemo(
    () => isLoginLoading || isMFALoading || isMFASetupLoading || isSettingUpMFA,
    [isLoginLoading, isMFALoading, isMFASetupLoading, isSettingUpMFA]
  );

  // Error handling
  const handleApiError = useCallback(
    (err: any, formType: "login" | "mfa") => {
      console.error(`${formType} error:`, err);

      const errorMessage =
        err?.data?.detail ||
        err?.data?.message ||
        err?.message ||
        "An unknown error occurred";

      const methods = formType === "login" ? loginMethods : mfaFormMethods;
      methods.setError("root", { message: errorMessage });

      error(errorMessage);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (err?.status === 401) {
        dispatch(logout());
        if (formStep === 2) {
          handleBackToLogin();
        }
      }
    },
    [loginMethods, mfaFormMethods, error, dispatch, formStep]
  );

  // MFA Setup
  const handleMFASetup = useCallback(async () => {
    try {
      setIsSettingUpMFA(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const setupResult = await setupMFA({
        enable: true,
        backup_codes_acknowledged: false,
      }).unwrap();

      setMfaSetupData({
        uri: setupResult.uri,
        secret: setupResult.secret,
        backup_codes: setupResult.backup_codes || [],
      });

      setMfaStep("setup");
      setFormStep(2);
      success("Scan the QR code with your authenticator app");
    } catch (setupError: any) {
      console.error("MFA Setup Error:", setupError);
      handleApiError(setupError, "login");
      if (setupError?.status === 401) {
        dispatch(logout());
        navigate("/");
      }
    } finally {
      setIsSettingUpMFA(false);
    }
  }, [setupMFA, success, handleApiError, dispatch, navigate]);

  // Login submission
  const handleLoginSubmit = useCallback(
    async (data: any) => {
      try {
        const result = await login({
          email: data.email,
          password: data.password,
          enableMFA: data.enableMFA,
        }).unwrap();

        console.log("Login result:", result);

        if (result.requiresMFA) {
          setFormStep(2);
          setMfaStep("verify");
          info("Two-factor authentication required. Please enter your code.");
          return;
        }

        if (data.enableMFA && !result.user.mfa_enabled) {
          await handleMFASetup();
          return;
        }

        success("Login successful! Redirecting...");
        setTimeout(() => navigate("/home"), 1500);
      } catch (err: any) {
        console.error("Login error:", err);
        handleApiError(err, "login");
      }
    },
    [login, info, handleMFASetup, success, navigate, handleApiError]
  );

  // MFA submission
  const handleMFASubmit = useCallback(
    async (data: any) => {
      try {
        const token = Object.values(data.code || {})
          .join("")
          .trim();

        if (token.length !== 6 || !/^[0-9]{6}$/.test(token)) {
          mfaFormMethods.setError("root", {
            type: "manual",
            message: "Please enter all 6 digits of the code correctly.",
          });
          return;
        }

        if (mfaStep === "verify") {
          await verifyMFA({
            token: token,
            uid: uid || "",
            tempToken: tempToken || "",
          }).unwrap();

          success("Verification successful! Redirecting...");
          setTimeout(() => navigate("/home"), 1500);
        } else if (mfaStep === "setup") {
          await verifyMFASetup({ token: token }).unwrap();

          success("MFA setup completed successfully!");
          setMfaStep("backup");
          info("Please save your backup codes in a secure location");
        }
      } catch (err: any) {
        console.error("MFA verification error:", err);
        handleApiError(err, "mfa");
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

  // Navigation handlers
  const handleForgotPassword = useCallback(() => {
    info("Redirecting to password recovery");
    setTimeout(() => navigate("/forgot-password"), 500);
  }, [info, navigate]);

  const handleBackToLogin = useCallback(() => {
    setFormStep(1);
    setMfaStep("login");
    setMfaSetupData(null);
    resetForms();
    dispatch(clearMFAState());
    info("Returned to login form");
  }, [resetForms, dispatch, info]);

  const handleBackupCodesAcknowledged = useCallback(() => {
    success("MFA setup complete! You can now log in.");
    handleBackToLogin();
    dispatch(clearMFAState());
  }, [success, handleBackToLogin, dispatch]);

  // Background effect
  useEffect(() => {
    document.body.className = "bg-gradient-to-br from-gray-50 to-indigo-50";
    return () => {
      document.body.className = "";
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
      <BackgroundElements shake={shake} />

      <motion.div
        {...ANIMATION_VARIANTS.pageEnter}
        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-sm bg-opacity-90 border border-white border-opacity-20"
      >
        <div className="flex flex-col md:flex-row">
          {/* Left Side Panel */}
          <SidePanel userType={userType} setUserType={setUserType} />

          {/* Right Side Form Panel */}
          <div className="w-full md:w-3/5 p-10 flex flex-col justify-center">
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
                  />
                )
              ) : (
                <RegisterForm
                  registerMethods={registerMethods}
                  setActiveTab={setActiveTab}
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
        className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400"
      >
        © {new Date().getFullYear()} RiskGuard Pro. All rights reserved.
      </motion.div>
    </div>
  );
};

export default Login;
