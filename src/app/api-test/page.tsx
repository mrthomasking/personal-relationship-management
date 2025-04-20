'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ApiTestPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const testHibpApi = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    addLog(`Testing HIBP API with email: ${email}`);

    try {
      // First try GET to test if the endpoint is accessible
      addLog('Testing GET method on /api/hibp');
      const getResponse = await fetch('/api/hibp');
      addLog(`GET response status: ${getResponse.status}`);
      const getMessage = await getResponse.text();
      addLog(`GET response: ${getMessage}`);

      // Then try the actual POST request
      addLog('Making POST request to /api/hibp');
      const response = await fetch('/api/hibp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      addLog(`POST response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Error response: ${errorText}`);
        setError(`HTTP error! status: ${response.status}, text: ${errorText}`);
        return;
      }

      const data = await response.json();
      addLog(`Received data: ${JSON.stringify(data)}`);
      setResult(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Exception: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="bg-gray-100 p-4 rounded-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Test HIBP API</h2>
        <div className="flex gap-2 mb-4">
          <Input 
            type="email" 
            placeholder="Enter email address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="flex-grow"
          />
          <Button onClick={testHibpApi} disabled={loading}>
            {loading ? 'Testing...' : 'Test HIBP API'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        {result && (
          <div className="mb-4">
            <h3 className="font-bold mb-2">Result:</h3>
            <pre className="bg-white p-4 rounded-md overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-gray-100 p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Logs</h2>
          <Button variant="outline" size="sm" onClick={clearLogs}>Clear Logs</Button>
        </div>
        <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Test an API to see logs.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 