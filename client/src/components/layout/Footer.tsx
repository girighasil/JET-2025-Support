import { useSiteConfig } from "@/hooks/use-site-config";
import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const { config } = useSiteConfig();
  
  type FooterLink = {
    title: string;
    url: string;
  };
  
  const footer = config?.footer || {
    text: '© 2025 Maths Magic Town. All rights reserved.',
    address: '123 Learning Street, Education City, IN 110001',
    phone: '+91 98765 43210',
    email: 'contact@mathsmagictown.com',
    links: [
      { title: 'Terms of Service', url: '/terms' },
      { title: 'Privacy Policy', url: '/privacy' },
      { title: 'Refund Policy', url: '/refund' }
    ] as FooterLink[]
  };
  
  const social = config?.social || {
    facebook: 'https://facebook.com/',
    twitter: 'https://twitter.com/',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/in/',
    youtube: 'https://youtube.com/'
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="py-12 bg-gradient-to-r from-primary/90 to-primary">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between">
            {/* Company Info Section */}
            <div className="w-full md:w-1/3 lg:w-1/4 mb-8 md:mb-0">
              <h3 className="text-xl font-bold mb-4">Maths Magic Town</h3>
              <p className="text-gray-100 max-w-xs mb-6">
                Dedicated to helping students excel in competitive exams through personalized coaching and practice.
              </p>
              
              {/* Contact Information */}
              <div className="space-y-3 text-sm">
                {footer.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-300 mr-2 mt-1 shrink-0" />
                    <span className="text-gray-300">{footer.address}</span>
                  </div>
                )}
                {footer.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-300 mr-2 shrink-0" />
                    <a href={`tel:${footer.phone}`} className="text-gray-300 hover:text-white transition-colors">
                      {footer.phone}
                    </a>
                  </div>
                )}
                {footer.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-300 mr-2 shrink-0" />
                    <a href={`mailto:${footer.email}`} className="text-gray-300 hover:text-white transition-colors">
                      {footer.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Useful Links */}
            <div className="w-full md:w-1/4 mb-8 md:mb-0">
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/#courses" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
                    <ArrowRight className="h-3 w-3 mr-2" /> Courses
                  </Link>
                </li>
                <li>
                  <Link href="/#practice-tests" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
                    <ArrowRight className="h-3 w-3 mr-2" /> Practice Tests
                  </Link>
                </li>
                <li>
                  <Link href="/#doubt-classes" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
                    <ArrowRight className="h-3 w-3 mr-2" /> Doubt Classes
                  </Link>
                </li>
                <li>
                  <Link href="/#testimonials" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
                    <ArrowRight className="h-3 w-3 mr-2" /> Success Stories
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
                    <ArrowRight className="h-3 w-3 mr-2" /> Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Important Links */}
            <div className="w-full md:w-1/4 mb-8 md:mb-0">
              <h3 className="text-xl font-bold mb-4">Important Links</h3>
              <ul className="space-y-2">
                {footer.links.map((link: FooterLink, index: number) => (
                  <li key={index}>
                    <Link href={link.url} className="inline-flex items-center text-gray-300 hover:text-white transition-colors">
                      <ArrowRight className="h-3 w-3 mr-2" /> {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Newsletter Section */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
              <p className="text-gray-300 mb-4">
                Follow us on social media for tips, updates, and success stories!
              </p>
              
              {/* Social Icons */}
              <div className="flex space-x-4">
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all">
                    <Facebook className="h-5 w-5 text-white" />
                  </a>
                )}
                {social.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all">
                    <Twitter className="h-5 w-5 text-white" />
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all">
                    <Instagram className="h-5 w-5 text-white" />
                  </a>
                )}
                {social.linkedin && (
                  <a href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all">
                    <Linkedin className="h-5 w-5 text-white" />
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all">
                    <Youtube className="h-5 w-5 text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright Section */}
      <div className="py-5 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400 text-sm">
            {footer.text}
          </div>
        </div>
      </div>
    </footer>
  );
}