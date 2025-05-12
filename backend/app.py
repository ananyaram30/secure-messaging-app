from flask import Flask, request, jsonify, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import json
import time
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import our modules
from database import get_db
from models import User, Contact, Message
from encryption import generate_key_pair, encrypt_message, decrypt_message
from auth import require_auth, authenticate_user, get_current_user

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JSON_SORT_KEYS'] = False

# Set up CORS
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# Set up SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# User connections dict to track active users
connected_users = {}

@app.route('/')
def index():
    return jsonify({"message": "DecSecMsg API"})

# User Registration and Authentication
@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user with username and public key"""
    data = request.json
    
    if not data or not 'username' in data or not 'publicKey' in data:
        return jsonify({'error': 'Username and public key are required'}), 400
    
    db = get_db()
    
    # Check if username already exists
    existing_user = db.users.find_one({'username': data['username']})
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 409
    
    # Create new user
    new_user = User(
        username=data['username'],
        public_key=data['publicKey']
    )
    
    # Save to database
    result = db.users.insert_one(new_user.to_dict())
    new_user._id = result.inserted_id
    
    # Store user in session
    session['user_id'] = str(new_user._id)
    session['username'] = new_user.username
    
    return jsonify({
        'id': str(new_user._id),
        'username': new_user.username,
        'publicKey': new_user.public_key
    }), 201

@app.route('/api/users/<user_id>', methods=['GET'])
@require_auth
def get_user(user_id):
    """Get user by ID"""
    db = get_db()
    user = db.users.find_one({'_id': user_id})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': str(user['_id']),
        'username': user['username'],
        'publicKey': user['public_key']
    })

@app.route('/api/login', methods=['POST'])
def login():
    """Log in a user with username and private key proof"""
    data = request.json
    
    if not data or not 'username' in data or not 'privateKeyProof' in data:
        return jsonify({'error': 'Username and private key proof are required'}), 400
    
    user = authenticate_user(data['username'], data['privateKeyProof'])
    
    if not user:
        return jsonify({'error': 'Invalid username or private key'}), 401
    
    # Store user in session
    session['user_id'] = str(user['_id'])
    session['username'] = user['username']
    
    return jsonify({
        'id': str(user['_id']),
        'username': user['username'],
        'publicKey': user['public_key']
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    """Log out current user"""
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

# Contact Management
@app.route('/api/contacts', methods=['GET'])
@require_auth
def get_contacts():
    """Get all contacts for the current user"""
    current_user = get_current_user()
    db = get_db()
    
    # Get all contacts
    contacts_list = []
    contacts = db.contacts.find({'user_id': str(current_user['_id'])})
    
    for contact in contacts:
        # Get contact user details
        contact_user = db.users.find_one({'_id': contact['contact_id']})
        if not contact_user:
            continue
            
        # Get last message between users (for preview)
        last_message = db.messages.find_one({
            '$or': [
                {'sender_id': str(current_user['_id']), 'receiver_id': contact['contact_id']},
                {'sender_id': contact['contact_id'], 'receiver_id': str(current_user['_id'])}
            ]
        }, sort=[('timestamp', -1)])
        
        # Format contact with last message
        contact_data = {
            'id': str(contact_user['_id']),
            'username': contact_user['username'],
            'publicKey': contact_user['public_key'],
        }
        
        if last_message:
            # We don't decrypt the message content here since this is just for preview
            contact_data['lastMessage'] = '(Encrypted message)'
            contact_data['lastMessageTime'] = last_message['timestamp'].isoformat()
            
        contacts_list.append(contact_data)
    
    return jsonify(contacts_list)

@app.route('/api/contacts', methods=['POST'])
@require_auth
def add_contact():
    """Add a new contact"""
    data = request.json
    current_user = get_current_user()
    db = get_db()
    
    if not data or not 'username' in data or not 'publicKey' in data:
        return jsonify({'error': 'Username and public key are required'}), 400
    
    # Find user to add as contact
    contact_user = db.users.find_one({'username': data['username']})
    if not contact_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if already a contact
    existing_contact = db.contacts.find_one({
        'user_id': str(current_user['_id']), 
        'contact_id': str(contact_user['_id'])
    })
    
    if existing_contact:
        return jsonify({'error': 'Already a contact'}), 409
    
    # Create contact relationship (both ways for bidirectional contact)
    contact1 = Contact(
        user_id=str(current_user['_id']),
        contact_id=str(contact_user['_id'])
    )
    
    contact2 = Contact(
        user_id=str(contact_user['_id']),
        contact_id=str(current_user['_id'])
    )
    
    db.contacts.insert_one(contact1.to_dict())
    db.contacts.insert_one(contact2.to_dict())
    
    return jsonify({
        'id': str(contact_user['_id']),
        'username': contact_user['username'],
        'publicKey': contact_user['public_key']
    }), 201

# Messaging
@app.route('/api/messages/<contact_id>', methods=['GET'])
@require_auth
def get_messages(contact_id):
    """Get messages between current user and contact"""
    current_user = get_current_user()
    db = get_db()
    
    # Validate contact_id
    contact = db.contacts.find_one({
        'user_id': str(current_user['_id']), 
        'contact_id': contact_id
    })
    
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404
    
    # Get messages between users
    messages_list = []
    messages = db.messages.find({
        '$or': [
            {'sender_id': str(current_user['_id']), 'receiver_id': contact_id},
            {'sender_id': contact_id, 'receiver_id': str(current_user['_id'])}
        ]
    }).sort('timestamp', 1)
    
    for message in messages:
        # Get sender username
        sender = db.users.find_one({'_id': message['sender_id']})
        sender_username = sender['username'] if sender else 'Unknown'
        
        # Format message
        message_data = {
            'id': str(message['_id']),
            'senderId': message['sender_id'],
            'senderUsername': sender_username, 
            'receiverId': message['receiver_id'],
            'content': message['content'],
            'ipfsHash': message.get('ipfs_hash'),
            'timestamp': message['timestamp'].isoformat(),
            'encrypted': True
        }
        
        messages_list.append(message_data)
        
        # Mark message as read if receiver is current user
        if message['receiver_id'] == str(current_user['_id']) and not message['is_read']:
            db.messages.update_one(
                {'_id': message['_id']},
                {'$set': {'is_read': True}}
            )
    
    return jsonify(messages_list)

@app.route('/api/messages', methods=['POST'])
@require_auth
def send_message():
    """Send a new message"""
    data = request.json
    current_user = get_current_user()
    db = get_db()
    
    if not data or not 'receiverId' in data or not 'content' in data:
        return jsonify({'error': 'Receiver ID and content are required'}), 400
    
    # Check if receiver is a contact
    contact = db.contacts.find_one({
        'user_id': str(current_user['_id']), 
        'contact_id': data['receiverId']
    })
    
    if not contact:
        return jsonify({'error': 'Receiver not found in contacts'}), 404
    
    # Create and save message
    message = Message(
        sender_id=str(current_user['_id']),
        receiver_id=data['receiverId'],
        content=data['content'],
        ipfs_hash=data.get('ipfsHash')
    )
    
    result = db.messages.insert_one(message.to_dict())
    message._id = result.inserted_id
    
    # Format response
    message_data = {
        'id': str(message._id),
        'senderId': message.sender_id,
        'senderUsername': current_user['username'],
        'receiverId': message.receiver_id,
        'content': message.content,
        'ipfsHash': message.ipfs_hash,
        'timestamp': message.timestamp.isoformat(),
        'encrypted': True
    }
    
    # Notify receiver through WebSocket if online
    if data['receiverId'] in connected_users:
        socketio.emit(
            'new_message',
            message_data,
            room=connected_users[data['receiverId']]
        )
    
    return jsonify(message_data), 201

@app.route('/api/messages/<message_id>/read', methods=['PATCH'])
@require_auth
def mark_message_as_read(message_id):
    """Mark a message as read"""
    current_user = get_current_user()
    db = get_db()
    
    # Find message
    message = db.messages.find_one({'_id': message_id})
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    # Check if current user is the receiver
    if message['receiver_id'] != str(current_user['_id']):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Update message as read
    db.messages.update_one(
        {'_id': message_id},
        {'$set': {'is_read': True}}
    )
    
    return jsonify({'success': True})

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    """Handle new WebSocket connection"""
    logger.info(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    logger.info(f"Client disconnected: {request.sid}")
    
    # Remove user from connected_users
    for user_id, sid in connected_users.items():
        if sid == request.sid:
            del connected_users[user_id]
            logger.info(f"User {user_id} disconnected")
            break

@socketio.on('auth')
def handle_auth(data):
    """Authenticate WebSocket connection"""
    logger.info(f"Auth request: {data}")
    
    username = data.get('username')
    if not username:
        return
        
    db = get_db()
    user = db.users.find_one({'username': username})
    
    if user:
        user_id = str(user['_id'])
        connected_users[user_id] = request.sid
        logger.info(f"User {username} authenticated")
        
        # Join a room with the user's ID for direct messaging
        join_room(request.sid)

@socketio.on('message')
def handle_message(data):
    """Handle incoming WebSocket message"""
    # This can be used for real-time messaging
    logger.info(f"Received message: {data}")
    
    # Check if receiver is online and forward the message
    receiver_id = data.get('receiverId')
    if receiver_id and receiver_id in connected_users:
        emit('new_message', data, room=connected_users[receiver_id])

# Run the app
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)