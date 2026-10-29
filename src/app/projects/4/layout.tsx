import type { Metadata } from 'next';
import { projectShareMetadata } from '@/data/projects';

const title = 'Brain Criticality Theory';
const description = 'Do brains operate at a critical point between order and disorder? An interactive Ising model simulation exploring criticality and optimal information processing in neural systems.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/projects/4' },
  ...projectShareMetadata('4', title, description),
};

export default function BrainCriticalityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
