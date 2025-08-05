import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  selectTemporaryPassword,
  selectPasswordExpired,
  selectRequiresPasswordChange,
  selectIsAuthenticated,
} from '../../redux/features/auth/authSlice';
import { useToast } from '../Toast';

/**
 * Security hook to prevent users with temporary/expired passwords from bypassing password change requirement
 * This hook implements multiple layers of protection against URL manipulation and browser navigation bypass
 */
export const usePasswordSecurityGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { warning: showWarning } = useToast();
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const temporaryPassword = useSelector(selectTemporaryPassword);
  const passwordExpired = useSelector(selectPasswordExpired);
  const requiresPasswordChange = useSelector(selectRequiresPasswordChange);
  
  const needsPasswordChange = temporaryPassword || passwordExpired || requiresPasswordChange;
  const isOnPasswordChangePage = location.pathname === '/change-password';
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // CRITICAL SECURITY: If user needs to change password but is not on password change page
    if (needsPasswordChange && !isOnPasswordChangePage) {
      console.warn('🔴 Security Guard: Blocking access - password change required');
      
      // Force immediate redirect with replace to prevent back button
      navigate('/change-password', { replace: true });
      
      // Show security warning
      showWarning('You must change your password before accessing the system.');
      
      return;
    }
  }, [
    isAuthenticated, 
    needsPasswordChange, 
    isOnPasswordChangePage, 
    navigate, 
    showWarning, 
    location.pathname
  ]);
  
  // Return security status for components to use
  return {
    needsPasswordChange,
    isSecureAccess: !needsPasswordChange || isOnPasswordChangePage,
    securityLevel: needsPasswordChange ? 'RESTRICTED' : 'NORMAL',
  };
};

/**
 * Higher-order component to wrap components that need password security protection
 */
export const withPasswordSecurityGuard = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> => {
  return (props: P) => {
    const { isSecureAccess } = usePasswordSecurityGuard();
    
    // Don't render component if access is not secure
    if (!isSecureAccess) {
      return null;
    }
    
    return React.createElement(WrappedComponent, props);
  };
};