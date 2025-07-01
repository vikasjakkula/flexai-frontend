import React from 'react';

const ContactFormCard = ({ title, children }) => (
  <div style={{
    maxWidth: 480,
    margin: '2rem auto',
    background: '#fff',
    borderRadius: '1rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    alignItems: 'stretch',
  }}>
    {title && <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', color: '#1DA1F2' }}>{title}</h2>}
    {children}
  </div>
);

export default ContactFormCard; 