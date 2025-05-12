import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ transparent = false }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMessaging = location.pathname === "/chat";

  return (
    <header className={transparent ? "bg-transparent" : "bg-white shadow-sm"}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center gap-2 text-primary font-semibold text-xl">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-6 h-6"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            DecSecMsg
          </Link>
          
          {!isMessaging && (
            <>
              <nav className="hidden md:flex space-x-6">
                <Link 
                  to="/" 
                  className={`font-medium ${location.pathname === "/" ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Home
                </Link>
                {user && (
                  <Link 
                    to="/chat" 
                    className={`font-medium ${location.pathname === "/chat" ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Messages
                  </Link>
                )}
              </nav>
              
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="hidden md:inline-block px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="hidden md:inline-block px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition"
                    >
                      Log In
                    </Link>
                    <Link 
                      to="/register" 
                      className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
          
          <button 
            type="button" 
            className="md:hidden text-gray-500 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="w-6 h-6"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;