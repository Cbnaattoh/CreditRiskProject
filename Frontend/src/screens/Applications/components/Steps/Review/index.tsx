import FormSection from "../../FormSection";
import type { FormData, UploadedFile } from "../../types";

type ReviewStepProps = {
  formValues: Partial<FormData>;
  uploadedFiles: UploadedFile[];
};

export const ReviewStep = ({ formValues, uploadedFiles }: ReviewStepProps) => (
  <FormSection title="Review Your Application" defaultOpen={true}>
    <div className="bg-gray-50 rounded-lg p-6">
      <h4 className="text-lg font-medium text-gray-900 mb-4">
        Application Summary
      </h4>

      <div className="space-y-6">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            Personal Information
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>First Name: {formValues.firstName || "-"}</div>
            <div>Last Name: {formValues.lastName || "-"}</div>
            <div>Date of Birth: {formValues.dob || "-"}</div>
            <div>Email: {formValues.email || "-"}</div>
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            Employment Information
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>Employment Status: {formValues.employmentStatus || "-"}</div>
            <div>Occupation: {formValues.occupation || "-"}</div>
            <div>Employer: {formValues.employer || "-"}</div>
            <div>Years at Job: {formValues.yearsEmployed || "-"}</div>
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            Financial Information
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              Annual Income:{" "}
              {formValues.annualIncome ? `$${formValues.annualIncome}` : "-"}
            </div>
            <div>
              Other Income:{" "}
              {formValues.otherIncome ? `$${formValues.otherIncome}` : "-"}
            </div>
            <div>
              Total Assets:{" "}
              {formValues.totalAssets ? `$${formValues.totalAssets}` : "-"}
            </div>
            <div>
              Total Liabilities:{" "}
              {formValues.totalLiabilities
                ? `$${formValues.totalLiabilities}`
                : "-"}
            </div>
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Documents</h5>
          <div className="text-sm text-gray-600">
            {uploadedFiles.length > 0 ? (
              <ul className="space-y-1">
                {uploadedFiles.map((file) => (
                  <li key={file.id}>{file.name}</li>
                ))}
              </ul>
            ) : (
              "No documents uploaded"
            )}
          </div>
        </div>
      </div>
    </div>
  </FormSection>
);
