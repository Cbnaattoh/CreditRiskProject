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
    <FormSection title="Income Information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Annual Income"
          name="annualIncome"
          type="number"
          register={register}
          error={errors.annualIncome}
          required
        />
        <FormInput
          label="Other Income"
          name="otherIncome"
          type="number"
          register={register}
          error={errors.otherIncome}
        />
      </div>
    </FormSection>

    <FormSection title="Assets & Liabilities">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label="Total Assets"
          name="totalAssets"
          type="number"
          register={register}
          error={errors.totalAssets}
        />
        <FormInput
          label="Total Liabilities"
          name="totalLiabilities"
          type="number"
          register={register}
          error={errors.totalLiabilities}
        />
      </div>
    </FormSection>
  </>
);
