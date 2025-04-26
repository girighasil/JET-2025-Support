import { Link } from "wouter";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
type NavLink = {
  title: string;
  path: string;
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
}

export default function MobileMenu({
  isOpen,
  onClose,
  links,
}: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed top-[10%] inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white h-[80vh] w-[80%] max-w-xs pt-5 px-4 overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-[70%] text-white bg-gray-700 hover:text-gray-200 focus:outline-none"
          aria-label="Close menu"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <nav className="mt-8">
          <ul className="space-y-4">
            {/* Always visible Home link *
            <li>
              <Link 
                href="/" 
                onClick={onClose} 
                className="flex items-center text-lg font-medium hover:text-primary transition-colors duration-200"
              >
                <Home className="mr-2 h-5 w-5" />
                Home
              </Link>
            </li>*/}

            {links.map((link, index) => (
              <li key={index}>
                <a
                  href={link.path}
                  onClick={onClose}
                  className="block text-xm sm:text-sm font-medium hover:text-primary transition-colors duration-200 hover:underline"
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        
          <div className="flex items-center gap-2 sm:gap-4 ">
            <Link href="/auth">
              <Button
                variant={"outline"}
                size="sm"
                className="text-xm sm:text-sm"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button
                variant="outline"
                size="sm"
                className="text-xm sm:text-sm"
              >
                Register
              </Button>
            </Link>
          </div>
       
      </div>
    </div>
  );
}
