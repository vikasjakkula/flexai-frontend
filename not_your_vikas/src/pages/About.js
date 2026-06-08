// Import necessary dependencies
import React from 'react';
import './About.css';

// About component - displays profile and developer information
const About = () => {
  return (
    // Main container for the about page
    <div className="about">
      {/* Page title */}
      <h1>About Vikas</h1>

      {/* Main content container */}
      <div className="about-content">
        {/* Born section */}
        <div className="about-section">
          <h2>Born</h2>
          <ul>
            <li>4th June 2008</li>
          </ul>
        </div>

        {/* Education section */}
        <div className="about-section">
          <h2>Education</h2>
          <ul>
            <li>Vijay Mary Kindergarten School</li>
            <li>Bhashyam High School</li>
            <li>Nano Jr. College</li>
            <li>NGIT (Osmania University)</li>
          </ul>
        </div>

        {/* What I do section */}
        <div className="about-section">
          <h2>What I Do</h2>
          <ul>
            <li>Engineering student & full-stack developer</li>
            <li>Building real-world web and AI projects</li>
            <li>Grinding daily on code, fitness and discipline</li>
            <li>Sharing the journey across social platforms</li>
          </ul>
        </div>

        {/* Currently Building section */}
        <div className="about-section">
          <h2>Currently Building</h2>
          <ul>
            <li>Full-stack web applications with React, Next.js and Node.js</li>
            <li>API-driven projects integrating external data sources</li>
            <li>Sharpening problem-solving skills through Data Structures & Algorithms</li>
          </ul>
        </div>

        {/* Currently Learning section */}
        <div className="about-section">
          <h2>Currently Learning</h2>
          <ul>
            <li>React.js — component-driven UI architecture</li>
            <li>Node.js & Express — scalable backend services</li>
            <li>MongoDB — flexible NoSQL data modelling</li>
            <li>DSA — algorithmic thinking & optimisation</li>
          </ul>
        </div>

        {/* Tech Stack section */}
        <div className="about-section">
          <h2>Tech Stack</h2>
          <ul>
            <li><strong>Languages:</strong> C, JavaScript</li>
            <li><strong>Frontend:</strong> HTML, CSS, React</li>
            <li><strong>Backend:</strong> Node.js, Express</li>
            <li><strong>Database:</strong> MongoDB</li>
            <li><strong>Tools:</strong> Git, GitHub, VS Code, GitHub Copilot, Cursor</li>
          </ul>
        </div>

        {/* Featured Projects section */}
        <div className="about-section">
          <h2>Featured Projects</h2>
          <ul>
            <li>Search & API integrations — working with live, external datasets</li>
            <li>End-to-end full-stack applications — frontend meets backend</li>
            <li>DSA practice sets — building consistency and logical depth</li>
          </ul>
        </div>

        {/* Vision & Goals section */}
        <div className="about-section">
          <h2>Vision & Goals</h2>
          <ul>
            <li>Grow into a strong software engineer and problem solver</li>
            <li>Contribute meaningfully to open-source communities</li>
            <li>Design and ship impactful AI-powered applications</li>
            <li>Crack Google Summer of Code by 2028</li>
            <li>Evolve into a well-rounded AI engineer</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
