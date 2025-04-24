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
      title: "Offline",
      href: "/student/offline-resources",
      icon: FileText,
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
