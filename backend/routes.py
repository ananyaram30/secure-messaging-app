from flask import Blueprint, request, jsonify, session
from database import get_db
from models import User, Contact, Message
from auth import require_auth, get_current_user
from encryption import encrypt_message, decrypt_message

# Create blueprint
api = Blueprint('api', __name__, url_prefix='/api')

# User Routes
@api.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('publicKey'):
        return jsonify({"message": "Missing required fields"}), 400
    
    username = data.get('username')
    public_key = data.get('publicKey')
    
    # Check if username already exists
    db = get_db()
    existing_user = db.users.find_one({"username": username})
    
    if existing_user:
        return jsonify({"message": "Username already taken"}), 400
    
    # Create new user
    user = User(username=username, public_key=public_key)
    user_id = db.users.insert_one(user.to_dict()).inserted_id
    
    # Get the created user (will have _id now)
    created_user = db.users.find_one({"_id": user_id})
    
    # Return user without public key
    created_user.pop('public_key', None)
    created_user['id'] = str(created_user.pop('_id'))
    created_user['createdAt'] = created_user.get('created_at', '').isoformat() if hasattr(created_user.get('created_at', ''), 'isoformat') else created_user.get('created_at', '')
    
    return jsonify(created_user), 201

@api.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    db = get_db()
    user = db.users.find_one({"_id": user_id})
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    user['id'] = str(user.pop('_id'))
    user.pop('public_key', None)  # Don't send public key
    
    return jsonify(user)

@api.route('/users/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('privateKeyProof'):
        return jsonify({"message": "Missing required fields"}), 400
    
    username = data.get('username')
    
    db = get_db()
    user = db.users.find_one({"username": username})
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # In a real app, verify the private key proof
    # For this example, we'll assume it's valid
    
    # Set user session
    session['user_id'] = str(user['_id'])
    
    # Return user data
    user_data = {
        "id": str(user['_id']),
        "username": user['username'],
        "createdAt": user.get('created_at', '').isoformat() if hasattr(user.get('created_at', ''), 'isoformat') else user.get('created_at', '')
    }
    
    return jsonify(user_data)

@api.route('/users/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully"})

# Contact Routes
@api.route('/contacts', methods=['GET'])
def get_contacts():
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({"message": "User ID is required"}), 400
    
    db = get_db()
    contacts_data = []
    
    # Find all contacts for this user
    contacts = db.contacts.find({"user_id": user_id})
    
    for contact in contacts:
        contact_user = db.users.find_one({"_id": contact.get('contact_id')})
        if contact_user:
            # Get last message
            last_message = db.messages.find({
                "$or": [
                    {"sender_id": user_id, "receiver_id": contact.get('contact_id')},
                    {"sender_id": contact.get('contact_id'), "receiver_id": user_id}
                ]
            }).sort("timestamp", -1).limit(1)
            
            last_message_data = None
            last_message_time = None
            
            for msg in last_message:  # Will be at most one
                last_message_data = msg.get('content')
                last_message_time = msg.get('timestamp').isoformat() if hasattr(msg.get('timestamp', ''), 'isoformat') else msg.get('timestamp', '')
            
            contacts_data.append({
                "id": str(contact_user.get('_id')),
                "username": contact_user.get('username'),
                "publicKey": contact_user.get('public_key'),
                "lastMessage": last_message_data,
                "lastMessageTime": last_message_time
            })
    
    # Sort by last message time, most recent first
    contacts_data.sort(key=lambda x: x.get('lastMessageTime') or "", reverse=True)
    
    return jsonify(contacts_data)

@api.route('/contacts', methods=['POST'])
def add_contact():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('publicKey'):
        return jsonify({"message": "Missing required fields"}), 400
    
    # In a real app, get current user from session
    current_user_id = data.get('currentUserId', '1')
    
    db = get_db()
    
    # Find the user to add as a contact
    contact_user = db.users.find_one({"username": data.get('username')})
    
    if not contact_user:
        return jsonify({"message": "User not found"}), 404
    
    contact_id = str(contact_user.get('_id'))
    
    # Check if already a contact
    existing_contact = db.contacts.find_one({
        "user_id": current_user_id,
        "contact_id": contact_id
    })
    
    if existing_contact:
        return jsonify({"message": "Already a contact"}), 400
    
    # Create the contact relationship
    contact = Contact(
        user_id=current_user_id,
        contact_id=contact_id
    )
    db.contacts.insert_one(contact.to_dict())
    
    # Create reverse contact relationship
    reverse_contact = Contact(
        user_id=contact_id,
        contact_id=current_user_id
    )
    db.contacts.insert_one(reverse_contact.to_dict())
    
    return jsonify({
        "id": contact_id,
        "username": contact_user.get('username')
    }), 201

# Message Routes
@api.route('/messages/<contact_id>', methods=['GET'])
def get_messages(contact_id):
    user_id = request.args.get('userId', '1')  # Default to user 1 for testing
    
    db = get_db()
    messages_data = []
    
    # Find all messages between these two users
    messages = db.messages.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": contact_id},
            {"sender_id": contact_id, "receiver_id": user_id}
        ]
    }).sort("timestamp", 1)
    
    for message in messages:
        sender = db.users.find_one({"_id": message.get('sender_id')})
        sender_username = sender.get('username') if sender else 'Unknown'
        
        messages_data.append({
            "id": str(message.get('_id')),
            "senderId": message.get('sender_id'),
            "senderUsername": sender_username,
            "receiverId": message.get('receiver_id'),
            "content": message.get('content'),
            "ipfsHash": message.get('ipfs_hash'),
            "timestamp": message.get('timestamp').isoformat() if hasattr(message.get('timestamp', ''), 'isoformat') else message.get('timestamp', ''),
            "encrypted": True
        })
    
    return jsonify(messages_data)

@api.route('/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    
    if not data or not data.get('receiverId') or not data.get('content'):
        return jsonify({"message": "Missing required fields"}), 400
    
    sender_id = data.get('senderId', '1')  # Default to user 1 for testing
    receiver_id = data.get('receiverId')
    content = data.get('content')
    ipfs_hash = data.get('ipfsHash')
    
    db = get_db()
    
    # Create the message
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
        ipfs_hash=ipfs_hash
    )
    
    message_id = db.messages.insert_one(message.to_dict()).inserted_id
    
    # Get sender info
    sender = db.users.find_one({"_id": sender_id})
    sender_username = sender.get('username') if sender else 'Unknown'
    
    # Get receiver info
    receiver = db.users.find_one({"_id": receiver_id})
    receiver_username = receiver.get('username') if receiver else 'Unknown'
    
    # Prepare message data for response
    message_data = {
        "id": str(message_id),
        "senderId": sender_id,
        "senderUsername": sender_username,
        "receiverId": receiver_id,
        "receiverUsername": receiver_username,
        "content": content,
        "ipfsHash": ipfs_hash,
        "timestamp": message.timestamp.isoformat() if hasattr(message.timestamp, 'isoformat') else message.timestamp,
        "encrypted": True
    }
    
    return jsonify(message_data), 201

@api.route('/messages/<message_id>/read', methods=['PATCH'])
def mark_message_as_read(message_id):
    db = get_db()
    
    # Update message as read
    db.messages.update_one(
        {"_id": message_id},
        {"$set": {"is_read": True}}
    )
    
    return jsonify({"success": True})