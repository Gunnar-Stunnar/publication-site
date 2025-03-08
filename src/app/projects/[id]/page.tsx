import React from 'react';
import Link from 'next/link';
import { projects } from '@/data/projects';
import Demo from '@/components/projects/Demo';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return projects.map((project) => ({
    id: project.id.toString(),
  }));
}
export type paramsType = { id: string };
// Use an async function to match Next.js expected type
export default async function ProjectPage({ params }: { params: paramsType }) {
  const projectId = parseInt(params.id);
  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    notFound();
  }

  return (
    <div className="py-12">
      <Link 
        href="/projects"
        className="mb-6 flex items-center text-gray-600 hover:text-black"
      >
        <span>← Back to projects</span>
      </Link>
      
      <div className="mb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <p className="text-lg text-gray-700 mb-6">
          {project.description}
        </p>
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
          <p className="text-lg mb-4">
            This research project explores innovative approaches to {project.title.toLowerCase()}. 
            Through a combination of computational modeling and data visualization techniques, 
            we've developed new methods for analyzing complex patterns and relationships.
          </p>
          <p className="text-lg mb-4">
            Our approach integrates machine learning algorithms with traditional analytical methods, 
            allowing for more nuanced understanding of the underlying phenomena.
          </p>
        </div>
        
        {project.hasDemo && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Interactive Demo</h2>
            <Demo projectId={project.id} />
            <p className="mt-4 text-gray-600 italic">
              This interactive demonstration showcases the key features and capabilities of our research.
            </p>
          </div>
        )}
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Methodology</h2>
          <p className="text-lg mb-4">
            Our research methodology combines quantitative and qualitative approaches to data collection and analysis.
            We employed a multi-stage process:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-lg ml-4 mb-4">
            <li>Initial data collection and preprocessing</li>
            <li>Pattern identification using custom algorithms</li>
            <li>Model development and validation</li>
            <li>Visualization and interactive tool creation</li>
          </ol>
          <p className="text-lg">
            This comprehensive approach ensures robust results while maintaining accessibility for various stakeholders.
          </p>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Related Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects
              .filter(p => p.id !== project.id)
              .slice(0, 2)
              .map(relatedProject => (
                <Link 
                  key={relatedProject.id}
                  href={`/projects/${relatedProject.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-bold mb-2">{relatedProject.title}</h3>
                  <p className="text-gray-700">{relatedProject.description}</p>
                </Link>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
} 