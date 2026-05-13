// Import necessary dependencies
import React from 'react';
import './Home.css';

// Home component
const Home = () => {
  return (
    <div className="home">
      <div className="home-content">
        <h1>Welcome To My Blog</h1>
        <img
          src="/Dp.png"
          alt="Dp"
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '60%',
            objectFit: 'cover',
            display: 'block',
            margin: '20px auto',
          }}
        />
       <p>Myself Vikas Yadav</p>
        <p>I am 17yr's old </p>

        <div className="features-container ">
          <div className="features">
            <div className="feature-card">
             <div> 
              <h2>School</h2>
              <p>Bhashyam high school</p>
              <p>2021-2023</p>
            </div>
            <div>
              <h2>Intermediate</h2>
              <p>Nano jr.cllg</p>
              <p>2023-2025</p>
            </div>
          </div>
            <div className="feature-card">
              <h2>Engineering</h2>
              <p>NGIT i.e,Neil Gogte Institute of Technology</p>
              <p>2025-2029</p>
            </div>
            <div className="feature-card">
              <h2>Hustle Mode</h2>
              <p>Start grow Inverst !</p>
              <p>2029-2033</p>
            </div>
          </div>
          <div className="feature-card" style={{ marginTop: '3rem' }}>
            <h2>What&apos;s Next?</h2>
            <p>2035+</p>
            <p>Build impactful tech solutions, that accuall solve a problem</p>
            <p>adapt the environment and moveon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
