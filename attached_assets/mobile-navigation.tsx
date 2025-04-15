import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, BookOpen, ClipboardCheck, HelpCircle, User, 
  BookmarkIcon, Users, BarChart2, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNavigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const isAdmin = user?.role === "admin";

  const studentLinks = [
    { label: "Home", href: "/student/dashboard", icon: <Home className="text-xl" /> },
    { label: "Courses", href: "/student/courses", icon: <BookOpen className="text-xl" /> },
    { label: "Tests", href: "/student/tests", icon: <ClipboardCheck className="text-xl" /> },
    { label: "Doubts", href: "/student/doubts", icon: <HelpCircle className="text-xl" /> },
    { label: "Profile", href: "/student/profile", icon: <User className="text-xl" /> },
  ];

  const adminLinks = [
    { label: "Home", href: "/admin/dashboard", icon: <Home className="text-xl" /> },
    { label: "Courses", href: "/admin/manage-courses", icon: <BookmarkIcon className="text-xl" /> },
    { label: "Tests", href: "/admin/manage-tests", icon: <ClipboardCheck className="text-xl" /> },
    { label: "Students", href: "/admin/manage-students", icon: <Users className="text-xl" /> },
    { label: "Sessions", href: "/admin/session-schedule", icon: <Calendar className="text-xl" /> },
  ];

  const navLinks = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10 lg:hidden">
      <div className="flex justify-around">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center pt-2 pb-1",
              location === link.href ? "text-primary-600" : "text-gray-600"
            )}
          >
            {link.icon}
            <span className="text-xs">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
