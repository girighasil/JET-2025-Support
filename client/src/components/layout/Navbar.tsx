import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import MobileMenu from './MobileMenu';
import PromoBanner from './PromoBanner';
import { SquareRadical, BarChart4, LogOut } from 'lucide-react';
import { useSiteConfig } from '@/hooks/use-site-config';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { config, isLoading } = useSiteConfig();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  // Define types for navigation links
  type NavLink = {
    title: string;
    path: string;
  };
  
  // Default values if config isn't loaded yet
  const siteTitle = config?.siteTitle || 'Maths Magic Town';
  const instituteName = config?.instituteName || 'Maths Magic Town';
  const tagline = config?.tagline || 'Your Path to Success in Competitive Exams';
  const logoUrl = config?.logoUrl || '';
  const useCustomLogo = config?.useCustomLogo || false;
  const navLinks: NavLink[] = config?.navLinks || [
    { title: 'Home', path: '#home' },
    { title: 'Courses', path: '#courses' },
    { title: 'Doubt Classes', path: '#doubt-classes' },
    { title: 'Practice Tests', path: '#practice-tests' },
    { title: 'Success Stories', path: '#testimonials' },
    { title: 'Contact', path: '#contact' }
  ];

  return (
    <header className={`sticky top-0 bg-white z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
      <nav className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            {isLoading ? (
              <Skeleton className="h-10 w-40 bg-gray-200" />
            ) : (
              <>
                {useCustomLogo && logoUrl ? (
                  <div className="h-10 mr-3">
                    <img 
                      src={logoUrl} 
                      alt={instituteName} 
                      className="h-full w-auto object-contain" 
                    />
                  </div>
                ) : (
                  <div className="bg-primary rounded-lg p-2 mr-3">
                    <SquareRadical className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-primary">{instituteName}</span>
                  <span className="text-xs text-gray-600">{tagline}</span>
                </div>
              </>
            )}
          </Link>
        </div>
        
        <button 
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="hidden md:flex flex-col md:flex-row w-full md:w-auto md:items-center mt-4 md:mt-0">
          <ul className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-2 md:space-y-0">
            {navLinks.map((link: NavLink, index: number) => (
              <li key={index}>
                <a 
                  href={link.path} 
                  className="font-medium hover:text-primary transition-colors duration-200"
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 md:mt-0 md:ml-8 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-primary/30">
                        <AvatarFallback className="text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block font-medium">{user.fullName || user.username}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                    <BarChart4 className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      logoutMutation.mutate();
                      navigate('/');
                    }}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={() => navigate('/auth')}
                >
                  Login
                </Button>
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => navigate('/auth')}
                >
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
      
      <PromoBanner />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={toggleMobileMenu} links={navLinks} />
    </header>
  );
}
