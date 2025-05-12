/**
 * Blockchain utilities for decentralized identity and verification
 * 
 * Note: This is a simplified implementation for demonstration purposes.
 * In a production environment, you would use a real blockchain integration.
 */

/**
 * Verify a message signature using blockchain
 * @param {string} message - Original message
 * @param {string} signature - Message signature
 * @param {string} publicKey - Signer's public key
 * @returns {Promise<boolean>} Whether the signature is valid
 */
export const verifySignature = async (message, signature, publicKey) => {
  try {
    // Convert public key from base64 to ArrayBuffer
    const publicKeyBuffer = base64ToArrayBuffer(publicKey);
    
    // Import the public key
    const cryptoKey = await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );
    
    // Convert signature from base64 to ArrayBuffer
    const signatureBuffer = base64ToArrayBuffer(signature);
    
    // Convert message to ArrayBuffer
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);
    
    // Verify the signature
    return await window.crypto.subtle.verify(
      {
        name: "RSASSA-PKCS1-v1_5",
      },
      cryptoKey,
      signatureBuffer,
      messageBuffer
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};

/**
 * Sign a message using private key
 * @param {string} message - Message to sign
 * @param {string} privateKey - Private key in base64
 * @returns {Promise<string>} Signature in base64
 */
export const signMessage = async (message, privateKey) => {
  try {
    // Convert private key from base64 to ArrayBuffer
    const privateKeyBuffer = base64ToArrayBuffer(privateKey);
    
    // Import the private key
    const cryptoKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
    
    // Convert message to ArrayBuffer
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);
    
    // Sign the message
    const signatureBuffer = await window.crypto.subtle.sign(
      {
        name: "RSASSA-PKCS1-v1_5",
      },
      cryptoKey,
      messageBuffer
    );
    
    // Convert signature to base64
    return arrayBufferToBase64(signatureBuffer);
  } catch (error) {
    console.error("Error signing message:", error);
    throw new Error("Failed to sign message");
  }
};

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - ArrayBuffer to convert
 * @returns {string} Base64 string
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
  return window.btoa(binary);
};

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string to convert
 * @returns {ArrayBuffer} ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};