import React from 'react';

interface GlowingBorderProps {
  children: React.ReactNode;
  className?: string;
}

const GlowingBorder: React.FC<GlowingBorderProps> = ({ children, className = '' }) => (
  <div className={`relative rounded-lg overflow-hidden ${className}`}>
    <div className="absolute inset-0 rounded-lg animate-pulse" style={{ 
      background: 'linear-gradient(90deg, rgba(255,0,0,0.5), rgba(255,154,0,0.5), rgba(79,220,74,0.5), rgba(47,201,226,0.5), rgba(95,21,242,0.5), rgba(251,7,217,0.5))',
      filter: 'blur(15px)',
      opacity: 0.7
    }}></div>
    
    {/* Glass effect overlay */}
    <div className="absolute inset-0 rounded-lg" style={{
      backdropFilter: 'blur(5px)',
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderTop: '1px solid rgba(255, 255, 255, 0.5)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3)'
    }}></div>
    
    {children}
  </div>
);

export default GlowingBorder; 