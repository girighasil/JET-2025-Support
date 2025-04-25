import { cn } from "@/lib/utils";
import { Link, useRoute, useLocation } from "wouter";
import { 
  Home, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  User,
  BarChart2,
  Users,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const { user } = useAuth();
  const role = user?.role || "student";
  const [location] = useLocation();
  
  // Student navigation items
  const studentItems = [
    {
      title: "Home",
      href: "/student/dashboard",
      icon: Home,
    },
    {
      title: "Courses",
      href: "/student/courses",
      icon: BookOpen,
    },
    {
      title: "Tests",
      href: "/student/tests",
      icon: FileText,
    },
    {
      title: "Doubts",
      href: "/student/doubts",
      icon: HelpCircle,
    },
    {
      title: "Profile",
      href: "/student/profile",
      icon: User,
    },
  ];

  // Admin navigation items
  const adminItems = [
    {
      title: "Home",
      href: "/admin/dashboard",
      icon: Home,
    },
    {
      title: "Courses",
      href: "/admin/manage-courses",
      icon: BookOpen,
    },
    {
      title: "Tests",
      href: "/admin/manage-tests",
      icon: FileText,
    },
    {
      title: "Students",
      href: "/admin/manage-students",
      icon: Users,
    },
    {
      title: "Sessions",
      href: "/admin/session-schedule",
      icon: Calendar,
    },
    {
      title: "Config",
      href: "/admin/site-config",
      icon: () => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      title: "Promo",
      href: "/admin/promotions",
      icon: () => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
  ];

  const items = role === "student" ? studentItems : adminItems;
  
  // Don't show mobile nav on auth pages
  if (location === "/" || location === "/auth" || location.startsWith("/login") || location.startsWith("/register")) {
    return null;
  }

  return (
    <div className={cn("md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around items-center h-16 z-10", className)}>
      {items.map((item, index) => (
        <NavItem 
          key={index}
          title={item.title}
          href={item.href}
          icon={item.icon}
        />
      ))}
    </div>
  );
}

interface NavItemProps {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function NavItem({ title, href, icon: Icon }: NavItemProps) {
  const [isActive] = useRoute(href);
  
  return (
    <div>
      <Link href={href} className="flex flex-col items-center justify-center">
        <Icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-gray-500")} />
        <span className={cn("text-xs mt-1", isActive ? "text-primary" : "text-gray-500")}>
          {title}
        </span>
      </Link>
    </div>
  );
}
