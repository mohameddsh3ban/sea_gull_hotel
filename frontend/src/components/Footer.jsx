// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#5f5d5c] text-white text-sm py-10 mt-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Left side: Contact info */}
        <div className="flex-1 text-center md:text-left">
          <p>
            Need help?{' '}
            <a href="mailto:info@hurghadaseagull.com" className="underline hover:text-gray-300">
              info@hurghadaseagull.com
            </a>
          </p>
        </div>

        {/* Center: Copyright */}
        <div className="flex-1 text-center">
          <p className="text-gray-300 text-sm">
            &copy; 2025 Seagull Beach Resort. All rights reserved.
          </p>
        </div>

        {/* Right side: Instagram */}
        <div className="flex-1 text-center md:text-right">
          <p>
            <a
              href="https://instagram.com/seagullbeachresorthrg"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-300"
            >
              @seagullbeachresorthrg
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
