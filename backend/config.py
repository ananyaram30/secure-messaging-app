import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_ENV') == 'development'
    
    # MongoDB configuration
    MONGO_URI = os.environ.get('MONGO_URI')
    MONGO_DB = os.environ.get('MONGO_DB', 'decsecmsg')
    
    # IPFS configuration
    IPFS_API_URL = os.environ.get('IPFS_API_URL', 'https://ipfs.infura.io:5001/api/v0')
    IPFS_GATEWAY = os.environ.get('IPFS_GATEWAY', 'https://ipfs.io/ipfs')
    
    # Web3 configuration
    WEB3_PROVIDER_URI = os.environ.get('WEB3_PROVIDER_URI', 'https://mainnet.infura.io/v3/your-project-id')
    
    # Session configuration
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours in seconds