import React from 'react';
import './3d-image-slider.css';

const images = [
  { src: process.env.PUBLIC_URL + '/1.png', alt: 'Slide 1' },
  { src: process.env.PUBLIC_URL + '/2.png', alt: 'Slide 2' },
  { src: process.env.PUBLIC_URL + '/3.png', alt: 'Slide 3' },
  // Add more images as needed
];

export default function Image3DSlider() {
  const quantity = images.length;

  return (
    <div className="banner">
      <div
        className="slider"
        style={{ '--quantity': quantity }}
      >
        {images.map((img, idx) => (
          <div
            className="item"
            key={idx}
            style={{ '--position': idx + 1, '--quantity': quantity }}
          >
            <img src={img.src} alt={img.alt} />
          </div>
        ))}
      </div>
      <div className="content">
        <h1 data-content="3D">3D</h1>
        <div className="author">
          <h2>Image Slider</h2>
          <div>by Your Name</div>
        </div>
        {/* Optionally, you can add a model image or other content here */}
      </div>
      {/* <div className="model"></div> */}
    </div>
  );
}