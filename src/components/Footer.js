import React from 'react';
import { Button } from './ui/button';

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-b from-[#1b9df3] to-[#1992e2]/40 text-white font-poppins shadow-[0_-8px_32px_0_#1c9ef5]">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mt-10 mb-8">
          <div className="flex flex-col items-start gap-2">
            <div className="text-base font-semibold text-gray-100 tracking-wider mb-2">CONNECT</div>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Github</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">X (Twitter)</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">LinkedIn</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">YouTube</Button>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="text-base font-semibold text-gray-100 tracking-wider mb-2">PILLARS</div>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Iterate</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Evaluate</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Deploy</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Monitor</Button>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="text-base font-semibold text-gray-100 tracking-wider mb-2">PRODUCTS</div>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Editor</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Playground</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Evaluations</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Datasets</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Deployments</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Logs</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Analytics</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Gateway</Button>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="text-base font-semibold text-gray-100 tracking-wider mb-2">COMPANY</div>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Labs</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Applied</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Pricing</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Blog</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Careers</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Book a Demo</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Wikipedia</Button>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="text-base font-semibold text-gray-100 tracking-wider mb-2">RESOURCES</div>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Documentation</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">API Reference</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">DPA</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Privacy Policy</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Terms of Service</Button>
            <Button variant="link" className="text-left w-full px-0 text-gray-200 hover:text-white">Report vulnerability</Button>
          </div>
        </div>
        <hr className="border-t border-white opacity-30 my-8" />
        <div className="flex flex-col items-center">
          <img src={process.env.PUBLIC_URL + '/flex.png'} alt="Flex Logo" className="h-10 mb-2" />
          <div className="text-sm text-gray-300">© 2025 Flex.AI. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
