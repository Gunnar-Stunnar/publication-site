import type { Metadata } from 'next';
import { projects, isLocked } from '@/data/projects';

const title = 'Teaching a Race Car to See the Racing Line';

export function generateMetadata(): Metadata {
  const project = projects.find(p => p.id === '5')!;

  if (isLocked(project)) {
    return { title, robots: { index: false, follow: false } };
  }

  return {
    title,
    description: 'How a linear regression on track waypoints became a first-place AWS DeepRacer model: teachers inside reward functions, racing lines, and damping a wobbling car. Includes interactive demos.',
    alternates: { canonical: '/projects/5' },
    openGraph: {
      title,
      description: 'A first-place DeepRacer model built from a linear readout, a hidden expert in the reward function, and a damped teacher.',
      images: [{ url: '/projects/deepracer/racing_line.png' }],
    },
  };
}

export default function DeepRacerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
