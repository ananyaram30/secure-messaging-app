/**
 * IPFS integration for decentralized message storage
 */

// IPFS HTTP Client endpoint (using public gateway)
const IPFS_API_URL = "https://ipfs.infura.io:5001/api/v0";

/**
 * Upload content to IPFS
 * @param {string} content - Content to upload
 * @returns {Promise<string>} IPFS hash (CID)
 */
export const uploadToIPFS = async (content) => {
  try {
    // Convert content to a Blob
    const blob = new Blob([content], { type: "text/plain" });
    
    // Create form data for the IPFS API
    const formData = new FormData();
    formData.append("file", blob);
    
    // Upload to IPFS
    const response = await fetch(`${IPFS_API_URL}/add`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.Hash; // Return the IPFS hash (CID)
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    
    // For now, return a placeholder hash if IPFS upload fails
    // In production, you would want to handle this more gracefully
    return "ipfs-upload-error-" + Date.now();
  }
};

/**
 * Retrieve content from IPFS
 * @param {string} hash - IPFS hash (CID)
 * @returns {Promise<string>} Content
 */
export const getFromIPFS = async (hash) => {
  try {
    // Use a public IPFS gateway to retrieve content
    const response = await fetch(`https://ipfs.io/ipfs/${hash}`);
    
    if (!response.ok) {
      throw new Error(`IPFS retrieval failed: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error("Error retrieving from IPFS:", error);
    throw new Error("Failed to retrieve content from IPFS");
  }
};