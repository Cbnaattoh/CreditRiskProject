import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/features/auth/authSlice";
import { useGetCurrentUserQuery } from "../../redux/features/auth/authApi";

const useAutoLogout = () => {
  const dispatch = useDispatch();
  const { refetch } = useGetCurrentUserQuery();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refetch().unwrap();
      } catch (err) {
        dispatch(logout());
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [dispatch, refetch]);
};

export default useAutoLogout;
