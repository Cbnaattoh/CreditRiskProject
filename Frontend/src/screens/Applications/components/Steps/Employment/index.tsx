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
          { value: "employed", label: "Employed" },
          { value: "self-employed", label: "Self-Employed" },
          { value: "unemployed", label: "Unemployed" },
          { value: "student", label: "Student" },
          { value: "retired", label: "Retired" },
        ]}
      />
      <FormInput
        label="Occupation"
        name="occupation"
        register={register}
        error={errors.occupation}
        required
      />
      <FormInput
        label="Company Name"
        name="employer"
        register={register}
        error={errors.employer}
        required
      />
      <FormInput
        label="Years at Current Job"
        name="yearsEmployed"
        type="number"
        register={register}
        error={errors.yearsEmployed}
        required
      />
    </div>
  </FormSection>
);
