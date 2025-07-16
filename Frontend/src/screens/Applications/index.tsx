import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
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
} from "../Applications/components/types";

const STEPS: FormStep[] = [
  { label: "Personal Info", isActive: true },
  { label: "Employment", isActive: false },
  { label: "Financials", isActive: false },
  { label: "Documents", isActive: false },
  { label: "Review", isActive: false },
];

const Applications: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    console.log("Save draft logic here");
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    console.log("Form submitted", data);
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files).map((file) => {
          // Create a proper UploadedFile object
          const uploadedFile: UploadedFile = Object.assign(
            new File([file], file.name, { type: file.type }),
            {
              id: Math.random().toString(36).substring(2, 9),
              uploadDate: new Date(),
              status: "completed" as const,
            }
          );
          return uploadedFile;
        });

        setUploadedFiles((prev) => [...prev, ...newFiles]);
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
        return <PersonalInfoStep {...commonProps} />;
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
          <StepIndicator
            steps={STEPS.map((step, i) => ({
              ...step,
              isActive: i === currentStep,
              isCompleted: i < currentStep,
            }))}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />

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

          <ButtonGroup
            onPrevious={currentStep > 0 ? handlePrevious : undefined}
            onNext={currentStep < STEPS.length - 1 ? handleNext : undefined}
            onSubmit={handleSubmit(onSubmit)}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
            currentStep={currentStep}
            totalSteps={STEPS.length}
          />
        </div>
      </main>
    </div>
  );
};

export default Applications;
