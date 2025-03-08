'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import content from '@/config/content.json';

const Navigation = () => {
  const pathname = usePathname();
  const { personal } = content;
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="flex items-center justify-between py-4 border-b border-gray-200">
      <div className="text-2xl font-bold">
        <Link href="/">{personal.name}</Link>
      </div>
      <div className="flex space-x-6">
        <Link 
          href="/about"
          className={`${isActive('/about') ? 'text-black font-medium' : 'text-gray-500'} hover:text-black`}
        >
          About
        </Link>
        <Link 
          href="/projects"
          className={`${isActive('/projects') ? 'text-black font-medium' : 'text-gray-500'} hover:text-black`}
        >
          Projects
        </Link>
        <Link 
          href="/blog"
          className={`${isActive('/blog') ? 'text-black font-medium' : 'text-gray-500'} hover:text-black`}
        >
          Blog
        </Link>
        {/* <Link 
          href="/contact"
          className={`${isActive('/contact') ? 'text-black font-medium' : 'text-gray-500'} hover:text-black`}
        >
          Contact
        </Link> */}
      </div>
    </nav>
  );
};

export default Navigation; 