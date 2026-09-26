// Site-wide constants used for SEO metadata, the sitemap, RSS and structured data.
export const site = {
  url: "https://gunnar.pub",
  name: "Gunnar Enserro",
  title: "Gunnar Enserro | Computational Neuroscience & Machine Learning",
  description:
    "Gunnar Enserro is a computational neuroscience PhD student at CU Denver / Anschutz and ML engineer. Research, simulations and writing on brains, connectomics, predictive coding and AI.",
  image: "/FlyBrain/tour.jpg",
  keywords: [
    "Gunnar Enserro",
    "computational neuroscience",
    "connectomics",
    "FlyWire",
    "fly brain simulation",
    "predictive coding",
    "spiking neural networks",
    "machine learning",
    "neuroscience blog",
  ],
  sameAs: ["https://github.com/Gunnar-Stunnar"],
};

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();
