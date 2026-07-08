# Markdown Styling Customization Guide

Your blog system now has a flexible theming system that allows you to easily customize how markdown content is rendered. Here's how to use it:

## Quick Theme Changes

### Using Pre-built Themes

You can switch between themes by passing a `theme` prop to the `MarkdownRenderer` component:

```tsx
// In your blog post page (src/app/blog/[slug]/page.tsx)
<MarkdownRenderer content={post.content} theme="default" />  // Purple theme
<MarkdownRenderer content={post.content} theme="tech" />     // Blue theme  
<MarkdownRenderer content={post.content} theme="dark" />     // Dark theme
```

### Available Pre-built Themes

1. **Default Theme** (`'default'`): Purple/physics theme with clean styling
2. **Tech Theme** (`'tech'`): Blue color scheme, great for technical content
3. **Dark Theme** (`'dark'`): Dark background theme for night reading

## Custom Themes

### Method 1: Modify Existing Themes

Edit the theme configurations in `src/config/markdownTheme.ts`:

```typescript
// Modify the defaultTheme object
export const defaultTheme: MarkdownTheme = {
  headings: {
    h1: "text-4xl font-bold mt-10 mb-8 text-red-900 border-b-4 border-red-300 pb-3",
    // ... other headings
  },
  // ... other properties
};
```

### Method 2: Create a New Theme

Add a new theme to `markdownTheme.ts`:

```typescript
export const customTheme: MarkdownTheme = {
  headings: {
    h1: "text-3xl font-bold mt-8 mb-6 text-green-900 border-b-2 border-green-200 pb-2",
    h2: "text-2xl font-bold mt-8 mb-4 text-green-800",
    // ... continue for h3-h6
  },
  text: {
    paragraph: "mb-4 text-gray-800 leading-relaxed text-lg",
    emphasis: "italic text-green-800",
    strong: "font-bold text-green-900",
    link: "text-green-600 hover:text-green-800 underline",
    linkHover: "text-green-800",
  },
  // ... continue with other properties
};
```

Then use it:

```tsx
import { customTheme } from '@/config/markdownTheme';

<MarkdownRenderer content={post.content} theme={customTheme} />
```

### Method 3: Inline Custom Theme

Pass a theme object directly:

```tsx
const myTheme = {
  headings: {
    h1: "text-4xl font-extrabold text-orange-900 mb-8",
    // ... other properties
  },
  // ... rest of theme
};

<MarkdownRenderer content={post.content} theme={myTheme} />
```

## Styling Individual Elements

### Headings
Control all heading styles through the `headings` object:
- `h1` through `h6`: Tailwind CSS classes for each heading level

### Text Elements
- `paragraph`: Main body text styling
- `emphasis`: Italic text (`*text*`)
- `strong`: Bold text (`**text**`)
- `link`: Link styling and hover effects

### Code Styling
- `inline`: Inline code styling (`` `code` ``)
- `block`: Code block container styling
- `blockText`: Text color inside code blocks

### Lists and Quotes
- `lists.text`: List container styling
- `lists.marker`: List bullet/number styling
- `blockquote.border`: Left border of blockquotes
- `blockquote.background`: Background color
- `blockquote.text`: Text styling

### Tables
- `table.headerBg`: Header row background
- `table.headerText`: Header text color
- `table.border`: Table border styling
- `table.cellText`: Regular cell text color

## Advanced Customization

### Adding Custom CSS Classes

You can also add custom CSS in `src/styles/markdown.css` and apply them:

```css
/* Custom physics equation styling */
.physics-equation {
  @apply bg-blue-50 p-4 border-l-4 border-blue-400 my-6 rounded-r-lg;
}

.physics-equation::before {
  content: "📐 ";
  @apply text-blue-600;
}
```

Then use it in your markdown:

```markdown
<div class="physics-equation">
E = mc²
</div>
```

### Per-Post Themes

You can set different themes for different blog posts by modifying the blog post metadata:

```typescript
// In src/data/blogPosts.ts
export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Physics Post",
    theme: "default", // Use default purple theme
    // ... other fields
  },
  {
    id: "2", 
    title: "Tech Tutorial",
    theme: "tech", // Use blue tech theme
    // ... other fields
  }
];
```

Then in your blog post page:

```tsx
<MarkdownRenderer 
  content={post.content} 
  theme={post.theme || 'default'} 
/>
```

## Common Customizations

### Change Color Scheme
Update the color classes in your theme. For example, to switch from purple to orange:

```typescript
// Change all purple-* classes to orange-*
h1: "text-3xl font-bold mt-8 mb-6 text-orange-900 border-b-2 border-orange-200 pb-2"
```

### Adjust Typography
Modify font sizes, weights, and spacing:

```typescript
h1: "text-5xl font-extrabold mt-12 mb-8 text-purple-900" // Larger, bolder
paragraph: "mb-6 text-gray-700 leading-loose text-xl"     // Bigger text, more spacing
```

### Custom Code Block Styling
Modify the code block appearance:

```typescript
code: {
  block: "bg-black text-green-400 p-8 rounded-xl border-2 border-green-500", // Matrix theme
  inline: "bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full font-bold"   // Highlight style
}
```

## Tips

1. **Preview Changes**: Use the development server (`npm run dev`) to see changes in real-time
2. **Consistent Colors**: Stick to a consistent color palette across your theme
3. **Accessibility**: Ensure sufficient contrast between text and background colors
4. **Mobile**: Test your styling on mobile devices - consider responsive classes
5. **Performance**: Avoid overly complex CSS that might slow down rendering

## Example: Creating a Physics Theme

```typescript
export const physicsTheme: MarkdownTheme = {
  headings: {
    h1: "text-3xl font-bold mt-8 mb-6 text-blue-900 border-b-2 border-blue-300 pb-2 relative",
    h2: "text-2xl font-semibold mt-8 mb-4 text-blue-800",
    h3: "text-xl font-semibold mt-6 mb-3 text-blue-700",
    // ... rest
  },
  text: {
    paragraph: "mb-4 text-gray-700 leading-relaxed text-lg font-light",
    strong: "font-bold text-blue-900 bg-blue-50 px-1 rounded",
    emphasis: "italic text-blue-800",
    link: "text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-all duration-200",
  },
  code: {
    inline: "bg-gray-100 text-blue-800 px-2 py-1 rounded text-sm font-mono border border-gray-300",
    block: "bg-gray-900 text-gray-100 p-6 rounded-lg border-l-4 border-blue-500 shadow-lg",
  },
  // ... continue with other elements
};
```

This gives you complete control over how your markdown content appears!
