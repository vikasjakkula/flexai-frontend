// src/components/Navbar.js
import React, { useEffect, useState } from 'react';
// import flexLogo from '../assets/new.png'; // Remove image import
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    navigate('/');
    window.location.reload(); // Force refresh
  };

  return (
    <nav className={`navbar fixed-navbar w-full flex items-center justify-between px-8 py-4${scrolled ? ' navbar-visible' : ''}`}>
      <div className="flex items-center">
        <video
          src={process.env.PUBLIC_URL + '/FLEX.mp4'}
          alt="FLEX.AI Logo"
          style={{ height: '48px', cursor: 'pointer', userSelect: 'none', marginRight: '12px', borderRadius: '8px' }}
          onClick={handleLogoClick}
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
      <div className="flex items-center space-x-8">
        <Link to="/" className="relative text-lg font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-[#1b9df3] to-[#1b9df3] transition-colors duration-200 focus:outline-none after:content-[''] after:block after:h-0.5 after:w-full after:bg-gradient-to-r after:from-[#1b9df3] after:to-[#1b9df3] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center">
          Home
        </Link>
        <Link to="/library" className="relative text-lg font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-[#1b9df3] to-[#1b9df3] transition-colors duration-200 focus:outline-none after:content-[''] after:block after:h-0.5 after:w-full after:bg-gradient-to-r after:from-[#1b9df3] after:to-[#1b9df3] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center">
          Library
        </Link>
        <Link to="/pricing" className="relative text-lg font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-[#1b9df3] to-[#1b9df3] transition-colors duration-200 focus:outline-none after:content-[''] after:block after:h-0.5 after:w-full after:bg-gradient-to-r after:from-[#1b9df3] after:to-[#1b9df3] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center">
          Pricing
        </Link>
        <Link to="/assistant" className="relative text-lg font-medium text-gray-800 hover:text-transparent bg-clip-text bg-gradient-to-r from-[#1b9df3] to-[#1b9df3] transition-colors duration-200 focus:outline-none after:content-[''] after:block after:h-0.5 after:w-full after:bg-gradient-to-r after:from-[#1b9df3] after:to-[#1b9df3] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center">
          Assistant
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
