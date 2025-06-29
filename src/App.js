import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Library from './pages/Library';
import Pricing from './pages/Pricing';
import AssistantPage from './pages/AssistantPage';
import LoadingPage from './components/LoadingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AlertDialogDemo } from './components/AlertDialogDemo';
import './App.css';
import './components/InfiniteScroll.css';
import { ThemeProvider, useTheme } from './ThemeContext';

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingPage />;

  return (
    <div className={`app-container ${theme}`}>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/assistant" element={<AssistantPage />} />
        </Routes>
        
        {/* Alert Dialog Demo - You can place this anywhere or remove it */}
        <div className="p-8">
          <h2 className="text-xl font-semibold mb-4">Alert Dialog Test</h2>
          <AlertDialogDemo />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;