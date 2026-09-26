export interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  tags: string[];
  slug: string;
  filePath: string;
  backgroundImage?: string;
  imageAlt?: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "4",
    title: "The Fly Brain, Wired",
    date: "2026-09-26",
    excerpt: "FlyWire mapped every one of the 139,255 neurons in a fruit fly's brain. I turned that wiring diagram into a working simulation, then pulled it apart into the circuits for seeing, smelling, remembering and moving, and switched each one on. This post walks through all four, with renders and simulation videos.",
    author: "Gunnar Enserro",
    tags: ["neuroscience", "connectomics", "computational neuroscience", "simulation", "research"],
    slug: "fly-brain-wired",
    filePath: "fly-brain-wired.md",
    backgroundImage: "/FlyBrain/tour.jpg",
    imageAlt: "Rotating 3D rendering of thousands of real fly neurons, colored by job"
  },
  {
    id: "3",
    title: "Functionality of Predictive Coding",
    date: "2026-07-08",
    excerpt: "Predictive Coding is a biologically inspired framework where the brain continuously generates predictions about incoming sensory data and updates itself based on prediction error — not raw input. This post covers the theory, how it compares to standard deep learning, and experimental results across autoencoding, classification, and generation, finishing with its connection to spiking neural networks and continual learning.",
    author: "Gunnar Enserro",
    tags: ["neuroscience", "deep learning", "predictive coding", "spiking neural networks", "research"],
    slug: "predictive-coding",
    filePath: "predictive-coding.md",
    backgroundImage: "/RACAS/image1.jpeg",
    imageAlt: "Abstract visualization of predictive coding and neural information processing"
  },
  {
    id: "2",
    title: "DeepSEA-SHARCQ",
    date: "2026-07-08",
    excerpt: "Automating whole-brain image analysis with deep learning. I advanced the original SHARCQ pipeline to fully automate brain slice alignment, registration, and cell quantification using Neural Best Buddies, triangular mesh morphing, and classical computer vision.",
    author: "Gunnar Enserro",
    tags: ["neuroscience", "deep learning", "computer vision", "research"],
    slug: "deepsea-sharcq",
    filePath: "deepsea-sharcq.md",
    backgroundImage: "/Sharcq/SHARCQ.png",
    imageAlt: "DeepSEA-SHARCQ brain registration pipeline overview"
  },
  // {
  //   id: "1",
  //   title: "Bridging the substrate: consciousness across materials",
  //   date: "2025-09-28",
  //   excerpt: "In this blog post, I will explore the question of what it means for consciousness to not be only human but on different substrates. To think that we could be years away from the first silicon consciousness, what is the true reason for consciousness to spawn consciousness? I will explore the idea of \"soul desires\", how a desire isn't only scoped to the body but an essence of consciousness. From this we find a guiding light towards empathy across substrates.",
  //   author: "Gunnar Enserro",
  //   tags: ["physics", "technology", "introduction"],
  //   slug: "welcome-to-my-blog",
  //   filePath: "sample-post.md",
  //   backgroundImage: "/tbh-creature.png",
  //   imageAlt: "Abstract physics and technology visualization"
  // }
]; 