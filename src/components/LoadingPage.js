import React from "react";
import "./LoadingPage.css";

const LoadingPage = () => {
  return (
    <div className="loading-container">
      <div className="loading-blur">
        <div className="loading-spinner"></div>
        <h2 className="loading-text">Loading your experience...</h2>
      </div>
    </div>
  );
};

export default LoadingPage;
