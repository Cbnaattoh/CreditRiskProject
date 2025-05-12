import FormSection from "../../FormSection";
import { DocumentUpload } from "../../DocumentUpload";
import type { UploadedFile } from "../../types";

type DocumentsStepProps = {
  uploadedFiles: UploadedFile[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: string) => void;
};

export const DocumentsStep = ({
  uploadedFiles,
  handleFileUpload,
  removeFile,
}: DocumentsStepProps) => (
  <FormSection title="Upload Required Documents">
    <DocumentUpload
      uploadedFiles={uploadedFiles}
      handleFileUpload={handleFileUpload}
      removeFile={removeFile}
    />
  </FormSection>
);
