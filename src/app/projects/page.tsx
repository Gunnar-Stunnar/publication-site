import React from 'react';
import { projects } from '@/data/projects';
import ProjectCard from '@/components/common/ProjectCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Projects',
  description: 'Computational neuroscience research projects by Gunnar Enserro, including interactive simulations of brain criticality.',
  alternates: { canonical: '/projects' },
};

export const revalidate = 3600;

export default function ProjectsPage() {
  return (
    <div className="py-12">
      <h1 className="text-4xl font-bold mb-8">Research Projects</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
} 