import React from 'react';

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="w-full p-6">
        <h1 className="text-4xl font-bold mb-8">About Me</h1>
        <div className="flex flex-col md:flex-row md:items-start md:space-x-8 space-y-8 md:space-y-0">
          <div className="w-full md:w-1/3">
            <div className="w-full aspect-square rounded-lg relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(255,0,0,0.6), rgba(255,154,0,0.6), rgba(208,222,33,0.6), rgba(79,220,74,0.6), rgba(63,218,216,0.6), rgba(47,201,226,0.6), rgba(28,127,238,0.6), rgba(95,21,242,0.6))',
              boxShadow: '0 0 20px rgba(255,0,0,0.4), 0 0 40px rgba(79,220,74,0.2), 0 0 60px rgba(28,127,238,0.1), inset 0 0 50px rgba(95,21,242,0.3)'
            }}>
              <div className="absolute top-0 left-0 w-full h-full" style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,154,0,0.5), transparent 30%), radial-gradient(circle at 70% 70%, rgba(47,201,226,0.5), transparent 40%)'
              }}></div>
              
              {/* Glass effect overlay */}
              <div className="absolute inset-0" style={{
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderTop: '1px solid rgba(255, 255, 255, 0.5)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3)'
              }}></div>
              
              {/* Light reflection */}
              <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg" style={{
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1) 50%, transparent)'
              }}></div>
            </div>
          </div>
          <div className="w-full md:w-2/3">
            <p className="text-lg mb-4">
              I'm a researcher specializing in thermal gradient analysis and computational modeling. My work focuses on developing new methods for understanding and visualizing complex thermal patterns.
            </p>
            <p className="text-lg mb-4">
              With a background in both computer science and physics, I bring an interdisciplinary approach to solving challenging problems in thermal imaging and analysis.
            </p>
            <p className="text-lg mb-4">
              Throughout my career, I've collaborated with researchers across multiple disciplines, including urban planning, environmental science, and materials engineering. These collaborations have led to innovative approaches to thermal analysis and visualization.
            </p>
            <p className="text-lg mb-4">
              My research has been published in leading journals and presented at international conferences. I'm passionate about making complex data accessible through intuitive visualizations and interactive demonstrations.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">
                Machine Learning
              </div>
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">
                Data Visualization
              </div>
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">
                Computational Modeling
              </div>
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">
                Thermal Analysis
              </div>
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">
                Pattern Recognition
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 