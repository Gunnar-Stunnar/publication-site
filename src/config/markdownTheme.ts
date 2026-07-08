// Markdown Theme Configuration
// Easily customize your blog's markdown styling here

export interface MarkdownTheme {
  // Heading colors and styles
  headings: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
  };
  
  // Text and content
  text: {
    paragraph: string;
    emphasis: string;
    strong: string;
    link: string;
    linkHover: string;
  };
  
  // Code styling
  code: {
    inline: string;
    block: string;
    blockText: string;
  };
  
  // Lists
  lists: {
    text: string;
    marker: string;
  };
  
  // Blockquotes
  blockquote: {
    border: string;
    background: string;
    text: string;
  };
  
  // Tables
  table: {
    headerBg: string;
    headerText: string;
    border: string;
    cellText: string;
  };
}

// Default theme (matching site's clean styling)
export const defaultTheme: MarkdownTheme = {
  headings: {
    h1: "text-4xl font-bold mt-8 mb-6 text-black",
    h2: "text-2xl font-bold mt-8 mb-4 text-black",
    h3: "text-xl font-bold mt-6 mb-3 text-black",
    h4: "text-lg font-bold mt-4 mb-2 text-black",
    h5: "text-base font-bold mt-3 mb-2 text-black",
    h6: "text-sm font-bold mt-2 mb-1 text-black",
  },
  text: {
    paragraph: "mb-4 text-gray-700 leading-relaxed text-lg",
    emphasis: "italic text-gray-800",
    strong: "font-bold text-black",
    link: "text-black border-b-2 border-black hover:border-gray-500 hover:text-gray-700 transition-colors",
    linkHover: "text-gray-700 border-gray-500",
  },
  code: {
    inline: "bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono border border-gray-300",
    block: "bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto border border-gray-700",
    blockText: "text-gray-100",
  },
  lists: {
    text: "mb-6 pl-6 text-gray-700 space-y-1",
    marker: "list-disc", // or "list-decimal" for ordered lists
  },
  blockquote: {
    border: "border-l-4 border-gray-300",
    background: "bg-gray-50",
    text: "pl-6 py-4 my-6 italic text-gray-700 rounded-r-lg",
  },
  table: {
    headerBg: "bg-gray-100",
    headerText: "text-black",
    border: "border border-gray-200",
    cellText: "text-gray-700",
  },
};

// Alternative theme: Blue/Tech theme
export const techTheme: MarkdownTheme = {
  headings: {
    h1: "text-3xl font-bold mt-8 mb-6 text-blue-900 border-b-2 border-blue-200 pb-2",
    h2: "text-2xl font-bold mt-8 mb-4 text-blue-800",
    h3: "text-xl font-bold mt-6 mb-3 text-blue-700",
    h4: "text-lg font-bold mt-4 mb-2 text-blue-600",
    h5: "text-base font-bold mt-3 mb-2 text-blue-600",
    h6: "text-sm font-bold mt-2 mb-1 text-blue-600",
  },
  text: {
    paragraph: "mb-4 text-gray-700 leading-relaxed text-lg",
    emphasis: "italic text-blue-800",
    strong: "font-bold text-blue-900",
    link: "text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-colors",
    linkHover: "text-blue-800 decoration-blue-500",
  },
  code: {
    inline: "bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono",
    block: "bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto border border-blue-500",
    blockText: "text-gray-100",
  },
  lists: {
    text: "mb-6 pl-6 text-gray-700 space-y-1",
    marker: "list-disc",
  },
  blockquote: {
    border: "border-l-4 border-blue-300",
    background: "bg-blue-50",
    text: "pl-6 py-4 my-6 italic text-gray-700 rounded-r-lg",
  },
  table: {
    headerBg: "bg-blue-100",
    headerText: "text-blue-900",
    border: "border border-gray-300",
    cellText: "text-gray-700",
  },
};

// Dark theme
export const darkTheme: MarkdownTheme = {
  headings: {
    h1: "text-3xl font-bold mt-8 mb-6 text-gray-100 border-b-2 border-gray-600 pb-2",
    h2: "text-2xl font-bold mt-8 mb-4 text-gray-200",
    h3: "text-xl font-bold mt-6 mb-3 text-gray-300",
    h4: "text-lg font-bold mt-4 mb-2 text-gray-400",
    h5: "text-base font-bold mt-3 mb-2 text-gray-400",
    h6: "text-sm font-bold mt-2 mb-1 text-gray-400",
  },
  text: {
    paragraph: "mb-4 text-gray-300 leading-relaxed text-lg",
    emphasis: "italic text-gray-200",
    strong: "font-bold text-gray-100",
    link: "text-blue-400 hover:text-blue-300 underline decoration-blue-500 hover:decoration-blue-400 transition-colors",
    linkHover: "text-blue-300 decoration-blue-400",
  },
  code: {
    inline: "bg-gray-800 text-gray-200 px-2 py-1 rounded text-sm font-mono",
    block: "bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto border border-gray-700",
    blockText: "text-gray-100",
  },
  lists: {
    text: "mb-6 pl-6 text-gray-300 space-y-1",
    marker: "list-disc",
  },
  blockquote: {
    border: "border-l-4 border-gray-600",
    background: "bg-gray-800",
    text: "pl-6 py-4 my-6 italic text-gray-300 rounded-r-lg",
  },
  table: {
    headerBg: "bg-gray-800",
    headerText: "text-gray-200",
    border: "border border-gray-600",
    cellText: "text-gray-300",
  },
};
