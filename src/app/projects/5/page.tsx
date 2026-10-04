import Link from 'next/link';
import { projects, isLocked, lockedMessage } from '@/data/projects';
import DeepRacerContent from '@/components/projects/deepracer/DeepRacerContent';

export const revalidate = 3600;

export default function DeepRacerProject() {
  const project = projects.find(p => p.id === '5')!;

  if (isLocked(project)) {
    return (
      <div className="py-12">
        <Link href="/projects" className="text-gray-500 hover:text-black text-sm">← Back to projects</Link>
        <h1 className="text-4xl font-bold mb-8 mt-4">{project.title}</h1>
        <div className="rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white text-center px-6 py-24">
          <svg className="w-10 h-10 mx-auto mb-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3m-.75 0h10.5a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z" />
          </svg>
          <p className="text-2xl font-medium">{lockedMessage(project)}</p>
        </div>
      </div>
    );
  }

  return <DeepRacerContent />;
}
