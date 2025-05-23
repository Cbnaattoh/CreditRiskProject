import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/features/auth/authSlice";
import { useVerifyTokenMutation } from "../../redux/features/auth/authApi";

const useAutoLogout = () => {
  const dispatch = useDispatch();
  const [verifyToken] = useVerifyTokenMutation();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await verifyToken().unwrap();
      } catch (err) {
        dispatch(logout());
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch, verifyToken]);
};

export default useAutoLogout;
