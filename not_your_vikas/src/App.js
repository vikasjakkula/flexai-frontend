// Import necessary dependencies from React and React Router
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Follow from './pages/Follow';
import { ThemeProvider } from './context/ThemeContext';
import SEO from './components/SEO';
import { Analytics } from "@vercel/analytics/react";
import './App.css';

// Component added by Ansh - github.com/ansh-dhanani
import GradualBlur from './ui/blur.jsx';

// Main App component that sets up routing
function App() {
  return (
    // ThemeProvider wraps the entire application
    <ThemeProvider>
      <Analytics debug={false} />
      {/* Router component wraps the entire application to enable routing */}
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <HelmetProvider>
          <SEO />
          <div className="App">
            <Navbar />
            <main className="main-content">
              {/* Routes component defines all available routes in the application */}
              <Routes>
                {/* MainLayout route acts as a parent route with nested child routes */}
                <Route path="/" element={<Home />} />

                {/* About page route - shown when path is "/about" */}
                <Route path="/about" element={<About />} />

                {/* Follow page route - shown when path is "/follow" */}
                <Route path="/follow" element={<Follow />} />
              </Routes>
            </main>
            <GradualBlur
              preset="subtle"
              target="page"
              position="top"
              style={{ top: '76px' }}
            />
            <GradualBlur preset="subtle" target="page" />
          </div>
        </HelmetProvider>
      </Router>
    </ThemeProvider>
  );
}

// Export the App component as the default export
export default App;
