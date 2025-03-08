import Link from "next/link";
import Image from "next/image";
import { projects } from "@/data/projects";
import ThermalThumbnail from "@/components/common/ThermalThumbnail";
import content from "@/config/content.json";

export default function Home() {
  const { personal } = content;
  
  return (
    <div className="py-12">
      <div className="w-full p-6">
        <h1 className="text-4xl font-bold mb-8">About Me</h1>
        <div className="flex flex-col md:flex-row md:items-start md:space-x-8 space-y-8 md:space-y-0">
          <div className="w-full md:w-1/3">
            <div className="w-full aspect-square rounded-lg relative overflow-hidden">
              {/* Profile photo with gradient overlay */}
              <div className="relative w-full h-full">
                <Image 
                  src="/profilePhoto2.JPG" 
                  alt={`${personal.name}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-lg"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 rounded-lg" style={{
                  background: 'linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,154,0,0.2), rgba(208,222,33,0.2), rgba(79,220,74,0.2), rgba(63,218,216,0.2), rgba(47,201,226,0.2), rgba(28,127,238,0.2), rgba(95,21,242,0.2))',
                  boxShadow: '0 0 20px rgba(255,0,0,0.2), 0 0 40px rgba(79,220,74,0.1), 0 0 60px rgba(28,127,238,0.05), inset 0 0 50px rgba(95,21,242,0.1)'
                }}></div>
                
                {/* Glass effect overlay */}
                <div className="absolute inset-0 glass-effect opacity-30 rounded-lg"></div>
                
                {/* Light reflection */}
                <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-lg light-reflection opacity-40"></div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3">
            <p className="text-lg mb-4">
              {personal.bio.short}
            </p>
            <p className="text-lg mb-4">
              {personal.bio.extended[1]}
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              {personal.skills.slice(0, 3).map((skill, index) => (
                <div key={index} className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">
                  {skill}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link 
                href="/about"
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 inline-block"
              >
                More About Me
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.slice(0, 3).map(project => (
            <div key={project.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 relative group">
              <ThermalThumbnail type={project.thumbnail} />
              <div className="p-6 relative">
                {/* Glass card effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 glass-card"></div>
                <h2 className="text-xl font-bold mb-2 relative z-10">{project.title}</h2>
                <p className="text-gray-700 mb-4 relative z-10">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                  {project.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link 
                  href={`/projects/${project.id}`}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 relative z-10 inline-block"
                >
                  View Project
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link 
            href="/projects"
            className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 inline-block"
          >
            View All Projects
          </Link>
        </div>
      </div>
    </div>
  );
} 