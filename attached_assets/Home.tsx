import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PromoBanner from "@/components/layout/PromoBanner";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import CoursesSection from "@/components/courses/CoursesSection";
import DoubtClassSection from "@/components/doubt/DoubtClassSection";
import TestsSection from "@/components/tests/TestsSection";
import TestimonialsSection from "@/components/testimonials/TestimonialsSection";
import FaqSection from "@/components/faq/FaqSection";
import ContactSection from "@/components/contact/ContactSection";
import CTABanner from "@/components/common/CTABanner";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function Home() {
  // Pre-fetch data for faster rendering
  const { data: coursesData } = useQuery({ 
    queryKey: ['/api/courses'], 
    staleTime: 60000
  });
  
  const { data: testSeriesData } = useQuery({ 
    queryKey: ['/api/test-series'], 
    staleTime: 60000
  });
  
  const { data: testimonialsData } = useQuery({ 
    queryKey: ['/api/testimonials'], 
    staleTime: 60000
  });
  
  const { data: faqsData } = useQuery({ 
    queryKey: ['/api/faqs'], 
    staleTime: 60000
  });
  
  // Scroll to section on hash change
  useEffect(() => {
    const scrollToSection = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          window.scrollTo({
            top: element.getBoundingClientRect().top + window.scrollY - 80,
            behavior: 'smooth'
          });
        }
      }
    };
    
    scrollToSection();
    window.addEventListener('hashchange', scrollToSection);
    
    return () => {
      window.removeEventListener('hashchange', scrollToSection);
    };
  }, []);
  
  return (
    <>
      <Navbar />
      
      <main>
        <HeroSection />
        <StatsSection />
        <WhyChooseUs />
        <CoursesSection />
        <DoubtClassSection />
        <TestsSection />
        <TestimonialsSection />
        <FaqSection />
        <ContactSection />
        <CTABanner />
        
        {/* Admin Login Link */}
        <div className="py-8 bg-gray-50">
          <div className="container mx-auto text-center">
            <h3 className="text-lg font-medium mb-4">Admin Access</h3>
            <a 
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Admin Login
            </a>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
