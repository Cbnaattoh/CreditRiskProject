import React from 'react';
import { useSelector } from 'react-redux';
import { useIsClientUser, usePermissions } from '../components/utils/hooks/useRBAC';
import { useGetApplicationsQuery } from '../components/redux/features/api/applications/applicationsApi';

const DebugRBAC: React.FC = () => {
  const currentUser = useSelector((state: any) => state.auth.user);
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const token = useSelector((state: any) => state.auth.token);
  const isClientUser = useIsClientUser();
  const { permissions, roles } = usePermissions();
  
  const { data: applicationsData, isLoading, error } = useGetApplicationsQuery({
    page: 1,
    page_size: 20
  });

  const debugData = {
    authentication: {
      isAuthenticated,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null
    },
    user: currentUser,
    rbac: {
      isClientUser,
      roles,
      permissions
    },
    api: {
      isLoading,
      error: error ? String(error) : null,
      applicationsCount: applicationsData?.count || 0,
      resultsLength: applicationsData?.results?.length || 0
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      width: '400px', 
      height: '100vh', 
      backgroundColor: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '20px', 
      fontSize: '12px', 
      overflow: 'auto',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <h3>RBAC Debug Panel</h3>
      <pre>{JSON.stringify(debugData, null, 2)}</pre>
    </div>
  );
};

export default DebugRBAC;