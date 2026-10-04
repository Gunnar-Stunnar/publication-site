import React from 'react';
import ThermalThumbnail from '@/components/common/ThermalThumbnail';
import { isLocked, lockedMessage, type Project } from '@/data/projects';

const ProjectImage = ({ project }: { project: Project }) => {
  if (isLocked(project)) {
    return (
      <div className="w-full h-48 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col items-center justify-center text-center px-6">
        <svg className="w-8 h-8 text-white/80 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3m-.75 0h10.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z" />
        </svg>
        <p className="text-white font-medium">{lockedMessage(project)}</p>
      </div>
    );
  }

  if (!project.image) return <ThermalThumbnail type={project.thumbnail} />;

  return (
    <div className="w-full h-48 relative overflow-hidden bg-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={project.image}
        alt={project.imageAlt ?? project.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
};

export default ProjectImage;
