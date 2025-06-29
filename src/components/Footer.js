import React from 'react';
import './Footer.css';
import { Button } from './ui/button';

const Footer = () => {
  return (
    <footer className="adaline-footer">
      <div className="footer-dock">
        <div className="footer-content-row">
          <div className="footer-col">
            <div className="footer-title">CONNECT</div>
            <Button variant="link" className="footer-link">Github</Button>
            <Button variant="link" className="footer-link">X (Twitter)</Button>
            <Button variant="link" className="footer-link">LinkedIn</Button>
            <Button variant="link" className="footer-link">YouTube</Button>
          </div>
          <div className="footer-col">
            <div className="footer-title">PILLARS</div>
            <Button variant="link" className="footer-link">Iterate</Button>
            <Button variant="link" className="footer-link">Evaluate</Button>
            <Button variant="link" className="footer-link">Deploy</Button>
            <Button variant="link" className="footer-link">Monitor</Button>
          </div>
          <div className="footer-col">
            <div className="footer-title">PRODUCTS</div>
            <Button variant="link" className="footer-link">Editor</Button>
            <Button variant="link" className="footer-link">Playground</Button>
            <Button variant="link" className="footer-link">Evaluations</Button>
            <Button variant="link" className="footer-link">Datasets</Button>
            <Button variant="link" className="footer-link">Deployments</Button>
            <Button variant="link" className="footer-link">Logs</Button>
            <Button variant="link" className="footer-link">Analytics</Button>
            <Button variant="link" className="footer-link">Gateway</Button>
          </div>
          <div className="footer-col">
            <div className="footer-title">COMPANY</div>
            <Button variant="link" className="footer-link">Labs</Button>
            <Button variant="link" className="footer-link">Applied</Button>
            <Button variant="link" className="footer-link">Pricing</Button>
            <Button variant="link" className="footer-link">Blog</Button>
            <Button variant="link" className="footer-link">Careers</Button>
            <Button variant="link" className="footer-link">Book a Demo</Button>
            <Button variant="link" className="footer-link">Wikipedia</Button>
          </div>
          <div className="footer-col">
            <div className="footer-title">RESOURCES</div>
            <Button variant="link" className="footer-link">Documentation</Button>
            <Button variant="link" className="footer-link">API Reference</Button>
            <Button variant="link" className="footer-link">DPA</Button>
            <Button variant="link" className="footer-link">Privacy Policy</Button>
            <Button variant="link" className="footer-link">Terms of Service</Button>
            <Button variant="link" className="footer-link">Report vulnerability</Button>
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
