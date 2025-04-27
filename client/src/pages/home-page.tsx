import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { SquareRadical, Youtube, MessageCircle } from "lucide-react";
import MobileMenu from "@/components/layout/MobileMenu";
import PromoBanner from "@/components/layout/PromoBanner";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ImportantInstructions from "@/components/home/ImportantInstructions";
import HelpDeskInstructions from "@/components/home/HelpDeskInstructions";
import { useSiteConfig } from "@/hooks/use-site-config";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { config } = useSiteConfig();
  const examInfo = config?.examInfo || "JET 2025";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const logoUrl = config?.logoUrl || "";
  const useCustomLogo = config?.useCustomLogo || false;
  const [isScrolled, setIsScrolled] = useState(false);
  const navLinks = config?.navLinks || [
    { title: "Home", path: "#home" },
    { title: "Courses", path: "#courses", className: "hover:underline" },
    { title: "Doubt Classes", path: "#doubt-classes" },
    { title: "Practice Tests", path: "#practice-tests" },
    { title: "Success Stories", path: "#testimonials" },
    { title: "Contact", path: "#contact" },
  ];

  // Scroll effect to detect when page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "student") {
        setLocation("/student/dashboard");
      } else {
        setLocation("/admin/dashboard");
      }
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen bg-stone-50 w-full overflow-x-hidden">
      {/* Fixed navigation at the top */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-amber-50 border-b border-amber-200 shadow-sm">
        <div className="responsive-container py-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center">
            <button onClick={toggleMobileMenu} aria-label="Toggle menu">
              {useCustomLogo && logoUrl ? (
                <div className="h-10 mr-3">
                  <img
                    src={logoUrl}
                    alt={config?.siteTitle || "JET 2025"}
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
                {config?.siteTitle || "JET 2025"}
              </span>
              <span className="text-xs text-gray-600">
                {config?.tagline || "Exam Support"}
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-col md:flex-row w-[50%] md:w-auto md:items-center mt-4 md:mt-0">
            <ul className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-2 md:space-y-0">
              {navLinks.map((link, index) => (
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

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button size="sm" className="text-xs sm:text-sm">
                Register
              </Button>
            </Link>
          </div>
        </div>
        <PromoBanner />      
      </header>
      
      {/* Add padding to account for fixed header height */}
      <div className="pt-32">
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={toggleMobileMenu}
          links={navLinks}
        />

        {/* Sign in / Registration Box */}
        {/* Very Important Instructions - Expandable Section */}
        <ImportantInstructions />
        
        {/* Help Desk Sidebar */}
        <HelpDeskInstructions />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mx-auto max-w-[95%] lg:max-w-6xl">
          <div className="bg-gradient-to-b from-amber-100 to-amber-50 p-4 sm:p-6 rounded-lg border border-amber-200">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-amber-800 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Important Alerts
            </h2>
            <ul className="text-left space-y-3 sm:space-y-4 text-sm sm:text-base">
              <li className="flex">
                <span className="mr-2 text-amber-600 flex-shrink-0">•</span>
                <p className="text-gray-700">
                  <strong>Before filling up the application form</strong>{" "}
                  candidate must read and understand the instructions given in
                  the {examInfo.name || "JET"} Booklet-
                  {examInfo.year || "2025"}.
                </p>
              </li>
              <li className="flex">
                <span className="mr-2 text-amber-600 flex-shrink-0">•</span>
                <p className="text-gray-700">
                  <strong>The mobile number and Email</strong> registered at the
                  time of filling online application form must be operational
                  till admission process is over. All information will be
                  communicated on registered mobile number or Email.
                </p>
              </li>
              <li className="flex">
                <span className="mr-2 text-amber-600 flex-shrink-0">•</span>
                <p className="text-gray-700">
                  <strong>Note down and keep your user ID</strong> (Reg. No.)
                  and password safely, it can be used by any one for making
                  change in your application form. If it happens candidate
                  himself or herself will be responsible.
                </p>
              </li>
            </ul>

            <div className="mt-4">
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  // Make sure URL starts with https:// and handle YouTube sub confirmation
                  let youtubeUrl = config?.social?.youtube || 
                    "https://www.youtube.com/@JET2025Support";
                  
                  // Ensure URL has proper protocol
                  if (!youtubeUrl.startsWith('http')) {
                    youtubeUrl = 'https://' + youtubeUrl;
                  }
                  
                  // Add subscription confirmation parameter if not already present
                  if (!youtubeUrl.includes('sub_confirmation=1')) {
                    youtubeUrl += youtubeUrl.includes('?') ? 
                      '&sub_confirmation=1' : 
                      '?sub_confirmation=1';
                  }
                  
                  // Open in new window using proper window.open() method
                  const newWindow = window.open(youtubeUrl, '_blank');
                  if (newWindow) {
                    newWindow.opener = null;
                  }
                }}
              >
                <Youtube className="h-5 w-5" />
                Subscribe YouTube
              </Button>
            </div>

            <div className="mt-4">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={(e) => {
                  e.preventDefault();
                  // Make sure WhatsApp URL starts with https://
                  let whatsappUrl = config?.social?.whatsapp || 
                    "https://whatsapp.com/channel/0029VbAudzTHbFV5ppcj0b07";
                  
                  // Ensure URL has proper protocol
                  if (!whatsappUrl.startsWith('http')) {
                    whatsappUrl = 'https://' + whatsappUrl;
                  }
                  
                  // Open in new window using proper window.open() method
                  const newWindow = window.open(whatsappUrl, '_blank');
                  if (newWindow) {
                    newWindow.opener = null;
                  }
                }}
              >
                <MessageCircle className="h-5 w-5" />
                Join WhatsApp
              </Button>
            </div>
          </div>
          <WhyChooseUs />

          {/*<div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clipRule="evenodd"
                />
              </svg>
              Sign in
            </h2>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Username"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    placeholder="Password"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button className="absolute inset-y-0 right-0 flex items-center px-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-red-500 text-xs mt-1">
                  password case-sensitive
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                  Type the characters you see in the picture below
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter captcha"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="bg-gray-200 p-2 rounded-md flex items-center justify-center min-w-[90px]">
                    <span className="font-mono text-gray-700 text-sm sm:text-base">
                      56VUM
                    </span>
                    <button className="ml-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-4">
                <Button
                  variant="outline"
                  className="w-full text-sm sm:text-base"
                >
                  New Registration
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm sm:text-base"
                >
                  Forgot password?
                </Button>
              </div>

              <div className="text-center mt-2">
                <p className="text-yellow-600 text-xs sm:text-sm flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Registration has not started yet. Please check back later.
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
