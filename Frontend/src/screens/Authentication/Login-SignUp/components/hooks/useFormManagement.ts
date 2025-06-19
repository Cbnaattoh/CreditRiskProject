// import { useCallback } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   loginSchema,
//   twoFASchema,
//   registrationSchema,
// } from "../../../../../components/utils/schemas/authSchemas";

// export const useFormManagement = () => {
//   const loginMethods = useForm({
//     resolver: zodResolver(loginSchema),
//     mode: "onChange",
//   });

//   const registerMethods = useForm({
//     resolver: zodResolver(registrationSchema),
//     mode: "onChange",
//   });

//   const mfaFormMethods = useForm({
//     resolver: zodResolver(twoFASchema),
//     mode: "onChange",
//   });

//   const resetForms = useCallback(() => {
//     loginMethods.reset();
//     mfaFormMethods.reset();
//   }, [loginMethods, mfaFormMethods]);

//   return { loginMethods, mfaFormMethods, registerMethods, resetForms };
// };

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
  // Login form with proper typing and defaults
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
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      userType: "User",
      enableMFA: false,
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
