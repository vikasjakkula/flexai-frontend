import React from 'react';
import './Follow.css';

const Follow = () => {
  return (
    <div className="follow">
      <h1>Follow</h1>
      <p>Connect with me on social platforms:</p>
      <ul className="follow-list">
        <li><a href="https://twitter.com/">Twitter</a></li>
        <li><a href="https://github.com/">GitHub</a></li>
        <li><a href="https://www.linkedin.com/">LinkedIn</a></li>
      </ul>
    </div>
  );
};

export default Follow;
