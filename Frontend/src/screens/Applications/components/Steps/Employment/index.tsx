import FormSection from "../../FormSection";
import { FormInput } from "../../FormInput";
import { EnhancedFormInput } from "../../FormInput/EnhancedFormInput";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { FormData } from "../../types";
import { getFieldHelper } from "../../../../../data/formHelpers";

export const EmploymentStep = ({
  register,
  errors,
}: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}) => (
  <FormSection title="Employment Details">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <EnhancedFormInput
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
        useEnhancedHelper={true}
      />
      <EnhancedFormInput
        label="Job Title"
        name="jobTitle"
        register={register}
        error={errors.jobTitle}
        required
        type="select"
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
        label="Company Name"
        name="employer"
        register={register}
        error={errors.employer}
        required
        placeholder={getFieldHelper('employer')?.example || "ABC Company Ltd"}
        useEnhancedHelper={true}
      />
      <EnhancedFormInput
        label="Years at Current Job"
        name="yearsEmployed"
        type="number"
        register={register}
        error={errors.yearsEmployed}
        required
        min="0"
        max="50"
        step="0.1"
        placeholder={getFieldHelper('yearsEmployed')?.example || "2.5"}
        useEnhancedHelper={true}
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <EnhancedFormInput
        label="Monthly Income (GHS)"
        name="monthlyIncome"
        type="number"
        register={register}
        error={errors.monthlyIncome}
        required
        min="0"
        step="0.01"
        placeholder={getFieldHelper('monthlyIncome')?.example || "5000.00"}
        useEnhancedHelper={true}
      />
      <EnhancedFormInput
        label="Employment Start Date"
        name="employmentStartDate"
        type="date"
        register={register}
        error={errors.employmentStartDate}
        useEnhancedHelper={true}
      />
    </div>
  </FormSection>
);
