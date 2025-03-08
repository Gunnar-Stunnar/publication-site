import React from 'react';

interface ThermalThumbnailProps {
  type: 'thermal' | 'gradient' | 'thermographic' | string;
}

const ThermalThumbnail: React.FC<ThermalThumbnailProps> = ({ type }) => {
  let gradientStyle = {};
  
  switch(type) {
    case 'thermal':
      gradientStyle = {
        background: 'linear-gradient(120deg, rgba(255,0,0,0.7), rgba(255,154,0,0.7), rgba(208,222,33,0.7), rgba(79,220,74,0.7), rgba(63,218,216,0.7), rgba(47,201,226,0.7), rgba(28,127,238,0.7), rgba(95,21,242,0.7), rgba(186,12,248,0.7), rgba(251,7,217,0.7))',
        boxShadow: '0 0 20px rgba(255,0,0,0.5), 0 0 40px rgba(255,154,0,0.3), 0 0 60px rgba(79,220,74,0.2), inset 0 0 30px rgba(28,127,238,0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative'
      };
      break;
    case 'gradient':
      gradientStyle = {
        background: 'linear-gradient(135deg, rgba(255,0,128,0.7), rgba(255,0,0,0.7), rgba(255,154,0,0.7), rgba(208,222,33,0.7), rgba(79,220,74,0.7), rgba(63,218,216,0.7), rgba(47,201,226,0.7), rgba(28,127,238,0.7), rgba(95,21,242,0.7))',
        boxShadow: '0 0 20px rgba(255,0,128,0.5), 0 0 40px rgba(255,154,0,0.3), 0 0 60px rgba(47,201,226,0.2), inset 0 0 30px rgba(95,21,242,0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative'
      };
      break;
    case 'thermographic':
      gradientStyle = {
        background: 'linear-gradient(150deg, rgba(95,21,242,0.7), rgba(47,201,226,0.7), rgba(63,218,216,0.7), rgba(79,220,74,0.7), rgba(208,222,33,0.7), rgba(255,154,0,0.7), rgba(255,0,0,0.7), rgba(255,0,128,0.7))',
        boxShadow: '0 0 20px rgba(95,21,242,0.5), 0 0 40px rgba(63,218,216,0.3), 0 0 60px rgba(255,154,0,0.2), inset 0 0 30px rgba(255,0,128,0.4)',
      };
      break;
    default:
      gradientStyle = {
        background: 'linear-gradient(120deg, rgba(79,220,74,0.7), rgba(63,218,216,0.7), rgba(47,201,226,0.7), rgba(28,127,238,0.7), rgba(95,21,242,0.7), rgba(186,12,248,0.7), rgba(251,7,217,0.7))',
        boxShadow: '0 0 20px rgba(79,220,74,0.5), 0 0 40px rgba(47,201,226,0.3), 0 0 60px rgba(186,12,248,0.2), inset 0 0 30px rgba(251,7,217,0.4)',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative'
      };
  }
  
  return (
    <div className="w-full h-32 rounded-lg relative overflow-hidden" style={gradientStyle}>
      {/* Glass overlay */}
      <div className="absolute inset-0 rounded-lg glass-effect"></div>
      {/* Light reflection */}
      <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg light-reflection"></div>
    </div>
  );
};

export default ThermalThumbnail; 