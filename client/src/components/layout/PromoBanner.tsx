import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePromoBanners } from '@/hooks/use-site-config';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { banners, isLoading } = usePromoBanners();

  // Get announcement texts from active banners
  const announcements = banners && banners.length > 0 
    ? banners
        .filter(banner => banner.isActive)
        .sort((a, b) => a.order - b.order)
        .map(banner => banner.text)
    : [];

  // Set up auto rotation between announcements
  const [currentIndex, setCurrentIndex] = useState(0);

  // Close the banner
  const closeBanner = () => {
    setIsVisible(false);
    
    // Remember user closed the banner for this session
    sessionStorage.setItem('promoBannerClosed', 'true');
  };

  // Navigate to next announcement
  const nextAnnouncement = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
  };

  // Navigate to previous announcement
  const prevAnnouncement = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + announcements.length) % announcements.length);
  };

  // Auto rotate announcements
  useEffect(() => {
    // Check if user closed the banner previously in this session
    const isClosed = sessionStorage.getItem('promoBannerClosed') === 'true';
    if (isClosed) {
      setIsVisible(false);
      return;
    }
    
    const interval = setInterval(() => {
      nextAnnouncement();
    }, 7500);
    
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (!isVisible || isLoading || announcements.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2 relative overflow-hidden border-b border-white/10 w-full">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(white,_transparent_60%)] bg-left"></div>
      </div>
      <div className="responsive-container relative">
        <div className="flex items-center justify-center">
          <div className="hidden sm:block mr-2 flex-shrink-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          
          <button
            onClick={prevAnnouncement}
            className="hidden sm:flex p-1 rounded-full hover:bg-white/20 transition-colors mr-2 z-10 flex-shrink-0"
            aria-label="Previous announcement"
          >
            <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          
          <div className="overflow-hidden max-w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-center font-medium text-xs sm:text-sm"
              >
                <div className="relative sm:static">
                  {/* Mobile scrolling text */}
                  <div className="sm:hidden block overflow-hidden">
                    <div className="inline-block whitespace-nowrap overflow-x-hidden w-full">
                      <motion.div
                        animate={{
                          x: ["100%", "-100%"],
                        }}
                        transition={{
                          x: {
                            repeat: Infinity,
                            duration: 25,
                            ease: "linear",
                          },
                        }}
                        className="inline-block"
                      >
                        {announcements[currentIndex]}
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Desktop static text */}
                  <div className="hidden sm:block overflow-hidden text-ellipsis">
                    <strong>Important Alert:</strong> {announcements[currentIndex]}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <button
            onClick={nextAnnouncement}
            className="hidden sm:flex p-1 rounded-full hover:bg-white/20 transition-colors mx-2 z-10 flex-shrink-0"
            aria-label="Next announcement"
          >
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          
          {/* <button 
            onClick={closeBanner}
            className="p-1 rounded-full hover:bg-white/20 transition-colors z-10 flex-shrink-0 ml-2 sm:ml-0"
            aria-label="Close banner"
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>*/}
        </div>
        
        {/* Indicators */}
        {announcements.length > 1 && (
          <div className="flex justify-center space-x-1 mt-1">
            {announcements.map((_, index) => (
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