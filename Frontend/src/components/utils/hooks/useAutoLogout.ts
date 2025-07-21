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
    console.warn("🟡 Auto-logout triggered");
    dispatch(logout());

    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.replace("/");
      }, 120000);
    }
  }, [dispatch]);

  useEffect(() => {
    if (tokenExpired) {
      console.warn("🔴 Token marked as expired in Redux state");
      performLogout();
      return;
    }

    if (authToken && isTokenExpired(authToken)) {
      console.warn("🔴 Token validation failed - token is expired");
      performLogout();
      return;
    }

    if (isAuthenticated && !isTokenValid) {
      console.warn("🔴 User marked as authenticated but token is invalid");
      performLogout();
      return;
    }
  }, [tokenExpired, authToken, isAuthenticated, isTokenValid, performLogout]);

  useEffect(() => {
    if (!isAuthenticated || !isTokenValid) {
      return;
    }

    console.log("🔵 Setting up auto-logout interval");

    const interval = setInterval(async () => {
      console.log("🔵 Auto-logout: Performing periodic token check");

      if (authToken && isTokenExpired(authToken)) {
        console.warn("🔴 Auto-logout: Token expired locally");
        performLogout();
        return;
      }

      try {
        const result = await refetch();

        if (result.error) {
          console.warn(
            "🔴 Auto-logout: Server validation failed",
            result.error
          );

          if ("status" in result.error && result.error.status === 401) {
            performLogout();
          }
        } else {
          console.log("🟢 Auto-logout: Token validation successful");
        }
      } catch (err) {
        console.error("🔴 Auto-logout: Error during token validation", err);
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
      console.log("🔵 Clearing auto-logout interval");
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
        console.warn("🔴 Token expires in less than 1 minute, logging out");
        performLogout();
        return;
      }

      const logoutTime = timeUntilExpiry - 30000;

      if (logoutTime > 0) {
        console.log(
          `🔵 Scheduling logout in ${Math.round(logoutTime / 1000)} seconds`
        );

        const timeoutId = setTimeout(() => {
          console.warn("🔴 Scheduled logout: Token about to expire");
          performLogout();
        }, logoutTime);

        return () => {
          console.log("🔵 Clearing scheduled logout");
          clearTimeout(timeoutId);
        };
      }
    } catch (error) {
      console.error("🔴 Error parsing token for scheduled logout:", error);
      performLogout();
    }
  }, [authToken, isTokenValid, performLogout]);
};

export default useAutoLogout;
