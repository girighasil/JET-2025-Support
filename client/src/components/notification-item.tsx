import { BellRing, Check, FileText, Book, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "wouter";
import { formatDistanceToNow } from 'date-fns';

type NotificationItemProps = {
  id: number;
  title: string;
  message: string;
  createdAt: string | Date;
  isRead: boolean;
  type: string;
  resourceId?: number | null;
  resourceType?: string | null;
  onMarkAsRead: (id: number) => void;
};

export function NotificationItem({
  id,
  title,
  message,
  createdAt,
  isRead,
  type,
  resourceId,
  resourceType,
  onMarkAsRead
}: NotificationItemProps) {
  const navigate = useNavigate();
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });

  const getIcon = () => {
    switch (type) {
      case 'course_update':
        return <Book className="h-5 w-5 text-blue-500" />;
      case 'test_update':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'module_update':
        return <Pencil className="h-5 w-5 text-purple-500" />;
      default:
        return <BellRing className="h-5 w-5 text-primary" />;
    }
  };

  const handleClick = () => {
    onMarkAsRead(id);
    
    // Navigate to resource if applicable
    if (resourceId && resourceType) {
      switch (resourceType) {
        case 'course':
          navigate(`/student/courses/${resourceId}`);
          break;
        case 'test':
          navigate(`/student/tests/${resourceId}`);
          break;
        default:
          break;
      }
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-accent/50 cursor-pointer",
        isRead ? "opacity-60" : "bg-accent/20"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 pt-1">
        {getIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          
          {!isRead && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(id);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as read</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}