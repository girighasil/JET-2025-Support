import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import MobileMenu from "./MobileMenu";
import PromoBanner from "./PromoBanner";
import { SquareRadical, BarChart4, LogOut, Home } from "lucide-react";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { config, isLoading } = useSiteConfig();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  // Define types for navigation links
  type NavLink = {
    title: string;
    path: string;
  };

  // Default values if config isn't loaded yet
  const siteTitle = config?.siteTitle || "Maths Magic Town";
  const instituteName = config?.instituteName || "Maths Magic Town";
  const tagline =
    config?.tagline || "Your Path to Success in Competitive Exams";
  const logoUrl = config?.logoUrl || "";
  const useCustomLogo = config?.useCustomLogo || false;

  // Refetch config when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);
  const navLinks: NavLink[] = config?.navLinks || [
    { title: "Home", path: "#home" },
    { title: "Courses", path: "#courses", className: "hover:underline" },
    { title: "Doubt Classes", path: "#doubt-classes" },
    { title: "Practice Tests", path: "#practice-tests" },
    { title: "Success Stories", path: "#testimonials" },
    { title: "Contact", path: "#contact" },
  ];

  return (
    <header
      className={`sticky top-0 bg-white z-50 transition-shadow duration-300 ${isScrolled ? "shadow-md" : ""}`}
    >
      <nav className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            {isLoading ? (
              <Skeleton className="h-10 w-40 bg-gray-200" />
            ) : (
              <>
                <button onClick={toggleMobileMenu} aria-label="Toggle menu">
                  {useCustomLogo && logoUrl ? (
                    <div className="h-10 mr-3">
                      <img
                        src={logoUrl}
                        alt={instituteName}
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-primary rounded-full p-2 mr-3">
                      <SquareRadical className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold">
                    {instituteName}
                  </span>
                  <span className="text-xs text-gray-600">{tagline}</span>
                </div>
              </>
            )}
          </Link>
        </div>


        <div className="hidden md:flex flex-col md:flex-row w-[50%] md:w-auto md:items-center mt-4 md:mt-0">
          <ul className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-2 md:space-y-0">
            {navLinks.map((link: NavLink, index: number) => (
              <li key={index}>
                <a
                  href={link.path}
                  className="text-xs sm:text-sm font-medium hover:text-primary transition-colors duration-200 hover:underline"
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

      </nav>

      <PromoBanner />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={toggleMobileMenu}
        links={navLinks}
      />
    </header>
  );
}