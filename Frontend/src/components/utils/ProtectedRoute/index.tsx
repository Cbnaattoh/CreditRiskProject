import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from "../../redux/features/auth/authSlice";
import { useGetCurrentUserQuery } from "../../redux/features/auth/authApi";

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [shouldVerify, setShouldVerify] = useState(false);

  const {
    data: userData,
    error,
    isLoading,
  } = useGetCurrentUserQuery(undefined, {
    skip: !shouldVerify || !isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (isAuthenticated && !user) {
      setShouldVerify(true);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      navigate("/");
    }
  }, [error, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <div>Verifying authentication...</div>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
