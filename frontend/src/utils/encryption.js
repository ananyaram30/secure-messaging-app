/**
 * Crypto utilities for encryption, decryption, and key generation
 */

/**
 * Generate a new RSA key pair for secure messaging
 * @returns {Promise<{publicKey: string, privateKey: string}>} The generated key pair
 */
export async function generateKeyPair() {
  try {
    // Generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // Extractable
      ["encrypt", "decrypt"] // Key usages
    );

    // Export public key as JWK (JSON Web Key)
    const publicKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey
    );

    // Export private key as JWK (JSON Web Key)
    const privateKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    );

    // Convert keys to string for storage
    return {
      publicKey: JSON.stringify(publicKey),
      privateKey: JSON.stringify(privateKey),
    };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw error;
  }
}

/**
 * Encrypt a message using the recipient's public key
 * @param {string} message - The message to encrypt
 * @param {string} publicKeyString - Recipient's public key as string
 * @returns {Promise<string>} Base64-encoded encrypted message
 */
export async function encryptMessage(message, publicKeyString) {
  try {
    // Parse the public key from string
    const publicKeyObj = JSON.parse(publicKeyString);

    // Import the public key
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      publicKeyObj,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false, // Not extractable
      ["encrypt"] // Key usages
    );

    // Encode the message to ArrayBuffer
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);

    // Encrypt the message
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      messageBuffer
    );

    // Convert encrypted data to Base64 for transmission
    return arrayBufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error("Error encrypting message:", error);
    throw error;
  }
}

/**
 * Decrypt a message using the recipient's private key
 * @param {string} encryptedMessage - Base64-encoded encrypted message
 * @param {string} privateKeyString - Recipient's private key as string
 * @returns {Promise<string>} Decrypted message
 */
export async function decryptMessage(encryptedMessage, privateKeyString) {
  try {
    // Parse the private key from string
    const privateKeyObj = JSON.parse(privateKeyString);

    // Import the private key
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyObj,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false, // Not extractable
      ["decrypt"] // Key usages
    );

    // Convert Base64 to ArrayBuffer
    const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);

    // Decrypt the message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedBuffer
    );

    // Decode the message from ArrayBuffer
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Error decrypting message:", error);
    throw error;
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - ArrayBuffer to convert
 * @returns {string} Base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string to convert
 * @returns {ArrayBuffer} Resulting ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}