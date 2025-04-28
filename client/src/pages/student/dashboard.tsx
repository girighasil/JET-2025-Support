import { Layout } from '@/components/ui/layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CourseCard } from '@/components/dashboard/course-card';
import { TestCard } from '@/components/dashboard/test-card';
import { Calendar, Book, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showBookSession, setShowBookSession] = useState(false);
  
  // Fetch student progress
  const { data: progress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['/api/analytics/student-progress'],
  });
  
  // Fetch enrolled courses
  const { data: enrollments, isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments'],
  });
  
  // Fetch course details for enrolled courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses', { isActive: true }],
    enabled: !!enrollments,
  });
  
  // Fetch upcoming and recent tests
  const { data: tests = [], isLoading: isTestsLoading } = useQuery({
    queryKey: ['/api/tests', { isActive: true }],
  });
  
  // Fetch test attempts
  const { data: testAttempts = [], isLoading: isAttemptsLoading } = useQuery({
    queryKey: ['/api/test-attempts'],
  });
  
  // Fetch doubt sessions
  const { data: doubtSessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/doubt-sessions'],
  });

  // Schedule a doubt session
  const scheduleMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const res = await apiRequest('POST', '/api/doubt-sessions', sessionData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Session Scheduled',
        description: 'Your doubt session has been scheduled successfully.',
      });
      setShowBookSession(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Schedule Session',
        description: error.message || 'There was an error scheduling your session.',
        variant: 'destructive',
      });
    }
  });

  // Process test data
  const upcomingTests = tests
    .filter((test: any) => {
      // Check if test is upcoming or available
      const hasAttempted = testAttempts.some(
        (attempt: any) => attempt.testId === test.id && attempt.userId === user?.id
      );
      return !hasAttempted && test.isActive;
    })
    .slice(0, 3);

  // Process enrollments data
  const enrolledCourses = enrollments && courses 
    ? courses
        .filter((course: any) => 
          enrollments.some((e: any) => e.courseId === course.id)
        )
        .map((course: any) => {
          const enrollment = enrollments.find((e: any) => e.courseId === course.id);
          return {
            ...course,
            progress: enrollment ? enrollment.progress : 0,
            isEnrolled: true
          };
        })
        .slice(0, 3)
    : [];

  // Schedule a doubt session
  const handleScheduleSession = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    scheduleMutation.mutate({
      topic: 'Math Concepts Clarification',
      description: 'I need help understanding complex number operations and their applications.',
      scheduledFor: tomorrow.toISOString(),
      status: 'pending'
    });
  };

  return (
    <Layout
      title={`Welcome back, ${user?.fullName?.split(' ')[0] || 'Student'}!`}
      description="Continue your learning journey and track your progress."
      rightContent={
        <Button 
          onClick={() => setShowBookSession(true)} 
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Schedule Doubt Session
        </Button>
      }
    >
      {/* Progress Stats */}
      <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {isProgressLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            <StatsCard
              title="Course Completion"
              value={`${progress?.courseProgress || 0}%`}
              icon={Book}
              actionLink={{ href: "/student/courses", text: "View all courses" }}
              iconVariant="info"
            />
            <StatsCard
              title="Test Performance"
              value={`${progress?.testPerformance || 0}%`}
              icon={FileText}
              actionLink={{ href: "/student/tests", text: "View test reports" }}
              iconVariant="success"
            />
            <StatsCard
              title="Study Time (This Week)"
              value={`${progress?.studyTimeThisWeek || 0} hours`}
              icon={Clock}
              iconVariant="warning"
            />
          </>
        )}
      </div>

      {/* Continue Learning Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Continue Learning</h2>
          <a href="/student/courses" className="text-sm text-primary hover:underline font-medium">
            View all courses
          </a>
        </div>
        {isCoursesLoading || isEnrollmentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course: any) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                category={course.category}
                thumbnail={course.thumbnail}
                progress={course.progress}
                isEnrolled={true}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Book className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses enrolled yet</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                Enroll in courses to start your learning journey and track your progress.
              </p>
              <Button asChild>
                <a href="/student/courses">Browse Courses</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Tests Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Tests</h2>
          <a href="/student/tests" className="text-sm text-primary hover:underline font-medium">
            View all tests
          </a>
        </div>
        {isTestsLoading || isAttemptsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : upcomingTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTests.map((test: any) => (
              <TestCard
                key={test.id}
                id={test.id}
                title={test.title}
                description={test.description}
                scheduledFor={test.scheduledFor}
                duration={test.duration}
                questionCount={10} // This would come from the API in a real implementation
                status="available"
              />
            ))}
          </div>
        ) : (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming tests</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                Check back later for new tests or browse all available tests.
              </p>
              <Button asChild>
                <a href="/student/tests">Browse Tests</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Doubt Sessions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Doubt Sessions</h2>
          <a href="/student/doubts" className="text-sm text-primary hover:underline font-medium">
            View all sessions
          </a>
        </div>
        {isSessionsLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : doubtSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doubtSessions.map((session: any) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{session.topic}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span>
                        {new Date(session.scheduledFor).toLocaleDateString()} at{' '}
                        {new Date(session.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize 
                        bg-blue-100 text-blue-800">{session.status}</span>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 mt-2">{session.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white rounded-lg shadow-sm border border-border p-6">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming doubt sessions</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                Schedule a doubt session with our teachers to get personalized help with topics you're struggling with.
              </p>
              <Button 
                onClick={() => setShowBookSession(true)}
                className="inline-flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Schedule a Doubt Session
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Book Session Dialog */}
      {showBookSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Schedule a Doubt Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Book a doubt session with our expert teachers to get personalized help with topics you're struggling with.
                </p>
                <p className="text-sm">
                  <strong>Topic:</strong> Math Concepts Clarification
                </p>
                <p className="text-sm">
                  <strong>Description:</strong> Complex number operations and their applications
                </p>
                <p className="text-sm">
                  <strong>Time:</strong> Tomorrow at 10:00 AM
                </p>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowBookSession(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleScheduleSession}
                disabled={scheduleMutation.isPending}
              >
                {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Now'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
