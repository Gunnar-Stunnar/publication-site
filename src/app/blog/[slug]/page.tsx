import React from 'react';
import { notFound } from 'next/navigation';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { blogPosts, BlogPost } from '@/data/blogPosts';
import MarkdownRenderer from '@/components/blog/MarkdownRenderer';
import type { Metadata } from 'next';
import { site, absoluteUrl } from '@/config/site';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface BlogPostData extends BlogPost {
  content: string;
}

async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  // Find the blog post metadata
  const postMeta = blogPosts.find(post => post.slug === slug);
  if (!postMeta) {
    return null;
  }

  try {
    // Read the markdown file
    const filePath = path.join(process.cwd(), 'src', 'content', 'blog', postMeta.filePath);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Parse the frontmatter and content
    const { data, content } = matter(fileContents);
    
    return {
      ...postMeta,
      content,
      // Override with frontmatter data if available
      title: data.title || postMeta.title,
      date: data.date || postMeta.date,
      excerpt: data.excerpt || postMeta.excerpt,
      author: data.author || postMeta.author,
      tags: data.tags || postMeta.tags,
    };
  } catch (error) {
    console.error('Error reading blog post:', error);
    return null;
  }
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const url = `/blog/${post.slug}`;
  const images = post.backgroundImage
    ? [{ url: post.backgroundImage, alt: post.imageAlt ?? post.title }]
    : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author, url: site.url }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.backgroundImage ? [post.backgroundImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags.join(', '),
    url: absoluteUrl(`/blog/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    ...(post.backgroundImage && { image: absoluteUrl(post.backgroundImage) }),
    author: { '@type': 'Person', '@id': `${site.url}/#person`, name: post.author, url: site.url },
    publisher: { '@id': `${site.url}/#person` },
  };

  return (
    <article className="py-12 max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
          <span>•</span>
          <span>By {post.author}</span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      
      {/* Glass rainbow separator */}
      <div className="relative mb-8">
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 opacity-30 rounded-full"></div>
        <div className="absolute inset-0 h-1 w-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 opacity-20 blur-sm rounded-full"></div>
        <div className="absolute inset-0 h-1 w-full glass-effect opacity-40 rounded-full"></div>
      </div>
      
      <MarkdownRenderer 
        content={post.content} 
        theme="default"
      />
      
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <a 
          href="/blog"
          className="text-black border-b-2 border-black hover:border-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Blog
        </a>
      </footer>
    </article>
  );
}
