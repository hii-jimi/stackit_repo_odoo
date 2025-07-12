import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

function Header() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      alert('Failed to log out: ' + error.message);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-white text-3xl font-extrabold tracking-wide hover:text-pink-400 transition duration-300">
          StackIt
        </Link>
        <nav className="flex items-center space-x-8 text-white font-semibold">
          <Link to="/" className="hover:text-pink-400 transition duration-300">
            Home
          </Link>
          {currentUser && <NotificationBell />}
          {currentUser ? (
            <>
              <Link to="/ask" className="hover:text-pink-400 transition duration-300">
                Ask Question
              </Link>
              <button
                onClick={handleLogout}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-pink-400 transition duration-300">
                Login
              </Link>
              <Link to="/signup" className="hover:text-pink-400 transition duration-300">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
