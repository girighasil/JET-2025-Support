import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/lib/queryClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import { Layout } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  FolderOpen, 
  Loader2, 
  Pencil, 
  Trash2, 
  X 
} from 'lucide-react';

// Test form schema
const testSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  courseId: z.number().nullable().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  passingScore: z.number().min(1, "Passing score must be at least 1%").max(100, "Passing score cannot exceed 100%"),
  isActive: z.boolean().default(false),
  scheduledFor: z.string().nullable().optional(),
});

// Question form schema
const questionSchema = z.object({
  testId: z.number(),
  type: z.string(),
  question: z.string().min(1, "Question text is required"),
  options: z.any().optional(),
  correctAnswer: z.any(),
  points: z.number().min(1, "Points must be at least 1"),
  explanation: z.string().optional().nullable(),
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
    queryFn: testId ? undefined : () => Promise.resolve(null),
    enabled: !!testId,
  });
  
  // Fetch questions for this test
  const { data: fetchedQuestions = [], isLoading: isQuestionsLoading } = useQuery({
    queryKey: [`/api/tests/${testId}/questions`],
    queryFn: testId ? undefined : () => Promise.resolve([]),
    enabled: !!testId,
  });
  
  // Fetch courses for dropdown
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
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
      isActive: false,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
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
      // Update the question in the local state
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
      await apiRequest('DELETE', `/api/questions/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      toast({
        title: 'Question Deleted',
        description: 'The question has been deleted successfully.',
      });
      // Remove the question from the local state
      setQuestions(prev => prev.filter(q => q.id !== id));
      setDeleteConfirmQuestion(null);
      if (currentQuestion?.id === id) {
        resetQuestionForm();
      }
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
      const res = await apiRequest('PUT', '/api/questions/reorder', { updates });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      toast({
        title: 'Order Updated',
        description: 'The question order has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Order',
        description: error.message || 'There was an error updating the question order.',
        variant: 'destructive',
      });
    }
  });
  
  // Set form values when editing a test
  useEffect(() => {
    if (isEditMode && test) {
      testForm.reset({
        title: test.title,
        description: test.description,
        courseId: test.courseId,
        duration: test.duration,
        passingScore: test.passingScore,
        isActive: test.isActive,
        scheduledFor: test.scheduledFor,
      });
    }
  }, [isEditMode, test, testForm]);
  
  // Set questions when fetched
  useEffect(() => {
    if (fetchedQuestions && fetchedQuestions.length > 0) {
      setQuestions(fetchedQuestions);
    }
  }, [fetchedQuestions]);
  
  // Set tab to questions if editing and questions exist
  useEffect(() => {
    if (isEditMode && questions.length > 0 && activeTab === 'test-details') {
      // Only auto-switch to questions tab when first loading an existing test with questions
      if (currentQuestion === null && testId && questions.length > 0) {
        setActiveTab('questions');
      }
    }
  }, [activeTab, isEditMode, testId, questions.length, currentQuestion, questionForm, mcqOptions]);
  
  // Set form values when editing a question
  useEffect(() => {
    if (currentQuestion) {
      // First update the question type state to ensure UI components render correctly
      if (currentQuestion.type) {
        setQuestionType(currentQuestion.type as 'mcq' | 'truefalse' | 'fillblank' | 'subjective');
      }
      
      // Then reset the form with all values
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
      const defaultType = 'mcq' as const;
      
      // Reset the question type state first
      setQuestionType(defaultType);
      
      // Then reset the form
      questionForm.reset({
        testId: testId || 0,
        type: defaultType,
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
    const defaultType = 'mcq' as const;
    const defaultOptions = [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' }
    ];
    
    // Update local state
    setQuestionType(defaultType);
    setMcqOptions(defaultOptions);
    setSelectedMcqAnswers([]);
    setTrueFalseAnswer(null);
    setFillBlankAnswer('');
    setSubjectiveKeywords([]);
    setKeywordInput('');
    
    // Update form values to stay in sync with local state
    questionForm.setValue('type', defaultType, { shouldValidate: true });
    questionForm.setValue('options', defaultOptions, { shouldValidate: true });
    questionForm.setValue('correctAnswer', [], { shouldValidate: true });
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
  
  // Add keyword to subjective question - properly updates form value and local state
  const addKeyword = () => {
    if (keywordInput.trim() && !subjectiveKeywords.includes(keywordInput.trim())) {
      // Create updated keywords array
      const updatedKeywords = [...subjectiveKeywords, keywordInput.trim()];
      
      // Update local state
      setSubjectiveKeywords(updatedKeywords);
      
      // Update form value with validation
      questionForm.setValue('correctAnswer', updatedKeywords, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      // Clear input
      setKeywordInput('');
    }
  };
  
  // Remove keyword from subjective question - properly updates form value and local state
  const removeKeyword = (keyword: string) => {
    // Create updated keywords array
    const updatedKeywords = subjectiveKeywords.filter(k => k !== keyword);
    
    // Update local state
    setSubjectiveKeywords(updatedKeywords);
    
    // Update form value with validation
    questionForm.setValue('correctAnswer', updatedKeywords, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    // Trigger validation
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
                        {/* Question Type */}
                        <FormField
                          control={questionForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Type</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  // Update form value
                                  field.onChange(value);
                                  
                                  // Update the question type state
                                  const typedValue = value as 'mcq' | 'truefalse' | 'fillblank' | 'subjective';
                                  setQuestionType(typedValue);
                                  
                                  // Reset the initial options based on the type
                                  const defaultMcqOptions = [
                                    { id: 'a', text: '' },
                                    { id: 'b', text: '' },
                                    { id: 'c', text: '' },
                                    { id: 'd', text: '' }
                                  ];
                                  
                                  // Reset MCQ options if switching to MCQ
                                  if (typedValue === 'mcq') {
                                    setMcqOptions(defaultMcqOptions);
                                    questionForm.setValue('options', defaultMcqOptions, { shouldValidate: true });
                                  }
                                  
                                  // Reset answer-related states
                                  setSelectedMcqAnswers([]);
                                  setTrueFalseAnswer(null);
                                  setFillBlankAnswer('');
                                  setSubjectiveKeywords([]);
                                  setKeywordInput('');
                                  
                                  // Reset the correct answer in the form based on type
                                  const defaultAnswers = {
                                    mcq: [],
                                    truefalse: null,
                                    fillblank: '',
                                    subjective: []
                                  };
                                  
                                  questionForm.setValue('correctAnswer', defaultAnswers[typedValue], { shouldValidate: true });
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
                        
                        {/* Question Text */}
                        <FormField
                          control={questionForm.control}
                          name="question"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Text</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter the question..." 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Answer Options based on question type */}
                        <div className="border rounded-md p-4">
                          <h3 className="font-medium mb-3">Answer Options</h3>
                          
                          {/* Multiple Choice Options */}
                          {questionType === 'mcq' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-2">Define options and select correct answer(s)</p>
                              
                              {/* MCQ Options */}
                              <div className="space-y-3">
                                {mcqOptions.map((option, index) => (
                                  <div key={`mcq-option-${option.id}`} className="flex items-start gap-3">
                                    <div className="flex items-start space-x-3 space-y-0">
                                      <FormField
                                        control={questionForm.control}
                                        name="correctAnswer"
                                        render={({ field }) => (
                                          <FormItem className="flex items-start space-x-3 space-y-0 mt-0">
                                            <FormControl>
                                              <Checkbox 
                                                id={`option-${option.id}`}
                                                checked={selectedMcqAnswers.includes(option.id)}
                                                onCheckedChange={(checked) => {
                                                  // Update the local state
                                                  const updatedAnswers = checked 
                                                    ? [...selectedMcqAnswers, option.id]
                                                    : selectedMcqAnswers.filter(a => a !== option.id);
                                                  
                                                  // Set both local state and form value
                                                  setSelectedMcqAnswers(updatedAnswers);
                                                  field.onChange(updatedAnswers);
                                                }}
                                              />
                                            </FormControl>
                                            <div className="flex-1">
                                              <label 
                                                htmlFor={`option-${option.id}`} 
                                                className="font-medium text-sm"
                                              >
                                                Option {option.id.toUpperCase()}
                                              </label>
                                              <FormField
                                                control={questionForm.control}
                                                name="options"
                                                render={({ field: optionsField }) => (
                                                  <FormItem className="mt-0">
                                                    <FormControl>
                                                      <Input
                                                        placeholder={`Enter option ${option.id}`}
                                                        value={option.text}
                                                        onChange={(e) => {
                                                          // Update local options state
                                                          const updatedOptions = mcqOptions.map(opt => 
                                                            opt.id === option.id ? { ...opt, text: e.target.value } : opt
                                                          );
                                                          
                                                          // Update both local state and form value
                                                          setMcqOptions(updatedOptions);
                                                          optionsField.onChange(updatedOptions);
                                                        }}
                                                        className="mt-1"
                                                      />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Validation message */}
                              {selectedMcqAnswers.length === 0 && (
                                <p className="text-sm text-destructive mt-2">
                                  Please select at least one correct answer
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* True/False Options */}
                          {questionType === 'truefalse' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-2">Select the correct answer</p>
                              
                              <FormField
                                control={questionForm.control}
                                name="correctAnswer"
                                render={({ field }) => (
                                  <FormItem className="space-y-3">
                                    <div 
                                      className={`flex items-center space-x-2 p-3 rounded-md border cursor-pointer ${
                                        trueFalseAnswer === true ? 'border-primary bg-primary/5' : 'border-input'
                                      }`}
                                      onClick={() => {
                                        setTrueFalseAnswer(true);
                                        field.onChange(true);
                                      }}
                                    >
                                      <div className={`h-4 w-4 rounded-full ${
                                        trueFalseAnswer === true ? 'bg-primary' : 'border border-input'
                                      }`} />
                                      <span>True</span>
                                    </div>
                                    
                                    <div 
                                      className={`flex items-center space-x-2 p-3 rounded-md border cursor-pointer ${
                                        trueFalseAnswer === false ? 'border-primary bg-primary/5' : 'border-input'
                                      }`}
                                      onClick={() => {
                                        setTrueFalseAnswer(false);
                                        field.onChange(false);
                                      }}
                                    >
                                      <div className={`h-4 w-4 rounded-full ${
                                        trueFalseAnswer === false ? 'bg-primary' : 'border border-input'
                                      }`} />
                                      <span>False</span>
                                    </div>
                                    
                                    {trueFalseAnswer === null && (
                                      <FormMessage>
                                        Please select the correct answer
                                      </FormMessage>
                                    )}
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                          
                          {/* Fill in the Blank */}
                          {questionType === 'fillblank' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-2">Enter the correct answer</p>
                              
                              <FormField
                                control={questionForm.control}
                                name="correctAnswer"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="Correct answer"
                                        value={fillBlankAnswer}
                                        onChange={(e) => {
                                          const newValue = e.target.value;
                                          setFillBlankAnswer(newValue);
                                          field.onChange(newValue);
                                        }}
                                      />
                                    </FormControl>
                                    {!fillBlankAnswer && (
                                      <FormMessage>
                                        Please enter the correct answer
                                      </FormMessage>
                                    )}
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                          
                          {/* Subjective Question */}
                          {questionType === 'subjective' && (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground mb-2">
                                Add keywords that should be present in a good answer (for auto-grading)
                              </p>
                              
                              <FormField
                                control={questionForm.control}
                                name="correctAnswer"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="space-y-4">
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Enter keyword"
                                          value={keywordInput}
                                          onChange={(e) => setKeywordInput(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              if (keywordInput.trim()) {
                                                // Only update if we have a non-empty keyword
                                                const updatedKeywords = [...subjectiveKeywords, keywordInput.trim()];
                                                setSubjectiveKeywords(updatedKeywords);
                                                field.onChange(updatedKeywords);
                                                setKeywordInput('');
                                              }
                                            }
                                          }}
                                          className="flex-1"
                                        />
                                        <Button 
                                          type="button" 
                                          onClick={() => {
                                            if (keywordInput.trim()) {
                                              // Only update if we have a non-empty keyword
                                              const updatedKeywords = [...subjectiveKeywords, keywordInput.trim()];
                                              setSubjectiveKeywords(updatedKeywords);
                                              field.onChange(updatedKeywords);
                                              setKeywordInput('');
                                            }
                                          }}
                                          className="shrink-0"
                                          size="sm"
                                        >
                                          Add
                                        </Button>
                                      </div>
                                      
                                      {subjectiveKeywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {subjectiveKeywords.map((keyword, i) => (
                                            <Badge key={`keyword-${i}`} variant="secondary" className="px-2 py-1">
                                              {keyword}
                                              <X 
                                                className="h-3 w-3 ml-1 cursor-pointer" 
                                                onClick={() => {
                                                  const updatedKeywords = subjectiveKeywords.filter(k => k !== keyword);
                                                  setSubjectiveKeywords(updatedKeywords);
                                                  field.onChange(updatedKeywords);
                                                }}
                                              />
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Points */}
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
                        
                        {/* Explanation */}
                        <FormField
                          control={questionForm.control}
                          name="explanation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Explanation (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Explain the correct answer..." 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3">
                          {currentQuestion && (
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={() => resetQuestionForm()}
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
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>
                      {questions.length > 0 
                        ? `This test has ${questions.length} questions` 
                        : 'No questions have been added yet'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {questions.length > 0 ? (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="questions-list">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {questions.map((question, index) => (
                                <Draggable 
                                  key={`question-${question.id}`} 
                                  draggableId={`question-${question.id}`} 
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-3 border rounded-md ${
                                        currentQuestion?.id === question.id
                                          ? 'border-primary bg-primary/5'
                                          : 'border-border'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-xs">
                                              {question.type === 'mcq' ? 'Multiple Choice' :
                                               question.type === 'truefalse' ? 'True/False' :
                                               question.type === 'fillblank' ? 'Fill Blank' :
                                               'Subjective'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                              {question.points} {question.points === 1 ? 'point' : 'points'}
                                            </span>
                                          </div>
                                          <p className="text-sm line-clamp-2">{question.question}</p>
                                        </div>
                                        <div className="flex items-center ms-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setCurrentQuestion(question)}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to delete this question? This action cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction 
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                  onClick={() => {
                                                    setDeleteConfirmQuestion(question);
                                                    handleDeleteQuestion();
                                                  }}
                                                >
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    ) : (
                      <div className="text-center p-4">
                        <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Use the form on the left to add questions to this test
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  );
}