import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Library from './pages/Library';
import Pricing from './pages/Pricing';
import AssistantPage from './pages/AssistantPage';
import LoadingPage from './components/LoadingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';
import './components/InfiniteScroll.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingPage />;

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main style={{ paddingTop: '80px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/assistant" element={<AssistantPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
