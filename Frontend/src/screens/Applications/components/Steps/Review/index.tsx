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
              {formValues.annualIncome ? `GHC ${formValues.annualIncome}` : "-"}
            </div>
            <div>
              Collections in Past 12 Months:{" "}
              {formValues.collections12mo !== undefined
                ? formValues.collections12mo
                : "-"}
            </div>
            <div>
              Debt-to-Income Ratio:{" "}
              {formValues.dti !== undefined ? `${formValues.dti}%` : "-"}
            </div>
            <div>
              Loan Amount:{" "}
              {formValues.loanAmount ? `GHC ${formValues.loanAmount}` : "-"}
            </div>
            <div>
              Interest Rate:{" "}
              {formValues.interestRate !== undefined
                ? `${formValues.interestRate}%`
                : "-"}
            </div>
            <div>
              Credit History Length:{" "}
              {formValues.creditHistoryLength !== undefined
                ? `${formValues.creditHistoryLength} years`
                : "-"}
            </div>
            <div>
              Revolving Utilization Rate:{" "}
              {formValues.revolvingUtilization !== undefined
                ? `${formValues.revolvingUtilization}%`
                : "-"}
            </div>
            <div>
              Maximum Balance on Bankcards:{" "}
              {formValues.maxBankcardBalance !== undefined
                ? `GHC ${formValues.maxBankcardBalance}`
                : "-"}
            </div>
            <div>
              Number of Delinquencies in Past 2 Years:{" "}
              {formValues.delinquencies2yr !== undefined
                ? formValues.delinquencies2yr
                : "-"}
            </div>
            <div>
              Total Number of Accounts:{" "}
              {formValues.totalAccounts !== undefined
                ? formValues.totalAccounts
                : "-"}
            </div>
            <div>
              Number of Inquiries in Last 6 Months:{" "}
              {formValues.inquiries6mo !== undefined
                ? formValues.inquiries6mo
                : "-"}
            </div>
            <div>
              Number of Revolving Accounts Opened in Last 12 Months:{" "}
              {formValues.revolvingAccounts12mo !== undefined
                ? formValues.revolvingAccounts12mo
                : "-"}
            </div>
            <div>
              Employment Length:{" "}
              {formValues.employmentLength || "-"}
            </div>
            <div>
              Number of Public Records:{" "}
              {formValues.publicRecords !== undefined
                ? formValues.publicRecords
                : "-"}
            </div>
            <div>
              Number of Open Accounts:{" "}
              {formValues.openAccounts !== undefined
                ? formValues.openAccounts
                : "-"}
            </div>
            <div>
              Home Ownership:{" "}
              {formValues.homeOwnership || "-"}
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