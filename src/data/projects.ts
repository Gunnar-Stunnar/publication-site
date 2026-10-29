import type { Metadata } from 'next';
import { site } from '@/config/site';

export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  image?: string;
  imageAlt?: string;
  // 1200×630 PNG for link previews (chat apps don't render SVG previews)
  ogImage?: string;
  tags: string[];
  featured: boolean;
  hasDemo: boolean;
  availableFrom?: string;
  availableLabel?: string;
}

export const isLocked = (project: Project, now: Date = new Date()) =>
  process.env.NODE_ENV !== 'development' &&
  !!project.availableFrom &&
  now < new Date(project.availableFrom);

export const lockedMessage = (project: Project) =>
  `Will display after ${project.availableLabel ?? 'a later date'}`;

// Open Graph and Twitter card fields for a project page, so shared links show
// the project's own image instead of the site-wide default. Next replaces a
// parent's openGraph/twitter objects wholesale, so these are complete.
export function projectShareMetadata(id: string, title: string, description: string): Pick<Metadata, 'openGraph' | 'twitter'> {
  const project = projects.find((p) => p.id === id);
  const image = project?.ogImage ?? site.image;
  const alt = project?.imageAlt ?? title;
  return {
    openGraph: {
      type: 'article',
      url: `/projects/${id}`,
      siteName: site.name,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: image, alt }],
    },
  };
}

export const projects: Project[] = [
  {
    id: "4",
    title: "Brain Criticality Theory",
    description: "Exploring how neural systems may operate at critical points between order and disorder for optimal information processing.",
    thumbnail: "thermal",
    image: "/projects/ising-criticality.svg",
    ogImage: "/projects/og/4.png",
    imageAlt: "Ising model lattice near its critical temperature, showing clusters of aligned spins at every scale",
    tags: ["Computational Neuroscience", "Statistical Physics", "Complex Systems"],
    featured: true,
    hasDemo: true
  },
  {
    id: "5",
    title: "First Place in CEDC AI Grand Prix 2026",
    description: "How a linear regression on track waypoints became a first-place AWS DeepRacer model: a hidden expert in the reward function, a physics-based racing line, and a teacher damped to stop the wobble.",
    thumbnail: "gradient",
    image: "/projects/deepracer/racing_line.png",
    ogImage: "/projects/og/5.png",
    imageAlt: "Racing line on the re:Invent 2018 track, colored by target speed",
    tags: ["Reinforcement Learning", "Imitation Learning", "Control Theory", "HPC"],
    featured: true,
    hasDemo: true
  },
  {
    id: "6",
    title: "Neurons Playing Doom",
    description: "A simulated dish of neurons learns to play Doom with no reward, only predictable and unpredictable stimulation. A hands-on tour of the free energy principle, maximum entropy and Bayesian inference.",
    thumbnail: "thermographic",
    image: "/projects/doom-neurons.svg",
    ogImage: "/projects/og/6.png",
    imageAlt: "A simulated culture of spiking neurons on an electrode array, with a spike raster along the bottom",
    tags: ["Free Energy Principle", "Bayesian Inference", "Spiking Neural Networks", "Computational Neuroscience"],
    featured: true,
    hasDemo: true
  },
  {
    id: "7",
    title: "The Mathematical Beauty of a Neuron",
    description: "Build a neuron from its equations: an RK4 solver tested on the Lorenz butterfly, the integrate-and-fire family and the shape of a spike, synapses, and STDP, ending with one neuron that learns which inputs belong together.",
    thumbnail: "gradient",
    image: "/projects/neuron-math.svg",
    ogImage: "/projects/og/7.png",
    imageAlt: "The Lorenz attractor behind the voltage trace of a firing integrate-and-fire neuron",
    tags: ["Numerical Methods", "Spiking Neuron Models", "Synaptic Plasticity", "Computational Neuroscience"],
    featured: true,
    hasDemo: true
  }
];
