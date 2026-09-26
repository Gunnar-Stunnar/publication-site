import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brain Criticality Theory',
  description: 'Do brains operate at a critical point between order and disorder? An interactive Ising model simulation exploring criticality and optimal information processing in neural systems.',
  alternates: { canonical: '/projects/4' },
};

export default function BrainCriticalityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
