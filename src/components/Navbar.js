import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import './Navbar.css';

const transition = {
  type: "spring",
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMobileLibraryOpen, setIsMobileLibraryOpen] = useState(false);
  const { theme } = useTheme();
  const dropdownRef = useRef(null);

  const libraryOutlets = [
    { name: 'Button 1', path: '/library/button1' },
    { name: 'Button 2', path: '/library/button2' },
    { name: 'Button 3', path: '/library/button3' },
    { name: 'Button 4', path: '/library/button4' },
    { name: 'Button 5', path: '/library/button5' },
  ];

  const handleLogoClick = () => {
    navigate('/');
    window.location.reload();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileLibraryOpen(false);
    setActiveMenu(null);
  };

  const toggleMobileLibrary = () => {
    setIsMobileLibraryOpen(!isMobileLibraryOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isLibraryActive = () => {
    return location.pathname.startsWith('/library');
  };

  return (
    <nav className={`navbar fixed-navbar w-full flex items-center justify-between px-4 md:px-8 py-4 ${theme}`}
         onMouseLeave={() => setActiveMenu(null)}>
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
      <div className="hidden md:flex items-center space-x-6 centered-nav-links">
        {/* Home */}
        <Link 
          to="/" 
          className={`animated-nav-link ${isActiveRoute('/') && location.pathname === '/' ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Home
        </Link>

        {/* Library with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.div
            className={`animated-nav-link library-dropdown-trigger ${isLibraryActive() ? 'active' : ''}`}
            onMouseEnter={() => setActiveMenu('library')}
          >
            <span>Library</span>
            <ChevronDown 
              size={16} 
              className={`ml-1 transition-transform duration-300 ${activeMenu === 'library' ? 'rotate-180' : ''}`} 
            />
          </motion.div>

          <AnimatePresence>
            {activeMenu === 'library' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 10 }}
                transition={transition}
                className="absolute top-[calc(100%_+_0.5rem)] left-1/2 transform -translate-x-1/2 z-50"
              >
                <motion.div
                  layoutId="active-menu"
                  className="bg-white dark:bg-black backdrop-blur-sm rounded-xl overflow-hidden border border-black/[0.2] dark:border-white/[0.2] shadow-xl min-w-[200px]"
                >
                  <motion.div layout className="p-2">
                    {libraryOutlets.map((outlet, index) => (
                      <Link
                        key={index}
                        to={outlet.path}
                        className={`dropdown-item ${isActiveRoute(outlet.path) ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                      >
                        {outlet.name}
                      </Link>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pricing */}
        <Link 
          to="/pricing" 
          className={`animated-nav-link ${isActiveRoute('/pricing') ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Pricing
        </Link>

        {/* Contact Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <motion.div
            className={`animated-nav-link library-dropdown-trigger ${isActiveRoute('/contact') ? 'active' : ''}`}
            onMouseEnter={() => setActiveMenu('contact')}
          >
            <span>Contact</span>
            <ChevronDown 
              size={16} 
              className={`ml-1 transition-transform duration-300 ${activeMenu === 'contact' ? 'rotate-180' : ''}`} 
            />
          </motion.div>

          <AnimatePresence>
            {activeMenu === 'contact' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 10 }}
                transition={transition}
                className="absolute top-[calc(100%_+_0.5rem)] left-1/2 transform -translate-x-1/2 z-50"
              >
                <motion.div
                  layoutId="active-menu"
                  className="bg-white dark:bg-black backdrop-blur-sm rounded-xl overflow-hidden border border-black/[0.2] dark:border-white/[0.2] shadow-xl min-w-[200px]"
                >
                  <motion.div layout className="p-2">
                    <Link
                      to="/contact/report-bugs"
                      className={`dropdown-item ${isActiveRoute('/contact/report-bugs') ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      Report Bugs
                    </Link>
                    <Link
                      to="/contact/ask-questions"
                      className={`dropdown-item ${isActiveRoute('/contact/ask-questions') ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      Ask Questions
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Community Button */}
        <Link 
          to="/community" 
          className={`animated-nav-link ${isActiveRoute('/community') ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Community
        </Link>
        {/* Nutrition Button */}
        <Link 
          to="/nutrition" 
          className={`animated-nav-link ${isActiveRoute('/nutrition') ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Nutrition
        </Link>
        {/* AI Coach (replaces Assistant) */}
        <Link 
          to="/aicoach" 
          className={`animated-nav-link ${isActiveRoute('/aicoach') ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          AI Coach
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`mobile-menu ${theme === 'dark' ? 'bg-black' : 'bg-white'} shadow-lg border-t border-gray-700/30 md:hidden z-50`}
          >
            <div className="flex flex-col space-y-4 p-4">
              <Link 
                to="/" 
                className={`animated-nav-link ${isActiveRoute('/') && location.pathname === '/' ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              
              {/* Mobile Library Section */}
              <div className="w-full">
                <div 
                  className={`animated-nav-link library-dropdown-trigger mobile ${isLibraryActive() ? 'active' : ''}`}
                  onClick={toggleMobileLibrary}
                >
                  <span>Library</span>
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transition-transform duration-300 ${isMobileLibraryOpen ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                <AnimatePresence>
                  {isMobileLibraryOpen && (
                    <motion.div
                      initial={{ maxHeight: 0, opacity: 0 }}
                      animate={{ maxHeight: 300, opacity: 1 }}
                      exit={{ maxHeight: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mobile-library-dropdown overflow-hidden"
                    >
                      {libraryOutlets.map((outlet, index) => (
                        <Link
                          key={index}
                          to={outlet.path}
                          className={`mobile-dropdown-item ${isActiveRoute(outlet.path) ? 'active' : ''}`}
                          onClick={closeMobileMenu}
                        >
                          {outlet.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link 
                to="/pricing" 
                className={`animated-nav-link ${isActiveRoute('/pricing') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Pricing
              </Link>
              
              {/* Contact Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.div
                  className={`animated-nav-link library-dropdown-trigger mobile ${isActiveRoute('/contact') ? 'active' : ''}`}
                  onMouseEnter={() => setActiveMenu('contact')}
                >
                  <span>Contact</span>
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transition-transform duration-300 ${activeMenu === 'contact' ? 'rotate-180' : ''}`} 
                  />
                </motion.div>
                
                <AnimatePresence>
                  {activeMenu === 'contact' && (
                    <motion.div
                      initial={{ maxHeight: 0, opacity: 0 }}
                      animate={{ maxHeight: 300, opacity: 1 }}
                      exit={{ maxHeight: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mobile-library-dropdown overflow-hidden"
                    >
                      <Link
                        to="/contact/report-bugs"
                        className={`mobile-dropdown-item ${isActiveRoute('/contact/report-bugs') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                      >
                        Report Bugs
                      </Link>
                      <Link
                        to="/contact/ask-questions"
                        className={`mobile-dropdown-item ${isActiveRoute('/contact/ask-questions') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                      >
                        Ask Questions
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Community Button */}
              <Link 
                to="/community" 
                className={`mobile-dropdown-item ${isActiveRoute('/community') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Community
              </Link>
              {/* Nutrition Button */}
              <Link 
                to="/nutrition" 
                className={`mobile-dropdown-item ${isActiveRoute('/nutrition') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Nutrition
              </Link>
              {/* AI Coach (replaces Assistant) */}
              <Link 
                to="/aicoach" 
                className={`mobile-dropdown-item ${isActiveRoute('/aicoach') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                AI Coach
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
