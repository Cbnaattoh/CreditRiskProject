import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import { selectIsAuthenticated } from "../../redux/features/auth/authSlice";
import { useVerify2FAMutation } from "../../redux/features/auth/authApi";

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [verifyToken] = useVerify2FAMutation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await verifyToken().unwrap();
      } catch (err) {
        navigate("/login");
      }
    };

    if (!isAuthenticated) {
      navigate("/login");
    } else {
      checkAuth();
    }
  }, [isAuthenticated, navigate, verifyToken]);

  return isAuthenticated ? <Outlet /> : null;
};

export default ProtectedRoute;
