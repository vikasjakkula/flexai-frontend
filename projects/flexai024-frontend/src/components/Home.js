import React from 'react';
import SEO from './SEO';

const Home = () => {
  return (
    <>
      <SEO 
        title="Vikas's Blog - Home | React Developer & Tech Enthusiast"
        description="Welcome to Vikas's blog - A space for sharing knowledge about React development, full-stack programming, and game development. Discover tutorials, insights, and coding adventures."
        keywords="React Developer, Full Stack Development, Game Development, Web Development, Programming Blog, Tech Tutorials, Coding Tips, Developer Portfolio"
      />
      <div className="home-container">
        <h1>Welcome to My Blog</h1>
        <p>Explore my journey in tech and development</p>
      </div>
    </>
  );
};

export default Home; 