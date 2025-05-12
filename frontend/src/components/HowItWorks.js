import React from 'react';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Your Account</h3>
            <p className="text-gray-600">
              Register with just a username. We'll generate a unique cryptographic key pair for you. No email or phone number required.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Secure Your Key</h3>
            <p className="text-gray-600">
              Save your private key securely. It's used to decrypt messages and is never stored on our servers. If lost, it cannot be recovered.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Start Messaging</h3>
            <p className="text-gray-600">
              Add contacts using their username and public key. Send end-to-end encrypted messages that only the recipient can decrypt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;