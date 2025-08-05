import type { RouteObject } from "react-router-dom";
import Login from "../../../../screens/Authentication/Login-SignUp";
import ForgotPassword from "../../../../screens/Authentication/PasswordRecovery/ForgotPassword";
import ResetPassword from "../../../../screens/Authentication/PasswordRecovery/ResetPassword";
import PasswordChangeRequired from "../../../../screens/Authentication/PasswordChangeRequired";
import LoginSecurityGuard from "../../guards/LoginSecurityGuard";

const authRoutes: RouteObject[] = [
  { 
    path: "/", 
    element: (
      <LoginSecurityGuard>
        <Login />
      </LoginSecurityGuard>
    ) 
  },
  { 
    path: "/forgot-password", 
    element: (
      <LoginSecurityGuard>
        <ForgotPassword />
      </LoginSecurityGuard>
    ) 
  },
  { 
    path: "/reset-password", 
    element: (
      <LoginSecurityGuard>
        <ResetPassword />
      </LoginSecurityGuard>
    ) 
  },
  { path: "/change-password", element: <PasswordChangeRequired /> },
];

export default authRoutes;
