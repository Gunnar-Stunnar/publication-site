import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teaching a Race Car to See the Racing Line',
  description: 'How a linear regression on track waypoints became a first-place AWS DeepRacer model: teachers inside reward functions, racing lines, and damping a wobbling car. Includes interactive demos.',
  alternates: { canonical: '/projects/5' },
  openGraph: {
    title: 'Teaching a Race Car to See the Racing Line',
    description: 'A first-place DeepRacer model built from a linear readout, a hidden expert in the reward function, and a damped teacher.',
    images: [{ url: '/projects/deepracer/racing_line.png' }],
  },
};

export default function DeepRacerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
