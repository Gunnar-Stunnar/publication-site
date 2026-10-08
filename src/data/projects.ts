export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  image?: string;
  imageAlt?: string;
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

export const projects: Project[] = [
  {
    id: "4",
    title: "Brain Criticality Theory",
    description: "Exploring how neural systems may operate at critical points between order and disorder for optimal information processing.",
    thumbnail: "thermal",
    image: "/projects/ising-criticality.svg",
    imageAlt: "Ising model lattice near its critical temperature, showing clusters of aligned spins at every scale",
    tags: ["Computational Neuroscience", "Statistical Physics", "Complex Systems"],
    featured: true,
    hasDemo: true
  },
  {
    id: "5",
    title: "Winning CEDC AI Grand Prix 2026",
    description: "How a linear regression on track waypoints became a first-place AWS DeepRacer model: a hidden expert in the reward function, a physics-based racing line, and a teacher damped to stop the wobble.",
    thumbnail: "gradient",
    image: "/projects/deepracer/racing_line.png",
    imageAlt: "Racing line on the re:Invent 2018 track, colored by target speed",
    tags: ["Reinforcement Learning", "Imitation Learning", "Control Theory", "HPC"],
    featured: true,
    hasDemo: true
  }
];
