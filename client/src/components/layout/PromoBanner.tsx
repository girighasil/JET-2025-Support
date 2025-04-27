import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, AlertTriangle, PauseCircle, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePromoBanners } from '@/hooks/use-site-config';

// Define banner type for type safety
type Banner = {
  id: number;
  text: string;
  isActive: boolean;
  order: number;
  url?: string;
};

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { banners, isLoading } = usePromoBanners();
  const [isPaused, setIsPaused] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Get announcement texts from active banners
  const announcements = Array.isArray(banners) && banners.length > 0 
    ? banners
        .filter((banner: Banner) => banner.isActive)
        .sort((a: Banner, b: Banner) => a.order - b.order)
        .map((banner: Banner) => banner.text)
    : [];

  // Set up auto rotation between announcements
  const [currentIndex, setCurrentIndex] = useState(0);

  // Close the banner
  const closeBanner = () => {
    setIsVisible(false);
    
    // Remember user closed the banner for this session
    localStorage.setItem('promoBannerClosed', 'true');
  };

  // Navigate to next announcement
  const nextAnnouncement = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
  };

  // Navigate to previous announcement
  const prevAnnouncement = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + announcements.length) % announcements.length);
  };

  // Toggle animation pause
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Check if banner was closed
  useEffect(() => {
    // Check if user closed the banner previously (using localStorage instead of sessionStorage)
    const isClosed = localStorage.getItem('promoBannerClosed') === 'true';
    if (isClosed) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, []);

  // Auto rotate announcements - only if not paused
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      nextAnnouncement();
    }, 20000); // Much longer duration for better readability
    
    return () => clearInterval(interval);
  }, [announcements.length, isPaused]);

  if (!isVisible || isLoading || announcements.length === 0) return null;

  // Calculate a reasonable duration based on the length of the announcement text
  const getScrollDuration = (text: string) => {
    // Base speed - roughly 6 characters per second (very slow reading)
    const baseSpeed = 6;
    const minDuration = 25; // Minimum duration in seconds
    
    // Calculate duration based on text length but never below minimum
    return Math.max(minDuration, Math.ceil(text.length / baseSpeed));
  };

  // The current announcement text
  const currentAnnouncement = announcements[currentIndex];
  
  // Duration for the current announcement
  const currentDuration = getScrollDuration(currentAnnouncement);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 relative overflow-hidden border-b border-white/10 w-full" ref={bannerRef}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(white,_transparent_60%)] bg-left"></div>
      </div>
      
      <div className="responsive-container relative">
        <div className="flex items-center justify-center">
          <div className="mr-2 flex-shrink-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          
          {/* Navigation controls - desktop only */}
          <div className="hidden sm:flex items-center mr-2">
            <button
              onClick={prevAnnouncement}
              className="p-1 rounded-full hover:bg-white/20 transition-colors mr-1 z-10 flex-shrink-0"
              aria-label="Previous announcement"
            >
              <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            
            <button
              onClick={togglePause}
              className="p-1 rounded-full hover:bg-white/20 transition-colors mx-1 z-10 flex-shrink-0"
              aria-label={isPaused ? "Resume announcements" : "Pause announcements"}
            >
              {isPaused ? (
                <PlayCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              ) : (
                <PauseCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              )}
            </button>
            
            <button
              onClick={nextAnnouncement}
              className="p-1 rounded-full hover:bg-white/20 transition-colors ml-1 z-10 flex-shrink-0"
              aria-label="Next announcement"
            >
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
          
          {/* Announcement content container */}
          <div className="overflow-hidden grow max-w-full mx-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="font-medium text-xs sm:text-sm overflow-hidden flex"
              >
                {/* Mobile: Ticker with pause-resume pattern */}
                <div className="sm:hidden block overflow-hidden w-full">
                  <div className="whitespace-nowrap overflow-x-hidden w-full relative">
                    <motion.div
                      animate={isPaused ? { x: 0 } : {
                        x: ["0%", "-5%", "-5%", "-100%", "-100%"],
                      }}
                      transition={isPaused ? {} : {
                        x: {
                          repeat: Infinity,
                          duration: currentDuration,
                          times: [0, 0.05, 0.15, 0.9, 1],
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }}
                      className="inline-block px-2"
                    >
                      <strong className="text-white mr-1">Important:</strong> 
                      {currentAnnouncement}
                    </motion.div>
                  </div>
                </div>
                
                {/* Desktop: Static text with proper line-wrapping */}
                <div className="hidden sm:block px-4 w-full">
                  <div className="max-w-4xl mx-auto">
                    <strong className="text-white">Important Alert:</strong> {currentAnnouncement}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Pause/Play button - mobile only */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={togglePause}
              className="p-1 rounded-full hover:bg-white/20 transition-colors z-10 flex-shrink-0 mr-2"
              aria-label={isPaused ? "Resume announcements" : "Pause announcements"}
            >
              {isPaused ? (
                <PlayCircle className="h-3.5 w-3.5" />
              ) : (
                <PauseCircle className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          
          {/* Close button */}
          <button 
            onClick={closeBanner}
            className="p-1 rounded-full hover:bg-white/20 transition-colors z-10 flex-shrink-0"
            aria-label="Close banner"
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
        
        {/* Indicators */}
        {announcements.length > 1 && (
          <div className="flex justify-center space-x-1 mt-1.5">
            {announcements.map((_: string, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-0.5 transition-all ${
                  index === currentIndex 
                    ? "w-2.5 sm:w-3 bg-white" 
                    : "w-1 sm:w-1.5 bg-white/40 hover:bg-white/60"
                } rounded-full`}
                aria-label={`Announcement ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}