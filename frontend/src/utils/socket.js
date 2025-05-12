/**
 * WebSocket client for real-time messaging
 */

/**
 * Get WebSocket URL based on current window location
 * @returns {string} WebSocket URL
 */
export function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
}

/**
 * Connect to WebSocket server
 * @returns {WebSocket} WebSocket connection
 */
export function connectWebSocket() {
  try {
    const socket = new WebSocket(getWebSocketUrl());
    
    // Handle connection open
    socket.onopen = () => {
      console.log("WebSocket connection established");
      
      // Send authentication message when connection opens
      const username = localStorage.getItem("username");
      if (username) {
        socket.send(JSON.stringify({
          type: "auth",
          username,
        }));
      }
    };
    
    // Handle connection error
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    // Handle connection close
    socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      
      // Attempt to reconnect after a delay if the connection was closed unexpectedly
      if (event.code !== 1000) {
        console.log("Attempting to reconnect in 5 seconds...");
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };
    
    return socket;
  } catch (error) {
    console.error("Error connecting to WebSocket:", error);
    // Return a dummy socket object to prevent errors elsewhere
    return {
      send: () => console.error("Cannot send: Socket not connected"),
      readyState: 3, // CLOSED
      close: () => {},
      onmessage: null,
      onopen: null,
      onclose: null,
      onerror: null
    };
  }
}

/**
 * Send a message through WebSocket
 * @param {WebSocket} socket - WebSocket connection
 * @param {string} type - Message type
 * @param {Object} data - Message data
 * @returns {boolean} Success status
 */
export function sendWebSocketMessage(socket, type, data) {
  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type,
        ...data,
      }));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error sending WebSocket message:", error);
    return false;
  }
}