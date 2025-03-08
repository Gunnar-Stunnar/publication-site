export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  featured: boolean;
}

export const projects: Project[] = [
  {
    id: "4",
    title: "Brain Criticality Theory",
    description: "Exploring how neural systems may operate at critical points between order and disorder for optimal information processing.",
    thumbnail: "thermal",
    tags: ["Computational Neuroscience", "Statistical Physics", "Complex Systems"],
    featured: true
  }
]; 