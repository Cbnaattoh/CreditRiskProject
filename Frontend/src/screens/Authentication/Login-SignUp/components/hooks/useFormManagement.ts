import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  twoFASchema,
  registrationSchema,
} from "../../../../../components/utils/schemas/authSchemas";

export const useFormManagement = () => {
  const loginMethods = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const registerMethods = useForm({
    resolver: zodResolver(registrationSchema),
    mode: "onChange",
  });

  const mfaFormMethods = useForm({
    resolver: zodResolver(twoFASchema),
    mode: "onChange",
  });

  const resetForms = useCallback(() => {
    loginMethods.reset();
    mfaFormMethods.reset();
  }, [loginMethods, mfaFormMethods]);

  return { loginMethods, mfaFormMethods, registerMethods, resetForms };
};
