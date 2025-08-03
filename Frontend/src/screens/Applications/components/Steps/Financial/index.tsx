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
          label="Annual Income (GHS)"
          name="annualIncome"
          type="number"
          register={register}
          error={errors.annualIncome}
          required
          min="0"
          step="0.01"
          placeholder="60000.00"
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
          min="0"
          max="100"
          step="0.1"
          placeholder="30"
          tooltip="Percentage of your monthly income that goes to debt payments (loans, credit cards, etc.)"
          helperText="Calculate: (Total monthly debt payments ÷ Monthly income) × 100"
          example="30% means GHS 1,500 debt payments on GHS 5,000 income"
        />
        <FormInput
          label="Loan Amount (GHS)"
          name="loanAmount"
          type="number"
          register={register}
          error={errors.loanAmount}
          required
          min="1000"
          step="0.01"
          placeholder="50000.00"
          tooltip="The amount you want to borrow"
          helperText="Consider your repayment ability when choosing the amount"
          example="50,000 for business expansion or home improvement"
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
          min="0"
          max="50"
          step="0.1"
          placeholder="5"
          tooltip="How long you've been using credit (loans, credit cards, hire purchase)"
          helperText="If you're new to credit, enter 0 or the number of months divided by 12"
          example="5 years of using loans or credit cards"
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
          { value: "own", label: "Own" },
          { value: "rent", label: "Rent" },
          { value: "mortgage", label: "Mortgage" },
          { value: "other", label: "Other" }
        ]}
      />
      </div>
    </FormSection>
    
    <FormSection title="Additional Financial Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Total Assets (GHS)"
          name="totalAssets"
          type="number"
          register={register}
          error={errors.totalAssets}
          min="0"
          step="0.01"
          placeholder="100000.00"
        />
        <FormInput
          label="Total Liabilities (GHS)"
          name="totalLiabilities"
          type="number"
          register={register}
          error={errors.totalLiabilities}
          min="0"
          step="0.01"
          placeholder="50000.00"
        />
        <FormInput
          label="Monthly Expenses (GHS)"
          name="monthlyExpenses"
          type="number"
          register={register}
          error={errors.monthlyExpenses}
          min="0"
          step="0.01"
          placeholder="3000.00"
        />
        <FormInput
          label="Have you ever filed for bankruptcy?"
          name="hasBankruptcy"
          type="select"
          register={register}
          error={errors.hasBankruptcy}
          options={[
            { value: "false", label: "No" },
            { value: "true", label: "Yes" }
          ]}
        />
      </div>
    </FormSection>
  </>
        );