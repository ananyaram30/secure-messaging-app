import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

/**
 * Component for testing API endpoints
 * This is for development purposes only
 */
const ApiTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [endpoint, setEndpoint] = useState('/users');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      let data = null;
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        try {
          data = JSON.parse(body);
        } catch (err) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }
      
      const response = await apiRequest(endpoint, method, data);
      setResult(response);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">API Test Tool</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endpoint
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
              /api
            </span>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 min-w-0 block px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="/users"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        
        {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Body (JSON)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder='{"key": "value"}'
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          <h3 className="text-sm font-medium">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700">Response</h3>
          <pre className="mt-2 p-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-md overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;