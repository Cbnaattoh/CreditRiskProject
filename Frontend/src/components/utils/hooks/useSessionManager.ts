import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '.';
import { selectRefreshToken, logout } from '../../redux/features/auth/authSlice';
import { useRefreshTokenMutation } from '../../redux/features/auth/authApi';

export const useSessionManager = () => {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector(selectRefreshToken);
  const [refreshTokenMutation] = useRefreshTokenMutation();

  const extendSession = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      console.error('No refresh token available for session extension');
      return false;
    }

    try {
      console.log('🔵 Extending session with refresh token...');
      await refreshTokenMutation({ refresh: refreshToken }).unwrap();
      console.log('🟢 Session extended successfully');
      return true;
    } catch (error) {
      console.error('🔴 Failed to extend session:', error);
      return false;
    }
  }, [refreshToken, refreshTokenMutation]);

  const forceLogout = useCallback(async () => {
    console.log('🔴 Forcing logout due to session expiration');
    dispatch(logout());
  }, [dispatch]);

  return {
    extendSession,
    forceLogout,
    hasRefreshToken: !!refreshToken,
  };
};