import React, { useState, useEffect, useCallback } from 'react';
import { HttpClient } from '@/common/helpers/httpClient';

interface ServerConfig {
  protocol: 'http' | 'https';
  host: string;
  port: number;
}

interface ServerInfo {
  port: number;
  ips: string[];
  hostname: string;
  timestamp: string;
  message: string;
}

interface ApiStatus {
  status: 'healthy' | 'error';
  db: boolean;
  port: number;
  env: string;
  error?: string;
}

const NetworkConfig: React.FC = () => {
  const [config, setConfig] = useState<ServerConfig>({
    protocol: 'http',
    host: 'localhost',
    port: 3001,
  });
  const [savedConfig, setSavedConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Load saved config on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('posServerConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedConfig(parsed);
        setConfig({
          protocol: parsed.protocol || 'http',
          host: parsed.host || 'localhost',
          port: parsed.port || 3001,
        });
      }
    } catch {
      // Invalid, ignore
    }
  }, []);

  const saveConfig = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.setItem('posServerConfig', JSON.stringify(config));
      setSavedConfig(config);
      // Trigger httpClient reload by window reload or dispatch event if needed
      window.dispatchEvent(new Event('configUpdated'));
      setTestStatus('success');
      setTestMessage('Config saved successfully!');
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Save failed');
    }
    setLoading(false);
  }, [config]);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setTestStatus('idle');
    try {
      // Temporarily set config for test
      const tempConfigStr = JSON.stringify(config);
      localStorage.setItem('posServerConfig', tempConfigStr);
      
      // Test endpoints
      const [serverInfo, status] = await Promise.all([
        HttpClient.get<ServerInfo>('/config/server-info'),
        HttpClient.get<ApiStatus>('/config/status'),
      ]);

      setTestStatus('success');
      setTestMessage(`Connected to ${serverInfo.hostname}:${config.port} (${status.status})`);
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error.message || 'Connection failed');
    }
    setLoading(false);
  }, [config]);

  const resetConfig = useCallback(() => {
    localStorage.removeItem('posServerConfig');
    setConfig({ protocol: 'http', host: 'localhost', port: 3001 });
    setSavedConfig(null);
    setTestStatus('idle');
    setTestMessage('');
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Network Configuration</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">Protocol</label>
            <select
              value={config.protocol}
              onChange={(e) => setConfig({ ...config, protocol: e.target.value as 'http' | 'https' })}
              className="w-full p-2 border rounded-md"
              disabled={loading}
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-2">Host</label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="localhost"
              className="w-full p-2 border rounded-md"
              disabled={loading}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-2">Port</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 3001 })}
              placeholder="3001"
              min="1"
              max="65535"
              className="w-full p-2 border rounded-md"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex-1"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={saveConfig}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Config'}
        </button>
        {savedConfig && (
          <button
            onClick={resetConfig}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reset
          </button>
        )}
      </div>

      {testStatus !== 'idle' && (
        <div className={`p-4 rounded-md ${
          testStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {testMessage}
        </div>
      )}

      {savedConfig && (
        <div className="bg-blue-50 p-4 rounded-md mt-4">
          <p className="font-medium">Current Saved Config:</p>
          <code className="text-sm block mt-1">
            {savedConfig.protocol}://{savedConfig.host}:{savedConfig.port}/api
          </code>
        </div>
      )}
    </div>
  );
};

export default NetworkConfig;

