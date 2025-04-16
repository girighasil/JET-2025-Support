import { useState, useEffect } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { useLocation, useSearch } from 'wouter';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function StudentTestAttempt() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const testId = parseInt(params.get('testId') || '0');
  const attemptId = parseInt(params.get('attemptId') || '0');
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);
  
  // Fetch test details
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });
  
  // Fetch test attempt
  const { data: testAttempt, isLoading: isAttemptLoading } = useQuery({
    queryKey: [`/api/test-attempts/${attemptId}`],
    enabled: !!attemptId,
  });
  
  // Fetch questions
  const { data: questions = [], isLoading: isQuestionsLoading } = useQuery({
    queryKey: [`/api/tests/${testId}/questions`],
    enabled: !!testId,
  });
  
  // Update test attempt mutation
  const updateAttemptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/test-attempts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/test-attempts/${attemptId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Test Attempt',
        description: error.message || 'There was an error updating your answers.',
        variant: 'destructive',
      });
    }
  });
  
  // Submit test attempt mutation
  const submitAttemptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/test-attempts/${id}`, {
        ...data,
        status: 'completed',
      });
      return res.json();
    },
    onSuccess: (data) => {
      // First invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/test-attempts'] });
      
      // Notify user with toast
      toast({
        title: 'Test Submitted',
        description: `You've completed the test with a score of ${data.score}%.`,
      });
      
      // Use window.history.pushState to avoid the 404 flash
      // This directly manipulates the browser history without triggering a navigation event
      window.history.pushState({}, "", `/student/tests/result/${attemptId}`);
      
      // Then force a navigation event after a small delay to ensure React router catches up
      setTimeout(() => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 200);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Submit Test',
        description: error.message || 'There was an error submitting your test.',
        variant: 'destructive',
      });
    }
  });
  
  // Setup timer
  useEffect(() => {
    if (test && testAttempt) {
      if (testAttempt.status === 'completed') {
        navigate(`/student/tests/result/${attemptId}`);
        return;
      }
      
      // Calculate time left based on start time and duration
      const startTime = new Date(testAttempt.startedAt).getTime();
      const endTime = startTime + (test.duration * 60 * 1000);
      const now = new Date().getTime();
      const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setTimeLeft(timeRemaining);
      
      // Initialize answers from existing attempt
      if (testAttempt.answers) {
        setAnswers(testAttempt.answers);
      }
      
      // Set up timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            setShowTimeoutAlert(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [test, testAttempt, testId, navigate]);
  
  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    
    const autoSaveInterval = setInterval(() => {
      updateAttemptMutation.mutate({
        id: attemptId,
        data: { answers }
      });
    }, 30000);
    
    return () => clearInterval(autoSaveInterval);
  }, [attemptId, answers, updateAttemptMutation]);
  
  // Handle answer change
  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  // Handle navigation between questions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Handle test submission
  const handleSubmitTest = () => {
    if (attemptId) {
      // Close the confirmation dialog first
      setShowConfirmSubmit(false);
      
      // Then submit the test with a small delay to ensure UI updates first
      setTimeout(() => {
        submitAttemptMutation.mutate({
          id: attemptId,
          data: { answers }
        });
      }, 100);
    }
  };
  
  // Handle time out
  const handleTimeOut = () => {
    if (attemptId) {
      // Close the timeout dialog first
      setShowTimeoutAlert(false);
      
      // Then submit the test after a small delay to ensure UI updates first
      setTimeout(() => {
        submitAttemptMutation.mutate({
          id: attemptId,
          data: { answers }
        });
      }, 100);
    }
  };
  
  // Format time display
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Check if all questions are answered
  const allQuestionsAnswered = questions.length > 0 && 
    questions.every((q: any) => answers[q.id] !== undefined);
  
  // Loading state
  if (isTestLoading || isAttemptLoading || isQuestionsLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }
  
  // Error state - no test found
  if (!test || !questions.length) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
          <p className="text-gray-600 mb-6">
            The test you're looking for doesn't exist or has no questions.
          </p>
          <Button asChild>
            <a href="/student/tests">Back to Tests</a>
          </Button>
        </div>
      </Layout>
    );
  }
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        {/* Test Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">{test.title}</h1>
            <p className="text-gray-500">{test.description}</p>
          </div>
          <div className="flex flex-col items-end mt-4 md:mt-0">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className={timeLeft && timeLeft < 300 ? 'text-red-600' : ''}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Time Remaining</p>
          </div>
        </div>
        
        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <span className="text-sm text-gray-500">
              {Object.keys(answers).length} of {questions.length} answered
            </span>
          </div>
          <Progress value={(Object.keys(answers).length / questions.length) * 100} className="h-2" />
        </div>
        
        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQuestionIndex + 1}. {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Multiple Choice Question */}
            {currentQuestion.type === 'mcq' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option: any) => (
                  <div key={option.id} className="flex items-start space-x-2">
                    <RadioGroup
                      value={answers[currentQuestion.id]?.toString()}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                        <Label htmlFor={`option-${option.id}`} className="flex-1">
                          {option.text}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}
            
            {/* True/False Question */}
            {currentQuestion.type === 'truefalse' && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString()}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value === 'true')}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="option-true" />
                  <Label htmlFor="option-true">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="option-false" />
                  <Label htmlFor="option-false">False</Label>
                </div>
              </RadioGroup>
            )}
            
            {/* Fill in the Blank Question */}
            {currentQuestion.type === 'fillblank' && (
              <div className="space-y-3">
                <Input
                  placeholder="Your answer..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                />
              </div>
            )}
            
            {/* Subjective Question */}
            {currentQuestion.type === 'subjective' && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Write your answer here..."
                  className="min-h-[150px]"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              onClick={goToPrevQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>
            <Button
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </Button>
          </CardFooter>
        </Card>
        
        {/* Question Status Grid */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Question Status</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q: any, index: number) => (
              <Button
                key={q.id}
                variant="outline"
                className={`h-10 p-0 ${
                  index === currentQuestionIndex
                    ? 'border-primary border-2'
                    : answers[q.id] !== undefined
                    ? 'bg-primary text-white'
                    : ''
                }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => setShowConfirmSubmit(true)}
            disabled={submitAttemptMutation.isPending}
          >
            Submit Test
          </Button>
        </div>
        
        {/* Confirm Submit Dialog */}
        <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                {allQuestionsAnswered ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>All questions have been answered.</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>
                      You have answered {Object.keys(answers).length} out of {questions.length} questions.
                    </span>
                  </span>
                )}
                <span className="block">
                  Once submitted, you won't be able to change your answers.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmitTest}>
                Submit Test
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Timeout Alert Dialog */}
        <AlertDialog open={showTimeoutAlert} onOpenChange={setShowTimeoutAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Time's Up!</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <span className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-5 w-5" />
                  <span>Your allocated time for this test has expired.</span>
                </span>
                <span className="block">
                  Your answers will be automatically submitted. Click 'Continue' to see your results.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleTimeOut}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
