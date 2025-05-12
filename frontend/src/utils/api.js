/**
 * API utility functions for making requests to the backend
 */

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {Object} data - Request data (for POST, PUT, etc.)
 * @returns {Promise<any>} - Response data
 */
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
    }

    // Check if the response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Get user's contacts
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Contacts array
 */
export const getContacts = async (userId) => {
  return apiRequest(`/api/contacts?userId=${userId}`);
};

/**
 * Add a new contact
 * @param {Object} contactData - Contact data
 * @returns {Promise<Object>} - New contact
 */
export const addContact = async (contactData) => {
  return apiRequest('/api/contacts', 'POST', contactData);
};

/**
 * Get messages between user and contact
 * @param {number} contactId - Contact ID
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Messages array
 */
export const getMessages = async (contactId, userId) => {
  return apiRequest(`/api/messages/${contactId}?userId=${userId}`);
};

/**
 * Send a new message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} - New message
 */
export const sendMessage = async (messageData) => {
  return apiRequest('/api/messages', 'POST', messageData);
};

/**
 * Mark a message as read
 * @param {number} messageId - Message ID
 * @returns {Promise<Object>} - Result
 */
export const markMessageAsRead = async (messageId) => {
  return apiRequest(`/api/messages/${messageId}/read`, 'PATCH');
};

/**
 * Register a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - New user
 */
export const registerUser = async (userData) => {
  return apiRequest('/api/users', 'POST', userData);
};

/**
 * Get user profile
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User profile
 */
export const getUserProfile = async (userId) => {
  return apiRequest(`/api/users/${userId}`);
};