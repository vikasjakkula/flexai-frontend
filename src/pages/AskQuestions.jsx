import React, { useState } from 'react';
import ContactFormCard from './ContactFormCard';

const AskQuestions = () => {
  const [form, setForm] = useState({ name: '', email: '', question: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.question.trim()) errs.question = 'Please enter your question';
    return errs;
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm({ name: '', email: '', question: '' });
    }, 1200);
  };

  return (
    <ContactFormCard title="Ask Questions">
      {success ? (
        <div style={{ color: '#10b981', textAlign: 'center', fontWeight: 600, fontSize: '1.1rem' }}>
          Thank you! We'll get back to you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }}
              disabled={loading}
            />
            {errors.name && <span style={{ color: '#ef4444', fontSize: 13 }}>{errors.name}</span>}
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }}
              disabled={loading}
            />
            {errors.email && <span style={{ color: '#ef4444', fontSize: 13 }}>{errors.email}</span>}
          </label>
          <label>
            Question
            <textarea
              name="question"
              value={form.question}
              onChange={handleChange}
              rows={4}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, resize: 'vertical' }}
              disabled={loading}
            />
            {errors.question && <span style={{ color: '#ef4444', fontSize: 13 }}>{errors.question}</span>}
          </label>
          <button
            type="submit"
            style={{
              background: '#1DA1F2',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '0.75rem',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ display: 'inline-block', width: 20, height: 20, border: '3px solid #fff', borderTop: '3px solid #1DA1F2', borderRadius: '50%', animation: 'spin 1s linear infinite', verticalAlign: 'middle' }}></span> : 'Submit'}
          </button>
        </form>
      )}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </ContactFormCard>
  );
};

export default AskQuestions; 