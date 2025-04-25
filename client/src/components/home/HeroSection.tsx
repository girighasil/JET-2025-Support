import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useSiteConfig } from '@/hooks/use-site-config';
import PromoBanner from '../layout/PromoBanner';

export default function HeroSection() {
  const { config } = useSiteConfig();
  
  const examInfo = config?.examInfo || {
    name: 'JET',
    fullName: 'Joint Entrance Test',
    year: '2025',
    applicationStartDate: 'February 20, 2025',
    applicationEndDate: 'March 30, 2025',
    examDate: 'May 14, 2025',
    universityName: 'Swami Keshwanand Rajasthan Agricultural University, Bikaner'
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Hero header with university name */}
      <div className="bg-emerald-700 text-white py-2 w-full">
        <div className="responsive-container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
              {config?.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="h-12 w-12 flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 font-bold text-xl">{examInfo.name?.charAt(0) || 'J'}</span>
                </div>
              )}
              <div className="min-w-0"> {/* Prevent text overflow */}
                <h1 className="text-sm md:text-base font-semibold truncate">
                  {examInfo.name || 'JET'}/{examInfo.fullName || 'Joint Entrance Test'} Entrance Examinations-{examInfo.year || '2025'}
                </h1>
                <p className="text-xs md:text-sm truncate">
                  {examInfo.universityName || 'Swami Keshwanand Rajasthan Agricultural University, Bikaner'}
                </p>
              </div>
            </div>
            <div className="hidden md:flex space-x-4 text-sm flex-wrap">
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="#important-alert" className="hover:underline">Important Alert</Link>
              <Link href="#important-instructions" className="hover:underline">Important Instructions</Link>
              <Link href="#contact-us" className="hover:underline">Contact Us</Link>
              <Link href="#guidelines" className="hover:underline">Guidelines</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Promo Banner for important announcements */}
      <PromoBanner />
      
      {/* Main Hero Section */}
      <section className="py-10 md:py-16 bg-gradient-to-b from-white to-gray-100 w-full">
        <div className="responsive-container">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-4 px-2">
              {examInfo.name || 'JET'} {examInfo.year || '2025'} – {config?.siteTitle || 'jet2025.com'}
            </h1>
            
            <div className="mt-6 mb-8 bg-yellow-100 border border-yellow-400 p-4 rounded-lg max-w-3xl mx-auto">
              <h2 className="text-lg sm:text-xl font-semibold text-yellow-800 mb-2">Notification Coming Soon- This Week</h2>
              <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3">{examInfo.name || 'JET'}/{examInfo.fullName || 'Joint Entrance Test'} Entrance Exam {examInfo.year || '2025'}</h3>
              <p className="text-gray-700 text-sm sm:text-base">
                After the official release, candidates can <strong>apply online for {examInfo.name || 'JET'} Application Form {examInfo.year || '2025'}</strong> through the {examInfo.name || 'JET'}{examInfo.year || '2025'} official website.
              </p>
            </div>
            
            {/* Sign in / Registration Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mx-auto max-w-[95%] lg:max-w-6xl">
              <div className="bg-amber-100 p-4 sm:p-6 rounded-lg border border-amber-200">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-amber-800 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Important Alerts
                </h2>
                <ul className="text-left space-y-3 sm:space-y-4 text-sm sm:text-base">
                  <li className="flex">
                    <span className="mr-2 text-amber-600 flex-shrink-0">•</span>
                    <p className="text-gray-700">
                      <strong>Before filling up the application form</strong> candidate must read and understand the instructions given in the {examInfo.name || 'JET'} Booklet-{examInfo.year || '2025'}.
                    </p>
                  </li>
                  <li className="flex">
                    <span className="mr-2 text-amber-600 flex-shrink-0">•</span>
                    <p className="text-gray-700">
                      <strong>The mobile number and Email</strong> registered at the time of filling online application form must be operational till admission process is over. All information will be communicated on registered mobile number or Email.
                    </p>
                  </li>
                  <li className="flex">
                    <span className="mr-2 text-amber-600 flex-shrink-0">•</span>
                    <p className="text-gray-700">
                      <strong>Note down and keep your user ID</strong> (Reg. No.) and password safely, it can be used by any one for making change in your application form. If it happens candidate himself or herself will be responsible.
                    </p>
                  </li>
                </ul>
                
                <div className="mt-6 bg-amber-200 p-3 rounded-lg">
                  <div className="flex flex-wrap justify-between items-center text-sm sm:text-base">
                    <strong className="text-amber-800 mr-2">📞 Contact Number:</strong>
                    <span className="text-gray-700">{config?.footer?.phone || '907XXXXXXX, 637XXXXXXX'}</span>
                  </div>
                  <div className="text-xs text-center mt-1 text-gray-600">(10am to 5pm only)</div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.open(config?.social?.whatsapp || 'https://whatsapp.com/channel/0029VbAudzTHbFV5ppcj0b07', '_blank')}
                  >
                    Join WhatsApp
                  </Button>
                </div>
              </div>
              
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                  Sign in
                </h2>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="username" className="sr-only">Username</label>
                    <input 
                      type="text" 
                      id="username" 
                      placeholder="Username" 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="sr-only">Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        id="password" 
                        placeholder="Password" 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                      />
                      <button className="absolute inset-y-0 right-0 flex items-center px-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-red-500 text-xs mt-1">password case-sensitive</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">Type the characters you see in the picture below</label>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        placeholder="Enter captcha" 
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                      />
                      <div className="bg-gray-200 p-2 rounded-md flex items-center justify-center min-w-[90px]">
                        <span className="font-mono text-gray-700 text-sm sm:text-base">56VUM</span>
                        <button className="ml-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Registration has not started yet. Please check back later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}