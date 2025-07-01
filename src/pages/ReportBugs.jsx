import React, { useState } from 'react';
import ContactFormCard from './ContactFormCard';

const ReportBugs = () => {
  const [form, setForm] = useState({ page: '', description: '', screenshot: null });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = 'Bug description is required';
    return errs;
  };

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm({
      ...form,
      [name]: name === 'screenshot' ? (files && files[0]) : value
    });
    setErrors({ ...errors, [name]: undefined });
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
      setForm({ page: '', description: '', screenshot: null });
    }, 1200);
  };

  return (
    <ContactFormCard title="Report Bugs">
      {success ? (
        <div style={{ color: '#10b981', textAlign: 'center', fontWeight: 600, fontSize: '1.1rem' }}>
          Bug reported successfully. Our team will check it!
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label>
            Page URL or Name
            <input
              type="text"
              name="page"
              value={form.page}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4 }}
              disabled={loading}
            />
          </label>
          <label>
            Bug Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, resize: 'vertical' }}
              disabled={loading}
            />
            {errors.description && <span style={{ color: '#ef4444', fontSize: 13 }}>{errors.description}</span>}
          </label>
          <label>
            Screenshot (optional)
            <input
              type="file"
              name="screenshot"
              accept="image/*"
              onChange={handleChange}
              style={{ marginTop: 4 }}
              disabled={loading}
            />
            {form.screenshot && (
              <span style={{ fontSize: 13, color: '#6b7280' }}>Selected: {form.screenshot.name}</span>
            )}
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

export default ReportBugs; 