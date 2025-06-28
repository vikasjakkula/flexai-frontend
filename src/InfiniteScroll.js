import React from "react";
import "./InfiniteScroll.css";

function InfiniteScroll() {
  return (
    <div className="scroll-wrapper">
      <div className="scroll-blur-left" />
      <div className="scroll-container">
        <div className="scroll-track">
          <span className="scroll-text">
            Your Brand • Powered by Fitness • Build Muscle • Stay Strong • Keep Going • Push Limits • Train Hard • Repeat • 
          </span>
          <span className="scroll-text">
            Your Brand • Powered by Fitness • Build Muscle • Stay Strong • Keep Going • Push Limits • Train Hard • Repeat • 
          </span>
        </div>
      </div>
      <div className="scroll-blur-right" />
    </div>
  );
}

export default InfiniteScroll;
