import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectUserPermissions, selectUserRoles } from '../redux/features/auth/authSlice';

interface ApiDebuggerProps {
  queryName: string;
  data?: any;
  isLoading?: boolean;
  error?: any;
  showDetails?: boolean;
}

export const ApiDebugger: React.FC<ApiDebuggerProps> = ({
  queryName,
  data,
  isLoading,
  error,
  showDetails = false
}) => {
  const user = useSelector(selectCurrentUser);
  const permissions = useSelector(selectUserPermissions);
  const roles = useSelector(selectUserRoles);

  if (!showDetails && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <div className="font-bold text-yellow-400 mb-2">API Debug: {queryName}</div>
      <div className="space-y-1">
        <div>User: {user?.email || 'Not logged in'}</div>
        <div>Permissions: {permissions.length}</div>
        <div>Roles: {roles.length}</div>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Error: {error ? 'Yes' : 'No'}</div>
        <div>Data: {data?.results?.length || data?.length || (data ? 'Present' : 'None')}</div>
        {error && (
          <div className="text-red-300 mt-2">
            Error: {JSON.stringify(error, null, 2)}
          </div>
        )}
        {showDetails && data && (
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-300">View Data</summary>
            <pre className="mt-1 text-xs overflow-auto max-h-32">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ApiDebugger;