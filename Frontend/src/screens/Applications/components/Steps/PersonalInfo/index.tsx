import FormSection from "../../FormSection";
import { FormInput } from "../../FormInput";
import { EnhancedFormInput } from "../../FormInput/EnhancedFormInput";
import { LocationInput } from "../../LocationInput";
import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { FormData } from "../../types";
import { getFieldHelper } from "../../../../../data/formHelpers";

export const PersonalInfoStep = ({
  register,
  errors,
  setValue,
  watch,
  prefilledFields = {},
}: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  setValue: UseFormSetValue<FormData>;
  watch: UseFormWatch<FormData>;
  prefilledFields?: Record<string, boolean>;
}) => (
  <>
    <FormSection title="A. Basic Identity">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancedFormInput
          label="First Name"
          name="firstName"
          register={register}
          error={errors.firstName}
          required
          placeholder={getFieldHelper('firstName')?.example || "John"}
          disabled={prefilledFields.firstName}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Other Names"
          name="otherNames"
          register={register}
          error={errors.otherNames}
          placeholder={getFieldHelper('otherNames')?.example}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Last Name"
          name="lastName"
          register={register}
          error={errors.lastName}
          required
          placeholder={getFieldHelper('lastName')?.example || "Doe"}
          disabled={prefilledFields.lastName}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Date of Birth"
          name="dob"
          type="date"
          register={register}
          error={errors.dob}
          required
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="National ID Number"
          name="nationalIDNumber"
          register={register}
          error={errors.nationalIDNumber}
          required
          placeholder={getFieldHelper('nationalIDNumber')?.example || "GHA-XXXXXXXXX-X"}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="SSNIT Number"
          name="ssnitNumber"
          register={register}
          error={errors.ssnitNumber}
          placeholder={getFieldHelper('ssnitNumber')?.example || "PXXXXXXXXXX"}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Gender"
          name="gender"
          type="select"
          register={register}
          error={errors.gender}
          required
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
            { value: "prefer_not_to_say", label: "Prefer not to say" },
          ]}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Marital Status"
          name="maritalStatus"
          type="select"
          register={register}
          error={errors.maritalStatus}
          required
          options={[
            { value: "single", label: "Single" },
            { value: "married", label: "Married" },
            { value: "divorced", label: "Divorced" },
            { value: "widowed", label: "Widowed" },
          ]}
          useEnhancedHelper={true}
        />
      </div>
    </FormSection>

    <FormSection title="B. Contact Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancedFormInput
          label="Phone Number"
          name="phone"
          type="tel"
          register={register}
          error={errors.phone}
          required
          placeholder={getFieldHelper('phone')?.example || "0202344444"}
          disabled={prefilledFields.phone}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          required
          placeholder={getFieldHelper('email')?.example || "your@email.com"}
          disabled={prefilledFields.email}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Residential Address"
          name="residentialAddress"
          register={register}
          error={errors.residentialAddress}
          required
          placeholder={getFieldHelper('residentialAddress')?.example || "House No. 123, Street Name, East Legon"}
          useEnhancedHelper={true}
        />
        <EnhancedFormInput
          label="Digital Address"
          name="digitalAddress"
          register={register}
          error={errors.digitalAddress}
          placeholder={getFieldHelper('digitalAddress')?.example || "GE-3445-345"}
          useEnhancedHelper={true}
        />

        <EnhancedFormInput
          label="Landmark"
          name="landmark"
          register={register}
          error={errors.landmark}
          placeholder={getFieldHelper('landmark')?.example || "Near church/school/etc."}
          useEnhancedHelper={true}
        />

        {/* <LocationInput register={register} errors={errors} /> */}
      </div>
      <LocationInput register={register} errors={errors} setValue={setValue} watch={watch} />
    </FormSection>

  </>
);
