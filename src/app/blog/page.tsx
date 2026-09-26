import React from 'react';
import Link from 'next/link';
import { blogPosts, BlogPost } from '@/data/blogPosts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Writing by Gunnar Enserro on computational neuroscience, connectomics, predictive coding, brain simulation and machine learning.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  return (
    <div className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Blog</h1>
        <p className="text-gray-600 mt-2">
          Thoughts on consciousness, the world, an I myself  
        </p>
      </div>
      <div className="space-y-8">
        {blogPosts.map((post: BlogPost, index: number) => (
          <div key={post.id} className="pb-8 flex flex-col md:flex-row gap-6 md:gap-8 relative">
            {/* Rainbow gradient separator - hide on last item */}
            {index < blogPosts.length - 1 && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 opacity-60"></div>
            )}
            {/* Left side - Content */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
              <p className="text-gray-500 mb-4">{post.date}</p>
              <p className="text-lg mb-4">{post.excerpt}</p>
              <Link 
                href={`/blog/${post.slug}`}
                className="text-black border-b-2 border-black hover:border-gray-500 hover:text-gray-700 transition-colors"
              >
                Read more
              </Link>
            </div>
            
            {/* Right side - Image */}
            {post.backgroundImage && (
              <div className="w-full md:w-80 h-48 md:h-48 flex-shrink-0 order-first md:order-last">
                <img
                  src={post.backgroundImage}
                  alt={post.imageAlt}
                  className="w-full h-full object-cover rounded-r-lg"
                />
              </div>
            )}
          </div>
        ))}
        {blogPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
} 