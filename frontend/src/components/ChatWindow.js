import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, markMessageAsRead } from '../utils/api';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import { uploadToIPFS } from '../utils/ipfs';

/**
 * Chat window component for displaying messages with a specific contact
 * @param {Object} props - Component props
 * @param {Object} props.contact - The contact user object
 * @param {Array} props.messages - Array of message objects
 * @param {Function} props.onNewMessage - Function to call when a new message is sent
 */
const ChatWindow = ({ contact, messages, onNewMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUsername = localStorage.getItem('username');
  const privateKey = localStorage.getItem('privateKey');
  
  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !contact || sending) return;
    
    try {
      setSending(true);
      
      // Encrypt the message with recipient's public key
      const encryptedContent = await encryptMessage(newMessage.trim(), contact.publicKey);
      
      // Upload to IPFS (if enabled)
      const ipfsHash = await uploadToIPFS(encryptedContent);
      
      // Send the message to the API
      const userId = localStorage.getItem('userId');
      const sentMessage = await sendMessage({
        senderId: userId,
        receiverId: contact.id, 
        content: encryptedContent,
        ipfsHash
      });
      
      // Add the sent message to the local state with unencrypted content
      // This way the sender can see what they sent in plain text
      const localMessage = {
        ...sentMessage,
        content: newMessage.trim(),
        encrypted: false
      };
      
      // Call the parent's callback to update state
      onNewMessage(localMessage);
      
      // Clear the input
      setNewMessage('');
      
      // Scroll to the newest message
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  // Format timestamp into a readable time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
          {contact.username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="font-medium">{contact.username}</h2>
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isCurrentUser = message.senderUsername === currentUsername;
            
            return (
              <div 
                key={message.id}
                className={`flex items-end gap-2 max-w-[80%] ${isCurrentUser ? 'ml-auto' : ''}`}
              >
                {!isCurrentUser && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium text-xs">
                    {message.senderUsername.slice(0, 2).toUpperCase()}
                  </div>
                )}
                
                <div className={`${
                  isCurrentUser 
                    ? 'bg-blue-600 text-white rounded-lg rounded-br-none' 
                    : 'bg-white rounded-lg rounded-bl-none'
                  } p-3 shadow-sm`}
                >
                  <p className={isCurrentUser ? 'text-white' : 'text-gray-800'}>
                    {message.content}
                  </p>
                  <span className={`text-xs ${isCurrentUser ? 'text-white/80' : 'text-gray-500'} mt-1 block`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-3 resize-none"
              placeholder="Type a message..."
              rows="2"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={sending}
            />
          </div>
          
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;