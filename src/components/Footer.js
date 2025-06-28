import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="adaline-footer">
      <div className="footer-dock">
        <div className="footer-content-row">
          <div className="footer-col">
            <div className="footer-title">CONNECT</div>
            <div className="footer-link">Github</div>
            <div className="footer-link">X (Twitter)</div>
            <div className="footer-link">LinkedIn</div>
            <div className="footer-link">YouTube</div>
          </div>
          <div className="footer-col">
            <div className="footer-title">PILLARS</div>
            <div className="footer-link">Iterate</div>
            <div className="footer-link">Evaluate</div>
            <div className="footer-link">Deploy</div>
            <div className="footer-link">Monitor</div>
          </div>
          <div className="footer-col">
            <div className="footer-title">PRODUCTS</div>
            <div className="footer-link">Editor</div>
            <div className="footer-link">Playground</div>
            <div className="footer-link">Evaluations</div>
            <div className="footer-link">Datasets</div>
            <div className="footer-link">Deployments</div>
            <div className="footer-link">Logs</div>
            <div className="footer-link">Analytics</div>
            <div className="footer-link">Gateway</div>
          </div>
          <div className="footer-col">
            <div className="footer-title">COMPANY</div>
            <div className="footer-link">Labs</div>
            <div className="footer-link">Applied</div>
            <div className="footer-link">Pricing</div>
            <div className="footer-link">Blog</div>
            <div className="footer-link">Careers</div>
            <div className="footer-link">Book a Demo</div>
            <div className="footer-link">Wikipedia</div>
          </div>
          <div className="footer-col">
            <div className="footer-title">RESOURCES</div>
            <div className="footer-link">Documentation</div>
            <div className="footer-link">API Reference</div>
            <div className="footer-link">DPA</div>
            <div className="footer-link">Privacy Policy</div>
            <div className="footer-link">Terms of Service</div>
            <div className="footer-link">Report vulnerability</div>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-col logo-col">
          <img src={process.env.PUBLIC_URL + '/flex.png'} alt="Flex Logo" style={{ height: '40px', marginBottom: '0.5rem' }} />
          <div className="footer-copyright">© 2025 Flex.AI. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
