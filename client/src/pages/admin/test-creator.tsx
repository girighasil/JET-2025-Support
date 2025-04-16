import { useState, useEffect } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useRoute } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, 
  Plus, 
  Save, 
  Trash, 
  ArrowLeft,
  Grip,
  Loader2
} from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable
} from '@hello-pangea/dnd';

// Test schema
const testSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  courseId: z.number().optional().nullable(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  passingScore: z.number().min(1, 'Passing score must be at least 1%').max(100, 'Passing score cannot exceed 100%'),
  isActive: z.boolean().default(true),
  scheduledFor: z.string().optional().nullable(),
});

// Question schema
const questionSchema = z.object({
  testId: z.number(),
  type: z.enum(['mcq', 'truefalse', 'fillblank', 'subjective']),
  question: z.string().min(3, 'Question must be at least 3 characters'),
  options: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  correctAnswer: z.any(),
  points: z.number().min(1, 'Points must be at least 1'),
  explanation: z.string().optional(),
  sortOrder: z.number(),
});

export default function TestCreator() {
  const [matched, params] = useRoute<{id: string}>('/admin/test-creator/:id');
  const testId = matched && params?.id ? parseInt(params.id) : undefined;
  const isEditMode = !!testId;
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('test-details');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionType, setQuestionType] = useState<'mcq' | 'truefalse' | 'fillblank' | 'subjective'>('mcq');
  const [mcqOptions, setMcqOptions] = useState<{id: string, text: string}[]>([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' }
  ]);
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState<string[]>([]);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState<string>('');
  const [subjectiveKeywords, setSubjectiveKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState<any>(null);
  
  // Fetch test if editing
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });
  
  // Fetch questions if editing
  const { data: fetchedQuestions = [], isLoading: isQuestionsLoading } = useQuery({
    queryKey: [`/api/tests/${testId}/questions`],
    enabled: !!testId,
  });
  
  // Fetch courses for dropdown
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
  });
  
  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: z.infer<typeof testSchema>) => {
      const res = await apiRequest('POST', '/api/tests', testData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      toast({
        title: 'Test Created',
        description: 'The test has been created successfully.',
      });
      // Switch to questions tab and set testId for questions
      setActiveTab('questions');
      navigate(`/admin/test-creator/${data.id}`, { replace: true });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Test',
        description: error.message || 'There was an error creating the test.',
        variant: 'destructive',
      });
    }
  });
  
  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async (testData: z.infer<typeof testSchema>) => {
      const res = await apiRequest('PUT', `/api/tests/${testId}`, testData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({
        title: 'Test Updated',
        description: 'The test has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Test',
        description: error.message || 'There was an error updating the test.',
        variant: 'destructive',
      });
    }
  });
  
  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: z.infer<typeof questionSchema>) => {
      const res = await apiRequest('POST', '/api/questions', questionData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      toast({
        title: 'Question Added',
        description: 'The question has been added successfully.',
      });
      
      // Add new question to the local state
      setQuestions(prev => [...prev, data]);
      resetQuestionForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add Question',
        description: error.message || 'There was an error adding the question.',
        variant: 'destructive',
      });
    }
  });
  
  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof questionSchema> }) => {
      const res = await apiRequest('PUT', `/api/questions/${id}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      toast({
        title: 'Question Updated',
        description: 'The question has been updated successfully.',
      });
      
      // Update question in local state
      setQuestions(prev => prev.map(q => q.id === data.id ? data : q));
      resetQuestionForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Question',
        description: error.message || 'There was an error updating the question.',
        variant: 'destructive',
      });
    }
  });
  
  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/questions/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      toast({
        title: 'Question Deleted',
        description: 'The question has been deleted successfully.',
      });
      
      // Remove question from local state
      setQuestions(prev => prev.filter(q => q.id !== deleteConfirmQuestion.id));
      setDeleteConfirmQuestion(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Question',
        description: error.message || 'There was an error deleting the question.',
        variant: 'destructive',
      });
    }
  });
  
  // Update question order mutation
  const updateQuestionOrderMutation = useMutation({
    mutationFn: async (updates: { id: number; sortOrder: number }[]) => {
      // Make multiple requests to update each question's order
      const promises = updates.map(update => 
        apiRequest('PUT', `/api/questions/${update.id}`, { sortOrder: update.sortOrder })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      toast({
        title: 'Question Order Updated',
        description: 'The question order has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Question Order',
        description: error.message || 'There was an error updating the question order.',
        variant: 'destructive',
      });
    }
  });
  
  // Test form
  const testForm = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: '',
      description: '',
      courseId: null,
      duration: 60,
      passingScore: 70,
      isActive: true,
      scheduledFor: null,
    },
  });
  
  // Question form
  const questionForm = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      testId: testId || 0,
      type: 'mcq',
      question: '',
      options: mcqOptions,
      correctAnswer: [],
      points: 1,
      explanation: '',
      sortOrder: 0,
    },
    mode: 'onChange',
  });
  
  // Initialize from existing test data
  useEffect(() => {
    if (test) {
      testForm.reset({
        title: test.title,
        description: test.description,
        courseId: test.courseId,
        duration: test.duration,
        passingScore: test.passingScore,
        isActive: test.isActive,
        scheduledFor: test.scheduledFor || null,
      });
    }
  }, [test, testForm]);
  
  // Initialize questions from fetched data
  useEffect(() => {
    if (fetchedQuestions && fetchedQuestions.length > 0) {
      // Sort by sortOrder
      const sortedQuestions = [...fetchedQuestions].sort((a, b) => a.sortOrder - b.sortOrder);
      setQuestions(sortedQuestions);
    }
  }, [fetchedQuestions]);
  
  // Handle active tab change
  useEffect(() => {
    if (activeTab === 'questions' && isEditMode) {
      // Reset question form when switching to questions tab
      if (!currentQuestion) {
        questionForm.reset({
          testId: testId || 0,
          type: 'mcq',
          question: '',
          options: mcqOptions,
          correctAnswer: [],
          points: 1,
          explanation: '',
          sortOrder: questions.length,
        });
        
        resetAnswerStates();
      }
    }
  }, [activeTab, isEditMode, testId, questions.length, currentQuestion, questionForm, mcqOptions]);

  // Set form values when editing a question
  useEffect(() => {
    if (currentQuestion) {
      questionForm.reset({
        testId: currentQuestion.testId,
        type: currentQuestion.type,
        question: currentQuestion.question,
        options: currentQuestion.options || mcqOptions,
        correctAnswer: currentQuestion.correctAnswer || [],
        points: currentQuestion.points,
        explanation: currentQuestion.explanation || '',
        sortOrder: currentQuestion.sortOrder,
      });
      
      setQuestionType(currentQuestion.type);
      
      // Set the appropriate answer state based on question type
      if (currentQuestion.type === 'mcq') {
        setMcqOptions(currentQuestion.options || mcqOptions);
        setSelectedMcqAnswers(Array.isArray(currentQuestion.correctAnswer) 
          ? currentQuestion.correctAnswer 
          : [currentQuestion.correctAnswer]);
      } else if (currentQuestion.type === 'truefalse') {
        setTrueFalseAnswer(currentQuestion.correctAnswer);
      } else if (currentQuestion.type === 'fillblank') {
        setFillBlankAnswer(Array.isArray(currentQuestion.correctAnswer) 
          ? currentQuestion.correctAnswer[0] 
          : currentQuestion.correctAnswer || '');
      } else if (currentQuestion.type === 'subjective') {
        setSubjectiveKeywords(Array.isArray(currentQuestion.correctAnswer) 
          ? currentQuestion.correctAnswer 
          : []);
      }
    } else {
      // Reset form for new question
      questionForm.reset({
        testId: testId || 0,
        type: 'mcq',
        question: '',
        options: mcqOptions,
        correctAnswer: [],
        points: 1,
        explanation: '',
        sortOrder: questions.length,
      });
      
      // Reset answer states
      resetAnswerStates();
    }
  }, [currentQuestion, questions.length, testId, questionForm, mcqOptions]);
  
  // Handle test form submission
  function onTestSubmit(values: z.infer<typeof testSchema>) {
    if (isEditMode) {
      updateTestMutation.mutate(values);
    } else {
      createTestMutation.mutate(values);
    }
  }
  
  // Handle question form submission
  function onQuestionSubmit(values: z.infer<typeof questionSchema>) {
    // Prepare correctAnswer based on question type
    let correctAnswer;
    
    switch (questionType) {
      case 'mcq':
        correctAnswer = selectedMcqAnswers;
        break;
      case 'truefalse':
        correctAnswer = trueFalseAnswer;
        break;
      case 'fillblank':
        correctAnswer = fillBlankAnswer;
        break;
      case 'subjective':
        correctAnswer = subjectiveKeywords;
        break;
      default:
        correctAnswer = [];
    }
    
    const formattedValues = {
      ...values,
      type: questionType,
      correctAnswer,
      options: questionType === 'mcq' ? mcqOptions : undefined,
      testId: testId || 0,
      sortOrder: currentQuestion?.sortOrder ?? questions.length,
    };
    
    if (currentQuestion) {
      updateQuestionMutation.mutate({ id: currentQuestion.id, data: formattedValues });
    } else {
      createQuestionMutation.mutate(formattedValues);
    }
  }
  
  // Reset question form and states
  const resetQuestionForm = () => {
    setCurrentQuestion(null);
    questionForm.reset({
      testId: testId || 0,
      type: 'mcq',
      question: '',
      options: mcqOptions,
      correctAnswer: [],
      points: 1,
      explanation: '',
      sortOrder: questions.length,
    });
    resetAnswerStates();
  };
  
  // Reset all answer-related states
  const resetAnswerStates = () => {
    setQuestionType('mcq' as const);
    const defaultOptions = [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' }
    ];
    setMcqOptions(defaultOptions);
    // Make sure to also update the form state with the default options
    questionForm.setValue('options', defaultOptions);
    setSelectedMcqAnswers([]);
    setTrueFalseAnswer(null);
    setFillBlankAnswer('');
    setSubjectiveKeywords([]);
    setKeywordInput('');
  };
  
  // Handle MCQ option change
  const handleMcqOptionChange = (id: string, text: string) => {
    const updatedOptions = mcqOptions.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    );
    setMcqOptions(updatedOptions);
    
    // Update the form's options value and force a re-render
    questionForm.setValue('options', updatedOptions, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };
  
  // Handle MCQ answer selection
  const handleMcqAnswerChange = (id: string) => {
    const updatedAnswers = selectedMcqAnswers.includes(id)
      ? selectedMcqAnswers.filter(a => a !== id)
      : [...selectedMcqAnswers, id];
    
    setSelectedMcqAnswers(updatedAnswers);
    
    // Update the form's correctAnswer value
    questionForm.setValue('correctAnswer', updatedAnswers);
    questionForm.trigger('correctAnswer');
  };
  
  // Add keyword to subjective question
  const addKeyword = () => {
    if (keywordInput.trim() && !subjectiveKeywords.includes(keywordInput.trim())) {
      const updatedKeywords = [...subjectiveKeywords, keywordInput.trim()];
      setSubjectiveKeywords(updatedKeywords);
      questionForm.setValue('correctAnswer', updatedKeywords, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      setKeywordInput('');
    }
  };
  
  // Remove keyword from subjective question
  const removeKeyword = (keyword: string) => {
    const updatedKeywords = subjectiveKeywords.filter(k => k !== keyword);
    setSubjectiveKeywords(updatedKeywords);
    questionForm.setValue('correctAnswer', updatedKeywords);
    questionForm.trigger('correctAnswer');
  };
  
  // Handle question deletion
  const handleDeleteQuestion = () => {
    if (deleteConfirmQuestion) {
      deleteQuestionMutation.mutate(deleteConfirmQuestion.id);
    }
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update local state
    setQuestions(items);
    
    // Prepare updates for API calls
    const updates = items.map((item, index) => ({
      id: item.id,
      sortOrder: index
    }));
    
    // Update in the database
    updateQuestionOrderMutation.mutate(updates);
  };
  
  // Loading state
  const isLoading = isEditMode && (isTestLoading || isQuestionsLoading);
  
  return (
    <Layout title={isEditMode ? 'Edit Test' : 'Create New Test'}>
      <div className="mb-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate('/admin/manage-tests')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </Button>
      </div>
      
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // Reset form states when switching to questions tab
            if (value === "questions" && !currentQuestion) {
              resetQuestionForm();
            }
          }} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="test-details">Test Details</TabsTrigger>
            <TabsTrigger value="questions" disabled={!isEditMode}>
              Questions {questions.length > 0 && `(${questions.length})`}
            </TabsTrigger>
          </TabsList>
          
          {/* Test Details Tab */}
          <TabsContent value="test-details">
            <Card>
              <CardHeader>
                <CardTitle>{isEditMode ? 'Edit Test' : 'Create New Test'}</CardTitle>
                <CardDescription>
                  {isEditMode 
                    ? 'Update the test details and settings.' 
                    : 'Fill in the details to create a new test. You can add questions after saving the test.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...testForm}>
                  <form onSubmit={testForm.handleSubmit(onTestSubmit)} className="space-y-6">
                    <FormField
                      control={testForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Algebra Mid-Term Exam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={testForm.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Associated Course (Optional)</FormLabel>
                            <Select
                              value={field.value?.toString() || ''}
                              onValueChange={(value) => 
                                field.onChange(value === "null" ? null : parseInt(value))
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a course" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="null">No specific course</SelectItem>
                                {!isCoursesLoading && courses.map((course: any) => (
                                  <SelectItem 
                                    key={course.id} 
                                    value={course.id.toString()}
                                  >
                                    {course.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={testForm.control}
                        name="scheduledFor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scheduled For (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field} 
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={testForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={testForm.control}
                        name="passingScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passing Score (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                max={100} 
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={testForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what the test covers..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={testForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Determine if this test is visible to students
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        className="w-full md:w-auto"
                        disabled={createTestMutation.isPending || updateTestMutation.isPending}
                      >
                        {(createTestMutation.isPending || updateTestMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isEditMode ? 'Update Test' : 'Create Test'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Question Form */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{currentQuestion ? 'Edit Question' : 'Add New Question'}</CardTitle>
                    <CardDescription>
                      {currentQuestion 
                        ? 'Update the question details and answer options.' 
                        : 'Create a new question for this test.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...questionForm}>
                      <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-6">
                        <FormField
                          control={questionForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Type</FormLabel>
                              <Select
                                value={questionType}
                                onValueChange={(value: any) => {
                                  const typedValue = value as 'mcq' | 'truefalse' | 'fillblank' | 'subjective';
                                  setQuestionType(typedValue);
                                  field.onChange(typedValue);
                                  
                                  // Reset all relevant answer state when switching types
                                  setSelectedMcqAnswers([]);
                                  setTrueFalseAnswer(null);
                                  setFillBlankAnswer('');
                                  setSubjectiveKeywords([]);
                                  
                                  // Set appropriate form values based on new question type
                                  questionForm.setValue('correctAnswer', 
                                    typedValue === 'mcq' ? [] : 
                                    typedValue === 'truefalse' ? null : 
                                    typedValue === 'fillblank' ? '' : 
                                    [], 
                                    { shouldValidate: true }
                                  );
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select question type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                                  <SelectItem value="truefalse">True/False</SelectItem>
                                  <SelectItem value="fillblank">Fill in the Blank</SelectItem>
                                  <SelectItem value="subjective">Subjective</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Question Text</div>
                          <textarea
                            placeholder="Enter the question..."
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={questionForm.getValues('question')}
                            onChange={(e) => {
                              questionForm.setValue('question', e.target.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true
                              });
                            }}
                          />
                          {questionForm.formState.errors.question && (
                            <p className="text-sm font-medium text-destructive">
                              {questionForm.formState.errors.question.message}
                            </p>
                          )}
                        </div>
                        
                        {/* Question Type Specific Inputs */}
                        <div className="border rounded-md p-4">
                          <h3 className="font-medium mb-3">Answer Options</h3>
                          
                          {/* Multiple Choice Options */}
                          {questionType === 'mcq' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-2">Define options and select correct answer(s)</p>
                              {mcqOptions.map((option, index) => (
                                <div key={`mcq-option-row-${option.id}-${index}`} className="flex items-start gap-3">
                                  <Checkbox 
                                    id={`option-${option.id}-${index}`}
                                    checked={selectedMcqAnswers.includes(option.id)}
                                    onCheckedChange={() => {
                                      const updatedAnswers = selectedMcqAnswers.includes(option.id)
                                        ? selectedMcqAnswers.filter(a => a !== option.id)
                                        : [...selectedMcqAnswers, option.id];
                                      
                                      setSelectedMcqAnswers(updatedAnswers);
                                      questionForm.setValue('correctAnswer', updatedAnswers, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true
                                      });
                                    }}
                                  />
                                  <div className="flex-1">
                                    <Label 
                                      htmlFor={`option-${option.id}-${index}`} 
                                      className="mb-1 block font-medium"
                                    >
                                      Option {option.id.toUpperCase()}
                                    </Label>
                                    <input
                                      type="text"
                                      placeholder={`Enter option ${option.id}`}
                                      defaultValue={option.text}
                                      onChange={(e) => {
                                        const updatedOptions = mcqOptions.map(opt => 
                                          opt.id === option.id ? { ...opt, text: e.target.value } : opt
                                        );
                                        setMcqOptions(updatedOptions);
                                        questionForm.setValue('options', updatedOptions, {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                          shouldTouch: true
                                        });
                                      }}
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                  </div>
                                </div>
                              ))}
                              {selectedMcqAnswers.length === 0 && (
                                <p className="text-sm text-red-500">
                                  Please select at least one correct answer
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* True/False Options */}
                          {questionType === 'truefalse' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-2">Select the correct answer</p>
                              <div className="flex flex-col space-y-3">
                                <div 
                                  className={`flex items-center space-x-2 p-3 rounded border ${
                                    trueFalseAnswer === true ? 'border-primary bg-primary/5' : 'border-input'
                                  }`}
                                  onClick={() => {
                                    setTrueFalseAnswer(true);
                                    questionForm.setValue('correctAnswer', true, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                      shouldTouch: true
                                    });
                                  }}
                                >
                                  <div className={`h-4 w-4 rounded-full ${
                                    trueFalseAnswer === true ? 'bg-primary' : 'border border-input'
                                  }`} />
                                  <Label className="cursor-pointer">True</Label>
                                </div>
                                <div 
                                  className={`flex items-center space-x-2 p-3 rounded border ${
                                    trueFalseAnswer === false ? 'border-primary bg-primary/5' : 'border-input'
                                  }`}
                                  onClick={() => {
                                    setTrueFalseAnswer(false);
                                    questionForm.setValue('correctAnswer', false, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                      shouldTouch: true
                                    });
                                  }}
                                >
                                  <div className={`h-4 w-4 rounded-full ${
                                    trueFalseAnswer === false ? 'bg-primary' : 'border border-input'
                                  }`} />
                                  <Label className="cursor-pointer">False</Label>
                                </div>
                              </div>
                              {trueFalseAnswer === null && (
                                <p className="text-sm text-red-500">
                                  Please select the correct answer
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Fill in the Blank */}
                          {questionType === 'fillblank' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-2">Enter the correct answer</p>
                              <input
                                type="text"
                                placeholder="Correct answer"
                                defaultValue={fillBlankAnswer}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setFillBlankAnswer(newValue);
                                  questionForm.setValue('correctAnswer', newValue, { 
                                    shouldValidate: true,
                                    shouldDirty: true,
                                    shouldTouch: true
                                  });
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              {!fillBlankAnswer && (
                                <p className="text-sm text-red-500">
                                  Please enter the correct answer
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Subjective Question */}
                          {questionType === 'subjective' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-2">
                                Add keywords that should be present in a good answer (for auto-grading)
                              </p>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Enter keyword"
                                  value={keywordInput}
                                  onChange={(e) => setKeywordInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addKeyword();
                                    }
                                  }}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Button 
                                  type="button" 
                                  onClick={() => {
                                    if (keywordInput.trim()) {
                                      const newKeywords = [...subjectiveKeywords, keywordInput.trim()];
                                      setSubjectiveKeywords(newKeywords);
                                      questionForm.setValue('correctAnswer', newKeywords, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true
                                      });
                                      setKeywordInput('');
                                    }
                                  }}
                                  disabled={!keywordInput.trim()}
                                >
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2 border rounded-md p-3">
                                {subjectiveKeywords.map((keyword, index) => (
                                  <div 
                                    key={`keyword-${index}-${keyword}`} 
                                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                  >
                                    {keyword}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newKeywords = subjectiveKeywords.filter(k => k !== keyword);
                                        setSubjectiveKeywords(newKeywords);
                                        questionForm.setValue('correctAnswer', newKeywords, {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                          shouldTouch: true
                                        });
                                      }}
                                      className="text-primary hover:text-primary/70 h-4 w-4 rounded-full flex items-center justify-center"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                {subjectiveKeywords.length === 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    No keywords added yet
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={questionForm.control}
                            name="points"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Points</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={1} 
                                    {...field}
                                    value={field.value}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Explanation (Optional)</div>
                          <textarea
                            placeholder="Explain the correct answer..."
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={questionForm.getValues('explanation') || ''}
                            onChange={(e) => {
                              questionForm.setValue('explanation', e.target.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true
                              });
                            }}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          {currentQuestion && (
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={resetQuestionForm}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button 
                            type="submit"
                            disabled={
                              createQuestionMutation.isPending || 
                              updateQuestionMutation.isPending ||
                              (questionType === 'mcq' && selectedMcqAnswers.length === 0) ||
                              (questionType === 'truefalse' && trueFalseAnswer === null) ||
                              (questionType === 'fillblank' && !fillBlankAnswer)
                            }
                          >
                            {(createQuestionMutation.isPending || updateQuestionMutation.isPending) && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {currentQuestion ? 'Update Question' : 'Add Question'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              
              {/* Questions List */}
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Questions ({questions.length})</CardTitle>
                    <CardDescription>
                      Drag to reorder questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="questions">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {questions.length > 0 ? (
                              questions.map((question, index) => (
                                <Draggable 
                                  key={question.id} 
                                  draggableId={question.id.toString()} 
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`p-3 rounded-md border flex items-start gap-2
                                        ${currentQuestion?.id === question.id ? 'bg-primary/5 border-primary' : 'bg-white'}
                                      `}
                                    >
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="mt-1"
                                      >
                                        <Grip className="h-5 w-5 text-gray-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                          <span className="text-xs font-medium bg-gray-100 rounded px-2 py-0.5 capitalize">
                                            {question.type === 'mcq' ? 'Multiple Choice' : 
                                             question.type === 'truefalse' ? 'True/False' : 
                                             question.type === 'fillblank' ? 'Fill Blank' : 
                                             'Subjective'}
                                          </span>
                                          <span className="text-xs font-medium bg-blue-50 text-blue-800 rounded px-2 py-0.5">
                                            {question.points} {question.points === 1 ? 'point' : 'points'}
                                          </span>
                                        </div>
                                        <p className="text-sm mt-1 break-words line-clamp-2">
                                          {question.question}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentQuestion(question)}
                                            className="h-8 px-2 text-xs"
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteConfirmQuestion(question)}
                                            className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            ) : (
                              <div className="text-center p-6 border border-dashed rounded-md">
                                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                  No questions added yet
                                </p>
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmQuestion} onOpenChange={(open) => !open && setDeleteConfirmQuestion(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-3 border rounded-md bg-gray-50">
            <p className="text-sm">{deleteConfirmQuestion?.question}</p>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmQuestion(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteQuestion}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
