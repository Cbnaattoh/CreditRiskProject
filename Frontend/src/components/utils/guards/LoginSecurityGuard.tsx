import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectIsAuthenticated,
  selectTemporaryPassword,
  selectPasswordExpired,
  selectRequiresPasswordChange,
} from '../../redux/features/auth/authSlice';

interface LoginSecurityGuardProps {
  children: React.ReactNode;
}

/**
 * Security guard for login page to prevent authenticated users with temporary passwords
 * from staying on login page instead of changing their password
 */
const LoginSecurityGuard: React.FC<LoginSecurityGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const temporaryPassword = useSelector(selectTemporaryPassword);
  const passwordExpired = useSelector(selectPasswordExpired);
  const requiresPasswordChange = useSelector(selectRequiresPasswordChange);
  
  const needsPasswordChange = temporaryPassword || passwordExpired || requiresPasswordChange;
  
  useEffect(() => {
    // If user is authenticated and needs password change, force them to password change page
    if (isAuthenticated && needsPasswordChange) {
      console.warn('🔴 Login Security Guard: Authenticated user with password change requirement detected');
      navigate('/change-password', { replace: true });
      return;
    }
    
    // If user is authenticated but doesn't need password change, redirect to dashboard
    if (isAuthenticated && !needsPasswordChange) {
      navigate('/home', { replace: true });
      return;
    }
  }, [isAuthenticated, needsPasswordChange, navigate]);
  
  // Only render login page if user is not authenticated
  if (isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
};

export default LoginSecurityGuard;