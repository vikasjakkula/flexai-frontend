// src/components/Navbar.js
import React, { useState } from 'react';
// import flexLogo from '../assets/new.png'; // Remove image import
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";

function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

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
      
      {/* Desktop Navigation with shadcn/ui navigation-menu */}
      <div className="hidden md:flex items-center">
        <NavigationMenu>
          <NavigationMenuList className="gap-6">
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/" onClick={closeMobileMenu}>Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/library" onClick={closeMobileMenu}>Library</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/pricing" onClick={closeMobileMenu}>Pricing</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/assistant" onClick={closeMobileMenu}>Assistant</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
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
            <NavigationMenu>
              <NavigationMenuList className="gap-4">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/" onClick={closeMobileMenu}>Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/library" onClick={closeMobileMenu}>Library</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/pricing" onClick={closeMobileMenu}>Pricing</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/assistant" onClick={closeMobileMenu}>Assistant</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;