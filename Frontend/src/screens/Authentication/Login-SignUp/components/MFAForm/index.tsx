import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiShield, FiKey, FiSave, FiHelpCircle, FiCopy, FiDownload, FiPrinter } from "react-icons/fi";
import { FormProvider } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import { MFARecoveryModal } from '../MFARecoveryModal';
import { MFAProgress } from '../MFAProgress';

interface MFASetupData {
  uri: string;
  secret: string;
  backup_codes: string[];
}

type MFAStep = "login" | "setup" | "verify" | "backup";

interface MFAFormProps {
  mfaFormMethods: UseFormReturn<{ code: string; useBackupCode?: boolean }>;
  mfaStep: MFAStep;
  mfaSetupData: MFASetupData | null;
  handleMFASubmit: (data: { code: string; useBackupCode?: boolean }) => Promise<void>;
  handleBackToLogin: () => void;
  isLoading: boolean;
  handleBackupCodesAcknowledged: () => void;
  onUseBackupCode?: () => void;
  showBackupCodeOption?: boolean;
  userEmail?: string;
  onContactSupport?: (method: 'email' | 'phone', message: string) => void;
}

const MFAForm: React.FC<MFAFormProps> = ({
  mfaFormMethods,
  mfaStep,
  mfaSetupData,
  handleMFASubmit,
  handleBackToLogin,
  isLoading,
  handleBackupCodesAcknowledged,
  onUseBackupCode,
  showBackupCodeOption = true,
  userEmail,
  onContactSupport,
}) => {
  const [codes, setCodes] = useState<string[]>(["", "", "", "", "", ""]);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  // Handle individual code input changes
  const handleCodeChange = (index: number, value: string) => {
    // Only allow single digit numbers
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    // Update the form with the complete code
    const completeCode = newCodes.join("");
    mfaFormMethods.setValue("code", completeCode);

    // Trigger validation to update form state
    mfaFormMethods.trigger("code");

    // Auto-focus next input if value was entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace and navigation
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (!codes[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newCodes = [...codes];
        newCodes[index] = "";
        setCodes(newCodes);
        mfaFormMethods.setValue("code", newCodes.join(""));
        mfaFormMethods.trigger("code");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

    if (pastedData.length === 6) {
      const newCodes = pastedData.split("");
      setCodes(newCodes);
      mfaFormMethods.setValue("code", pastedData);
      mfaFormMethods.trigger("code");

      // Focus the last input
      inputRefs.current[5]?.focus();
    }
  };

  // Check if all codes are filled or backup code is provided
  const isCodeComplete = useBackupCode ? backupCode.length >= 8 : codes.every((code) => code.length === 1);
  const codeString = useBackupCode ? backupCode : codes.join("");
  
  // Handle backup code toggle
  const handleBackupCodeToggle = () => {
    setUseBackupCode(!useBackupCode);
    setBackupCode('');
    setCodes(["", "", "", "", "", ""]);
    mfaFormMethods.setValue("code", "");
    mfaFormMethods.setValue("useBackupCode", !useBackupCode);
    
    // Focus appropriate input
    setTimeout(() => {
      if (!useBackupCode) {
        backupInputRef.current?.focus();
      } else {
        inputRefs.current[0]?.focus();
      }
    }, 100);
  };
  
  // Handle backup code input
  const handleBackupCodeChange = (value: string) => {
    // Allow alphanumeric characters and convert to uppercase
    const sanitizedValue = value.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
    if (sanitizedValue.length <= 8) {
      setBackupCode(sanitizedValue);
      mfaFormMethods.setValue("code", sanitizedValue);
      mfaFormMethods.trigger("code");
    }
  };

  return (
    <FormProvider {...mfaFormMethods}>
      <motion.div
        key="mfa"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Progress Indicator - Only show during setup flow */}
        {(mfaStep === "setup" || mfaStep === "verify" || mfaStep === "backup") && (
          <MFAProgress currentStep={mfaStep} className="mb-8" />
        )}
        {/* Backup Codes Step */}
        {mfaStep === "backup" && mfaSetupData?.backup_codes && (
          <div className="backup-codes-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Save Your Backup Codes
                </h2>
                <p className="text-gray-600">
                  These codes can be used if you lose access to your
                  authenticator app
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FiSave className="text-yellow-600 text-xl" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-yellow-800">
                  Please save these codes in a secure location:
                </p>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = mfaSetupData.backup_codes.join('\n');
                      navigator.clipboard.writeText(text);
                    }}
                    className="p-2 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 rounded transition-colors"
                    title="Copy all codes"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `RiskGuard Pro - MFA Backup Codes\n\nGenerated: ${new Date().toLocaleDateString()}\n\n${mfaSetupData.backup_codes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nIMPORTANT: Keep these codes safe and secure. Each can only be used once.`;
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'mfa-backup-codes.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="p-2 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 rounded transition-colors"
                    title="Download as text file"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const printContent = `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                          <h1>RiskGuard Pro - MFA Backup Codes</h1>
                          <p>Generated: ${new Date().toLocaleDateString()}</p>
                          <div style="margin: 20px 0;">
                            ${mfaSetupData.backup_codes.map((code, i) => `<p style="font-family: monospace; font-size: 14px;">${i + 1}. ${code}</p>`).join('')}
                          </div>
                          <p style="color: red; font-weight: bold;">IMPORTANT: Keep these codes safe and secure. Each can only be used once.</p>
                        </div>
                      `;
                      const printWindow = window.open('', '_blank');
                      printWindow?.document.write(printContent);
                      printWindow?.document.close();
                      printWindow?.print();
                    }}
                    className="p-2 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 rounded transition-colors"
                    title="Print codes"
                  >
                    <FiPrinter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {mfaSetupData.backup_codes.map((code, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative p-3 bg-white rounded-lg font-mono text-center border border-yellow-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="select-all">{code}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                      title="Copy this code"
                    >
                      <FiCopy className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-700 flex items-start">
                  <FiAlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>
                    <strong>Important:</strong> These codes won't be shown again.
                    Each code can only be used once. Store them in a secure password manager or print them out.
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  id="confirmSaved"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  onChange={(e) => {
                    const button = document.getElementById('confirmButton') as HTMLButtonElement;
                    if (button) button.disabled = !e.target.checked || isLoading;
                  }}
                />
                <label htmlFor="confirmSaved" className="cursor-pointer">
                  I have saved these backup codes in a secure location
                </label>
              </div>
              <motion.button
                id="confirmButton"
                type="button"
                onClick={handleBackupCodesAcknowledged}
                disabled={true} // Initially disabled until checkbox is checked
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Complete MFA Setup"}
              </motion.button>
            </div>
          </div>
        )}

        {/* Setup Step (QR Code) */}
        {mfaStep === "setup" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Set Up Two-Factor Authentication
                </h2>
                <p className="text-gray-600">
                  Scan the QR code with your authenticator app
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiShield className="text-blue-600 text-xl" />
              </div>
            </div>

            <div className="flex flex-col items-center">
              {mfaSetupData?.uri ? (
                <div className="mb-4 p-4 bg-white rounded-lg">
                  <QRCode
                    value={mfaSetupData.uri}
                    size={200}
                    level="H"
                    renderAs="svg"
                    includeMargin={true}
                  />
                </div>
              ) : (
                <div className="mb-4 p-8 bg-gray-100 rounded-lg animate-pulse">
                  <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                    Loading QR code...
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-600 mb-4">
                <FiKey className="inline mr-2" />
                {mfaSetupData?.secret
                  ? `Secret: ${mfaSetupData.secret}`
                  : "Generating secret..."}
              </div>
            </div>
          </>
        )}

        {/* Verify Step */}
        {mfaStep === "verify" && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Two-Factor Authentication
              </h2>
              <p className="text-gray-600">
                {useBackupCode 
                  ? "Enter your 8-character backup code" 
                  : "Enter the 6-digit code from your authenticator app"
                }
              </p>
              {retryCount > 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  Attempt {retryCount + 1} of 5
                </p>
              )}
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiShield className="text-blue-600 text-xl" />
            </div>
          </div>
        )}

        {/* Error Messages */}
        {mfaFormMethods.formState.errors.root && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start"
          >
            <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
            <div>{mfaFormMethods.formState.errors.root?.message}</div>
          </motion.div>
        )}

        {mfaFormMethods.formState.errors.code && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start"
          >
            <FiAlertCircle className="mt-0.5 mr-3 flex-shrink-0" />
            <div>{mfaFormMethods.formState.errors.code?.message}</div>
          </motion.div>
        )}

        {/* Code Input (only shown for setup and verify steps) */}
        {(mfaStep === "setup" || mfaStep === "verify") && (
          <>
            {/* Hidden inputs for form validation */}
            <input
              type="hidden"
              {...mfaFormMethods.register("code")}
              value={codeString}
            />
            <input
              type="hidden"
              {...mfaFormMethods.register("useBackupCode")}
              value={useBackupCode}
            />

            {/* Backup Code Input */}
            {useBackupCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Code
                  </label>
                  <input
                    ref={backupInputRef}
                    type="text"
                    placeholder="XXXXXXXX"
                    value={backupCode}
                    onChange={(e) => handleBackupCodeChange(e.target.value)}
                    className={`w-full h-16 text-2xl text-center rounded-lg border-2 font-mono tracking-widest ${
                      mfaFormMethods.formState.errors.code
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors uppercase`}
                    autoComplete="off"
                    maxLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter one of your saved backup codes. Each code can only be used once.
                  </p>
                </div>
              </div>
            ) : (
              /* Regular TOTP Code Input */
              <div className="grid grid-cols-6 gap-3">
                {codes.map((code, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    maxLength={1}
                    value={code}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={`w-full h-16 text-3xl text-center rounded-lg border-2 ${
                      mfaFormMethods.formState.errors.code
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors`}
                    autoComplete="off"
                  />
                ))}
              </div>
            )}

            {/* Backup Code Toggle and Recovery - Only show during verification */}
            {mfaStep === "verify" && (
              <div className="space-y-3 mt-4">
                {showBackupCodeOption && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleBackupCodeToggle}
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                    >
                      {useBackupCode ? "Use authenticator app instead" : "Use backup code instead"}
                    </button>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center space-x-1"
                  >
                    <FiHelpCircle className="w-4 h-4" />
                    <span>Can't access your device?</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 flex space-x-3">
              <motion.button
                type="button"
                onClick={handleBackToLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Back
              </motion.button>
              <motion.button
                type="button"
                onClick={mfaFormMethods.handleSubmit(handleMFASubmit)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  isLoading || !isCodeComplete || 
                  (useBackupCode ? backupCode.length !== 8 : codeString.length !== 6)
                }
                className={`flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors ${
                  isLoading || !isCodeComplete || 
                  (useBackupCode ? backupCode.length !== 8 : codeString.length !== 6)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isLoading ? "Verifying..." : `Verify ${useBackupCode ? 'Backup Code' : 'Code'}`}
              </motion.button>
            </div>
          </>
        )}

        {/* Manual Secret Entry (setup step only) */}
        {mfaStep === "setup" && (
          <div className="mt-4 text-sm text-gray-500">
            <p>Can't scan the QR code? Enter this secret manually:</p>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg font-mono break-all">
              {mfaSetupData?.secret || "Loading..."}
            </div>
          </div>
        )}

        {/* MFA Recovery Modal */}
        <MFARecoveryModal
          isOpen={showRecoveryModal}
          onClose={() => setShowRecoveryModal(false)}
          userEmail={userEmail}
          onContactSupport={onContactSupport || (() => {})}
        />

        {/* Debug info - remove in production
        <div className="text-xs text-gray-400 mt-4">
          <p>Code: {codeString}</p>
          <p>Complete: {isCodeComplete ? "Yes" : "No"}</p>
          <p>Valid: {mfaFormMethods.formState.isValid ? "Yes" : "No"}</p>
        </div> */}
      </motion.div>
    </FormProvider>
  );
};

export default MFAForm;
