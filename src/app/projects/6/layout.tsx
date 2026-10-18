import type { Metadata } from 'next';

const title = 'Neurons Playing Doom';

export const metadata: Metadata = {
  title,
  description: 'A simulated neuron culture learns Doom with no reward, only predictable and unpredictable stimulation. The free energy principle, maximum entropy and Bayesian inference, with interactive figures.',
  alternates: { canonical: '/projects/6' },
  openGraph: {
    title,
    description: 'A simulated dish of neurons learns to play Doom using only predictable and unpredictable feedback. Interactive explanation of the free energy principle.',
  },
};

export default function DoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
