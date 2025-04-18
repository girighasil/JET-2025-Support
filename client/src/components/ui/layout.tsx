import { SidebarNav } from "@/components/ui/sidebar-nav";
import { MobileNav } from "@/components/ui/mobile-nav";
import { MobileSidebarNav } from "@/components/ui/mobile-sidebar-nav";
import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";
import { UserAvatar } from "./user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { Menu } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle, 
  SheetDescription 
} from "./sheet";
import { NotificationPopover } from "@/components/notification-popover";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  rightContent?: ReactNode;
  className?: string;
}

export function Layout({ 
  children, 
  title, 
  description, 
  rightContent,
  className 
}: LayoutProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  
  return (
    <div className="min-h-screen w-full flex bg-background">
      <SidebarNav />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-4 bg-white border-b p-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Navigation links for the application</SheetDescription>
              <MobileSidebarNav onItemClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
              M
            </div>
            <h1 className="font-bold text-lg">Maths Magic Town</h1>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <NotificationPopover />
            <UserAvatar user={user} className="h-8 w-8" />
          </div>
        </header>
        
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-end gap-4 bg-white border-b p-4">
          <div className="flex items-center gap-3">
            <NotificationPopover />
            <div className="flex items-center gap-2">
              <UserAvatar user={user} className="h-8 w-8" />
              <div className="hidden lg:block">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page header with title */}
        {(title || rightContent) && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 p-4 md:p-6 lg:p-8">
            {title && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                {description && <p className="text-sm text-gray-500">{description}</p>}
              </div>
            )}
            {rightContent && (
              <div className="mt-4 md:mt-0">
                {rightContent}
              </div>
            )}
          </div>
        )}
        
        {/* Main content */}
        <div className={cn("flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8", className)}>
          {children}
        </div>
        
        <MobileNav />
      </main>
    </div>
  );
}
