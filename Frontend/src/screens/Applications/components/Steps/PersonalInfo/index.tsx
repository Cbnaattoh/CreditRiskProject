import FormSection from "../../FormSection";
import { FormInput } from "../../FormInput";
import { LocationInput } from "../../LocationInput";
import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { FormData } from "../../types";

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
        <FormInput
          label="First Name"
          name="firstName"
          register={register}
          error={errors.firstName}
          required
          placeholder="John"
          disabled={prefilledFields.firstName}
        />
        <FormInput
          label="Other Names"
          name="otherNames"
          register={register}
          error={errors.otherNames}
        />
        <FormInput
          label="Last Name"
          name="lastName"
          register={register}
          error={errors.lastName}
          required
          placeholder="Doe"
          disabled={prefilledFields.lastName}
        />
        <FormInput
          label="Date of Birth"
          name="dob"
          type="date"
          register={register}
          error={errors.dob}
          required
        />
        <FormInput
          label="National ID Number"
          name="nationalIDNumber"
          register={register}
          error={errors.nationalIDNumber}
          required
          placeholder="GHA-XXXXXXXXX-X"
        />
        <FormInput
          label="SSNIT Number"
          name="ssnitNumber"
          register={register}
          error={errors.ssnitNumber}
          required
          placeholder="PXXXXXXXXXX"
        />
        <FormInput
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
        />
        <FormInput
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
        />
      </div>
    </FormSection>

    <FormSection title="B. Contact Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormInput
          label="Phone Number"
          name="phone"
          type="tel"
          register={register}
          error={errors.phone}
          required
          placeholder="0202344444"
          disabled={prefilledFields.phone}
        />
        <FormInput
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          required
          placeholder="your@email.com"
          disabled={prefilledFields.email}
        />
        <FormInput
          label="Residential Address"
          name="residentialAddress"
          register={register}
          error={errors.residentialAddress}
          required
          placeholder="House No. 123, Street Name, East Legon"
          helperText="Your current home address including house number and street"
          tooltip="This should match the address on your official documents"
        />
        <FormInput
          label="Digital Address"
          name="digitalAddress"
          register={register}
          error={errors.digitalAddress}
          required
          placeholder="GE-3445-345"
          tooltip="Ghana Post GPS address - found on your Ghana Post GPS app or utility bills"
          helperText="Your official Ghana Post GPS address"
          example="GE-123-4567"
        />

        <FormInput
          label="Landmark"
          name="landmark"
          register={register}
          error={errors.landmark}
          placeholder="Near church/school/etc."
          helperText="Notable location near your address to help with identification"
          example="Near SDA Church, Behind Shell Filling Station"
        />

        {/* <LocationInput register={register} errors={errors} /> */}
      </div>
      <LocationInput register={register} errors={errors} setValue={setValue} watch={watch} />
    </FormSection>

  </>
);
