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
      console.log('🔵 Setting user data from getCurrentUser:', userData);
      dispatch(setUser(userData));
    }
  }, [userSuccess, userData, currentUser, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔵 Auth sync - authenticated user detected:', {
        hasUser: !!currentUser,
        hasPermissions: currentPermissions.length > 0,
        hasRoles: currentRoles.length > 0,
        userLoading,
        permissionsLoading,
        permissionsSuccess
      });
    }
  }, [isAuthenticated, currentUser, currentPermissions.length, currentRoles.length, userLoading, permissionsLoading, permissionsSuccess]);

  useEffect(() => {
    if (userError) {
      console.error('🔴 Failed to fetch user data:', userError);
    }
    if (permissionsError) {
      console.error('🔴 Failed to fetch user permissions:', permissionsError);
    }
  }, [userError, permissionsError]);

  useEffect(() => {
    if (permissionsSuccess && permissionsData) {
      console.log('🔵 Permissions fetched successfully:', permissionsData);
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