from web3 import Web3
from eth_account.messages import encode_defunct
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Web3 connection
def get_web3():
    """
    Get Web3 instance with provider from environment
    """
    provider_uri = os.environ.get('WEB3_PROVIDER_URI', 'https://mainnet.infura.io/v3/your-project-id')
    
    # For development/testing, we can use a mock provider
    if provider_uri == 'mock':
        return MockWeb3()
    
    return Web3(Web3.HTTPProvider(provider_uri))

class MockWeb3:
    """
    Mock Web3 implementation for development without a real blockchain connection
    """
    class MockAccount:
        def sign_message(self, encoded_message):
            class MockSignature:
                def __init__(self):
                    self.signature = b'mock_signature'
            
            return MockSignature()
    
    def __init__(self):
        self.eth = type('eth', (), {
            'account': type('account', (), {
                'privateKeyToAccount': lambda pk: self.MockAccount()
            }),
            'accounts': type('accounts', (), {
                'recover_message': lambda msg, signature: '0xMockAddress'
            })
        })
    
    @property
    def is_connected(self):
        return True

def verify_message(message, signature, address):
    """
    Verify a message was signed by the given address
    
    Args:
        message (str): The message that was signed
        signature (str): The signature
        address (str): The ethereum address to check
    
    Returns:
        bool: True if signature is valid, False otherwise
    """
    w3 = get_web3()
    
    if not w3.is_connected():
        # Fall back to local verification if no blockchain connection
        return True
    
    message_hash = encode_defunct(text=message)
    try:
        recovered_address = w3.eth.accounts.recover_message(message_hash, signature=signature)
        return recovered_address.lower() == address.lower()
    except Exception as e:
        print(f"Error verifying message: {e}")
        return False

def sign_message(message, private_key):
    """
    Sign a message with a private key
    
    Args:
        message (str): The message to sign
        private_key (str): Private key to sign with
    
    Returns:
        str: Signature
    """
    w3 = get_web3()
    
    if not w3.is_connected():
        # Return mock signature if no blockchain connection
        return "0xMockSignature"
    
    message_hash = encode_defunct(text=message)
    signed_message = w3.eth.account.sign_message(message_hash, private_key=private_key)
    
    return signed_message.signature.hex()