import React from 'react';
import { blogPosts } from '@/data/blogPosts';

// Define the type for blog posts if not already defined elsewhere
interface BlogPost {
  id: string | number;
  title: string;
  date: string;
  excerpt: string;
}

export default function BlogPage() {
  return (
    <div className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Blog</h1>
      </div>
      <div className="space-y-8">
        {(blogPosts as BlogPost[]).map(post => (
          <div key={post.id} className="border-b border-gray-200 pb-8 last:border-b-0">
            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
            <p className="text-gray-500 mb-4">{post.date}</p>
            <p className="text-lg mb-4">{post.excerpt}</p>
            <button className="text-black border-b-2 border-black hover:border-gray-500 hover:text-gray-700 transition-colors">
              Read more
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 