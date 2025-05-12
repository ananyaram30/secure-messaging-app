import os
import pymongo
from flask import g
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db():
    """
    Get a database connection from Flask's g object or create a new one
    """
    if 'db' not in g:
        # In production, use environment variable for MongoDB connection
        mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
        client = MongoClient(mongo_uri)
        
        # Use a specific database for this app
        db_name = os.environ.get('MONGO_DB', 'decsecmsg')
        g.db = client[db_name]
        
        # Create indexes
        create_indexes(g.db)
    
    return g.db

def close_db(e=None):
    """
    Close the database connection at the end of a request
    """
    db = g.pop('db', None)
    
    if db is not None:
        db.client.close()

def create_indexes(db):
    """
    Create necessary indexes for performance
    """
    # Username index for users collection
    db.users.create_index([('username', pymongo.ASCENDING)], unique=True)
    
    # User-Contact index for contacts collection
    db.contacts.create_index([
        ('user_id', pymongo.ASCENDING),
        ('contact_id', pymongo.ASCENDING)
    ], unique=True)
    
    # Timestamp index for messages collection
    db.messages.create_index([('timestamp', pymongo.ASCENDING)])
    
    # Sender-Receiver index for messages collection
    db.messages.create_index([
        ('sender_id', pymongo.ASCENDING),
        ('receiver_id', pymongo.ASCENDING),
        ('timestamp', pymongo.ASCENDING)
    ])

def init_db(app):
    """
    Initialize the database connection and register close_db with the app
    """
    app.teardown_appcontext(close_db)
    
    # Create memory-only database for development if no MongoDB URI provided
    if not os.environ.get('MONGO_URI'):
        print("Using in-memory database for development")
        # In-memory database using a simple dictionary
        class MemoryCollection:
            def __init__(self):
                self.data = {}
                self.counter = 1
            
            def find_one(self, query):
                for _id, item in self.data.items():
                    match = True
                    for key, value in query.items():
                        if key == '_id' and str(value) != str(_id):
                            match = False
                            break
                        elif key != '_id' and item.get(key) != value:
                            match = False
                            break
                    
                    if match:
                        return item.copy()
                
                return None
            
            def find(self, query=None):
                results = []
                
                for _id, item in self.data.items():
                    if not query:
                        results.append(item.copy())
                        continue
                    
                    match = True
                    for key, value in query.items():
                        if key == '$or':
                            or_match = False
                            for or_query in value:
                                or_match_inner = True
                                for or_key, or_value in or_query.items():
                                    if item.get(or_key) != or_value:
                                        or_match_inner = False
                                        break
                                
                                if or_match_inner:
                                    or_match = True
                                    break
                            
                            if not or_match:
                                match = False
                                break
                        elif item.get(key) != value:
                            match = False
                            break
                    
                    if match:
                        results.append(item.copy())
                
                # In-memory sort (simple implementation for timestamp only)
                class Sorter:
                    def sort(self, field, direction=1):
                        if isinstance(field, tuple) and field[0] == 'timestamp':
                            reverse = direction == -1
                            results.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=reverse)
                        return self
                    
                    def limit(self, n):
                        return results[:n]
                    
                    def __iter__(self):
                        return iter(results)
                
                return Sorter()
            
            def insert_one(self, document):
                if '_id' not in document:
                    document['_id'] = str(self.counter)
                    self.counter += 1
                
                self.data[document['_id']] = document.copy()
                
                class Result:
                    @property
                    def inserted_id(self):
                        return document['_id']
                
                return Result()
            
            def update_one(self, query, update):
                item = self.find_one(query)
                
                if item:
                    for key, value in update.get('$set', {}).items():
                        item[key] = value
                    
                    self.data[item['_id']] = item
            
            def create_index(self, keys, **kwargs):
                # No-op for in-memory database
                pass
        
        class MemoryDB:
            def __init__(self):
                self.users = MemoryCollection()
                self.contacts = MemoryCollection()
                self.messages = MemoryCollection()
                self.client = type('client', (), {'close': lambda: None})
        
        # Set up memory database
        g.db = MemoryDB()