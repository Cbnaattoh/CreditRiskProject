import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../components/utils/hooks";

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const mfaRequired = useAppSelector((state) => state.auth.requiresMFA);

  useEffect(() => {
    if (isAuthenticated && !mfaRequired) {
      navigate("/home");
    }
  }, [isAuthenticated, mfaRequired, navigate]);
};
