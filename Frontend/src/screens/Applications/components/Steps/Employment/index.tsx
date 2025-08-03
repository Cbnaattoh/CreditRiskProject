import FormSection from "../../FormSection";
import { FormInput } from "../../FormInput";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { FormData } from "../../types";

export const EmploymentStep = ({
  register,
  errors,
}: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}) => (
  <FormSection title="Employment Details">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormInput
        label="Employment Status"
        name="employmentStatus"
        type="select"
        register={register}
        error={errors.employmentStatus}
        required
        options={[
          { value: "employed", label: "Employed (Full-Time)" },
          { value: "self_employed", label: "Self-Employed" },
          { value: "unemployed", label: "Unemployed" },
          { value: "retired", label: "Retired" },
        ]}
        tooltip="Your current work situation - this affects your loan eligibility and terms"
        helperText="Select the option that best describes your current employment"
      />
      <FormInput
        label="Occupation"
        name="occupation"
        register={register}
        error={errors.occupation}
        required
        placeholder="Teacher, Engineer, Trader, etc."
        helperText="Your job title or profession"
        tooltip="Be specific about your role, e.g., 'Senior Accountant' rather than just 'Accountant'"
      />
      <FormInput
        label="Company Name"
        name="employer"
        register={register}
        error={errors.employer}
        required
        placeholder="ABC Company Ltd"
        helperText="Full name of your employer or business"
        tooltip="For self-employed, enter your business name or 'Self-Employed'"
      />
      <FormInput
        label="Years at Current Job"
        name="yearsEmployed"
        type="number"
        register={register}
        error={errors.yearsEmployed}
        required
        min="0"
        max="50"
        step="0.1"
        placeholder="2.5"
        helperText="How long you've been with your current employer"
        tooltip="Use decimals for partial years (e.g., 2.5 for 2 years and 6 months)"
        example="2.5 (for 2 years, 6 months)"
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <FormInput
        label="Monthly Income (GHS)"
        name="monthlyIncome"
        type="number"
        register={register}
        error={errors.monthlyIncome}
        required
        min="0"
        step="0.01"
        placeholder="5000.00"
        tooltip="Your gross monthly income before taxes and deductions"
        helperText="Include salary, allowances, and regular bonuses"
        example="5,500.00 (salary + transport allowance)"
      />
      <FormInput
        label="Employment Start Date"
        name="employmentStartDate"
        type="date"
        register={register}
        error={errors.employmentStartDate}
        helperText="When you started your current job (optional)"
        tooltip="This helps verify your employment duration"
      />
    </div>
  </FormSection>
);
