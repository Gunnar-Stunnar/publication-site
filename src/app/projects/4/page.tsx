'use client';

import React from 'react';
import Link from 'next/link';
import IsingModelSimulation from '@/components/projects/IsingModelSimulation';
import GlowingBorder from '@/components/common/GlowingBorder';
import content from '@/config/content.json';

// Add this interface to define the related project type
interface RelatedProject {
  id: number | string;
  title: string;
  description: string;
}

export default function BrainCriticalityProject() {
  const { brainCriticality } = content.projects;
  
  // Type assertion to fix the "never" type issue
  const relatedProjects = brainCriticality.relatedProjects as RelatedProject[];
  
  return (
    <div className="py-12">
      <div className="mb-6">
        <Link 
          href="/projects"
          className="flex items-center text-gray-600 hover:text-black mb-4"
        >
          <span>← Back to projects</span>
        </Link>
        <h1 className="text-4xl font-bold mb-4">Brain Criticality Theory</h1>
      </div>
      
      <div className="mb-8">
        <GlowingBorder className="p-6">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
            <p className="text-lg mb-4">{brainCriticality.overview}</p>
            <p className="text-lg mb-4">{brainCriticality.methodology}</p>
            
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                Computational Neuroscience
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                Statistical Physics
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                Complex Systems
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                Phase Transitions
              </span>
            </div>
          </div>
        </GlowingBorder>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Interactive Demonstration: Ising Model</h2>
        <p className="mb-6">{brainCriticality.demoDescription}</p>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <IsingModelSimulation />
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Key Findings</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {brainCriticality.keyFindings.map((finding, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-2">{finding.title}</h3>
              <p>{finding.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Implications</h2>
        <p className="text-lg mb-4">{brainCriticality.implications.intro}</p>
        <ul className="list-disc pl-6 space-y-2">
          {brainCriticality.implications.points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Related Projects</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {relatedProjects.map((project, index) => (
            <Link key={index} href={`/projects/${project.id}`} className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-2">{project.title}</h3>
              <p className="text-gray-700">{project.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 