export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  featured: boolean;
  hasDemo: boolean;
}

export const projects: Project[] = [
  {
    id: "4",
    title: "Brain Criticality Theory",
    description: "Exploring how neural systems may operate at critical points between order and disorder for optimal information processing.",
    thumbnail: "thermal",
    tags: ["Computational Neuroscience", "Statistical Physics", "Complex Systems"],
    featured: true,
    hasDemo: true
  },
  {
    id: "5",
    title: "Teaching a Race Car to See the Racing Line",
    description: "How a linear regression on track waypoints became a first-place AWS DeepRacer model: a hidden expert in the reward function, a physics-based racing line, and a teacher damped to stop the wobble.",
    thumbnail: "gradient",
    tags: ["Reinforcement Learning", "Imitation Learning", "Control Theory", "HPC"],
    featured: true,
    hasDemo: true
  }
];
