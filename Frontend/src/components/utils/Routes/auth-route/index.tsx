import type { RouteObject } from "react-router-dom";
import Login from "../../../../screens/Authentication/Login-SignUp";
import ForgotPassword from "../../../../screens/Authentication/PasswordRecovery/ForgotPassword";
import ResetPassword from "../../../../screens/Authentication/PasswordRecovery/ResetPassword";
import PasswordChangeRequired from "../../../../screens/Authentication/PasswordChangeRequired";

const authRoutes: RouteObject[] = [
  { path: "/", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/change-password", element: <PasswordChangeRequired /> },
];

export default authRoutes;
