import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Loader2, ArrowLeft, Plus, Trash2, Edit, Check, X } from 'lucide-react';

import { Layout } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Define test schema
const testSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  courseId: z.number().nullable(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  passingScore: z.number().min(1, "Passing score must be at least 1").max(100, "Passing score cannot exceed 100"),
  isActive: z.boolean().default(false),
  scheduledFor: z.string().nullable().optional(),
});

// Define question schema with stronger typing
const questionSchema = z.object({
  testId: z.number(),
  type: z.enum(['mcq', 'truefalse', 'fillblank', 'subjective']),
  question: z.string().min(1, "Question text is required"),
  points: z.number().min(1, "Points must be at least 1"),
  explanation: z.string().optional().nullable(),
  sortOrder: z.number(),
  // These fields will be added during submission based on question type
  options: z.array(z.object({ id: z.string(), text: z.string() })).optional().nullable(),
  correctAnswer: z.union([
    z.array(z.string()),  // For MCQ and subjective
    z.boolean(),          // For true/false
    z.string(),           // For fill in the blank
    z.null()              // For initial state
  ]),
});

export default function SimpleTestCreator() {
  const [matched, params] = useRoute<{id: string}>('/admin/simple-test-creator/:id');
  const testId = matched && params?.id ? parseInt(params.id) : undefined;
  const isEditMode = !!testId;
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('test-details');
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Question form state
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
      navigate(`/admin/simple-test-creator/${data.id}`, { replace: true });
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
  
  // Set form values when editing a test
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (fetchedQuestions && fetchedQuestions.length > 0) {
      setQuestions(fetchedQuestions);
    }
  }, [fetchedQuestions]);
  
  // Set form values when editing a question
  React.useEffect(() => {
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
          : []);
      } else if (currentQuestion.type === 'truefalse') {
        setTrueFalseAnswer(currentQuestion.correctAnswer);
      } else if (currentQuestion.type === 'fillblank') {
        setFillBlankAnswer(typeof currentQuestion.correctAnswer === 'string'
          ? currentQuestion.correctAnswer
          : '');
      } else if (currentQuestion.type === 'subjective') {
        setSubjectiveKeywords(Array.isArray(currentQuestion.correctAnswer) 
          ? currentQuestion.correctAnswer 
          : []);
      }
    } else {
      // Reset form for new question
      resetQuestionForm();
    }
  }, [currentQuestion, mcqOptions]);
  
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
    
    // Make sure options are properly formatted for database
    const options = questionType === 'mcq' 
      ? mcqOptions.map(opt => ({ 
          id: opt.id, 
          text: opt.text 
        }))
      : null;
    
    const formattedValues = {
      ...values,
      type: questionType,
      correctAnswer,
      options: options,
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
    setQuestionType('mcq');
    setMcqOptions([
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' }
    ]);
    setSelectedMcqAnswers([]);
    setTrueFalseAnswer(null);
    setFillBlankAnswer('');
    setSubjectiveKeywords([]);
    setKeywordInput('');
    
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
  };
  
  // Handle MCQ option change
  const handleMcqOptionChange = (id: string, text: string) => {
    const updatedOptions = mcqOptions.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    );
    setMcqOptions(updatedOptions);
  };
  
  // Add keyword to subjective question
  const addKeyword = () => {
    if (keywordInput.trim() && !subjectiveKeywords.includes(keywordInput.trim())) {
      setSubjectiveKeywords(prev => [...prev, keywordInput.trim()]);
      setKeywordInput('');
    }
  };
  
  // Remove keyword from subjective question
  const removeKeyword = (keyword: string) => {
    setSubjectiveKeywords(prev => prev.filter(k => k !== keyword));
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
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                                {!isCoursesLoading && Array.isArray(courses) && courses.map((course: any) => (
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
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
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
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 70)}
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
                              value={field.value || ''}
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
                            <FormDescription>
                              Determine if this test is visible to students
                            </FormDescription>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question List */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>
                      {questions.length > 0 
                        ? `${questions.length} question(s) in this test` 
                        : 'No questions yet. Add your first question.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isQuestionsLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="mb-4">
                          <Skeleton className="h-16 w-full rounded-md" />
                        </div>
                      ))
                    ) : questions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground mb-4">No questions added yet</p>
                        <Button 
                          variant="outline" 
                          onClick={resetQuestionForm}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Your First Question
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {questions.sort((a, b) => a.sortOrder - b.sortOrder).map((q) => (
                          <div 
                            key={q.id}
                            className={`p-3 border rounded-md ${currentQuestion?.id === q.id ? 'bg-muted border-primary' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <Badge variant="outline" className="mb-2">{q.type.toUpperCase()}</Badge>
                                <h4 className="font-medium line-clamp-2">{q.question}</h4>
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setCurrentQuestion(q)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => deleteQuestionMutation.mutate(q.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">Points: {q.points}</div>
                          </div>
                        ))}
                        
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={resetQuestionForm}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Question
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Question Form */}
              <div className="lg:col-span-2 order-1 lg:order-2">
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
                        <div className="space-y-4">
                          <Label>Question Type</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div
                              className={`border rounded-md p-3 cursor-pointer hover:border-primary ${
                                questionType === 'mcq' ? 'bg-muted border-primary' : ''
                              }`}
                              onClick={() => setQuestionType('mcq')}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Multiple Choice</span>
                                {questionType === 'mcq' && <Check className="h-4 w-4" />}
                              </div>
                              <p className="text-xs text-muted-foreground">Select one or more correct options</p>
                            </div>
                            
                            <div
                              className={`border rounded-md p-3 cursor-pointer hover:border-primary ${
                                questionType === 'truefalse' ? 'bg-muted border-primary' : ''
                              }`}
                              onClick={() => setQuestionType('truefalse')}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">True/False</span>
                                {questionType === 'truefalse' && <Check className="h-4 w-4" />}
                              </div>
                              <p className="text-xs text-muted-foreground">Simple true or false questions</p>
                            </div>
                            
                            <div
                              className={`border rounded-md p-3 cursor-pointer hover:border-primary ${
                                questionType === 'fillblank' ? 'bg-muted border-primary' : ''
                              }`}
                              onClick={() => setQuestionType('fillblank')}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Fill in Blank</span>
                                {questionType === 'fillblank' && <Check className="h-4 w-4" />}
                              </div>
                              <p className="text-xs text-muted-foreground">Enter the correct answer</p>
                            </div>
                            
                            <div
                              className={`border rounded-md p-3 cursor-pointer hover:border-primary ${
                                questionType === 'subjective' ? 'bg-muted border-primary' : ''
                              }`}
                              onClick={() => setQuestionType('subjective')}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Subjective</span>
                                {questionType === 'subjective' && <Check className="h-4 w-4" />}
                              </div>
                              <p className="text-xs text-muted-foreground">Add keywords for auto-grading</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Question Text */}
                        <FormField
                          control={questionForm.control}
                          name="question"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Text</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter your question here..." 
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Question Answer Options - based on type */}
                        <div className="space-y-4">
                          <Label>Answer</Label>
                          
                          {questionType === 'mcq' && (
                            <div className="space-y-4">
                              {mcqOptions.map((option) => (
                                <div key={option.id} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`mcq-option-${option.id}`}
                                    checked={selectedMcqAnswers.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedMcqAnswers(prev => [...prev, option.id]);
                                      } else {
                                        setSelectedMcqAnswers(prev => prev.filter(id => id !== option.id));
                                      }
                                    }}
                                  />
                                  <Input
                                    placeholder={`Option ${option.id.toUpperCase()}`}
                                    value={option.text}
                                    onChange={(e) => handleMcqOptionChange(option.id, e.target.value)}
                                  />
                                </div>
                              ))}
                              <FormDescription>
                                Check the correct answer(s)
                              </FormDescription>
                            </div>
                          )}
                          
                          {questionType === 'truefalse' && (
                            <RadioGroup
                              value={trueFalseAnswer === null ? undefined : trueFalseAnswer.toString()}
                              onValueChange={(value) => setTrueFalseAnswer(value === 'true')}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="true" />
                                <Label htmlFor="true">True</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="false" />
                                <Label htmlFor="false">False</Label>
                              </div>
                            </RadioGroup>
                          )}
                          
                          {questionType === 'fillblank' && (
                            <Input
                              placeholder="Enter the correct answer"
                              value={fillBlankAnswer}
                              onChange={(e) => setFillBlankAnswer(e.target.value)}
                            />
                          )}
                          
                          {questionType === 'subjective' && (
                            <div className="space-y-4">
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Add a keyword"
                                  value={keywordInput}
                                  onChange={(e) => setKeywordInput(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addKeyword();
                                    }
                                  }}
                                />
                                <Button type="button" onClick={addKeyword}>Add</Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {subjectiveKeywords.map((keyword, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {keyword}
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-4 w-4 p-0 ml-1"
                                      onClick={() => removeKeyword(keyword)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                                {subjectiveKeywords.length === 0 && (
                                  <p className="text-sm text-muted-foreground">No keywords added yet</p>
                                )}
                              </div>
                              <FormDescription>
                                Add keywords that should appear in the answer for auto-grading
                              </FormDescription>
                            </div>
                          )}
                        </div>
                        
                        {/* Points and Explanation */}
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
                        
                        <FormField
                          control={questionForm.control}
                          name="explanation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Explanation (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide an explanation for the correct answer..."
                                  className="min-h-[80px]"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormDescription>
                                This will be shown to students after they complete the test
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2">
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
                            disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
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
            </div>
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  );
}