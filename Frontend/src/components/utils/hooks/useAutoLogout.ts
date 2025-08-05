import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  logout,
  selectIsTokenValid,
  selectTokenExpired,
  selectAuthToken,
  selectIsAuthenticated,
  isTokenExpired,
} from "../../redux/features/auth/authSlice";
import { useGetCurrentUserQuery } from "../../redux/features/auth/authApi";

const useAutoLogout = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isTokenValid = useSelector(selectIsTokenValid);
  const tokenExpired = useSelector(selectTokenExpired);
  const authToken = useSelector(selectAuthToken);

  const { refetch } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated || !isTokenValid,
  });

  const performLogout = useCallback(() => {
    dispatch(logout());

    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.replace("/");
      }, 120000);
    }
  }, [dispatch]);

  useEffect(() => {
    if (tokenExpired) {
      performLogout();
      return;
    }

    if (authToken && isTokenExpired(authToken)) {
      performLogout();
      return;
    }

    if (isAuthenticated && !isTokenValid) {
      performLogout();
      return;
    }
  }, [tokenExpired, authToken, isAuthenticated, isTokenValid, performLogout]);

  useEffect(() => {
    if (!isAuthenticated || !isTokenValid) {
      return;
    }


    const interval = setInterval(async () => {

      if (authToken && isTokenExpired(authToken)) {
        performLogout();
        return;
      }

      try {
        const result = await refetch();

        if (result.error) {

          if ("status" in result.error && result.error.status === 401) {
            performLogout();
          }
        } else {
        }
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          err.status === 401
        ) {
          performLogout();
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    dispatch,
    refetch,
    isAuthenticated,
    isTokenValid,
    authToken,
    performLogout,
  ]);

  useEffect(() => {
    if (!authToken || !isTokenValid) return;

    try {
      const payload = JSON.parse(atob(authToken.split(".")[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      if (timeUntilExpiry <= 60000) {
        performLogout();
        return;
      }

      const logoutTime = timeUntilExpiry - 300000;

      if (logoutTime > 0) {

        const timeoutId = setTimeout(() => {
          performLogout();
        }, logoutTime);

        return () => {
          clearTimeout(timeoutId);
        };
      }
    } catch (error) {
      performLogout();
    }
  }, [authToken, isTokenValid, performLogout]);
};

export default useAutoLogout;
