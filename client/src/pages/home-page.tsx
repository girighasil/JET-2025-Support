import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import MobileMenu from "@/components/layout/MobileMenu";
import PromoBanner from "@/components/layout/PromoBanner";
import { useSiteConfig } from "@/hooks/use-site-config";
import Navbar from "@/components/layout/Navbar";
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
  const navLinks: NavLink[] = config?.navLinks || [
    { title: "Home", path: "#home" },
    { title: "Courses", path: "#courses", className: "hover:underline" },
    { title: "Doubt Classes", path: "#doubt-classes" },
    { title: "Practice Tests", path: "#practice-tests" },
    { title: "Success Stories", path: "#testimonials" },
    { title: "Contact", path: "#contact" },
  ];

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

  // Hero section for landing page using the updated HeroSection component
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Navigation - updated with site config */}
      <nav className="w-full border-b border-border bg-white">
        <div className="bg-emerald-700 text-white py-2 w-full">
          <div className="responsive-container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                {/* Prevent text overflow */}
                <h1 className="text-sm md:text-base font-semibold truncate">
                  {/* Site title */}
                  "Joint Entrance Test"
                </h1>
                {/* tagline */}
                <p className="text-xs md:text-sm truncate">
                  {
                    "Swami Keshwanand Rajasthan Agricultural University, Bikaner"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-container py-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold flex-shrink-0">
              {config?.examInfo?.name?.charAt(0) || "J"}
            </div>
            <span className="text-lg sm:text-xl font-bold truncate">
              {config?.siteTitle || "JET 2025"}
            </span>
          </div>
          <div className="hidden md:flex space-x-4 text-sm flex-wrap">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="#important-alert" className="hover:underline">
              Important Alert
            </Link>
            <Link href="#important-instructions" className="hover:underline">
              Important Instructions
            </Link>
            <Link href="#contact-us" className="hover:underline">
              Contact Us
            </Link>
            <Link href="#guidelines" className="hover:underline">
              Guidelines
            </Link>
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
        <button
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>
      <Navbar />
      <PromoBanner />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={toggleMobileMenu}
        links={navLinks}
      />
      {/* Sign in / Registration Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mx-auto max-w-[95%] lg:max-w-6xl">
        <div className="bg-amber-100 p-4 sm:p-6 rounded-lg border border-amber-200">
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
                candidate must read and understand the instructions given in the{" "}
                {examInfo.name || "JET"} Booklet-
                {examInfo.year || "2025"}.
              </p>
            </li>
            <li className="flex">
              <span className="mr-2 text-amber-600 flex-shrink-0">•</span>
              <p className="text-gray-700">
                <strong>The mobile number and Email</strong> registered at the
                time of filling online application form must be operational till
                admission process is over. All information will be communicated
                on registered mobile number or Email.
              </p>
            </li>
            <li className="flex">
              <span className="mr-2 text-amber-600 flex-shrink-0">•</span>
              <p className="text-gray-700">
                <strong>Note down and keep your user ID</strong> (Reg. No.) and
                password safely, it can be used by any one for making change in
                your application form. If it happens candidate himself or
                herself will be responsible.
              </p>
            </li>
          </ul>

          <div className="mt-6 bg-amber-200 p-3 rounded-lg">
            <div className="flex flex-wrap justify-between items-center text-sm sm:text-base">
              <strong className="text-amber-800 mr-2">
                📞 Contact Number:
              </strong>
              <span className="text-gray-700">
                {config?.footer?.phone || "907XXXXXXX, 637XXXXXXX"}
              </span>
            </div>
            <div className="text-xs text-center mt-1 text-gray-600">
              (10am to 5pm only)
            </div>
          </div>

          <div className="mt-4">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() =>
                window.open(
                  config?.social?.whatsapp ||
                    "https://whatsapp.com/channel/0029VbAudzTHbFV5ppcj0b07",
                  "_blank",
                )
              }
            >
              Join WhatsApp
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
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
              <Button variant="outline" className="w-full text-sm sm:text-base">
                New Registration
              </Button>
              <Button variant="outline" className="w-full text-sm sm:text-base">
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
        </div>
      </div>
      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50 w-full">
        <div className="responsive-container">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Why Choose Maths Magic Town?
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Comprehensive Courses
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Well-structured courses designed by expert educators covering
                all essential math topics for competitive exams.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6 text-green-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Adaptive Test Series
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Practice with tests that adapt to your skill level, providing
                targeted questions to improve your weak areas.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                On-Demand Doubt Sessions
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Schedule personalized sessions with expert teachers to clear
                your doubts and strengthen your understanding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 md:py-20 bg-white w-full">
        <div className="responsive-container">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            What Our Students Say
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-border">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">Rohit Sharma</h4>
                  <p className="text-xs sm:text-sm text-gray-500">
                    IIT-JEE Aspirant
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                "The practice tests helped me identify my weak areas in
                calculus. After focused practice, I saw significant improvement
                in my scores."
              </p>
            </div>

            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-border">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">Priya Patel</h4>
                  <p className="text-xs sm:text-sm text-gray-500">
                    NEET Aspirant
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                "The doubt sessions were extremely helpful. The teachers
                explained complex concepts in simple ways that made everything
                click for me."
              </p>
            </div>

            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-border">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">Amit Kumar</h4>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Bank Exam Aspirant
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                "The quantitative aptitude course helped me master time-saving
                techniques. I was able to solve questions much faster in my
                practice tests."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-primary text-white w-full">
        <div className="responsive-container text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of students who have improved their math skills and
            achieved success in competitive exams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?tab=register">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Register Now
              </Button>
            </Link>
            <Link href="/auth">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white/10"
              >
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
                  {config?.examInfo?.name?.charAt(0) || "J"}
                </div>
                <span className="text-lg sm:text-xl font-bold">
                  {config?.siteTitle || "JET 2025"}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {config?.tagline || "Prepare for JET Entrance Exam"}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:col-span-3">
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  Platform
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Courses
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Test Series
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Doubt Sessions
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Analytics
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  Company
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Our Teachers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Testimonials
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  Legal
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-gray-400 text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Refund Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-gray-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()}{" "}
              {config?.instituteName || "Paras Education"}. All rights reserved.
            </p>
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
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    className="sm:w-4 sm:h-4"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
