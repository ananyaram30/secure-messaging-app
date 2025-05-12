from functools import wraps
from flask import request, jsonify, session, g
from database import get_db

def get_current_user():
    """
    Get the current authenticated user from session
    """
    if 'user_id' in session:
        db = get_db()
        return db.users.find_one({"_id": session['user_id']})
    return None

def require_auth(f):
    """
    Decorator to require authentication for a route
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check if user is authenticated
        current_user = get_current_user()
        
        if not current_user:
            return jsonify({"message": "Authentication required"}), 401
        
        # Add current user to g for the request
        g.current_user = current_user
        
        return f(*args, **kwargs)
    
    return decorated

def authenticate_user(username, private_key_proof):
    """
    Authenticate a user with username and private key proof
    
    In a real implementation, this would verify a signature to prove
    the user possesses the private key corresponding to their public key.
    
    For this example, we're using a simplified approach.
    """
    db = get_db()
    user = db.users.find_one({"username": username})
    
    if not user:
        return None
    
    # In a real app, verify the private key proof against the stored public key
    # For this example, we're skipping this step and assuming it's valid
    
    return user