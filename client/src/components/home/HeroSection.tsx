import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Skeleton } from "@/components/ui/skeleton";

export default function HeroSection() {
  const { config, isLoading } = useSiteConfig();

  // Default values if config isn't loaded yet
  const hero = config.hero || {
    title: "Ace Your Math Competitive Exams",
    subtitle: "Personalized coaching, expert doubt resolution, and comprehensive practice tests for JEE, NEET, NDA, and more.",
    primaryButtonText: "Explore Courses",
    primaryButtonUrl: "https://jetskrau2025.com/",
    secondaryButtonText: "Try Free Demo",
    secondaryButtonUrl: "#doubt-classes", // Updated URL for Try Free Demo
    backgroundImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
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
              <>
                <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl mb-4 text-center"> {/* Added text-center */}
                  <a href={hero.secondaryButtonUrl} className="hover:text-primary transition-colors"> {/* Added link */}
                    {hero.title}
                  </a>
                </h1>
                <p className="text-lg mb-8 text-gray-700">
                  {hero.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button size="lg" className="bg-orange-200 text-primary hover:bg-orange-300">
                    <a href={hero.primaryButtonUrl}>{hero.primaryButtonText}</a>
                  </Button>
                  <Button size="lg" className="bg-[#D97706] hover:bg-[#B45309] text-white">
                    <a href={hero.secondaryButtonUrl}>{hero.secondaryButtonText}</a>
                  </Button>
                </div>
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
              <img 
                src={hero.backgroundImage} 
                alt="Students studying mathematics" 
                className="rounded-lg shadow-lg w-full h-auto object-cover"
              />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}