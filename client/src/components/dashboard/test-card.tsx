import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigation } from '@/lib/navigation';

interface TestCardProps {
  id: number;
  title: string;
  description: string;
  scheduledFor?: Date | string | null;
  duration: number; // in minutes
  questionCount: number;
  status: 'upcoming' | 'available' | 'completed' | 'expired';
  score?: number;
  testType?: 'practice' | 'formal';
  visibility?: 'public' | 'private';
  onStartTest?: (testId: number) => void;
}

export function TestCard({
  id,
  title,
  description,
  scheduledFor,
  duration,
  questionCount,
  status,
  score,
  testType = 'practice',
  visibility = 'private',
  onStartTest,
}: TestCardProps) {
  const { navigate } = useNavigation();

  // Status badge styling
  const statusConfig: Record<string, { label: string; color: string }> = {
    upcoming: { label: 'Upcoming', color: 'bg-amber-500' },
    available: { label: 'Available', color: 'bg-green-500' },
    completed: { label: 'Completed', color: 'bg-blue-500' },
    expired: { label: 'Expired', color: 'bg-gray-500' },
  };

  // Format date if available
  const formattedDate = scheduledFor 
    ? format(new Date(scheduledFor), 'MMMM d, yyyy · h:mm a')
    : 'Available now';

  // Handle button click based on status
  const handleAction = () => {
    if (status === 'available' || status === 'upcoming') {
      if (onStartTest) {
        onStartTest(id);
      } else {
        // Use our navigation utility
        import('@/lib/navigation').then(({ navigateToTest }) => {
          // For test attempts, we'll still use direct navigation since it has a query parameter
          navigate(`/student/test-attempt?testId=${id}`);
        });
      }
    } else if (status === 'completed') {
      navigate(`/student/tests/result/${id}`);
    }
  };

  // Button text based on status
  const buttonText = {
    upcoming: 'Set Reminder',
    available: 'Start Test',
    completed: 'View Results',
    expired: 'View Details',
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
          </div>
          <span className={`text-xs font-medium text-white ${statusConfig[status].color} px-2 py-1 rounded`}>
            {statusConfig[status].label}
          </span>
        </div>
        
        <div className="mt-4 space-y-2 flex-grow">
          {/* Test badges for type and visibility */}
          <div className="flex gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              testType === 'practice' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {testType === 'practice' ? 'Practice' : 'Formal'}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              visibility === 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {visibility === 'public' ? 'Public' : 'Course Members Only'}
            </span>
          </div>
          
          {scheduledFor && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-5 w-5 text-gray-400" />
            <span>Duration: {duration} minutes</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-5 w-5 text-gray-400" />
            <span>{questionCount} questions</span>
          </div>
          
          {status === 'completed' && score !== undefined && (
            <div className="flex items-center gap-2 text-sm font-medium mt-2">
              <span>Your score: </span>
              <span className={score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'}>
                {score}%
              </span>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleAction}
          className="w-full mt-4"
          variant={status === 'expired' ? 'outline' : 'default'}
          disabled={status === 'expired'}
        >
          {buttonText[status]}
        </Button>
      </CardContent>
    </Card>
  );
}
