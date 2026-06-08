import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close menu when clicking a link
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isDarkMode ? 'dark' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src={`${process.env.PUBLIC_URL}/image.png`} alt="Vikas Yadav" className="logo-img" />
        </Link>

        {/* Desktop Menu */}
        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          </li>
          <li>
            <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>
          </li>
          <li>
            <Link to="/follow" className="nav-link" onClick={closeMenu}>Follow</Link>
          </li>
        </ul>

        {/* Controls */}
        <div className="nav-controls">
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>

          <button className="mobile-menu-icon" onClick={toggleMenu}>
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;