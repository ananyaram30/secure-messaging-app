from datetime import datetime
from bson.objectid import ObjectId

class User:
    def __init__(self, username, public_key, _id=None, created_at=None):
        self.id = _id if _id else str(ObjectId())
        self.username = username
        self.public_key = public_key
        self.created_at = created_at if created_at else datetime.now()
    
    def to_dict(self):
        return {
            "_id": self.id,
            "username": self.username,
            "public_key": self.public_key,
            "created_at": self.created_at
        }

class Contact:
    def __init__(self, user_id, contact_id, _id=None, created_at=None):
        self.id = _id if _id else str(ObjectId())
        self.user_id = user_id
        self.contact_id = contact_id
        self.created_at = created_at if created_at else datetime.now()
    
    def to_dict(self):
        return {
            "_id": self.id,
            "user_id": self.user_id,
            "contact_id": self.contact_id,
            "created_at": self.created_at
        }

class Message:
    def __init__(self, sender_id, receiver_id, content, ipfs_hash=None, _id=None, 
                 timestamp=None, is_read=False):
        self.id = _id if _id else str(ObjectId())
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.content = content
        self.ipfs_hash = ipfs_hash
        self.timestamp = timestamp if timestamp else datetime.now()
        self.is_read = is_read
    
    def to_dict(self):
        return {
            "_id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "content": self.content,
            "ipfs_hash": self.ipfs_hash,
            "timestamp": self.timestamp,
            "is_read": self.is_read
        }