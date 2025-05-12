import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getContacts, getMessages, sendMessage, apiRequest } from '../utils/api';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import { uploadToIPFS } from '../utils/messageStore';
import { connectWebSocket, sendWebSocketMessage } from '../utils/socket';

const Chat = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactFormData, setContactFormData] = useState({ username: '', publicKey: '' });
  
  const messagesEndRef = useRef(null);
  const socket = useRef(null);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      // Connect to WebSocket for real-time messaging
      socket.current = connectWebSocket();
      
      // Handle incoming WebSocket messages
      socket.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message' && data.message) {
            // Add message to the state if it's from the currently selected contact
            if (selectedContact && data.message.senderId === selectedContact.id) {
              // Decrypt the message
              let messageContent = data.message.content;
              
              if (data.message.encrypted && user.privateKey) {
                try {
                  messageContent = await decryptMessage(messageContent, user.privateKey);
                } catch (error) {
                  console.error('Failed to decrypt message:', error);
                  messageContent = '[Encrypted message - cannot decrypt]';
                }
              }
              
              setMessages(prev => [...prev, {
                ...data.message,
                content: messageContent,
                encrypted: false
              }]);
              
              // Scroll to bottom
              scrollToBottom();
            }
            
            // Refresh contacts to update last message
            fetchContacts();
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      // Load contacts on initial load
      fetchContacts();
      
      // Clean up socket connection on unmount
      return () => {
        if (socket.current) {
          socket.current.close();
        }
      };
    }
  }, [user, navigate, selectedContact]);
  
  // Fetch user's contacts
  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Normally we'd use the user's ID from auth context
      // For simplicity, we're using 1 as the default user ID
      const response = await getContacts(1);
      
      // Set the contacts, sorted with most recent messages first
      setContacts(response);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch messages when selecting a contact
  useEffect(() => {
    if (selectedContact) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedContact]);
  
  // Fetch messages between user and selected contact
  const fetchMessages = async () => {
    if (!selectedContact || !user) return;
    
    try {
      setLoading(true);
      // For this example, using userId=1 (would normally come from auth)
      const messagesData = await getMessages(selectedContact.id, 1);
      
      // Decrypt messages
      const decryptedMessages = await Promise.all(
        messagesData.map(async (msg) => {
          if (msg.encrypted && user.privateKey) {
            try {
              const decryptedContent = await decryptMessage(msg.content, user.privateKey);
              return { ...msg, content: decryptedContent, encrypted: false };
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              return { ...msg, content: '[Encrypted message - cannot decrypt]' };
            }
          }
          return msg;
        })
      );
      
      setMessages(decryptedMessages);
      
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    
    try {
      // Encrypt the message using recipient's public key
      const encryptedContent = await encryptMessage(newMessage, selectedContact.publicKey);
      
      // Upload encrypted message to IPFS
      const ipfsHash = await uploadToIPFS(encryptedContent);
      
      // Send the message through the API
      const sentMessage = await sendMessage({
        receiverId: selectedContact.id,
        content: encryptedContent,
        ipfsHash,
        // For this example, using senderId=1 (would normally come from auth)
        senderId: 1
      });
      
      // Add the message to the messages list
      setMessages(prev => [...prev, {
        ...sentMessage,
        content: newMessage, // Show unencrypted version on sender's side
        encrypted: false
      }]);
      
      // Clear the input field
      setNewMessage('');
      
      // Scroll to bottom
      scrollToBottom();
      
      // Refresh contacts to update last message
      fetchContacts();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };
  
  // Handle adding a new contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    
    try {
      if (!contactFormData.username || !contactFormData.publicKey) {
        setError('Username and public key are required');
        return;
      }
      
      // Add contact through API
      await apiRequest('/contacts', 'POST', {
        ...contactFormData,
        // For this example, using currentUserId=1 (would normally come from auth)
        currentUserId: 1
      });
      
      // Clear form and close modal
      setContactFormData({ username: '', publicKey: '' });
      setShowAddContactModal(false);
      
      // Refresh contacts
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      setError('Failed to add contact');
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-primary font-semibold text-xl">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="w-6 h-6"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            DecSecMsg
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => setShowAddContactModal(true)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              title="Add Contact"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="w-6 h-6"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </button>
            
            <button 
              type="button" 
              onClick={() => setShowProfileModal(true)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              title="Your Profile"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="w-6 h-6"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            
            <button 
              type="button" 
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              title="Logout"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="w-6 h-6"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search contacts..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="w-4 h-4"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Contact List */}
            {loading && contacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Loading contacts...
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div 
                  key={contact.id}
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${selectedContact?.id === contact.id ? 'bg-primary/5' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className={`w-10 h-10 ${selectedContact?.id === contact.id ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center font-medium`}>
                    {contact.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">{contact.username}</h3>
                      <span className="text-xs text-gray-500">
                        {contact.lastMessageTime ? new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {contact.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? "No contacts match your search" : "No contacts yet. Add one to start messaging!"}
              </div>
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-medium">
                  {selectedContact.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-medium">{selectedContact.username}</h2>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="text-center text-gray-500">
                    Loading messages...
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const isCurrentUser = message.senderId === 1; // Using 1 as current user ID
                    const messageTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div 
                        key={message.id}
                        className={`flex items-end gap-2 max-w-[80%] ${isCurrentUser ? 'ml-auto' : ''}`}
                      >
                        {!isCurrentUser && (
                          <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-medium text-xs">
                            {message.senderUsername?.slice(0, 2).toUpperCase() || "?"}
                          </div>
                        )}
                        
                        <div className={`${
                          isCurrentUser 
                            ? 'bg-primary text-white rounded-lg rounded-br-none' 
                            : 'bg-white rounded-lg rounded-bl-none'
                          } p-3 shadow-sm`}
                        >
                          <p className={isCurrentUser ? 'text-white' : 'text-gray-800'}>
                            {message.content}
                          </p>
                          <span className={`text-xs ${isCurrentUser ? 'text-white/80' : 'text-gray-500'} mt-1 block`}>
                            {messageTime}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-5 h-5"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="text-primary mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-16 h-16 mx-auto"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Select a contact</h3>
                <p className="text-gray-600 mb-6">
                  Choose a contact from the list to start messaging or add a new contact to begin a conversation.
                </p>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Add New Contact
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add New Contact</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={contactFormData.username}
                  onChange={(e) => setContactFormData({...contactFormData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key
                </label>
                <textarea
                  id="publicKey"
                  value={contactFormData.publicKey}
                  onChange={(e) => setContactFormData({...contactFormData, publicKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary resize-none"
                  placeholder="Paste their public key"
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddContactModal(false);
                    setContactFormData({ username: '', publicKey: '' });
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-6">Your Profile</h3>
            
            <div className="mb-6 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl mx-auto mb-4">
                {user?.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <h4 className="text-lg font-medium">{user?.username || "Your Username"}</h4>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Public Key</label>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-xs break-all mb-2">
                {user?.publicKey || "Your public key will appear here"}
              </div>
              
              <button 
                type="button" 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(user?.publicKey || '');
                    alert('Public key copied to clipboard!');
                  } catch (err) {
                    alert('Failed to copy. Please select and copy manually.');
                  }
                }}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="h-3 w-3"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg> 
                Copy to Clipboard
              </button>
              
              <p className="text-xs text-gray-500 mt-2">
                Share your username and public key with people who want to add you as a contact.
              </p>
            </div>
            
            <div className="mb-6">
              <h5 className="font-medium mb-2">Account Security</h5>
              <p className="text-sm text-gray-600 mb-4">
                Your account is secured by your private key. Make sure you have a backup of your private key in a secure location.
              </p>
              
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                <h3 className="text-amber-800 font-medium">Warning</h3>
                <p className="text-amber-700 text-sm mt-1">
                  If you lose your private key, you will permanently lose access to your account and all messages.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;