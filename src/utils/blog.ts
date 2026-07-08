import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BlogPost } from '@/data/blogPosts';

export interface BlogPostWithContent extends BlogPost {
  content: string;
}

/**
 * Get all markdown files from the blog content directory
 */
export function getBlogPostFiles(): string[] {
  const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
  
  if (!fs.existsSync(blogDir)) {
    return [];
  }
  
  return fs.readdirSync(blogDir).filter(file => file.endsWith('.md'));
}

/**
 * Parse a markdown file and extract frontmatter + content
 */
export function parseBlogPost(filePath: string): { frontmatter: any; content: string } {
  const fullPath = path.join(process.cwd(), 'src', 'content', 'blog', filePath);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  return {
    frontmatter: data,
    content
  };
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get reading time estimate for content
 */
export function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
