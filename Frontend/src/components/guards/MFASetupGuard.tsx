import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  selectRequiresMFASetup,
  selectHasLimitedAccess,
  selectIsAuthenticated,
} from "../redux/features/auth/authSlice";
import { MFASetupBanner, MFASetupModal } from "../MFA";

interface MFASetupGuardProps {
  children: React.ReactNode;
  showBanner?: boolean;
  blockAccess?: boolean;
  allowedPaths?: string[];
}

export const MFASetupGuard: React.FC<MFASetupGuardProps> = ({
  children,
  showBanner = true,
  blockAccess = false,
  allowedPaths = ["/settings", "/auth", "/logout"],
}) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const requiresMFASetup = useSelector(selectRequiresMFASetup);
  const hasLimitedAccess = useSelector(selectHasLimitedAccess);
  const [showMFAModal, setShowMFAModal] = useState(false);

  // Don't show guard if not authenticated or doesn't need MFA setup
  if (!isAuthenticated || !requiresMFASetup) {
    return <>{children}</>;
  }

  // Check if current path is allowed for limited access users
  const currentPath = window.location.pathname;
  const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));

  // If user has limited access and is accessing a restricted path
  if (hasLimitedAccess && blockAccess && !isAllowedPath) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Complete MFA Setup Required
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your access is limited until you complete the multi-factor authentication setup. 
            This security measure protects your account and ensures secure access.
          </p>
          
          <button
            onClick={() => setShowMFAModal(true)}
            className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white py-3 px-4 rounded-lg font-medium transition-colors mb-4"
          >
            Complete MFA Setup
          </button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You can also complete setup from your{" "}
            <a href="/settings" className="text-amber-600 dark:text-amber-400 hover:underline">
              account settings
            </a>
          </p>
        </div>
        
        <MFASetupModal
          isOpen={showMFAModal}
          onClose={() => setShowMFAModal(false)}
          onComplete={() => {
            setShowMFAModal(false);
            // Refresh the page to get new tokens and permissions
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Show banner and allow access
  return (
    <>
      {showBanner && (
        <div className="sticky top-0 z-40 px-4 pt-4">
          <MFASetupBanner
            onStartSetup={() => setShowMFAModal(true)}
            showDismiss={!hasLimitedAccess}
          />
        </div>
      )}
      
      {children}
      
      <MFASetupModal
        isOpen={showMFAModal}
        onClose={() => setShowMFAModal(false)}
        onComplete={() => {
          setShowMFAModal(false);
          // Refresh the page to get new tokens and permissions
          window.location.reload();
        }}
      />
    </>
  );
};