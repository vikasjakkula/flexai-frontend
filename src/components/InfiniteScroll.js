import React from "react";
import "./InfiniteScroll.css";

const InfiniteScroll = () => {
  return (
    <div className="scroll-wrapper">
      {/* Left Blur */}
      <div className="scroll-blur-left"></div>

      {/* Scrolling Text */}
      <div className="scroll-container">
        <div className="scroll-track">
          <div className="scroll-text">
            Train hard. Eat clean. Stay consistent. &nbsp;&nbsp;&nbsp;
            No pain, no progress. &nbsp;&nbsp;&nbsp;
            Results don't come easy — you earn them. &nbsp;&nbsp;&nbsp;
            Sweat is fat crying. &nbsp;&nbsp;&nbsp;
            Lift. Rest. Repeat. &nbsp;&nbsp;&nbsp;
            Progress over perfection. &nbsp;&nbsp;&nbsp;
            You vs You — win every day. &nbsp;&nbsp;&nbsp;
          </div>
          <div className="scroll-text">
            Train hard. Eat clean. Stay consistent. &nbsp;&nbsp;&nbsp;
            No pain, no progress. &nbsp;&nbsp;&nbsp;
            Results don't come easy — you earn them. &nbsp;&nbsp;&nbsp;
            Sweat is fat crying. &nbsp;&nbsp;&nbsp;
            Lift. Rest. Repeat. &nbsp;&nbsp;&nbsp;
            Progress over perfection. &nbsp;&nbsp;&nbsp;
            You vs You — win every day.
          </div>
        </div>
      </div>

      {/* Right Blur */}
      <div className="scroll-blur-right"></div>
    </div>
  );
};

export default InfiniteScroll;
