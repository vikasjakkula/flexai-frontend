// Import necessary dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create a root element for React to render into
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the main App component inside React's StrictMode
// StrictMode helps identify potential problems in the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Report web vitals for performance monitoring
// You can pass a function to log results or send to an analytics endpoint
reportWebVitals();
