import React from 'react';
import Link from 'next/link';
import { projects } from '@/data/projects';
import ThermalThumbnail from '@/components/common/ThermalThumbnail';

export default function ProjectsPage() {
  return (
    <div className="py-12">
      <h1 className="text-4xl font-bold mb-8">Research Projects</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <div key={project.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 relative group">
            <ThermalThumbnail type={project.thumbnail} />
            <div className="p-6 relative">
              {/* Glass card effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 glass-card"></div>
              <h2 className="text-xl font-bold mb-2 relative z-10">{project.title}</h2>
              <p className="text-gray-700 mb-4 relative z-10">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                {project.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <Link 
                href={`/projects/${project.id}`}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 relative z-10 inline-block"
              >
                View Project
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 