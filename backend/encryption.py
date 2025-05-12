import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256

def generate_key_pair():
    """
    Generate a new RSA key pair
    
    Returns:
        tuple: (private_key, public_key) as PEM-encoded strings
    """
    # Generate a 2048-bit RSA key pair
    key = RSA.generate(2048)
    
    # Export private and public keys in PEM format
    private_key = key.export_key().decode('utf-8')
    public_key = key.publickey().export_key().decode('utf-8')
    
    return private_key, public_key

def encrypt_message(message, public_key_pem):
    """
    Encrypt a message using the recipient's public key
    
    Args:
        message (str): The message to encrypt
        public_key_pem (str): Recipient's public key in PEM format
    
    Returns:
        str: Base64-encoded encrypted message
    """
    # Import public key
    recipient_key = RSA.import_key(public_key_pem)
    
    # Create cipher
    cipher = PKCS1_OAEP.new(recipient_key)
    
    # Encrypt the message
    encrypted_msg = cipher.encrypt(message.encode('utf-8'))
    
    # Return base64 encoded encrypted message
    return base64.b64encode(encrypted_msg).decode('utf-8')

def decrypt_message(encrypted_message, private_key_pem):
    """
    Decrypt a message using the recipient's private key
    
    Args:
        encrypted_message (str): Base64-encoded encrypted message
        private_key_pem (str): Recipient's private key in PEM format
    
    Returns:
        str: Decrypted message
    """
    # Decode from base64
    encrypted_bytes = base64.b64decode(encrypted_message)
    
    # Import private key
    private_key = RSA.import_key(private_key_pem)
    
    # Create cipher
    cipher = PKCS1_OAEP.new(private_key)
    
    # Decrypt the message
    decrypted_msg = cipher.decrypt(encrypted_bytes)
    
    return decrypted_msg.decode('utf-8')

def sign_message(message, private_key_pem):
    """
    Sign a message using the sender's private key
    
    Args:
        message (str): The message to sign
        private_key_pem (str): Sender's private key in PEM format
    
    Returns:
        str: Base64-encoded signature
    """
    # Import private key
    private_key = RSA.import_key(private_key_pem)
    
    # Create a hash of the message
    h = SHA256.new(message.encode('utf-8'))
    
    # Sign the hash
    signature = pkcs1_15.new(private_key).sign(h)
    
    # Return base64 encoded signature
    return base64.b64encode(signature).decode('utf-8')

def verify_signature(message, signature, public_key_pem):
    """
    Verify a message signature using the sender's public key
    
    Args:
        message (str): The original message
        signature (str): Base64-encoded signature
        public_key_pem (str): Sender's public key in PEM format
    
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        # Decode signature from base64
        signature_bytes = base64.b64decode(signature)
        
        # Import public key
        public_key = RSA.import_key(public_key_pem)
        
        # Create a hash of the message
        h = SHA256.new(message.encode('utf-8'))
        
        # Verify the signature
        pkcs1_15.new(public_key).verify(h, signature_bytes)
        
        return True
    except (ValueError, TypeError):
        return False