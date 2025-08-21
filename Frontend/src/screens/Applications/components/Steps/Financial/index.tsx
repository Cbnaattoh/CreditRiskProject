import FormSection from "../../FormSection";
import { FormInput } from "../../FormInput";
import { EnhancedFormInput } from "../../FormInput/EnhancedFormInput";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { FormData } from "../../types";
import { getFieldHelper } from "../../../../../data/formHelpers";

export const FinancialsStep = ({
  register,
  errors,
}: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}) => (
  <>
    <FormSection title="Financial Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EnhancedFormInput
          label="Annual Income (GHS)"
          name="annualIncome"
          type="number"
          register={register}
          error={errors.annualIncome}
          required
          min="0"
          step="0.01"
          placeholder={getFieldHelper('annualIncome')?.example || "60000.00"}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Collections in Past 12 Months (excluding medical)"
          name="collections12mo"
          type="number"
          register={register}
          error={errors.collections12mo}
          min="0"
          max="10"
          step="1"
          placeholder="0"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Debt-to-Income Ratio (%)"
          name="dti"
          type="number"
          register={register}
          error={errors.dti}
          required
          min="0"
          max="100"
          step="0.01"
          placeholder="30.5"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Loan Amount (GHS)"
          name="loanAmount"
          type="number"
          register={register}
          error={errors.loanAmount}
          required
          min="1000"
          step="0.01"
          placeholder={getFieldHelper('loanAmount')?.example || "50000.00"}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Interest Rate (%)"
          name="interestRate"
          type="number"
          register={register}
          error={errors.interestRate}
          required
          min="0"
          max="50"
          step="0.1"
          placeholder={getFieldHelper('interestRate')?.example || "12.5"}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Credit History Length (years)"
          name="creditHistoryLength"
          type="number"
          register={register}
          error={errors.creditHistoryLength}
          required
          min="0"
          max="50"
          step="0.1"
          placeholder="5"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Credit Utilization Rate (%)"
          name="revolvingUtilization"
          type="number"
          register={register}
          error={errors.revolvingUtilization}
          min="0"
          max="150"
          step="0.1"
          placeholder="30.0"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Maximum Balance on Bankcards (GHS)"
          name="maxBankcardBalance"
          type="number"
          register={register}
          error={errors.maxBankcardBalance}
          min="0"
          step="100"
          placeholder="5000"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Number of Delinquencies in Past 2 Years"
          name="delinquencies2yr"
          type="number"
          register={register}
          error={errors.delinquencies2yr}
          min="0"
          max="20"
          step="1"
          placeholder="0"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Total Number of Accounts"
          name="totalAccounts"
          type="number"
          register={register}
          error={errors.totalAccounts}
          required
          min="0"
          max="100"
          step="1"
          placeholder="15"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Credit Inquiries in Last 6 Months"
          name="inquiries6mo"
          type="number"
          register={register}
          error={errors.inquiries6mo}
          min="0"
          max="20"
          step="1"
          placeholder="1"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="New Revolving Accounts (Last 12 Months)"
          name="revolvingAccounts12mo"
          type="number"
          register={register}
          error={errors.revolvingAccounts12mo}
          min="0"
          max="20"
          step="1"
          placeholder="1"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Employment Length"
          name="employmentLength"
          type="select"
          register={register}
          error={errors.employmentLength}
          required
          options={[
            { value: "< 1 year", label: "< 1 year" },
            { value: "1 year", label: "1 year" },
            { value: "2 years", label: "2 years" },
            { value: "3 years", label: "3 years" },
            { value: "4 years", label: "4 years" },
            { value: "5 years", label: "5 years" },
            { value: "6 years", label: "6 years" },
            { value: "7 years", label: "7 years" },
            { value: "8 years", label: "8 years" },
            { value: "9 years", label: "9 years" },
            { value: "10+ years", label: "10+ years" }
          ]}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Job Title"
          name="jobTitle"
          type="select"
          register={register}
          error={errors.jobTitle}
          required
          options={[
            { value: "Software Engineer", label: "Software Engineer" },
            { value: "Teacher", label: "Teacher" },
            { value: "Nurse", label: "Nurse" },
            { value: "Doctor", label: "Doctor" },
            { value: "Banker", label: "Banker" },
            { value: "Trader", label: "Trader" },
            { value: "Farmer", label: "Farmer" },
            { value: "Driver", label: "Driver" },
            { value: "Mechanic", label: "Mechanic" },
            { value: "Electrician", label: "Electrician" },
            { value: "Accountant", label: "Accountant" },
            { value: "Manager", label: "Manager" },
            { value: "Sales Person", label: "Sales Person" },
            { value: "Secretary", label: "Secretary" },
            { value: "Security Guard", label: "Security Guard" },
            { value: "Government Worker", label: "Government Worker" },
            { value: "Business Owner", label: "Business Owner" },
            { value: "Mining Engineer", label: "Mining Engineer" },
            { value: "Oil Worker", label: "Oil Worker" },
            { value: "Bank Manager", label: "Bank Manager" },
            { value: "Financial Analyst", label: "Financial Analyst" },
            { value: "Pharmacist", label: "Pharmacist" },
            { value: "Lawyer", label: "Lawyer" },
            { value: "Architect", label: "Architect" },
            { value: "Civil Servant", label: "Civil Servant" },
            { value: "Lecturer", label: "Lecturer" },
            { value: "Hotel Worker", label: "Hotel Worker" },
            { value: "Restaurant Worker", label: "Restaurant Worker" },
            { value: "Market Trader", label: "Market Trader" },
            { value: "Shop Owner", label: "Shop Owner" },
            { value: "Cocoa Farmer", label: "Cocoa Farmer" },
            { value: "Fisherman", label: "Fisherman" },
            { value: "House Help", label: "House Help" },
            { value: "Cleaner", label: "Cleaner" },
            { value: "Other", label: "Other" }
          ]}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Number of Public Records"
          name="publicRecords"
          type="number"
          register={register}
          error={errors.publicRecords}
          min="0"
          max="10"
          step="1"
          placeholder="0"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Number of Open Accounts"
          name="openAccounts"
          type="number"
          register={register}
          error={errors.openAccounts}
          min="0"
          max="50"
          step="1"
          placeholder="8"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Home Ownership"
          name="homeOwnership"
          type="select"
          register={register}
          error={errors.homeOwnership}
          required
          options={[
            { value: "OWN", label: "Own" },
            { value: "RENT", label: "Rent" },
            { value: "MORTGAGE", label: "Mortgage" },
            { value: "OTHER", label: "Other" }
          ]}
          useEnhancedHelper={true}
        />
      </div>
    </FormSection>
    
    <FormSection title="Additional Financial Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EnhancedFormInput
          label="Total Assets (GHS)"
          name="totalAssets"
          type="number"
          register={register}
          error={errors.totalAssets}
          min="0"
          step="0.01"
          placeholder="100000.00"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Total Liabilities (GHS)"
          name="totalLiabilities"
          type="number"
          register={register}
          error={errors.totalLiabilities}
          min="0"
          step="0.01"
          placeholder="50000.00"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Monthly Expenses (GHS)"
          name="monthlyExpenses"
          type="number"
          register={register}
          error={errors.monthlyExpenses}
          min="0"
          step="0.01"
          placeholder="3000.00"
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Have you ever filed for bankruptcy?"
          name="hasBankruptcy"
          type="select"
          register={register}
          error={errors.hasBankruptcy}
          options={[
            { value: "false", label: "No" },
            { value: "true", label: "Yes" }
          ]}
          useEnhancedHelper={true}
        />
      </div>
    </FormSection>
  </>
        );