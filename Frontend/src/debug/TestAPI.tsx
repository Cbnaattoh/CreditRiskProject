import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const TestAPI: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useSelector((state: any) => state.auth.token);
  const user = useSelector((state: any) => state.auth.user);

  const testAPI = async () => {
    if (!token) {
      setError('No token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/applications/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      testAPI();
    }
  }, [token]);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      width: '500px', 
      height: '300px', 
      backgroundColor: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '20px', 
      fontSize: '12px', 
      overflow: 'auto',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <h3>API Test Panel</h3>
      <p><strong>User:</strong> {user?.email}</p>
      <p><strong>User Type:</strong> {user?.user_type}</p>
      <p><strong>Has Token:</strong> {!!token ? 'Yes' : 'No'}</p>
      
      <button 
        onClick={testAPI} 
        style={{ marginBottom: '10px', padding: '5px 10px' }}
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && (
        <div>
          <p><strong>Count:</strong> {data.count}</p>
          <p><strong>Results:</strong> {data.results?.length || 0}</p>
          {data.results && data.results.length > 0 && (
            <div>
              <strong>First Application:</strong>
              <pre style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
                {JSON.stringify(data.results[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestAPI;