import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import HeroSection from "@/components/home/HeroSection";
import { useSiteConfig } from '@/hooks/use-site-config';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { config } = useSiteConfig();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'student') {
        setLocation('/student/dashboard');
      } else {
        setLocation('/admin/dashboard');
      }
    }
  }, [user, isLoading, setLocation]);

  // Hero section for landing page using the updated HeroSection component
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Navigation - updated with site config */}
      <nav className="w-full border-b border-border bg-white">
        <div className="responsive-container py-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold flex-shrink-0">
              {config?.examInfo?.name?.charAt(0) || 'J'}
            </div>
            <span className="text-lg sm:text-xl font-bold truncate">{config?.siteTitle || 'JET 2025'}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">Sign In</Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button size="sm" className="text-xs sm:text-sm">Register</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Using the updated component */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50 w-full">
        <div className="responsive-container">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Why Choose Maths Magic Town?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Comprehensive Courses</h3>
              <p className="text-sm sm:text-base text-gray-600">Well-structured courses designed by expert educators covering all essential math topics for competitive exams.</p>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Adaptive Test Series</h3>
              <p className="text-sm sm:text-base text-gray-600">Practice with tests that adapt to your skill level, providing targeted questions to improve your weak areas.</p>
            </div>
            
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">On-Demand Doubt Sessions</h3>
              <p className="text-sm sm:text-base text-gray-600">Schedule personalized sessions with expert teachers to clear your doubts and strengthen your understanding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 md:py-20 bg-white w-full">
        <div className="responsive-container">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">What Our Students Say</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-border">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">Rohit Sharma</h4>
                  <p className="text-xs sm:text-sm text-gray-500">IIT-JEE Aspirant</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">"The practice tests helped me identify my weak areas in calculus. After focused practice, I saw significant improvement in my scores."</p>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-border">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">Priya Patel</h4>
                  <p className="text-xs sm:text-sm text-gray-500">NEET Aspirant</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">"The doubt sessions were extremely helpful. The teachers explained complex concepts in simple ways that made everything click for me."</p>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-border">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">Amit Kumar</h4>
                  <p className="text-xs sm:text-sm text-gray-500">Bank Exam Aspirant</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">"The quantitative aptitude course helped me master time-saving techniques. I was able to solve questions much faster in my practice tests."</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-primary text-white w-full">
        <div className="responsive-container text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ready to Start Your Learning Journey?</h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto">Join thousands of students who have improved their math skills and achieved success in competitive exams.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?tab=register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Register Now
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 w-full">
        <div className="responsive-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-primary font-bold flex-shrink-0">
                  {config?.examInfo?.name?.charAt(0) || 'J'}
                </div>
                <span className="text-lg sm:text-xl font-bold">{config?.siteTitle || 'JET 2025'}</span>
              </div>
              <p className="text-sm text-gray-400">{config?.tagline || 'Prepare for JET Entrance Exam'}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:col-span-3">
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Platform</h3>
                <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white">Courses</a></li>
                  <li><a href="#" className="hover:text-white">Test Series</a></li>
                  <li><a href="#" className="hover:text-white">Doubt Sessions</a></li>
                  <li><a href="#" className="hover:text-white">Analytics</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
                <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white">About Us</a></li>
                  <li><a href="#" className="hover:text-white">Our Teachers</a></li>
                  <li><a href="#" className="hover:text-white">Testimonials</a></li>
                  <li><a href="#" className="hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
                <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white">Refund Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} {config?.instituteName || 'Paras Education'}. All rights reserved.</p>
            {config?.footer?.phone && (
              <p className="mt-2">Contact: {config.footer.phone}</p>
            )}
            {config?.footer?.email && (
              <p className="mt-1">Email: {config.footer.email}</p>
            )}
            {config?.social?.whatsapp && (
              <div className="mt-4">
                <a 
                  href={config.social.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" className="sm:w-4 sm:h-4" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Join WhatsApp Group
                </a>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
