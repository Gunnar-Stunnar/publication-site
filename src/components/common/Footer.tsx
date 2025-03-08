import React from 'react';

const Footer = () => {
  return (
    <div className="mt-16 border-t border-gray-200 relative">
      <div className="h-3 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(90deg, rgba(255,0,0,1), rgba(255,154,0,1), rgba(208,222,33,1), rgba(79,220,74,1), rgba(63,218,216,1), rgba(47,201,226,1), rgba(28,127,238,1), rgba(95,21,242,1), rgba(186,12,248,1), rgba(251,7,217,1))',
          boxShadow: 'inset 0 0 10px white, 0 0 20px rgba(255,154,0,0.8), 0 0 40px rgba(47,201,226,0.6)'
        }}></div>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)'
        }}></div>
        
        {/* Glass effect overlay */}
        <div className="absolute inset-0 glass-effect"></div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">Your Name</div>
          <div className="text-gray-500">© {new Date().getFullYear()} All Rights Reserved</div>
        </div>
      </div>
    </div>
  );
};

export default Footer; 