import { useEffect } from "react";
import { useGetMyPermissionsQuery } from "../../redux/features/api/RBAC/rbacApi";
import { useGetCurrentUserQuery } from "../../redux/features/auth/authApi";
import { useSelector, useDispatch } from "react-redux";
import { 
  selectIsAuthenticated, 
  selectUserPermissions, 
  selectUserRoles,
  selectCurrentUser,
  setUser
} from "../../redux/features/auth/authSlice";

export const useAuthSync = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const currentPermissions = useSelector(selectUserPermissions);
  const currentRoles = useSelector(selectUserRoles);

  // Automatically fetch current user data if authenticated but no user data
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    isSuccess: userSuccess
  } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated || !!currentUser,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  // Automatic permissions fetch when user is authenticated
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
    isSuccess: permissionsSuccess
  } = useGetMyPermissionsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  // Update user data when fetched
  useEffect(() => {
    if (userSuccess && userData && !currentUser) {
      dispatch(setUser(userData));
    }
  }, [userSuccess, userData, currentUser, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
    }
  }, [isAuthenticated, currentUser, currentPermissions.length, currentRoles.length, userLoading, permissionsLoading, permissionsSuccess]);

  useEffect(() => {
    if (userError) {
    }
    if (permissionsError) {
    }
  }, [userError, permissionsError]);

  useEffect(() => {
    if (permissionsSuccess && permissionsData) {
    }
  }, [permissionsSuccess, permissionsData]);

  return {
    userLoading,
    userError,
    userData,
    permissionsLoading,
    permissionsError,
    permissionsData,
    isAuthenticated,
    hasUser: !!currentUser,
    hasPermissions: currentPermissions.length > 0,
    hasRoles: currentRoles.length > 0,
  };
};