import React from 'react';
import ThermalThumbnail from '@/components/common/ThermalThumbnail';
import type { Project } from '@/data/projects';

const ProjectImage = ({ project }: { project: Project }) => {
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
