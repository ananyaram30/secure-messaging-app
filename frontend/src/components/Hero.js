import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section id="hero" className="bg-primary text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Decentralized Secure Messaging
        </h1>
        <p className="text-xl opacity-90 mb-10">
          Private. Decentralized. Blockchain-based.
        </p>
        <Link 
          to="/register" 
          className="inline-block px-8 py-3 bg-white text-primary font-medium rounded-md hover:bg-gray-100 transition"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
};

export default Hero;