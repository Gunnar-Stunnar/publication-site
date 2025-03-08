import React from 'react';

interface DemoProps {
  projectId: number;
}

const Demo: React.FC<DemoProps> = ({ projectId }) => {
  return (
    <div className="w-full h-64 rounded-lg p-4 flex items-center justify-center relative overflow-hidden" 
         style={{
           background: projectId === 1 ? 'linear-gradient(120deg, rgba(255,255,255,0.9), rgba(255,0,0,0.3), rgba(255,154,0,0.3), rgba(208,222,33,0.3), rgba(79,220,74,0.3), rgba(47,201,226,0.3), rgba(28,127,238,0.3))' :
                       projectId === 2 ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(28,127,238,0.3), rgba(95,21,242,0.3), rgba(186,12,248,0.3), rgba(251,7,217,0.3), rgba(255,0,128,0.3))' :
                       'linear-gradient(150deg, rgba(255,255,255,0.9), rgba(79,220,74,0.3), rgba(63,218,216,0.3), rgba(47,201,226,0.3), rgba(28,127,238,0.3), rgba(95,21,242,0.3))',
           boxShadow: projectId === 1 ? 'inset 0 0 50px rgba(255,0,0,0.4), inset 0 0 100px rgba(79,220,74,0.2)' :
                      projectId === 2 ? 'inset 0 0 50px rgba(95,21,242,0.4), inset 0 0 100px rgba(255,0,128,0.2)' :
                      'inset 0 0 50px rgba(47,201,226,0.4), inset 0 0 100px rgba(95,21,242,0.2)'
         }}>
      <div className="absolute top-0 left-0 w-full h-full" style={{
        background: projectId === 1 ? 'radial-gradient(circle at 30% 20%, rgba(255,0,0,0.2), transparent 30%), radial-gradient(circle at 70% 60%, rgba(28,127,238,0.2), transparent 40%)' :
                   projectId === 2 ? 'radial-gradient(circle at 20% 70%, rgba(95,21,242,0.2), transparent 30%), radial-gradient(circle at 80% 20%, rgba(255,0,128,0.2), transparent 40%)' :
                   'radial-gradient(circle at 60% 30%, rgba(63,218,216,0.2), transparent 30%), radial-gradient(circle at 30% 70%, rgba(95,21,242,0.2), transparent 40%)'
      }}></div>
      
      {/* Glass effect overlay */}
      <div className="absolute inset-0" style={{
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderTop: '1px solid rgba(255, 255, 255, 0.5)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3)'
      }}></div>
      
      {/* Light reflection */}
      <div className="absolute top-0 left-0 right-0 h-1/4 rounded-t-lg" style={{
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.1) 60%, transparent)'
      }}></div>
      
      <div className="bg-white bg-opacity-70 p-6 rounded-lg shadow-lg backdrop-blur-sm z-10 border border-white border-opacity-30 relative">
        <div className="absolute inset-0 rounded-lg" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
          backdropFilter: 'blur(4px)'
        }}></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">Interactive Demo</h3>
          <p className="mb-4">This is a placeholder for your research project's interactive demo.</p>
          <button className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
            Try the demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Demo; 