import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  // Fetch promotions from API
  const { data: fetchedAnnouncements, isLoading } = useQuery({
    queryKey: ['/api/promo-banners'],
    staleTime: 60000,
  });

  // Default announcements data (fallback)
  const defaultAnnouncements = [
    "📢 All the latest information regarding JET/Pre-PG/Ph.D. Entrance Exam 2025 will be made available on this website.",
    "📅 Important Dates: Application starts Feb 20, 2025 | Application ends March 30, 2025 | Exam Date: May 14, 2025",
    "🎓 Admission open for B.Sc. Agriculture, Horticulture, Forestry, Food Technology, and more programs",
    "📚 Before filling the application form, read all instructions in the JET Booklet-2025",
    "📞 Helpdesk available from 10am to 5pm - Contact for application assistance",
  ];

  // Use fetched announcements or fallback to defaults
  const announcements = Array.isArray(fetchedAnnouncements) && fetchedAnnouncements.length > 0 ? 
    fetchedAnnouncements.map((promo: any) => promo.text) : 
    defaultAnnouncements;

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
    }, 7000);
    
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (!isVisible || isLoading) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2 relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(white,_transparent_60%)] bg-left"></div>
      </div>
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-center">
          <div className="hidden sm:block mr-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          
          <button
            onClick={prevAnnouncement}
            className="hidden sm:flex p-1 rounded-full hover:bg-white/20 transition-colors mr-2 z-10"
            aria-label="Previous announcement"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          
          <div className="overflow-hidden w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center font-medium text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis"
              >
                <div className="relative sm:static">
                  <motion.span
                    className="inline-block sm:hidden"
                    animate={{
                      x: ["100%", "-100%"],
                    }}
                    transition={{
                      x: {
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear",
                      },
                    }}
                  >
                    {announcements[currentIndex]}
                  </motion.span>
                  <span className="hidden sm:inline">
                    <strong>Important Alert:</strong> {announcements[currentIndex]}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <button
            onClick={nextAnnouncement}
            className="hidden sm:flex p-1 rounded-full hover:bg-white/20 transition-colors mx-2 z-10"
            aria-label="Next announcement"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          
          <button 
            onClick={closeBanner}
            className="p-1 rounded-full hover:bg-white/20 transition-colors z-10"
            aria-label="Close banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {/* Indicators */}
        <div className="flex justify-center space-x-1 mt-1">
          {announcements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-0.5 transition-all ${
                index === currentIndex 
                  ? "w-3 bg-white" 
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              } rounded-full`}
              aria-label={`Announcement ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}