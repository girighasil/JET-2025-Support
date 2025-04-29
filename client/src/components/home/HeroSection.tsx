import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { SquareRadical, Youtube, MessageCircle } from "lucide-react";
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
            className="md:w-1/2 mb-6 md:mb-0"
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
                <div className="flex items-center gap-2 sm:gap-4 justify-center gap-4"><div>
                  <Link href="/student/tests">
                    <Button                      
                      size="sm"
                      className="w-full text-xs sm:text-sm bg-primary hover:bg-gray-900 text-stone-50 flex items-center justify-center gap-2"
                    >
                      Demo test
                    </Button>
                  </Link>
                  </div>
                  <div>
                    <Button
                      size="sm"
                      className="w-full text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.preventDefault();

                        // Force the correct YouTube channel URL with subscription confirmation
                        const youtubeUrl = "https://www.youtube.com/@JET2025Support?sub_confirmation=1";

                        // Open in new window with correct security attributes
                        const newWindow = window.open(
                          youtubeUrl, 
                          '_blank', 
                          'noopener,noreferrer'
                        );

                        // Additional security for older browsers
                        if (newWindow) {
                          newWindow.opener = null;
                        }

                        // Log for debugging
                        console.log("Opening YouTube URL:", youtubeUrl);
                      }}
                    >
                      <Youtube className="h-4 w-4" />
                      Subscribe
                    </Button>
                  </div>
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