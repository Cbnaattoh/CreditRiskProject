import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../../components/utils/hooks/useWebSocket';
import { useSelector } from 'react-redux';
import type { RootState } from '../../components/redux/store';

const WebSocketTest: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const { isConnected, connectionError, sendMessage } = useWebSocket('/ws/notifications/', {
    onMessage: (message) => {
      console.log('Received WebSocket message:', message);
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${JSON.stringify(message)}`]);
    },
    onConnect: () => {
      console.log('WebSocket connected successfully');
      setConnectionStatus('Connected');
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: WebSocket Connected`]);
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('Disconnected');
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: WebSocket Disconnected`]);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('Error');
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: WebSocket Error`]);
    }
  });

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('Connected');
    } else {
      setConnectionStatus('Disconnected');
    }
  }, [isConnected]);

  const testSendMessage = () => {
    const testMessage = {
      type: 'test',
      data: { message: 'Hello from frontend!', timestamp: new Date().toISOString() }
    };
    const sent = sendMessage(testMessage);
    if (sent) {
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: Sent test message`]);
    } else {
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: Failed to send message (not connected)`]);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebSocket Connection Test</h1>
      
      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Authentication:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
            <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
            <p><strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}</p>
          </div>
          <div>
            <p><strong>WebSocket Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                connectionStatus === 'Connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'Error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {connectionStatus}
              </span>
            </p>
            <p><strong>Connection Error:</strong> {connectionError || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
        <div className="flex space-x-4">
          <button
            onClick={testSendMessage}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Test Message
          </button>
          <button
            onClick={clearMessages}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Messages
          </button>
        </div>
      </div>

      {/* Message Log */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Message Log</h2>
        <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 h-64 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet...</p>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => (
                <div key={index} className="text-sm font-mono">
                  {message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to Test</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <li>Make sure you're logged in (Authentication should show ✅)</li>
          <li>Check that WebSocket Status shows "Connected"</li>
          <li>Open a terminal and run: <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">cd Backend && python3 test_websocket.py</code></li>
          <li>You should see real-time messages appear in the Message Log above</li>
          <li>You can also click "Send Test Message" to test bidirectional communication</li>
        </ol>
      </div>
    </div>
  );
};

export default WebSocketTest;