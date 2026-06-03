import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about">
      <h1>About Vikas!</h1>
      <div className="about-content">
        <div className="about-section">
          <h2>Born</h2>
          <p>
            <li>4th June 2008</li>
          </p>
        </div>
        <div className="about-section">
          <h2>Education</h2>
          <p>
            <li>Vijay Mary kindergarten schools </li>
            <li>Bhashyam high school</li>
            <li>Nano jr.cllg</li>
            <li>NGIT ( Osmania University )</li>
          </p>
        </div>
        <div className="about-section">
          <h2>What I do?</h2>
          <ul>
            <li>Student</li>
            <li>Gamer</li>
            <li>Projects</li>
            <li>Gym</li>
            <li>AI enthusiast</li>
            <li>Music</li>
            <li>Travel</li>
            <li>Social Media</li>
            <li>Repeat...</li>
          </ul>
        </div>
        <div className="about-section">
          <h2>Passion</h2>
          <ul>
            <li>Building apps from scratch</li>
            <li>Solving a specific problem that can be automated with ai</li>
            <li>ai figureout distribution</li>
            <li>read official docs helping me to understand teckslack</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About; 