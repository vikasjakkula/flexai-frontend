// Import necessary dependencies
import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import './Contact.css';

// Contact component - handles the contact form and information
const Contact = () => {
  const [formData, setFormData] = useState({
    email: '',
    message: '',
  });
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        {
          user_email: formData.email,
          message: formData.message,
        },
        'YOUR_PUBLIC_KEY'
      )
      .then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        setFormData({ email: '', message: '' });
      })
      .catch((error) => {
        alert('Failed to send message: ' + error.text);
      });
  };

  return (
    <div className="contact">
      {showToast && (
        <div className="toast">
          <span className="toast-icon">✅</span>
          Message Sent Successfully!
        </div>
      )}
      <h1>Contact Me ❤️‍🔥</h1>
      <div className="contact-container">
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <p>I&apos;d love to hear from you. Please fill your opinion out there through X or Reddit</p>
          <ul>
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:vikasjakkula08@gmail.com">vikasjakkula08@gmail.com</a>
            </li>
            <li>
              <strong>Social Media</strong>
              <ul>
                <li>
                  X (Twitter):{' '}
                  <a href="https://twitter.com/vikas_070v" target="_blank" rel="noopener noreferrer">
                    @vikas_070v
                  </a>
                </li>
                <li>
                  GitHub:{' '}
                  <a href="https://github.com/vikasjakkula" target="_blank" rel="noopener noreferrer">
                    github.com/vikasjakkula
                  </a>
                </li>
                <li>
                  Reddit:{' '}
                  <a
                    href="https://www.reddit.com/user/Relevant_Whole2540"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    u/Relevant_Whole2540
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="submit-btn">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
