import React from 'react';
import Link from 'next/link';
import ProjectImage from '@/components/common/ProjectImage';
import { isLocked, type Project } from '@/data/projects';

const ProjectCard = ({ project, maxTags }: { project: Project; maxTags?: number }) => {
  const locked = isLocked(project);
  const tags = maxTags ? project.tags.slice(0, maxTags) : project.tags;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 relative group">
      <ProjectImage project={project} />
      <div className="p-6 relative">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 glass-card"></div>
        <h2 className="text-xl font-bold mb-2 relative z-10">{project.title}</h2>
        {locked ? (
          <p className="text-gray-500 italic mb-4 relative z-10">Details are hidden until this project is published.</p>
        ) : (
          <>
            <p className="text-gray-700 mb-4 relative z-10">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-4 relative z-10">
              {tags.map(tag => (
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
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
