import FormSection from "../../FormSection";
import { FormInput } from "../../FormInput";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { FormData } from "../../types";

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
        <FormInput
          label="Annual Income (GHC)"
          name="annualIncome"
          type="number"
          register={register}
          error={errors.annualIncome}
          required
        />
        <FormInput
          label="Collections in Past 12 Months (excluding medical)"
          name="collections12mo"
          type="number"
          register={register}
          error={errors.collections12mo}
        />
        <FormInput
          label="Debt-to-Income Ratio (%)"
          name="dti"
          type="number"
          register={register}
          error={errors.dti}
          required
        />
        <FormInput
          label="Loan Amount (GHC)"
          name="loanAmount"
          type="number"
          register={register}
          error={errors.loanAmount}
          required
        />
        <FormInput
          label="Interest Rate (%)"
          name="interestRate"
          type="number"
          register={register}
          error={errors.interestRate}
          required
        />
        <FormInput
          label="Credit History Length (years)"
          name="creditHistoryLength"
          type="number"
          register={register}
          error={errors.creditHistoryLength}
          required
        />
        <FormInput
          label="Revolving Utilization Rate (%)"
          name="revolvingUtilization"
          type="number"
          register={register}
          error={errors.revolvingUtilization}
        />
        <FormInput
          label="Maximum Balance on Bankcards (GHC)"
          name="maxBankcardBalance"
          type="number"
          register={register}
          error={errors.maxBankcardBalance}
        />
        <FormInput
          label="Number of Delinquencies in Past 2 Years"
          name="delinquencies2yr"
          type="number"
          register={register}
          error={errors.delinquencies2yr}
        />
        <FormInput
          label="Total Number of Accounts"
          name="totalAccounts"
          type="number"
          register={register}
          error={errors.totalAccounts}
          required
        />
        <FormInput
          label="Number of Inquiries in Last 6 Months"
          name="inquiries6mo"
          type="number"
          register={register}
          error={errors.inquiries6mo}
        />
        <FormInput
          label="Number of Revolving Accounts Opened in Last 12 Months"
          name="revolvingAccounts12mo"
          type="number"
          register={register}
          error={errors.revolvingAccounts12mo}
        />
        <FormInput
          label="Employment Length (e.g., '5 years', '10+ years', '< 1 year')"
          name="employmentLength"
          type="text"
          register={register}
          error={errors.employmentLength}
          required
        />
        <FormInput
          label="Number of Public Records"
          name="publicRecords"
          type="number"
          register={register}
          error={errors.publicRecords}
        />
        <FormInput
          label="Number of Open Accounts"
          name="openAccounts"
          type="number"
          register={register}
          error={errors.openAccounts}
        />
        <FormInput
          label="Home Ownership"
          name="homeOwnership"
          type="select"
          register={register}
          error={errors.homeOwnership}
          required
        options={[
          { value: "OWN", label: "Own" },
          { value: "RENT", label: "Rent" },
          { value: "OTHER", label: "Other" },
          { value: "MORTGAGE", label: "Mortgage" },
          { value: "NONE", label: "None" }
        ]}
      />
            </div>
          </FormSection>
                </>
        );