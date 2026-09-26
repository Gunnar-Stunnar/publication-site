import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { defaultTheme, techTheme, darkTheme, MarkdownTheme } from '@/config/markdownTheme';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  theme?: 'default' | 'tech' | 'dark' | MarkdownTheme;
}

// Get theme object based on theme prop
function getTheme(theme?: 'default' | 'tech' | 'dark' | MarkdownTheme): MarkdownTheme {
  if (typeof theme === 'object') return theme;
  
  switch (theme) {
    case 'tech': return techTheme;
    case 'dark': return darkTheme;
    default: return defaultTheme;
  }
}

// Custom markdown components with theming
function createMarkdownComponents(theme: MarkdownTheme) {
  return {
    // Headings with custom styling
    h1: ({ children }: any) => (
      <h1 className={theme.headings.h1}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className={theme.headings.h2}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className={theme.headings.h3}>
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className={theme.headings.h4}>
        {children}
      </h4>
    ),
    h5: ({ children }: any) => (
      <h5 className={theme.headings.h5}>
        {children}
      </h5>
    ),
    h6: ({ children }: any) => (
      <h6 className={theme.headings.h6}>
        {children}
      </h6>
    ),

    // Paragraphs
    p: ({ children }: any) => (
      <p className={theme.text.paragraph}>
        {children}
      </p>
    ),

    // Code blocks and inline code
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !className;
      
      return !isInline && match ? (
        <div className="my-6 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 font-mono border-b border-gray-200">
            {match[1]}
          </div>
          <pre className={theme.code.block}>
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className={theme.code.inline} {...props}>
          {children}
        </code>
      );
    },

    // Lists
    ul: ({ children }: any) => (
      <ul className={`${theme.lists.text} ${theme.lists.marker}`}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className={`${theme.lists.text} list-decimal`}>
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-lg leading-relaxed">
        {children}
      </li>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className={`${theme.blockquote.border} ${theme.blockquote.background} ${theme.blockquote.text}`}>
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        className={theme.text.link}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),

    // Images (a .mp4/.webm src renders as a looping video, with a same-named .jpg as its poster)
    img: ({ src, alt }: any) => /\.(mp4|webm)$/i.test(src ?? '') ? (
      <span className="block my-6">
        <video
          src={src}
          poster={src.replace(/\.(mp4|webm)$/i, '.jpg')}
          aria-label={alt}
          autoPlay
          loop
          muted
          playsInline
          controls
          preload="metadata"
          className="rounded-lg shadow-lg max-w-full h-auto mx-auto"
        />
        {alt && (
          <span className="block text-center text-sm text-gray-500 mt-2 italic">
            {alt}
          </span>
        )}
      </span>
    ) : (
      <span className="block my-6">
        <img
          src={src}
          alt={alt}
          className="rounded-lg shadow-lg max-w-full h-auto mx-auto"
        />
        {alt && (
          <span className="block text-center text-sm text-gray-500 mt-2 italic">
            {alt}
          </span>
        )}
      </span>
    ),

    // Tables
    table: ({ children }: any) => (
      <div className="my-6 overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full bg-white">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className={theme.table.headerBg}>
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-gray-200">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-gray-50 transition-colors duration-200">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className={`px-6 py-3 text-left text-sm font-bold ${theme.table.headerText}`}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className={`px-6 py-3 text-sm ${theme.table.cellText}`}>
        {children}
      </td>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="my-8 border-t border-gray-200" />
    ),

    // Strong and emphasis
    strong: ({ children }: any) => (
      <strong className={theme.text.strong}>
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className={theme.text.emphasis}>
        {children}
      </em>
    ),
  };
}

export default function MarkdownRenderer({ content, className = "", theme = 'default' }: MarkdownRendererProps) {
  const selectedTheme = getTheme(theme);
  const components = createMarkdownComponents(selectedTheme);
  
  return (
    <div className={`prose prose-lg max-w-none markdown-content ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}