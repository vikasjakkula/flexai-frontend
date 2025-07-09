import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';
import { useAuth } from '../contexts/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';


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
  const dropdownRef = useRef(null);

  // Supabase Auth State
  const { user, signOut, loading, error } = useAuth();

  const libraryOutlets = [
    { name: 'Calender', path: '/library/calender' },
    { name: 'Workout Logs', path: '/library/workout-logs' },
    { name: 'Video Library', path: '/library/video-library' },
    { name: 'Form Checker AI', path: '/library/form-checker' },
    { name: 'My Routines', path: '/library/routines' },
    { name: 'Exercise Encyclopedia', path: '/library/exercises' },
  ];

  const handleLogoClick = () => {
    navigate('/');
    window.location.reload();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsMobileLibraryOpen(false);
    setActiveMenu(null);
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

  useEffect(() => { AOS.init(); }, []);

  return (
    <nav role="navigation" className={`navbar fixed-navbar w-full flex items-center justify-between px-4 md:px-8 py-4`}
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
                  className="bg-white rounded-xl overflow-hidden border border-black/[0.2] shadow-xl min-w-[200px]"
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
                  className="bg-white rounded-xl overflow-hidden border border-black/[0.2] shadow-xl min-w-[200px]"
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
        {/* Place this where the user icon should appear, between AI Coach and Google login/logout */}
        <button
          className="mx-2 p-2 rounded-full hover:bg-blue-100"
          onClick={() => navigate('/profile')}
          aria-label="Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-user text-blue-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
      </div>

      {/* User Profile - right corner */}
      <div className="ml-auto flex items-center gap-2 mobile-signin-hide">
        {loading && <span className="text-gray-500">Loading...</span>}
        {error && <span className="text-red-500 text-sm">{error}</span>}
        {user && (
          <div className="flex items-center gap-2 bg-white rounded shadow px-3 py-1">
            {user.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />}
            <span className="font-medium text-gray-700">{user.user_metadata?.name || user.email}</span>
            <button onClick={signOut} className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded">Logout</button>
          </div>
        )}
      </div>

      {/* Hamburger Icon for Mobile Sidebar */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden p-2 rounded-lg hover:bg-gray-700/20 transition-colors duration-200 fixed top-4 right-4 z-[100]"
        aria-label="Toggle sidebar"
        style={{ position: 'fixed', top: 16, right: 16 }}
      >
        {isMobileMenuOpen ? (
          <X size={28} />
        ) : (
          <Menu size={28} />
        )}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`mobile-sidebar fixed top-0 right-0 h-full w-4/5 max-w-xs z-50 flex flex-col`}
            style={{ zIndex: 9999 }}
          >
            <div className="flex flex-col space-y-4 p-6 pt-16 text-left">
              <Link 
                to="/" 
                className={`animated-nav-link ${isActiveRoute('/') && location.pathname === '/' ? 'active' : ''}`}
                onClick={closeMobileMenu}
                style={{ textAlign: 'left' }}
              >
                Home
              </Link>
              
              {/* Mobile Library Section */}
              <div className="w-full text-left">
                <div 
                  className={`animated-nav-link library-dropdown-trigger mobile ${isLibraryActive() ? 'active' : ''}`}
                  onClick={toggleMobileLibrary}
                  style={{ textAlign: 'left' }}
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
                          style={{ textAlign: 'left' }}
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
                style={{ textAlign: 'left' }}
              >
                Pricing
              </Link>
              
              {/* Contact Dropdown */}
              <div className="w-full text-left">
                <div
                  className={`animated-nav-link library-dropdown-trigger mobile ${isActiveRoute('/contact') ? 'active' : ''}`}
                  onClick={() => setActiveMenu(activeMenu === 'contact' ? null : 'contact')}
                  style={{ textAlign: 'left' }}
                >
                  <span>Contact</span>
                  <ChevronDown 
                    size={16} 
                    className={`ml-1 transition-transform duration-300 ${activeMenu === 'contact' ? 'rotate-180' : ''}`} 
                  />
                </div>
                
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
                        style={{ textAlign: 'left' }}
                      >
                        Report Bugs
                      </Link>
                      <Link
                        to="/contact/ask-questions"
                        className={`mobile-dropdown-item ${isActiveRoute('/contact/ask-questions') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                        style={{ textAlign: 'left' }}
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
                style={{ textAlign: 'left' }}
              >
                Community
              </Link>
              {/* Nutrition Button */}
              <Link 
                to="/nutrition" 
                className={`mobile-dropdown-item ${isActiveRoute('/nutrition') ? 'active' : ''}`}
                onClick={closeMobileMenu}
                style={{ textAlign: 'left' }}
              >
                Nutrition
              </Link>
              {/* AI Coach (replaces Assistant) */}
              <Link 
                to="/aicoach" 
                className={`mobile-dropdown-item ${isActiveRoute('/aicoach') ? 'active' : ''}`}
                onClick={closeMobileMenu}
                style={{ textAlign: 'left' }}
              >
                AI Coach
              </Link>
            </div>
            {/* Close button inside sidebar for convenience */}
            <button
              onClick={closeMobileMenu}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-700/20 transition-colors duration-200"
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>
            {/* Mobile-only user profile card at bottom if logged in */}
            {user && (
              <div className="mobile-signin-bottom">
                <div className="flex items-center gap-2 bg-white rounded shadow px-3 py-2">
                  {user.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />}
                  <span className="font-medium text-gray-700 flex-1">{user.user_metadata?.name || user.email}</span>
                  <button onClick={signOut} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Logout</button>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Make GIF larger on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .centered-nav-links { display: none !important; }
          .navbar video {
            height: 70px !important;
            width: auto !important;
            max-width: 90vw;
          }
        }
      `}</style>

     
    </nav>
  );
}

export default Navbar;
