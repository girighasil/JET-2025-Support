import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Skeleton } from "@/components/ui/skeleton";

export default function HeroSection() {
  const { config, isLoading } = useSiteConfig();

  // Default values if config isn't loaded yet
  const hero = config.hero || {
    title: "Joint Entrance Test-2025",    
    subtitle: "For Admission to Under Graduate Programmes in Agriculture & Allied Sciences in Rajasthan.",
    primaryButtonText: "Explore Courses",
    primaryButtonUrl: "https://jetskrau2025.com/",
    secondaryButtonText: "Try Free Demo",
    secondaryButtonUrl: "#doubt-classes", // Updated URL for Try Free Demo
    backgroundImage: "https://raubikaner.org/wp-content/themes/theme2/images/untitled_12.jpg"
  };

  return (
    <section id="home" className="bg-gradient-to-r from-amber-50 to-amber-100 text-gray-800">
      <div className="container mx-auto px-2 py-8 md:py-24">
        <div className="flex flex-col md:flex-row items-center space-y-4">
          
          <motion.div 
            className="md:w-1/2 mb-10 md:mb-0"
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
                <h2 className="text-center text-xl text-gray-900 mb-4">A complete guide for</h2>
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-amber-900 mb-4 whitespace-pre-line">                   
                  {hero.title}
                </h1>
                
                <p className="text-gray-700 text-center mb-6">
                  {hero.subtitle}
                </p>
                <h5
                  className="text-xm font-bold text-center mb-4 text-gray-600">
                  "Conducted by:
                    SKRAU
                    Bikaner"
                </h5>
                                   
                      <img 
                        src={hero.backgroundImage} 
                        alt="Students studying mathematics" 
                        className="rounded-lg shadow-lg w-full h-auto object-cover"
                      />                                  
              </>
            )}
          </motion.div>
          <motion.div 
            className="md:w-1/2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isLoading ? (
              <Skeleton className="h-64 w-full bg-white/20 rounded-lg" />
            ) : (
            <div className="bg-gradient-to-b from-amber-50 to-amber-100 p-6 sm:p-6 ">                          

              <div className="flex flex-col items-center justify-center my-4">                
                <p className="text-gray-700 text-center font-bold mb-6">
                  For
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-amber-800 mb-4">
                  JET-2025
                </h2>
                <h1 className="text-3xl sm:text-xl font-bold mb-3 text-amber-900 flex items-center justify-center">
                                  Coming Soon
                </h1>
                <p className="text-gray-700 text-center mb-6">
                  The online application form will be available soon. Please check back later.
                </p>
                <div className="w-full max-w-xs">
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    disabled
                  >
                    Apply Online (Coming Soon)
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-6">
                  Registration link will be activated soon. Stay connected for further updates.
                </p>
              </div>
            </div>
            )}
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}