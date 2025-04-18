import { formatDistanceToNow } from 'date-fns';
import { Bell, BookOpen, AlertCircle, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useNavigation } from '@/lib/navigation';

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
  const { toast } = useToast();
  const { navigate } = useNavigation();
  
  const formattedDate = typeof createdAt === 'string' 
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    : formatDistanceToNow(createdAt, { addSuffix: true });
  
  const handleClick = () => {
    // Mark as read
    onMarkAsRead(id);
    
    // Navigate to resource if applicable
    if (resourceId && resourceType) {
      // Navigate based on resource type
      switch(resourceType) {
        case 'course':
          navigate(`/student/courses/${resourceId}`);
          break;
        case 'test':
          navigate(`/student/tests/${resourceId}`);
          break;
        case 'module':
          navigate(`/student/modules/${resourceId}`);
          break;
        default:
          // Just mark as read, no navigation
          toast({
            title: "Notification marked as read",
            description: "The notification has been marked as read.",
          });
      }
    } else {
      // Just mark as read
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read.",
      });
    }
  };
  
  // Choose icon based on notification type
  const getIcon = () => {
    switch(type) {
      case 'course_update':
        return <BookOpen className="h-4 w-4" />;
      case 'test_update':
        return <AlertCircle className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex gap-3 p-3 cursor-pointer hover:bg-muted transition-colors",
        !isRead && "bg-muted/50"
      )}
    >
      <div className={cn(
        "mt-1 flex h-8 w-8 items-center justify-center rounded-full",
        type === 'course_update' && "bg-blue-100 text-blue-600",
        type === 'test_update' && "bg-yellow-100 text-yellow-600",
        type === 'system' && "bg-purple-100 text-purple-600",
        type === 'enrollment' && "bg-green-100 text-green-600",
      )}>
        {getIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          {!isRead && (
            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  );
}