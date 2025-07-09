import React from 'react';
import { Button } from './ui/button';

const footerSections = [
  {
    heading: 'CONNECT',
    links: ['Github', 'X (Twitter)', 'LinkedIn', 'YouTube'],
  },
  {
    heading: 'PILLARS',
    links: ['Iterate', 'Evaluate', 'Deploy', 'Monitor'],
  },
  {
    heading: 'PRODUCTS',
    links: [
      'Editor',
      'Playground',
      'Evaluations',
      'Datasets',
      'Deployments',
      'Logs',
      'Analytics',
      'Gateway',
    ],
  },
  {
    heading: 'COMPANY',
    links: [
      'Labs',
      'Applied',
      'Pricing',
      'Blog',
      'Careers',
      'Book a Demo',
      'Wikipedia',
    ],
  },
  {
    heading: 'RESOURCES',
    links: [
      'Documentation',
      'API Reference',
      'DPA',
      'Privacy Policy',
      'Terms of Service',
      'Report vulnerability',
    ],
  },
];

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-b from-[#1b9df3] to-[#1992e2]/40 text-white font-poppins shadow-[0_-8px_32px_0_#1c9ef5] relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mt-10 mb-12">
          {footerSections.map((section, index) => (
            <div 
              key={section.heading} 
              className="flex flex-col items-start text-left transform transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className="text-base font-semibold text-gray-100 tracking-wider mb-4 text-left relative">
                {section.heading}
                <div className="absolute -bottom-1 left-0 w-8 h-0.5 bg-white/50 rounded-full"></div>
              </div>
              <div className="flex flex-col gap-2">
                {section.links.map((link, linkIndex) => (
                  <Button
                    key={link}
                    variant="link"
                    className="text-left justify-start px-0 text-gray-200 hover:text-white !no-underline !shadow-none !rounded-none !p-0 !m-0 transition-all duration-200 hover:translate-x-1 hover:drop-shadow-sm"
                    style={{
                      animationDelay: `${(index * 100) + (linkIndex * 50)}ms`
                    }}
                  >
                    <span className="relative">
                      {link}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-white/70 transition-all duration-200 group-hover:w-full"></span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="relative my-8">
          <hr className="border-t border-white/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="transform transition-all duration-300 hover:scale-105">
            <img 
              src={process.env.PUBLIC_URL + '/flex.png'} 
              alt="Flex Logo" 
              className="h-10 filter drop-shadow-lg" 
            />
          </div>
          <div className="text-sm text-gray-700 font-medium tracking-wide">
            © 2025 Flex.AI. All rights reserved.
          </div>
          <div className="flex space-x-4 mt-2">
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;