import type { Metadata } from 'next';

const title = 'The Mathematical Beauty of a Neuron';

export const metadata: Metadata = {
  title,
  description: 'From a differential-equation solver to a learning neuron: RK4 and the Lorenz butterfly, leaky integrate-and-fire models and their spikes, synapses, and spike-timing-dependent plasticity, with interactive simulations.',
  alternates: { canonical: '/projects/7' },
  openGraph: {
    title,
    description: 'Build a neuron from equations: RK4, the Lorenz attractor, integrate-and-fire models, and STDP learning, all simulated in the browser.',
  },
};

export default function NeuronLayout({ children }: { children: React.ReactNode }) {
  return children;
}
