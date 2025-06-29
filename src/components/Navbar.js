// src/components/Navbar.js
import React, { useState } from 'react';
// import flexLogo from '../assets/new.png'; // Remove image import
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from '../ThemeContext';

function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogoClick = () => {
    navigate('/');
    window.location.reload(); // Force refresh
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const NavLink = ({ to, children }) => (
    <Link 
      to={to} 
      onClick={closeMobileMenu}
      className={`relative text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-black'} hover:text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-[#34d399] transition-colors duration-200 focus:outline-none after:content-[''] after:block after:h-0.5 after:w-full after:bg-gradient-to-r after:from-[#60a5fa] after:to-[#34d399] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center`}
    >
      {children}
    </Link>
  );

  return (
    <nav className={`navbar fixed-navbar w-full flex items-center justify-between px-4 md:px-8 py-4 ${theme}`}>
      <div className="flex items-center">
        <video
          src={process.env.PUBLIC_URL + '/FLEX.mp4'}
          alt="FLEX.AI Logo"
          style={{ height: '40px', cursor: 'pointer', userSelect: 'none', marginRight: '12px', borderRadius: '8px' }}
          className="md:h-12"
          onClick={handleLogoClick}
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        {/* Theme Toggle Button (left to Home) */}
        <button
          onClick={handleThemeToggle}
          aria-label="Toggle dark mode"
          className="theme-toggle-btn mr-2 flex items-center justify-center focus:outline-none transition-colors duration-200"
          style={{ marginRight: '0.5rem' }}
        >
          {theme === 'dark' ? (
            <Sun size={22} className="text-yellow-400" />
          ) : (
            <Moon size={22} className="text-gray-600" />
          )}
        </button>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/library">Library</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/assistant">Assistant</NavLink>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden p-2 rounded-lg hover:bg-gray-700/20 transition-colors duration-200"
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? (
          <X size={24} className={theme === 'dark' ? 'text-white' : 'text-black'} />
        ) : (
          <Menu size={24} className={theme === 'dark' ? 'text-white' : 'text-black'} />
        )}
      </button>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className={`absolute top-full left-0 right-0 ${theme === 'dark' ? 'bg-black' : 'bg-white'} shadow-lg border-t border-gray-700/30 md:hidden z-50`}>
          <div className="flex flex-col space-y-4 p-4">
            {/* Theme Toggle in mobile menu */}
            <button
              onClick={handleThemeToggle}
              aria-label="Toggle dark mode"
              className="theme-toggle-btn mb-2 flex items-center justify-center focus:outline-none transition-colors duration-200"
              style={{ alignSelf: 'flex-start' }}
            >
              {theme === 'dark' ? (
                <Sun size={22} className="text-yellow-400" />
              ) : (
                <Moon size={22} className="text-gray-600" />
              )}
            </button>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/library">Library</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/assistant">Assistant</NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;