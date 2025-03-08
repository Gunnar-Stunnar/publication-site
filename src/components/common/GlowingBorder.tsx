import React, { ReactNode } from 'react';

interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
}

const GlowingBorder: React.FC<GlowingBorderProps> = ({ children, className = '' }) => {
  return (
    <div className="relative rounded-lg overflow-hidden">
      {/* Animated gradient border */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          background: 'linear-gradient(45deg, rgba(255,0,0,0.5), rgba(255,154,0,0.5), rgba(208,222,33,0.5), rgba(79,220,74,0.5), rgba(63,218,216,0.5), rgba(47,201,226,0.5), rgba(28,127,238,0.5), rgba(95,21,242,0.5))',
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
          filter: 'blur(3px)',
        }}
      />
      
      {/* Content container */}
      <div className={`relative z-10 bg-white bg-opacity-95 rounded-lg ${className}`}>
        {children}
      </div>
      
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default GlowingBorder; 