import type { RouteObject } from "react-router-dom";
import Login from "../../../../screens/Authentication/Login-SignUp";
import ForgotPassword from "../../../../screens/Authentication/PasswordRecovery/ForgotPassword";
import ResetPassword from "../../../../screens/Authentication/PasswordRecovery/ResetPassword";

const authRoutes: RouteObject[] = [
  { path: "/", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
];

export default authRoutes;
