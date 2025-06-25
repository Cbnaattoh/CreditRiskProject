import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  twoFASchema,
  frontendRegistrationSchema,
} from "../../../../../components/utils/schemas/authSchemas";
import type {
  LoginFormData,
  FrontendRegistrationFormData,
  TwoFAFormData,
} from "../../../../../components/utils/schemas/authSchemas";

export const useFormManagement = () => {
  const loginMethods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
      enableMFA: false,
    },
  });

  // Registration form using frontend schema
  const registerMethods = useForm<FrontendRegistrationFormData>({
    resolver: zodResolver(frontendRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      password: "",
      confirm_password: "",
      user_type: "User",
      mfa_enabled: false,
      terms_accepted: false,
      profile_picture: undefined,
    },
  });

  // MFA form with proper typing and defaults
  const mfaFormMethods = useForm<TwoFAFormData>({
    resolver: zodResolver(twoFASchema),
    mode: "onChange",
    defaultValues: {
      code: "",
    },
  });

  // Reset all forms with proper dependency management
  const resetForms = useCallback(() => {
    loginMethods.reset();
    registerMethods.reset();
    mfaFormMethods.reset();
  }, [loginMethods, registerMethods, mfaFormMethods]);

  return {
    loginMethods,
    registerMethods,
    mfaFormMethods,
    resetForms,
  };
};
