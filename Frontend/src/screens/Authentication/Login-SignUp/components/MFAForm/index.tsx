import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiShield, FiKey } from "react-icons/fi";
import { FormProvider } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { QRCodeCanvas as QRCode } from "qrcode.react";

interface MFASetupData {
  uri: string;
  secret: string;
  backup_codes: string[];
}

type MFAStep = "login" | "setup" | "verify" | "backup";

interface MFAFormProps {
  mfaFormMethods: UseFormReturn<{ code: string }>;
  mfaStep: MFAStep;
  mfaSetupData: MFASetupData | null;
  handleMFASubmit: (data: { code: string }) => Promise<void>;
  handleBackToLogin: () => void;
  isLoading: boolean;
  backupCodes?: string[];
  handleBackupCodesAcknowledged?: () => void;
}

const MFAForm: React.FC<MFAFormProps> = ({
  mfaFormMethods,
  mfaStep,
  mfaSetupData,
  handleMFASubmit,
  handleBackToLogin,
  isLoading,
}) => {
  const [codes, setCodes] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Check if all codes are filled
  const isCodeComplete = codes.every((code) => code.length === 1);
  const codeString = codes.join("");

  return (
    <FormProvider {...mfaFormMethods}>
      <motion.div
        key="mfa"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
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
            {mfaSetupData?.backup_codes && (
              <div className="mt-4 text-sm text-gray-500">
                <p className="font-medium mb-2">Your backup codes:</p>
                <div className="grid grid-cols-2 gap-2">
                  {mfaSetupData.backup_codes.map((code, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-100 rounded font-mono text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-red-500">
                  Save these codes in a secure place. They won't be shown again.
                </p>
              </div>
            )}
          </>
        )}

        {mfaStep === "verify" && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Two-Factor Authentication
              </h2>
              <p className="text-gray-600">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiShield className="text-blue-600 text-xl" />
            </div>
          </div>
        )}

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

        {/* Hidden input for form validation */}
        <input
          type="hidden"
          {...mfaFormMethods.register("code")}
          value={codeString}
        />

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
            disabled={isLoading || !isCodeComplete || codeString.length !== 6}
            className={`flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors ${
              isLoading || !isCodeComplete || codeString.length !== 6
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </motion.button>
        </div>

        {mfaStep === "setup" && (
          <div className="mt-4 text-sm text-gray-500">
            <p>Can't scan the QR code? Enter this secret manually:</p>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg font-mono break-all">
              {mfaSetupData?.secret || "Loading..."}
            </div>
          </div>
        )}

        {/* Debug info - remove in production */}
        <div className="text-xs text-gray-400 mt-4">
          <p>Code: {codeString}</p>
          <p>Complete: {isCodeComplete ? "Yes" : "No"}</p>
          <p>Valid: {mfaFormMethods.formState.isValid ? "Yes" : "No"}</p>
        </div>
      </motion.div>
    </FormProvider>
  );
};

export default MFAForm;
