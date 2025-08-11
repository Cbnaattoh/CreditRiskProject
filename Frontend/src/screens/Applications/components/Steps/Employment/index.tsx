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
        label="Job Title"
        name="jobTitle"
        register={register}
        error={errors.jobTitle}
        required
        type="select"
        options={[
          { value: "Select...", label: "Select..." },
          { value: "Bank Manager", label: "Bank Manager" },
          { value: "Government Worker", label: "Government Worker" },
          { value: "Teacher", label: "Teacher" },
          { value: "Doctor", label: "Doctor" },
          { value: "Nurse", label: "Nurse" },
          { value: "Engineer", label: "Engineer" },
          { value: "Lawyer", label: "Lawyer" },
          { value: "Accountant", label: "Accountant" },
          { value: "Software Developer", label: "Software Developer" },
          { value: "Marketing Manager", label: "Marketing Manager" },
          { value: "Sales Representative", label: "Sales Representative" },
          { value: "Business Owner", label: "Business Owner" },
          { value: "Trader", label: "Trader" },
          { value: "Farmer", label: "Farmer" },
          { value: "Fisherman", label: "Fisherman" },
          { value: "Driver", label: "Driver" },
          { value: "Mechanic", label: "Mechanic" },
          { value: "Electrician", label: "Electrician" },
          { value: "Security Guard", label: "Security Guard" },
          { value: "Chef", label: "Chef" },
          { value: "Waiter", label: "Waiter" },
          { value: "House Help", label: "House Help" },
          { value: "Cleaner", label: "Cleaner" },
          { value: "Mining Engineer", label: "Mining Engineer" },
          { value: "Oil & Gas Worker", label: "Oil & Gas Worker" },
          { value: "Construction Worker", label: "Construction Worker" },
          { value: "Real Estate Agent", label: "Real Estate Agent" },
          { value: "Journalist", label: "Journalist" },
          { value: "Artist", label: "Artist" },
          { value: "Musician", label: "Musician" },
          { value: "Other", label: "Other" }
        ]}
        helperText="Select your specific job title - this affects your employment stability score in Ghana"
        tooltip="Your job title is analyzed for employment stability in Ghana's job market"
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
