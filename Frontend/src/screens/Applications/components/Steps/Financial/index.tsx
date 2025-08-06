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
          tooltip="Your total yearly income before taxes from all sources"
          helperText="Include salary, bonuses, business income, and other earnings"
          example="GHS 60,000 per year equals GHS 5,000 per month"
        />
        <FormInput
          label="Collections in Past 12 Months (excluding medical)"
          name="collections12mo"
          type="number"
          register={register}
          error={errors.collections12mo}
          min="0"
          max="10"
          step="1"
          placeholder="0"
          tooltip="Accounts sent to collections in the last 12 months (not including medical bills)"
          helperText="Collections seriously hurt credit scores - 0 is strongly preferred"
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
          step="0.01"
          placeholder="30.5"
          tooltip="Percentage of your monthly income that goes to debt payments (loans, credit cards, etc.)"
          helperText="Calculate: (Total monthly debt payments ÷ Monthly income) × 100. You can enter decimal values like 30.5%"
          example="30.25% means GHS 1,512.50 debt payments on GHS 5,000 income"
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
          min="0"
          max="50"
          step="0.1"
          placeholder="12.5"
          tooltip="The annual interest rate offered by your lender"
          helperText="This rate affects your monthly payments and total loan cost"
          example="12.5% is a typical rate for personal loans in Ghana"
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
          label="Credit Utilization Rate (%)"
          name="revolvingUtilization"
          type="number"
          register={register}
          error={errors.revolvingUtilization}
          min="0"
          max="150"
          step="0.1"
          placeholder="30.0"
          tooltip="Percentage of your available credit limit that you're currently using"
          helperText="Lower utilization (below 30%) indicates better credit management"
          example="If you have GHS 10,000 credit limit and owe GHS 3,000, your utilization is 30%"
        />
        <FormInput
          label="Maximum Balance on Bankcards (GHS)"
          name="maxBankcardBalance"
          type="number"
          register={register}
          error={errors.maxBankcardBalance}
          min="0"
          step="100"
          placeholder="5000"
          tooltip="The highest balance you've ever had on any bankcard or credit card"
          helperText="This helps assess your credit usage patterns and financial management"
        />
        <FormInput
          label="Number of Delinquencies in Past 2 Years"
          name="delinquencies2yr"
          type="number"
          register={register}
          error={errors.delinquencies2yr}
          min="0"
          max="20"
          step="1"
          placeholder="0"
          tooltip="Times you were 30+ days late on loan or credit card payments in the last 2 years"
          helperText="Lower is better - 0 delinquencies shows reliable payment history"
        />
        <FormInput
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
          tooltip="Total number of credit accounts you've ever had (loans, credit cards, hire purchase)"
          helperText="This includes both current and closed accounts - shows your credit experience"
        />
        <FormInput
          label="Credit Inquiries in Last 6 Months"
          name="inquiries6mo"
          type="number"
          register={register}
          error={errors.inquiries6mo}
          min="0"
          max="20"
          step="1"
          placeholder="1"
          tooltip="Number of times lenders checked your credit report in the last 6 months"
          helperText="Too many inquiries (>6) may indicate credit seeking behavior and affect your score"
        />
        <FormInput
          label="New Revolving Accounts (Last 12 Months)"
          name="revolvingAccounts12mo"
          type="number"
          register={register}
          error={errors.revolvingAccounts12mo}
          min="0"
          max="20"
          step="1"
          placeholder="1"
          tooltip="Credit cards or revolving credit accounts opened in the last 12 months"
          helperText="Opening too many new accounts quickly may indicate financial stress"
        />
        <FormInput
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
          tooltip="How long you have been employed at your current job"
          helperText="This affects your employment stability score in Ghana"
        />
        <FormInput
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
          tooltip="Your current job title - important for Ghana employment analysis"
          helperText="This helps assess job stability and income expectations in Ghana's job market"
        />
        <FormInput
          label="Number of Public Records"
          name="publicRecords"
          type="number"
          register={register}
          error={errors.publicRecords}
          min="0"
          max="10"
          step="1"
          placeholder="0"
          tooltip="Bankruptcies, liens, judgments, and other public financial records"
          helperText="Public records negatively impact credit scores - 0 is ideal"
        />
        <FormInput
          label="Number of Open Accounts"
          name="openAccounts"
          type="number"
          register={register}
          error={errors.openAccounts}
          min="0"
          max="50"
          step="1"
          placeholder="8"
          tooltip="Currently active credit accounts (loans, credit cards you're still paying)"
          helperText="This shows your current credit obligations - consider both usage and management"
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
            { value: "MORTGAGE", label: "Mortgage" },
            { value: "OTHER", label: "Other" }
          ]}
          tooltip="Your current housing situation"
          helperText="Home ownership status affects your financial stability assessment"
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
          tooltip="Total value of everything you own (property, vehicles, savings, investments)"
          helperText="Include real estate, cars, bank accounts, stocks, and other valuable items"
          example="House (GHS 80,000) + Car (GHS 15,000) + Savings (GHS 5,000) = GHS 100,000"
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
          tooltip="Total amount you owe on all debts (mortgages, loans, credit cards)"
          helperText="Include outstanding balances on all borrowed money"
          example="Mortgage (GHS 40,000) + Car loan (GHS 8,000) + Credit cards (GHS 2,000) = GHS 50,000"
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
          tooltip="Your total monthly spending on all necessities and lifestyle expenses"
          helperText="Include rent, food, utilities, transport, insurance, and other regular costs"
          example="Rent (GHS 1,200) + Food (GHS 800) + Utilities (GHS 300) + Transport (GHS 400) + Other (GHS 300) = GHS 3,000"
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
          tooltip="Whether you have ever declared bankruptcy or insolvency"
          helperText="Bankruptcy significantly affects creditworthiness - be honest as this is verifiable"
          example="Most applicants select 'No' - only select 'Yes' if you have legally declared bankruptcy"
        />
      </div>
    </FormSection>
  </>
        );