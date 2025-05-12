import React from 'react';

const WhyUseIt = () => {
  return (
    <section id="why-use-it" className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Use DecSecMsg</h2>
        
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <svg 
              viewBox="0 0 800 600" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto rounded-lg shadow-md"
            >
              <rect width="800" height="600" fill="#f8f9fa" />
              <path d="M400,150 C250,150 150,250 150,400 C150,550 250,650 400,650 C550,650 650,550 650,400 C650,250 550,150 400,150 Z" fill="#4f46e5" fillOpacity="0.1" />
              <circle cx="400" cy="300" r="120" fill="#4f46e5" fillOpacity="0.2" />
              <path d="M320,300 L400,360 L480,300 L400,240 Z" fill="#4f46e5" />
              <rect x="350" y="250" width="100" height="150" rx="10" fill="white" stroke="#4f46e5" strokeWidth="3" />
              <rect x="370" y="280" width="60" height="10" rx="5" fill="#4f46e5" fillOpacity="0.6" />
              <rect x="370" y="300" width="60" height="10" rx="5" fill="#4f46e5" fillOpacity="0.6" />
              <rect x="370" y="320" width="60" height="10" rx="5" fill="#4f46e5" fillOpacity="0.6" />
              <path d="M410,380 L420,370 L430,380 L420,390 Z" fill="#4f46e5" />
            </svg>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="text-primary mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Unmatched Privacy</h3>
                <p className="text-gray-600">
                  Unlike traditional messaging apps, we don't collect your data or metadata. Your conversations remain truly private.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-primary mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="3" y1="3" x2="21" y2="21" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Backdoors</h3>
                <p className="text-gray-600">
                  Our open-source code ensures there are no hidden backdoors. The security can be verified by anyone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-primary mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No Central Server Vulnerability</h3>
                <p className="text-gray-600">
                  Decentralized architecture means there's no central point of failure or data breach risk.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-primary mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Complete Control</h3>
                <p className="text-gray-600">
                  You own your encryption keys and identity, giving you complete control over your digital communications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUseIt;