import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "Jakkula Vikas Yadav - Full Stack Developer & Tech Blogger",
  description = "Jakkula Vikas Yadav is a Full Stack Developer specializing in React, Node.js, and Game Development. Explore my portfolio, tech blog, and coding tutorials. Connect with me on GitHub, LinkedIn, Reddit, and X (Twitter).",
  keywords = "Jakkula Vikas Yadav, Vikas Yadav, Vikas Jakkula, Full Stack Developer, React Developer, Game Developer, Tech Blogger, vikasjakkula08@gmail.com, GitHub, LinkedIn, Reddit, X Twitter, Web Development, Programming Blog",
  image = "/Dp.png",
  url = "https://blog-fronted-blush.vercel.app"
}) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Jakkula Vikas Yadav",
    "url": url,
    "image": image,
    "sameAs": [
      "https://github.com/vikasjakkula",
      "https://linkedin.com/in/vikasjakkula",
      "https://twitter.com/jakkula_vi60475",
      "https://reddit.com/user/Relevant_Whole2540"
    ],
    "jobTitle": "Full Stack Developer",
    "worksFor": {
      "@type": "Organization",
      "name": "Tech Blogger"
    },
    "email": "vikasjakkula08@gmail.com",
    "description": description
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="Jakkula Vikas Yadav" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
      
      {/* Social Media Links */}
      <meta name="github" content="https://github.com/vikasjakkula" />
      <meta name="linkedin" content="https://linkedin.com/in/vikasjakkula" />
      <meta name="twitter" content="https://twitter.com/jakkula_vi60475" />
      <meta name="reddit" content="https://reddit.com/user/Relevant_Whole2540" />
      
      {/* Contact Information */}
      <meta name="email" content="vikasjakkula08@gmail.com" />
      
      {/* Favicon */}
      <link rel="icon" type="image/png" href="/Dp.png" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export default SEO; 