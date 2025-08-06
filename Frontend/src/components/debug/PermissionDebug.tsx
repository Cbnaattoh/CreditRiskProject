import React, { useState } from 'react';
import { usePermissions } from '../utils/hooks/useRBAC';

const PermissionDebug: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { permissions, roles, isAuthenticated, isAdmin, isStaff } = usePermissions();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
      >
        🔍 Debug RBAC
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">RBAC Debug Info</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <strong>Authentication Status:</strong>
              <div className="ml-2">
                <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
                <div>Is Admin: {isAdmin ? '✅' : '❌'}</div>
                <div>Is Staff: {isStaff ? '✅' : '❌'}</div>
              </div>
            </div>
            
            <div>
              <strong>Roles ({roles.length}):</strong>
              <div className="ml-2 max-h-20 overflow-y-auto">
                {roles.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {roles.map((role, index) => (
                      <li key={index} className="text-green-600">{role}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No roles assigned</div>
                )}
              </div>
            </div>
            
            <div>
              <strong>Permissions ({permissions.length}):</strong>
              <div className="ml-2 max-h-32 overflow-y-auto text-xs">
                {permissions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {permissions.map((permission, index) => (
                      <div key={index} className="text-blue-600">{permission}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No permissions assigned</div>
                )}
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500">
                This debug panel only shows in development mode
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionDebug;