import { cn } from "@/lib/utils";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  BookOpen,
  FileText,
  HelpCircle,
  User,
  BarChart2,
  Users,
  Calendar,
  LogOut,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const role = user?.role || "student";

  // Student navigation items
  const studentItems = [
    {
      title: "Dashboard",
      href: "/student/dashboard",
      icon: Home,
    },
    {
      title: "My Courses",
      href: "/student/courses",
      icon: BookOpen,
    },
    {
      title: "Tests",
      href: "/student/tests",
      icon: FileText,
    },
    {
      title: "Doubt Sessions",
      href: "/student/doubts",
      icon: HelpCircle,
    },
    {
      title: "My Profile",
      href: "/student/profile",
      icon: User,
    },
  ];

  // Admin navigation items
  const adminItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
    },
    {
      title: "Manage Courses",
      href: "/admin/manage-courses",
      icon: BookOpen,
    },
    {
      title: "Manage Tests",
      href: "/admin/manage-tests",
      icon: FileText,
    },
    {
      title: "Manage Students",
      href: "/admin/manage-students",
      icon: Users,
    },
    {
      title: "Manage Enrollments",
      href: "/admin/manage-enrollments",
      icon: BookOpen,
    },
    {
      title: "Doubt Sessions",
      href: "/admin/session-schedule",
      icon: Calendar,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart2,
    },
    {
      title: "Site Config",
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
          className="h-5 w-5"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      title: "Promotions",
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
          className="h-5 w-5"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
  ];

  const items = role === "student" ? studentItems : adminItems;

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen flex-col border-r bg-white transition-all duration-300",
        className,
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo and Title */}
      <div className="flex h-16 items-center border-b px-4 w-full">
        <div className="flex items-center gap-2 font-semibold overflow-hidden flex-1 min-w-0">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            M
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              <div className="text-lg font-bold truncate">Maths Magic Town</div>
              <div className="text-xs text-muted-foreground truncate">
                Learn, Practice, Succeed
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 ml-2"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-chevron-right"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-chevron-left"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          )}
        </Button>
      </div>

      {/* User Info */}
      <div
        className={cn(
          "flex items-center gap-2 border-b p-4 w-full",
          collapsed && "justify-center",
        )}
      >
        <UserAvatar user={user} className="h-10 w-10 flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-sm font-medium truncate">{user?.fullName}</span>
            <span className="text-xs text-muted-foreground capitalize truncate">
              {user?.role}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {items.map((item, index) => (
            <NavItem
              key={index}
              title={item.title}
              href={item.href}
              icon={item.icon}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className={cn("p-4 border-t", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "text-red-600 hover:text-red-700",
            collapsed ? "w-10 h-10 p-0" : "gap-2 w-full justify-start",
          )}
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}

interface NavItemProps {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed?: boolean;
}

function NavItem({ title, href, icon: Icon, collapsed = false }: NavItemProps) {
  const [isActive] = useRoute(href);

  return (
    <div className="w-full">
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full",
          isActive
            ? "bg-blue-50 text-primary"
            : "text-gray-600 hover:bg-gray-50",
          collapsed && "justify-center px-0",
        )}
        title={title}
      >
        <Icon
          className={cn(
            "h-5 w-5 flex-shrink-0",
            isActive ? "text-primary" : "text-gray-500",
          )}
        />
        {!collapsed && (
          <span className="truncate overflow-hidden">{title}</span>
        )}
      </Link>
    </div>
  );
}
