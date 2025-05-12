import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    async function checkUserStatus() {
      try {
        const storedUsername = localStorage.getItem('username');
        const storedPrivateKey = localStorage.getItem('privateKey');
        
        if (storedUsername && storedPrivateKey) {
          setUser({
            username: storedUsername,
            publicKey: localStorage.getItem('publicKey'),
            privateKey: storedPrivateKey
          });
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('Failed to authenticate');
      } finally {
        setLoading(false);
      }
    }
    
    checkUserStatus();
  }, []);

  // Register a new user
  const register = async (username) => {
    try {
      setLoading(true);
      
      // Generate cryptographic key pair
      const keyPair = await generateKeyPair();
      
      // Send registration request to API
      const response = await apiRequest('/api/users', 'POST', {
        username,
        publicKey: keyPair.publicKey
      });
      
      // Save user data to local storage
      localStorage.setItem('username', username);
      localStorage.setItem('publicKey', keyPair.publicKey);
      localStorage.setItem('privateKey', keyPair.privateKey);
      
      // Update state
      setUser({
        id: response.id,
        username,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey
      });
      
      return keyPair.privateKey;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (username, privateKey) => {
    try {
      setLoading(true);
      
      // Verify the private key by trying to decrypt a test message
      // In a real app, you would verify this with the server
      
      // For simplicity, we're just setting the user
      setUser({
        username,
        privateKey
      });
      
      localStorage.setItem('username', username);
      localStorage.setItem('privateKey', privateKey);
      
      return true;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('publicKey');
    localStorage.removeItem('privateKey');
    setUser(null);
  };

  // Generate RSA key pair
  const generateKeyPair = async () => {
    // Use the Web Crypto API to generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"] // key usage
    );
    
    // Export the public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    
    // Export the private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    
    // Convert the exported keys to base64 strings
    const publicKey = arrayBufferToBase64(publicKeyBuffer);
    const privateKey = arrayBufferToBase64(privateKeyBuffer);
    
    return { publicKey, privateKey };
  };

  // Convert ArrayBuffer to Base64 string
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    return window.btoa(binary);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}