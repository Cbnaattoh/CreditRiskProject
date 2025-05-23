import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, twoFASchema } from "../schemas/authSchemas";
import type { LoginFormData, TwoFAFormData } from "../schemas/authSchemas";

export const useAuthForm = (formType: "login" | "2fa") => {
  const methods = useForm<LoginFormData | TwoFAFormData>({
    resolver: zodResolver(formType === "login" ? loginSchema : twoFASchema),
    mode: "onChange",
  });

  const [serverError, setServerError] = useState("");

  return {
    methods,
    serverError,
    setServerError,
  };
};
