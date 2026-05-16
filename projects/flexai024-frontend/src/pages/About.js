// Import necessary dependencies
import React from 'react';
import './About.css';

// About component - displays company/team information
const About = () => {
  return (
    // Main container for the about page
    <div className="about">
      {/* Page title */}
      <h1>About Vikas!</h1>
      
      {/* Main content container */}
      <div className="about-content">
        {/* Mission section */}
        <div className="about-section">
          <h2>Born</h2>
          <p>
            <li>4th June 2008</li>
          </p>
        </div>

        {/* Team section */}
        <div className="about-section">
          <h2>Education</h2>
          <p>
            <li>Vijay Mary Kindergarten School</li>
            <li>Bhashyam high school</li>
            <li>Nano jr.cllg</li>
            <li>NGIT ( Osmania University )</li>
          </p>
        </div>

        {/* Technology stack section */}
        <div className="about-section">
          <h2>What I do?</h2>
          {/* List of technologies used */}
          <ul>
            <li>Coding</li>
            <li>Gaming</li>
            <li>Student</li>
            <li>Gym</li>
            <li>Workout</li>
            <li>Social Media</li>
            <li>Repeat</li>
          </ul>
        </div>

        {/* Passion section */}
        <div className="about-section">
          <h2>Passion</h2>
          <ul>
            <li>Building apps from scratch</li>
            <li>Exploring React & Full Stack development</li>
            <li>Game development (especially car racing games)</li>
            <li>3D design using Blender lol (not good at it)</li>
          </ul>
        </div>

        {/* Current Goals section */}
        <div className="about-section">
          <h2>Current Goals</h2>
          <ul>
            <li>Master React, Node.js, Full Stack</li>
            <li>Build a full CRUD dashboard with sidebar navigation</li>
            <li>Publish my first game project inspired by "Night City Racing"</li>
            <li>Launch my own professional portfolio website</li> 
            <li></li>
          </ul>
        </div>

        {/* Fun Facts section */}
        <div className="about-section">
          <h2>Fun Facts</h2>
          <ul>
            <li>I believe coding is like solving a puzzle — fun and powerful</li>
            <li>I'm inspired by creators who build in public (Brother)</li>
            <li>One day, I want to create something that helps thousands of beginners like me</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About; 