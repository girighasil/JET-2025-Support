import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";

export default function HeroSection() {
  const { config, isLoading } = useSiteConfig();

  // Default values if config isn't loaded yet
  const hero = config.hero || {
    title: "Joint Entrance Test-2025",    
    subtitle: "For Admission to Under Graduate Programmes in Agriculture & Allied Sciences in Rajasthan. Here you will get all support from application form to Exam preparation by accessing online test series and Courses",
    primaryButtonText: "Explore Courses",
    primaryButtonUrl: "https://jetskrau2025.com/",
    secondaryButtonText: "Try Free Demo",
    secondaryButtonUrl: "#doubt-classes", // Updated URL for Try Free Demo
    backgroundImage: "https://i.ytimg.com/vi/6FS2DgxUdj8/maxresdefault.jpg"
  };

  return (
    <section id="home" className="bg-gradient-to-r from-amber-50 to-orange-50 text-gray-800">
      <div className="container mx-auto px-1 py-6 md:py-12">
        <div className="flex flex-col md:flex-row items-center">
          
          <motion.div 
            className="md:w-1/2 mb-2 md:mb-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isLoading ? (
              <>
                <Skeleton className="h-12 w-3/4 bg-white/20 mb-4" />
                <Skeleton className="h-20 w-full bg-white/20 mb-8" />
                <div className="flex space-x-4">
                  <Skeleton className="h-12 w-32 bg-white/20" />
                  <Skeleton className="h-12 w-32 bg-white/20" />
                </div>
              </>
            ) : (
              <>            
                <h2 className="text-center text-xl text-primary mb-4">A complete guide for</h2>
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-amber-900 mb-4 whitespace-pre-line">                   
                  {hero.title}
                </h1>
                
                <p className="text-gray-700 text-center px-2 mb-6">
                  {hero.subtitle}
                </p> 
                <div className="flex flex-col md:flex-row mx-auto flex items-center gap-2 sm:gap-4 mx-auto">
                  <Link href="/auth">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth?tab=register">
                    <Button size="sm" className="text-xs sm:text-sm">
                      Register
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </motion.div>

          <motion.div 
            className="md:w-1/2 mb-4 md:mb-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isLoading ? (
              <>
                <Skeleton className="h-12 w-3/4 bg-white/20 mb-4" />
                <Skeleton className="h-20 w-full bg-white/20 mb-8" />
                <div className="flex space-x-4">
                  <Skeleton className="h-12 w-32 bg-white/20" />
                  <Skeleton className="h-12 w-32 bg-white/20" />
                </div>
              </>
            ) : (
              <>           

              <img 
                src={hero.backgroundImage} 
                alt="sknau, bikaner" 
                className="rounded-lg shadow-lg w-full h-object object-cover"              />                
              </>
            )}
          </motion.div> 
        </div>
      </div>
    </section>
  );
}