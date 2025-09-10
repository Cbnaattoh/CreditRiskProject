import { useEffect } from "react";
import { useGetMyPermissionsQuery } from "../../redux/features/api/RBAC/rbacApi";
import { useGetCurrentUserQuery } from "../../redux/features/auth/authApi";
import { useSelector, useDispatch } from "react-redux";
import { 
  selectIsAuthenticated, 
  selectUserPermissions, 
  selectUserRoles,
  selectCurrentUser,
  selectTokenExpired,
  setUser,
  restorePersistedPermissions,
  handleApiError
} from "../../redux/features/auth/authSlice";

export const useAuthSync = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const currentPermissions = useSelector(selectUserPermissions);
  const currentRoles = useSelector(selectUserRoles);
  const tokenExpired = useSelector(selectTokenExpired);

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

  // Debug: Log permissions API state
  // console.log('🔍 useAuthSync Permissions API Debug:', {
  //   isAuthenticated,
  //   permissionsLoading,
  //   permissionsError: !!permissionsError,
  //   permissionsSuccess,
  //   hasPermissionsData: !!permissionsData,
  //   permissionsDataRoles: permissionsData?.roles,
  //   permissionsDataPermissions: permissionsData?.permission_codes,
  //   currentPermissions: currentPermissions.length,
  //   currentRoles: currentRoles.length,
  // });

  // Update user data when fetched
  useEffect(() => {
    if (userSuccess && userData && !currentUser) {
      dispatch(setUser(userData));
    }
  }, [userSuccess, userData, currentUser, dispatch]);

  // Restore permissions from localStorage on initial load if authenticated but no permissions
  useEffect(() => {
    if (isAuthenticated && currentPermissions.length === 0 && currentRoles.length === 0) {
      // console.log('🔄 User authenticated but no permissions/roles - restoring from localStorage');
      dispatch(restorePersistedPermissions());
    }
  }, [isAuthenticated, currentPermissions.length, currentRoles.length, dispatch]);

  // Handle API errors gracefully
  useEffect(() => {
    if (userError) {
      console.error('🔴 User API error:', userError);
      // Don't clear auth state immediately for user API errors
      dispatch(handleApiError({ preserveAuth: true }));
    }
    if (permissionsError) {
      console.error('🔴 Permissions API error:', permissionsError);
      // Restore permissions from localStorage when API fails
      dispatch(handleApiError({ preserveAuth: true }));
      dispatch(restorePersistedPermissions());
    }
  }, [userError, permissionsError, dispatch]);

  // Log permission sync success
  useEffect(() => {
    if (permissionsSuccess && permissionsData) {
      console.log('✅ Permissions synced successfully:', {
        permissions: permissionsData.permission_codes?.length || 0,
        roles: permissionsData.roles?.length || 0
      });
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