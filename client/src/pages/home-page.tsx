import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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

  // Hero section for landing page
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="w-full border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
              M
            </div>
            <span className="text-xl font-bold">Maths Magic Town</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Personalized learning for competitive exam preparation
            </h1>
            <p className="text-lg text-gray-600">
              Master mathematics with interactive courses, personalized practice tests, and on-demand doubt sessions. Track your progress and achieve your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth?tab=register">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1588072432836-e10032774350?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
              alt="Student studying mathematics" 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Maths Magic Town?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Courses</h3>
              <p className="text-gray-600">Well-structured courses designed by expert educators covering all essential math topics for competitive exams.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Adaptive Test Series</h3>
              <p className="text-gray-600">Practice with tests that adapt to your skill level, providing targeted questions to improve your weak areas.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">On-Demand Doubt Sessions</h3>
              <p className="text-gray-600">Schedule personalized sessions with expert teachers to clear your doubts and strengthen your understanding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Students Say</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div>
                  <h4 className="font-semibold">Rohit Sharma</h4>
                  <p className="text-sm text-gray-500">IIT-JEE Aspirant</p>
                </div>
              </div>
              <p className="text-gray-600">"The practice tests helped me identify my weak areas in calculus. After focused practice, I saw significant improvement in my scores."</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div>
                  <h4 className="font-semibold">Priya Patel</h4>
                  <p className="text-sm text-gray-500">NEET Aspirant</p>
                </div>
              </div>
              <p className="text-gray-600">"The doubt sessions were extremely helpful. The teachers explained complex concepts in simple ways that made everything click for me."</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div>
                  <h4 className="font-semibold">Amit Kumar</h4>
                  <p className="text-sm text-gray-500">Bank Exam Aspirant</p>
                </div>
              </div>
              <p className="text-gray-600">"The quantitative aptitude course helped me master time-saving techniques. I was able to solve questions much faster in my practice tests."</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join thousands of students who have improved their math skills and achieved success in competitive exams.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?tab=register">
              <Button size="lg" variant="secondary">
                Register Now
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="md:w-1/3">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-primary font-bold">
                  M
                </div>
                <span className="text-xl font-bold">Maths Magic Town</span>
              </div>
              <p className="text-gray-400">Personalized learning for competitive exam preparation</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Platform</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Courses</a></li>
                  <li><a href="#" className="hover:text-white">Test Series</a></li>
                  <li><a href="#" className="hover:text-white">Doubt Sessions</a></li>
                  <li><a href="#" className="hover:text-white">Analytics</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">About Us</a></li>
                  <li><a href="#" className="hover:text-white">Our Teachers</a></li>
                  <li><a href="#" className="hover:text-white">Testimonials</a></li>
                  <li><a href="#" className="hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white">Refund Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Maths Magic Town. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
