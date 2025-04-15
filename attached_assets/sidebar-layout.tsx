import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import MobileNavigation from "@/layouts/mobile-navigation";
import { 
  Home, BookOpen, ClipboardCheck, HelpCircle, User, 
  BookmarkIcon, Users, BarChart2, CalendarDays, LogOut,
  Menu, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [location] = useLocation();
  const isMobile = useMobile();

  const userInitials = user?.fullName 
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() 
    : user?.username?.substring(0, 2).toUpperCase() || '';

  const isAdmin = user?.role === "admin";

  const studentLinks = [
    { label: "Dashboard", href: "/student/dashboard", icon: <Home className="h-5 w-5" /> },
    { label: "My Courses", href: "/student/courses", icon: <BookOpen className="h-5 w-5" /> },
    { label: "Test Series", href: "/student/tests", icon: <ClipboardCheck className="h-5 w-5" /> },
    { label: "Doubt Sessions", href: "/student/doubts", icon: <HelpCircle className="h-5 w-5" /> },
    { label: "My Profile", href: "/student/profile", icon: <User className="h-5 w-5" /> },
  ];

  const adminLinks = [
    { label: "Admin Dashboard", href: "/admin/dashboard", icon: <Home className="h-5 w-5" /> },
    { label: "Manage Courses", href: "/admin/manage-courses", icon: <BookmarkIcon className="h-5 w-5" /> },
    { label: "Manage Tests", href: "/admin/manage-tests", icon: <ClipboardCheck className="h-5 w-5" /> },
    { label: "Manage Students", href: "/admin/manage-students", icon: <Users className="h-5 w-5" /> },
    { label: "Doubt Sessions", href: "/admin/session-schedule", icon: <CalendarDays className="h-5 w-5" /> },
    { label: "Analytics", href: "/admin/analytics", icon: <BarChart2 className="h-5 w-5" /> },
  ];

  const navLinks = isAdmin ? adminLinks : studentLinks;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar - Desktop */}
      <div className={cn(
        "lg:block bg-white shadow flex-shrink-0",
        isMobile ? (isSidebarOpen ? "fixed inset-y-0 left-0 z-50 w-64" : "hidden") : (isSidebarOpen ? "w-64" : "w-20"),
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center h-16 bg-primary-600">
            {isSidebarOpen ? (
              <h1 className="text-white font-bold text-xl">Maths Magic Town</h1>
            ) : (
              <span className="text-white font-bold text-xl">MMT</span>
            )}
          </div>
          
          {/* User Profile */}
          <div className={cn("border-b border-gray-200", isSidebarOpen ? "p-4" : "p-2 flex justify-center")}>
            {isSidebarOpen ? (
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-bold">
                  {userInitials}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
                  <p className="text-xs font-medium text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-bold">
                {userInitials}
              </div>
            )}
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center py-2 text-sm font-medium rounded-md group",
                  location === link.href 
                    ? "text-primary-600 bg-primary-50" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  isSidebarOpen ? "px-2" : "px-3 justify-center"
                )}
              >
                <span className={cn(
                  location === link.href ? "text-primary-600" : "text-gray-400 group-hover:text-gray-500",
                  isSidebarOpen ? "mr-3" : ""
                )}>
                  {link.icon}
                </span>
                {isSidebarOpen && <span>{link.label}</span>}
              </Link>
            ))}
          </nav>
          
          {/* Logout Button */}
          <div className={cn("border-t border-gray-200", isSidebarOpen ? "p-4" : "p-2")}>
            <button 
              type="button" 
              onClick={handleLogout}
              className={cn(
                "flex items-center text-sm font-medium text-red-600 hover:bg-red-50 rounded-md w-full",
                isSidebarOpen ? "px-4 py-2" : "py-2 justify-center"
              )}
            >
              <LogOut className={cn("h-5 w-5", isSidebarOpen ? "mr-3" : "")} />
              {isSidebarOpen && "Sign out"}
            </button>
          </div>

          {/* Toggle Sidebar (Only on Desktop) */}
          {!isMobile && (
            <div className="p-2 border-t border-gray-200">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center"
                onClick={toggleSidebar}
              >
                {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="lg:hidden fixed top-0 inset-x-0 z-10 flex items-center justify-between h-16 bg-white shadow px-4">
          <button type="button" className="text-gray-500 focus:outline-none" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-primary-600 font-bold text-lg">Maths Magic Town</h1>
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-bold">
            {userInitials}
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-100 pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
        
        {/* Mobile Navigation */}
        {isMobile && <MobileNavigation />}
      </main>

      {/* Overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
