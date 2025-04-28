import { Card, CardContent } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { Calendar, Clock, FileText, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigation } from '@/lib/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface TestCardProps {
  id: number;
  title: string;
  description: string;
  scheduledFor?: Date | string | null;
  duration: number; // in minutes
  questionCount: number;
  status: 'upcoming' | 'available' | 'completed' | 'expired' | 'locked';
  score?: number;
  testType?: 'practice' | 'formal';
  visibility?: 'public' | 'private';
  onStartTest?: (testId: number) => void;
  hasEnrollmentRequest?: boolean;
  enrollmentRequestStatus?: 'pending' | 'approved' | 'rejected';
  courseId?: number | null;
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
  hasEnrollmentRequest = false,
  enrollmentRequestStatus = 'pending',
  courseId = null
}: TestCardProps) {
  const { navigate } = useNavigation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status badge styling
  const statusConfig: Record<string, { label: string; color: string }> = {
    upcoming: { label: 'Upcoming', color: 'bg-amber-500' },
    available: { label: 'Available', color: 'bg-green-500' },
    completed: { label: 'Completed', color: 'bg-blue-500' },
    expired: { label: 'Expired', color: 'bg-gray-500' },
    locked: { label: 'Locked', color: 'bg-gray-500' }
  };

  // Format date if available
  const formattedDate = scheduledFor 
    ? format(new Date(scheduledFor), 'MMMM d, yyyy · h:mm a')
    : 'Available now';

  // Mutation for requesting test enrollment
  const requestEnrollmentMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);
      return await apiRequest('POST', '/api/test-enrollment-requests', { testId: id });
    },
    onSuccess: () => {
      toast({
        title: 'Enrollment Request Submitted',
        description: 'Your request to access this test has been submitted and is pending approval.',
      });
      // Refresh test data
      queryClient.invalidateQueries({ queryKey: ['/api/available-tests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/test-enrollment-requests'] });
    },
    onError: (error: any) => {
      // Check if this is a 400 error suggesting to enroll in the course first
      if (error.status === 400 && error.data?.courseId) {
        toast({
          title: 'Course Enrollment Required',
          description: error.data.message || 'You must be enrolled in the course to access this test.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Request Failed',
          description: error?.data?.message || 'Failed to submit enrollment request.',
          variant: 'destructive',
        });
      }
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

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
    } else if (status === 'locked') {
      if (hasEnrollmentRequest) {
        // Already has a request
        toast({
          title: 'Enrollment Status',
          description: `Your enrollment request is ${enrollmentRequestStatus}. ${
            enrollmentRequestStatus === 'pending' 
              ? 'Please wait for approval.' 
              : enrollmentRequestStatus === 'rejected' 
                ? 'Your request was rejected.' 
                : ''
          }`,
        });
      } else {
        // Request enrollment
        requestEnrollmentMutation.mutate();
      }
    }
  };

  // Button text based on status
  const buttonText = {
    upcoming: 'Set Reminder',
    available: 'Start Test',
    completed: 'View Results',
    expired: 'View Details',
    locked: hasEnrollmentRequest 
      ? enrollmentRequestStatus === 'pending' 
        ? 'Enrollment Pending' 
        : 'Request Again' 
      : 'Request Enrollment'
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
          
          {status === 'locked' && (
            <div className="flex items-center gap-2 text-sm mt-2 text-gray-600">
              <Lock className="h-4 w-4 text-gray-500" />
              <span>
                {hasEnrollmentRequest 
                  ? `Enrollment request ${enrollmentRequestStatus}` 
                  : "Requires enrollment approval"}
              </span>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleAction}
          className="w-full mt-4"
          variant={status === 'expired' || (status === 'locked' && hasEnrollmentRequest && enrollmentRequestStatus === 'pending') ? 'outline' : 'default'}
          disabled={status === 'expired' || (status === 'locked' && hasEnrollmentRequest && enrollmentRequestStatus === 'pending')}
          isLoading={isSubmitting}
        >
          {buttonText[status]}
        </Button>
      </CardContent>
    </Card>
  );
}
