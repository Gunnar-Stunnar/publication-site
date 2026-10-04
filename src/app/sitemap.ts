import type { MetadataRoute } from 'next';
import { blogPosts } from '@/data/blogPosts';
import { projects, isLocked } from '@/data/projects';
import { absoluteUrl } from '@/config/site';

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const latestPost = blogPosts.map(post => post.date).sort().at(-1);

  return [
    { url: absoluteUrl('/'), lastModified: latestPost, changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/blog'), lastModified: latestPost, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/projects'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/contact'), changeFrequency: 'yearly', priority: 0.3 },
    ...blogPosts.map(post => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.date,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      ...(post.backgroundImage && { images: [absoluteUrl(post.backgroundImage)] }),
    })),
    ...projects.filter(project => !isLocked(project)).map(project => ({
      url: absoluteUrl(`/projects/${project.id}`),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
