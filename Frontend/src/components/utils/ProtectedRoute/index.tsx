import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectRequiresMFASetup,
  selectHasLimitedAccess,
  selectRequiresPasswordChange,
  selectPasswordExpired,
  selectTemporaryPassword,
} from "../../redux/features/auth/authSlice";
import { useGetCurrentUserQuery } from "../../redux/features/auth/authApi";
import { MFASetupGuard } from "../../../components/guards/MFASetupGuard";

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const requiresMFASetup = useSelector(selectRequiresMFASetup);
  const hasLimitedAccess = useSelector(selectHasLimitedAccess);
  const requiresPasswordChange = useSelector(selectRequiresPasswordChange);
  const passwordExpired = useSelector(selectPasswordExpired);
  const temporaryPassword = useSelector(selectTemporaryPassword);
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
      navigate("/auth");
      return;
    }

    // CRITICAL SECURITY: Users with temporary passwords or expired passwords 
    // MUST change their password and cannot navigate anywhere else
    if (isAuthenticated && (requiresPasswordChange || passwordExpired || temporaryPassword)) {
      // Force redirect to password change page from ANY other location
      if (location.pathname !== "/change-password") {
        // Replace instead of push to prevent back button bypass
        navigate("/change-password", { replace: true });
        return;
      }
    }

    if (isAuthenticated && !user) {
      setShouldVerify(true);
    }
  }, [isAuthenticated, user, requiresPasswordChange, passwordExpired, temporaryPassword, navigate, location.pathname]);

  // Additional security layer: Prevent rendering protected content for users who need password change
  const needsPasswordChange = requiresPasswordChange || passwordExpired || temporaryPassword;
  
  // Block all access except password change page for users with temporary/expired passwords
  if (isAuthenticated && needsPasswordChange && location.pathname !== "/change-password") {
    // Force immediate redirect
    navigate("/change-password", { replace: true });
    return null;
  }

  useEffect(() => {
    if (error) {
      navigate("/auth");
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
