import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Register = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  // Redirect if already logged in
  if (user && !showPrivateKey) {
    navigate('/chat');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Register user and get private key
      const generatedPrivateKey = await register(username);
      setPrivateKey(generatedPrivateKey);
      setShowPrivateKey(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      alert('Private key copied to clipboard!');
    } catch (err) {
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const handleContinue = () => {
    if (!keySaved) {
      alert('Please confirm that you have saved your private key');
      return;
    }
    
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8">
            {!showPrivateKey ? (
              <>
                <h2 className="text-2xl font-bold text-center text-primary mb-8">Create Your Secure Account</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      placeholder="Choose a username"
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <h3 className="text-blue-800 font-medium">How It Works</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      When you register, we'll generate a unique cryptographic key pair for you. You'll need to save your private key securely - it's the only way to access your account.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                    <h3 className="text-amber-800 font-medium">Important Security Notice</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      DecSecMsg doesn't store your private key. If you lose it, you'll lose access to your account permanently. There is no password reset option. Store it securely.
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="text-primary font-medium hover:underline">
                        Login
                      </Link>
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center text-primary mb-6">Your Private Key</h2>
                
                <div className="bg-gray-50 p-4 rounded-md font-mono text-xs break-all mb-4">
                  {privateKey}
                </div>
                
                <button
                  onClick={handleCopyToClipboard}
                  className="mb-6 w-full py-2 px-4 flex items-center justify-center gap-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy to Clipboard
                </button>
                
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-6">
                  <h3 className="text-amber-800 font-medium">IMPORTANT</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Save this private key immediately! It will never be shown again.
                    <br /><br />
                    If you lose this key, you'll permanently lose access to your account and messages. Store it in a secure password manager or other secure location.
                  </p>
                </div>
                
                <div className="flex items-center mb-6">
                  <input
                    id="confirm"
                    type="checkbox"
                    checked={keySaved}
                    onChange={(e) => setKeySaved(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="confirm" className="ml-2 block text-sm text-gray-700">
                    I have saved my private key and understand that it cannot be recovered if lost
                  </label>
                </div>
                
                <button
                  onClick={handleContinue}
                  disabled={!keySaved}
                  className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Messaging
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;