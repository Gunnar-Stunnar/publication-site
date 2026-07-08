# Blog System Usage Guide

This blog system allows you to create blog posts using Markdown files with frontmatter metadata.

## Directory Structure

```
src/
├── content/
│   └── blog/           # Place your .md files here
├── data/
│   └── blogPosts.ts    # Blog post metadata
└── app/
    └── blog/
        ├── page.tsx    # Blog listing page
        └── [slug]/
            └── page.tsx # Individual blog post page
```

## Adding a New Blog Post

### Step 1: Create a Markdown File

Create a new `.md` file in `src/content/blog/`. Example: `my-new-post.md`

```markdown
---
title: "My New Blog Post"
date: "2024-01-25"
excerpt: "A brief description of what this post is about."
author: "Your Name"
tags: ["tag1", "tag2", "tag3"]
---

# Your Blog Post Title

Your markdown content goes here...

## Subheadings

You can use all standard Markdown features:

- Lists
- **Bold text**
- *Italic text*
- `Code snippets`
- Links: [Example](https://example.com)

### Code Blocks

\`\`\`javascript
function example() {
  console.log("Hello, world!");
}
\`\`\`

### Math (if needed)
You can add mathematical expressions for physics content.
```

### Step 2: Add Metadata

Update `src/data/blogPosts.ts` to include your new post:

```typescript
export const blogPosts: BlogPost[] = [
  // ... existing posts
  {
    id: "3", // Increment the ID
    title: "My New Blog Post",
    date: "2024-01-25",
    excerpt: "A brief description of what this post is about.",
    author: "Your Name",
    tags: ["tag1", "tag2", "tag3"],
    slug: "my-new-blog-post", // URL-friendly version of title
    filePath: "my-new-post.md" // Name of your .md file
  }
];
```

## Frontmatter Fields

The frontmatter (YAML section at the top of your markdown file) supports:

- `title`: The blog post title
- `date`: Publication date (YYYY-MM-DD format)
- `excerpt`: Brief description for the blog listing
- `author`: Author name
- `tags`: Array of tags for categorization

## Features

### Supported Markdown Features

- Headers (H1-H6)
- Paragraphs and line breaks
- **Bold** and *italic* text
- Lists (ordered and unordered)
- Links and images
- Code blocks with syntax highlighting
- Blockquotes
- Tables (GitHub Flavored Markdown)

### Custom Styling

The blog system includes custom styling for:
- Code blocks with dark theme
- Responsive design
- Tag display
- Date formatting
- Author attribution

### URL Structure

Blog posts are accessible at:
- Blog listing: `/blog`
- Individual posts: `/blog/[slug]`

Where `[slug]` is the URL-friendly version of your post title.

## Example Posts

Check out the existing example posts:
- `src/content/blog/sample-post.md`
- `src/content/blog/physics-simulation.md`

These demonstrate the structure and features available.

## Tips

1. **Slugs**: Make sure each post has a unique slug in the metadata
2. **File Names**: Use descriptive, URL-friendly file names for your `.md` files
3. **Images**: Place images in the `public/` directory and reference them with `/image-name.jpg`
4. **Dates**: Use consistent date formatting (YYYY-MM-DD)
5. **Tags**: Keep tags lowercase and use hyphens for multi-word tags

## Development

The blog system uses:
- Next.js App Router for routing
- React Markdown for rendering
- Gray Matter for frontmatter parsing
- Tailwind CSS for styling
- GitHub Flavored Markdown support
