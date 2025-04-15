import { Layout } from '@/components/ui/layout';
import { TestCard } from '@/components/dashboard/test-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'wouter';
import { format, isPast, isFuture, addMinutes } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Table column definitions
const completedTestsColumns = [
  {
    accessorKey: 'title',
    header: 'Test Name',
  },
  {
    accessorKey: 'completedAt',
    header: 'Completed On',
    cell: ({ row }: any) => {
      const date = row.getValue('completedAt');
      if (!date) return 'N/A';
      return format(new Date(date), 'MMM d, yyyy');
    },
  },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: ({ row }: any) => {
      const score = row.getValue('score');
      return (
        <Badge 
          variant={score >= 70 ? 'success' : score >= 40 ? 'warning' : 'destructive'}
        >
          {score}%
        </Badge>
      );
    },
  },
  {
    accessorKey: 'duration',
    header: 'Time Taken',
    cell: ({ row }: any) => {
      const attempt = row.original;
      if (!attempt.startedAt || !attempt.completedAt) return 'N/A';
      
      const start = new Date(attempt.startedAt);
      const end = new Date(attempt.completedAt);
      const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
      
      return `${minutes} min`;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: any) => {
      return (
        <a 
          href={`/student/tests/result/${row.original.testId}`}
          className="text-primary hover:underline"
        >
          View Details
        </a>
      );
    },
  },
];

export default function StudentTests() {
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  
  // Fetch all active tests
  const { data: tests = [], isLoading: isTestsLoading } = useQuery({
    queryKey: ['/api/tests', { isActive: true }],
  });
  
  // Fetch test attempts
  const { data: attempts = [], isLoading: isAttemptsLoading } = useQuery({
    queryKey: ['/api/test-attempts'],
  });

  // Start test attempt mutation
  const startTestMutation = useMutation({
    mutationFn: async (testId: number) => {
      const res = await apiRequest('POST', '/api/test-attempts', { testId, status: 'in_progress' });
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/student/test-attempt?testId=${data.testId}&attemptId=${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Start Test',
        description: error.message || 'There was an error starting the test.',
        variant: 'destructive',
      });
    }
  });

  // Process test data
  const processedTests = tests.map((test: any) => {
    // Find attempts for this test
    const testAttempts = attempts.filter((attempt: any) => attempt.testId === test.id);
    const lastCompletedAttempt = testAttempts.find((a: any) => a.status === 'completed');
    const inProgressAttempt = testAttempts.find((a: any) => a.status === 'in_progress');
    
    // Determine test status
    let status = 'available';
    if (test.scheduledFor && isFuture(new Date(test.scheduledFor))) {
      status = 'upcoming';
    } else if (lastCompletedAttempt) {
      status = 'completed';
    } else if (test.scheduledFor && isPast(addMinutes(new Date(test.scheduledFor), test.duration))) {
      status = 'expired';
    }
    
    return {
      ...test,
      status,
      score: lastCompletedAttempt?.score,
      inProgressAttemptId: inProgressAttempt?.id,
      lastCompletedAttempt
    };
  });

  // Filter tests by status
  const upcomingTests = processedTests.filter((test: any) => test.status === 'upcoming');
  const availableTests = processedTests.filter((test: any) => test.status === 'available');
  const completedTests = processedTests.filter((test: any) => test.status === 'completed');
  
  // Prepare data for completed tests table
  const completedTestsData = completedTests.map((test: any) => {
    const lastAttempt = test.lastCompletedAttempt;
    return {
      testId: test.id,
      title: test.title,
      completedAt: lastAttempt?.completedAt,
      score: lastAttempt?.score,
      startedAt: lastAttempt?.startedAt,
      duration: test.duration
    };
  });

  // Handle starting a test
  const handleStartTest = (testId: number) => {
    const test = processedTests.find((t: any) => t.id === testId);
    
    if (test.inProgressAttemptId) {
      // Continue in-progress test
      navigate(`/student/test-attempt?testId=${testId}&attemptId=${test.inProgressAttemptId}`);
    } else {
      // Start new attempt
      startTestMutation.mutate(testId);
    }
  };

  return (
    <Layout title="Tests" description="Practice tests and assessments">
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="available">Available Tests</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed Tests</TabsTrigger>
        </TabsList>
        
        {/* Available Tests Tab */}
        <TabsContent value="available">
          {isTestsLoading || isAttemptsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : availableTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTests.map((test: any) => (
                <TestCard
                  key={test.id}
                  id={test.id}
                  title={test.title}
                  description={test.description}
                  duration={test.duration}
                  questionCount={10} // Would come from API
                  status="available"
                  onStartTest={handleStartTest}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="py-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tests available</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Check back later for new tests or see the upcoming tests section.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Upcoming Tests Tab */}
        <TabsContent value="upcoming">
          {isTestsLoading || isAttemptsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : upcomingTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTests.map((test: any) => (
                <TestCard
                  key={test.id}
                  id={test.id}
                  title={test.title}
                  description={test.description}
                  scheduledFor={test.scheduledFor}
                  duration={test.duration}
                  questionCount={10} // Would come from API
                  status="upcoming"
                />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="py-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming tests</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Check back later for new scheduled tests or try the available tests.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Completed Tests Tab */}
        <TabsContent value="completed">
          {isTestsLoading || isAttemptsLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : completedTests.length > 0 ? (
            <DataTable
              columns={completedTestsColumns}
              data={completedTestsData}
              searchable={true}
              searchPlaceholder="Search tests..."
            />
          ) : (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="py-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tests</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Once you complete tests, they will be listed here. Try taking some of the available tests.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
