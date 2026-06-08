// Import necessary dependencies from React and React Router
import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import './MainLayout.css';

// MainLayout component that provides the common layout structure for all pages
const MainLayout = () => {
  const navigate = useNavigate();

  const handleBlogClick = () => {
    navigate('/');
  };

  return (
    // Main container div that wraps the entire layout
    <div className="main-layout">
      {/* Navigation bar component */}
      <nav className="main-nav">
        {/* Left side - Blog text */}
        <div className="nav-left">
          <Link to="/" className="blog-title" onClick={handleBlogClick}>Blog</Link>
        </div>

        {/* Right side navigation links */}
        <div className="nav-right">
          {/* Home page link */}
          <Link to="/" className="nav-link">Home</Link>
          {/* About page link */}
          <Link to="/about" className="nav-link">About</Link>
          {/* Contact page link */}
          <Link to="/contact" className="nav-link">Contact</Link>
          {/* Follow page link */}
          {/* Hero page link */}
          <Link to="/follow" className="nav-link">Follow</Link>
        </div>
      </nav>

      {/* Main content area where child routes will be rendered */}
      <main className="main-content">
        {/* Outlet component renders the child route components */}
        <Outlet />
      </main>
    </div>
  );
};

// Export the MainLayout component as the default export
export default MainLayout; 