import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Bell, PauseCircle, PlayCircle } from 'lucide-react';
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
  const { banners = [], isLoading } = usePromoBanners();
  const [isPaused, setIsPaused] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Get announcement texts from active banners - memoized to prevent unnecessary re-renders
  const announcements = useMemo(() => {
    if (!Array.isArray(banners) || banners.length === 0) return [];
    
    return banners
      .filter((banner: Banner) => banner.isActive)
      .sort((a: Banner, b: Banner) => a.order - b.order)
      .map((banner: Banner) => banner.text);
  }, [banners]);

  // Set up auto rotation between announcements
  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigate to next announcement
  const nextAnnouncement = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    // Reset animation
    setAnimationKey(prev => prev + 1);
  };

  // Navigate to previous announcement
  const prevAnnouncement = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + announcements.length) % announcements.length);
    // Reset animation
    setAnimationKey(prev => prev + 1);
  };

  // Toggle animation pause
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Auto rotate announcements - only if not paused
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      nextAnnouncement();
    }, 15000); // 15 seconds per announcement
    
    return () => clearInterval(interval);
  }, [announcements.length, isPaused]);

  // If no banners or loading, render a placeholder to prevent layout shifts
  if (isLoading) {
    return (
      <div className="h-8 bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse"></div>
    );
  }
  
  if (announcements.length === 0) return null;

  // The current announcement text
  const currentAnnouncement = announcements[currentIndex];
  
  // Fixed duration for consistent animation speed  
  const animationDuration = 15; // 15 seconds

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-1 relative overflow-hidden border-b border-white/10 w-full fixed top-0 left-0 right-0 z-[60]" ref={bannerRef}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(white,_transparent_60%)] bg-left"></div>
      </div>
      
      <div className="responsive-container relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-4 w-4 sm:h-4 sm:w-4 mr-1" />
            
            {/* Navigation controls - desktop only */}
            <div className="hidden sm:flex items-center space-x-1">
              <button
                onClick={prevAnnouncement}
                className="p-1 rounded-full hover:bg-white/20 transition-colors z-10 flex-shrink-0"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              
              <button
                onClick={togglePause}
                className="p-1 rounded-full hover:bg-white/20 transition-colors z-10 flex-shrink-0"
                aria-label={isPaused ? "Resume announcements" : "Pause announcements"}
              >
                {isPaused ? (
                  <PlayCircle className="h-3.5 w-3.5" />
                ) : (
                  <PauseCircle className="h-3.5 w-3.5" />
                )}
              </button>
              
              <button
                onClick={nextAnnouncement}
                className="p-1 rounded-full hover:bg-white/20 transition-colors z-10 flex-shrink-0"
                aria-label="Next announcement"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          
          {/* Announcement content container */}
          <div className="overflow-hidden flex-1 mx-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`announcement-${currentIndex}-${animationKey}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="font-medium text-xs sm:text-sm overflow-hidden"
              >
                {/* Mobile: Smooth ticker animation */}
                <div className="sm:hidden block overflow-hidden w-full">
                  <div className="whitespace-nowrap overflow-x-hidden w-full">
                    <motion.div
                      animate={isPaused ? { x: 0 } : {
                        x: ["100%", "-100%"]
                      }}
                      transition={isPaused ? {} : {
                        x: {
                          repeat: 0,
                          duration: animationDuration,
                          ease: "linear"
                        }
                      }}
                      className="inline-block px-2"
                    >                       
                      {currentAnnouncement}
                    </motion.div>
                  </div>
                </div>
                
                {/* Desktop: Static text with proper line-wrapping */}
                <div className="hidden sm:block w-full text-center">
                  <strong className="text-white">Important Alert:</strong> {currentAnnouncement}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Mobile controls */}
          <div className="sm:hidden flex items-center space-x-1">
            <button
              onClick={togglePause}
              className="p-1 rounded-full hover:bg-white/20 transition-colors z-10 flex-shrink-0"
              aria-label={isPaused ? "Resume announcements" : "Pause announcements"}
            >
              {isPaused ? (
                <PlayCircle className="h-5 w-5" />
              ) : (
                <PauseCircle className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Indicators */}
        {announcements.length > 1 && (
          <div className="flex justify-center space-x-1 mt-1">
            {announcements.map((_: string, index: number) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setAnimationKey(prev => prev + 1);
                }}
                className={`h-0.5 transition-all ${
                  index === currentIndex 
                    ? "w-3 bg-white" 
                    : "w-1.5 bg-white/40 hover:bg-white/60"
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