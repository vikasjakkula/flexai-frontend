import React from 'react';
import { useNavigate } from 'react-router-dom';
import './add.css';

const AnimatedButtons = () => {
  const navigate = useNavigate();

  // Ripple effect on click
  const handleRipple = (e, route) => {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
    circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
    circle.classList.add('ripple');
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);

    // Navigate after a short delay for ripple effect
    setTimeout(() => {
      navigate(route);
    }, 200);
  };

  // Magnetic hover effect
  const handleMouseMove = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.05)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <div className="animated-btns-container">
      <button
        className="magnetic-btn neon"
        onClick={(e) => handleRipple(e, '/library')}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        [ START NOW ]
      </button>
      <button
        className="magnetic-btn neon"
        onClick={(e) => handleRipple(e, '/library')}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        [ JOIN AS A TRAINER ]
      </button>
      <button
        className="magnetic-btn neon"
        onClick={(e) => handleRipple(e, '/pricing')}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        [ EXPLORE PLANS ]
      </button>
    </div>
  );
};

export default AnimatedButtons;