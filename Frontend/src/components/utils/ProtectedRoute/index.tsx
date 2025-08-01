import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectRequiresMFASetup,
  selectHasLimitedAccess,
} from "../../redux/features/auth/authSlice";
import { useGetCurrentUserQuery } from "../../redux/features/auth/authApi";
import { MFASetupGuard } from "../../../components/guards/MFASetupGuard";

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const requiresMFASetup = useSelector(selectRequiresMFASetup);
  const hasLimitedAccess = useSelector(selectHasLimitedAccess);
  const navigate = useNavigate();
  const location = useLocation();
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

  // Define paths that should have restricted access for users with limited tokens
  const restrictedPaths = [
    "/home/loan-applications",
    "/home/customers", 
    "/home/reports",
    "/home/admin",
  ];

  // Settings path should allow access for MFA setup
  const isSettingsPath = location.pathname.startsWith("/home/settings");
  
  // Check if current path should be blocked for limited access users
  const shouldBlockAccess = hasLimitedAccess && 
    restrictedPaths.some(path => location.pathname.startsWith(path));

  return (
    <MFASetupGuard 
      showBanner={!isSettingsPath}
      blockAccess={shouldBlockAccess}
      allowedPaths={["/home/settings", "/home"]}
    >
      <Outlet />
    </MFASetupGuard>
  );
};

export default ProtectedRoute;
