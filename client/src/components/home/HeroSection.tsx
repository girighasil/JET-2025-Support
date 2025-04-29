import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Skeleton } from "@/components/ui/skeleton";

export default function HeroSection() {
  const { config, isLoading } = useSiteConfig();

  // Default values if config isn't loaded yet
  const hero = config.hero || {
    title: "JET-2025 <br/> (JOINT ENTRANCE TEST)",    
    subtitle: "For Admission to Under Graduate Programmes in Agriculture & Allied Sciences in Rajasthan.",
    primaryButtonText: "Explore Courses",
    primaryButtonUrl: "https://jetskrau2025.com/",
    secondaryButtonText: "Try Free Demo",
    secondaryButtonUrl: "#doubt-classes", // Updated URL for Try Free Demo
    backgroundImage: "https://raubikaner.org/wp-content/themes/theme2/images/untitled_12.jpg"
  };

  return (
    <section id="home" className="bg-gradient-to-r from-amber-50 to-amber-100 text-gray-800">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center space-y-3">
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
              <>                               <h1 className="font-bold text-xl md:text-4xl lg:text-5xl mb-4 text-center"> {/* Added text-center */}
                  <a href={hero.secondaryButtonUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"> {/* Added link */}
                    {hero.title}
                  </a>
                </h1>
                <h5
                  className="text-xm font-bold text-center mb-2 text-gray-800">
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
              <h1 className="text-3xl sm:text-xl font-bold mb-3 text-amber-900 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mr-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.465 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                Coming Soon
              </h1>
              <h3 className="text-center text-sm text-amber-700 mb-6">Stay tuned for updates</h3>

              <div className="flex flex-col items-center justify-center my-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-amber-800 mb-4">
                  JET 2025 Online Application Form
                </h2>
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