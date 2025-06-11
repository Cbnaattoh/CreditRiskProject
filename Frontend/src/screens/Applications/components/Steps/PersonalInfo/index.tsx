import FormSection from "../../FormSection";
import { FormInput } from "../../FormInput";
import { LocationInput } from "../../LocationInput";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { FormData } from "../../types";

export const PersonalInfoStep = ({
  register,
  errors,
}: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
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
          label="Gender"
          name="gender"
          type="select"
          register={register}
          error={errors.gender}
          required
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "transgender", label: "Transgender" },
            { value: "undisclosed", label: "Prefer not to say" },
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
            { value: "married", label: "Married" },
            { value: "single", label: "Single" },
            { value: "divorced", label: "Divorced" },
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
        />
        <FormInput
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          required
          placeholder="your@email.com"
        />
        <FormInput
          label="Residential Address"
          name="residentialAddress"
          register={register}
          error={errors.residentialAddress}
          required
          placeholder="East Legon"
        />
        <FormInput
          label="Digital Address"
          name="digitalAddress"
          register={register}
          error={errors.digitalAddress}
          required
          placeholder="GE-3445-345"
        />

        <FormInput
          label="Landmark"
          name="landmark"
          register={register}
          error={errors.landmark}
          placeholder="Near church/school/etc."
        />

        {/* <LocationInput register={register} errors={errors} /> */}
      </div>
      <LocationInput register={register} errors={errors} />
    </FormSection>

  </>
);
