import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Layout } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ArrowLeft, Edit, Loader2, Trash } from 'lucide-react';

// Question form schema
const questionSchema = z.object({
  testId: z.number(),
  type: z.enum(['mcq', 'truefalse', 'fillblank', 'subjective']),
  question: z.string().min(3, 'Question is required'),
  options: z.any().optional(),
  correctAnswer: z.any(),
  points: z.union([
    z.number().min(0.1, 'Points must be greater than 0'),
    z.string().regex(/^\d*\.?\d*$/, 'Must be a valid number').transform(val => parseFloat(val) || 1)
  ]),
  negativePoints: z.union([
    z.number().min(0, 'Negative points must be 0 or greater'),
    z.string().regex(/^\d*\.?\d*$/, 'Must be a valid number').transform(val => parseFloat(val) || 0)
  ]),
  pointsFloat: z.string().regex(/^\d*\.?\d*$/, 'Must be a valid number').optional(),
  negativePointsFloat: z.string().regex(/^\d*\.?\d*$/, 'Must be a valid number').optional(),
  explanation: z.string().optional(),
  sortOrder: z.number(),
});

export default function QuestionManager() {
  const [match, params] = useRoute("/admin/tests/:id/questions");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const testId = match ? parseInt(params?.id as string) : null;

  // State
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Question type specific states
  const [questionType, setQuestionType] = useState<'mcq' | 'truefalse' | 'fillblank' | 'subjective'>('mcq');
  const [mcqOptions, setMcqOptions] = useState([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' }
  ]);
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState<string[]>([]);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [subjectiveKeywords, setSubjectiveKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  // Get test details
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    queryFn: (context) => fetch(context.queryKey[0] as string).then(res => res.json()),
    enabled: !!testId,
  });

  // Get test questions
  const { data: fetchedQuestions, isLoading: isQuestionsLoading } = useQuery({
    queryKey: [`/api/tests/${testId}/questions`],
    queryFn: (context) => fetch(context.queryKey[0] as string).then(res => res.json()),
    enabled: !!testId,
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
      negativePoints: 0, // Will be updated from test.defaultNegativeMarking once test is loaded
      explanation: '',
      sortOrder: 0,
    }
  });

  // Create Question Mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/tests/${testId}/questions`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Question created',
        description: 'The question has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      resetQuestionForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create question',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update Question Mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PATCH', `/api/questions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Question updated',
        description: 'The question has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      resetQuestionForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update question',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete Question Mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/questions/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete question');
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Question deleted',
        description: 'The question has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      setDeleteDialogOpen(false);
      setDeleteConfirmQuestion(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete question',
        description: error.message,
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
    }
  });

  // Update Question Order Mutation
  const updateQuestionOrderMutation = useMutation({
    mutationFn: async (updates: {id: number, sortOrder: number}[]) => {
      const res = await apiRequest('PATCH', `/api/tests/${testId}/questions/reorder`, { updates });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Question order updated',
        description: 'The question order has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update question order',
        description: error.message,
        variant: 'destructive',
      });
      // Revert questions to previous order by refetching
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
    }
  });

  // Initialize questions from fetched data
  useEffect(() => {
    if (fetchedQuestions && fetchedQuestions.length > 0) {
      // Sort by sortOrder
      const sortedQuestions = [...fetchedQuestions].sort((a, b) => a.sortOrder - b.sortOrder);
      setQuestions(sortedQuestions);
    }
  }, [fetchedQuestions]);

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
        negativePoints: currentQuestion.negativePoints || 0,
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
      const initialType = 'mcq' as const;
      const initialOptions = [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ];
      
      questionForm.reset({
        testId: testId || 0,
        type: initialType,
        question: '',
        options: initialOptions,
        correctAnswer: [],
        points: 1,
        negativePoints: 0,
        explanation: '',
        sortOrder: questions.length,
      });
      
      // Reset answer states
      setQuestionType(initialType);
      setMcqOptions(initialOptions);
      setSelectedMcqAnswers([]);
      setTrueFalseAnswer(null);
      setFillBlankAnswer('');
      setSubjectiveKeywords([]);
      setKeywordInput('');
    }
  }, [currentQuestion, questions.length, testId, questionForm]);

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
    
    const initialType = 'mcq' as const;
    const initialOptions = [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' }
    ];
    
    // Update state variables
    setQuestionType(initialType);
    setMcqOptions(initialOptions);
    setSelectedMcqAnswers([]);
    setTrueFalseAnswer(null);
    setFillBlankAnswer('');
    setSubjectiveKeywords([]);
    setKeywordInput('');
    
    // Get default negative points from test if available
    const defaultNegativePoints = test?.hasNegativeMarking && test?.defaultNegativeMarking 
      ? parseFloat(test.defaultNegativeMarking) 
      : 0;
    
    // Also make sure form fields are updated
    questionForm.reset({
      testId: testId || 0,
      type: initialType,
      question: '',
      options: initialOptions,
      correctAnswer: [],
      points: 1,
      negativePoints: defaultNegativePoints,
      explanation: '',
      sortOrder: questions.length,
    });
  };
  
  // Handle MCQ option text changes
  const handleMcqOptionChange = (id: string, text: string) => {
    const updatedOptions = mcqOptions.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    );
    setMcqOptions(updatedOptions);
    
    // Update the form's options value
    questionForm.setValue('options', updatedOptions);
  };
  
  // Handle MCQ answer selection changes
  const handleMcqAnswerChange = (id: string) => {
    const updatedAnswers = selectedMcqAnswers.includes(id)
      ? selectedMcqAnswers.filter(a => a !== id)
      : [...selectedMcqAnswers, id];
    
    setSelectedMcqAnswers(updatedAnswers);
    
    // Update the form's correctAnswer value
    questionForm.setValue('correctAnswer', updatedAnswers);
  };
  

  
  // Add keyword to subjective question
  const addKeyword = () => {
    if (keywordInput.trim() && !subjectiveKeywords.includes(keywordInput.trim())) {
      const updatedKeywords = [...subjectiveKeywords, keywordInput.trim()];
      setSubjectiveKeywords(updatedKeywords);
      questionForm.setValue('correctAnswer', updatedKeywords);
      setKeywordInput('');
    }
  };
  
  // Remove keyword from subjective question
  const removeKeyword = (keyword: string) => {
    const updatedKeywords = subjectiveKeywords.filter(k => k !== keyword);
    setSubjectiveKeywords(updatedKeywords);
    questionForm.setValue('correctAnswer', updatedKeywords);
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
  const isLoading = isTestLoading || isQuestionsLoading;
  
  if (!testId) {
    return (
      <Layout title="Question Manager">
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invalid Test</h2>
          <p className="text-muted-foreground mb-6">
            No test ID provided. Please select a test to manage questions.
          </p>
          <Button onClick={() => navigate('/admin/manage-tests')}>
            Go to Tests
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Question Manager">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-9 w-64" /> : test?.title}
          </h2>
          <p className="text-muted-foreground">
            {isLoading ? <Skeleton className="h-5 w-96" /> : 'Manage questions and adjust their settings'}
          </p>
          {!isLoading && test?.creatorName && (
            <p className="text-sm font-medium text-muted-foreground">
              Created by: {test.creatorName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/admin/manage-tests')}
          >
            <ArrowLeft className="h-4 w-4" />
            All Tests
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate(`/admin/test-creator/${testId}`)}
          >
            <Edit className="h-4 w-4" />
            Edit Test Details
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
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
                            value={field.value}
                            onValueChange={(value: 'mcq' | 'truefalse' | 'fillblank' | 'subjective') => {
                              setQuestionType(value);
                              field.onChange(value);
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Question Type Specific Inputs */}
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Answer Options</h3>
                      
                      {/* Multiple Choice Options */}
                      {questionType === 'mcq' && (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground mb-2">Define options and select correct answer(s)</p>
                          {mcqOptions.map((option) => (
                            <div key={option.id} className="flex items-start gap-3">
                              <Checkbox 
                                id={`option-${option.id}`}
                                checked={selectedMcqAnswers.includes(option.id)}
                                onCheckedChange={() => handleMcqAnswerChange(option.id)}
                              />
                              <div className="flex-1">
                                <Label 
                                  htmlFor={`option-${option.id}`} 
                                  className="mb-1 block font-medium"
                                >
                                  Option {option.id.toUpperCase()}
                                </Label>
                                <Input
                                  type="text"
                                  placeholder={`Enter option ${option.id}`}
                                  value={option.text}
                                  onChange={(e) => handleMcqOptionChange(option.id, e.target.value)}
                                  className="w-full"
                                  key={`mcq-option-${option.id}`}
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
                          <RadioGroup
                            value={trueFalseAnswer === null ? undefined : trueFalseAnswer.toString()}
                            onValueChange={(value) => {
                              const boolValue = value === 'true';
                              setTrueFalseAnswer(boolValue);
                              questionForm.setValue('correctAnswer', boolValue);
                            }}
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
                          <Input
                            type="text"
                            placeholder="Correct answer"
                            value={fillBlankAnswer}
                            onChange={(e) => {
                              setFillBlankAnswer(e.target.value);
                              questionForm.setValue('correctAnswer', e.target.value);
                            }}
                            className="w-full"
                            key="fill-blank-answer"
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
                            <Input
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
                              className="w-full"
                              key="keyword-input"
                            />
                            <Button 
                              type="button" 
                              onClick={addKeyword}
                              disabled={!keywordInput.trim()}
                            >
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {subjectiveKeywords.map((keyword, index) => (
                              <div 
                                key={index} 
                                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                              >
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => removeKeyword(keyword)}
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
                            <FormLabel>Points for Correct Answer</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1}
                                step="0.01"
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={questionForm.control}
                        name="negativePoints"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points to Deduct for Wrong Answer</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0}
                                step="0.01"
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              Set to 0 if no points should be deducted
                            </p>
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
                              placeholder="Explain the correct answer..." 
                              className="min-h-[80px]"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                                    ${currentQuestion?.id === question.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'}
                                  `}
                                >
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-center h-6 w-6 bg-muted rounded-md text-xs font-medium"
                                  >
                                    {index + 1}
                                  </div>
                                  <div 
                                    className="flex-1 cursor-pointer" 
                                    onClick={() => setCurrentQuestion(question)}
                                  >
                                    <p className="font-medium line-clamp-2">
                                      {question.question}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                        {question.type === 'mcq' ? 'Multiple Choice' : 
                                          question.type === 'truefalse' ? 'True/False' :
                                          question.type === 'fillblank' ? 'Fill Blank' : 'Subjective'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {question.points} {question.points === 1 ? 'point' : 'points'}
                                        {question.negativePoints > 0 && ` (${question.negativePoints} neg.)`}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteConfirmQuestion(question);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-muted-foreground mb-2">No questions added yet</p>
                            <p className="text-sm text-muted-foreground">
                              Use the form to add questions to this test
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
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 border rounded-md my-2">
            <p className="font-medium">{deleteConfirmQuestion?.question}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {deleteConfirmQuestion?.type === 'mcq' ? 'Multiple Choice' : 
                  deleteConfirmQuestion?.type === 'truefalse' ? 'True/False' :
                  deleteConfirmQuestion?.type === 'fillblank' ? 'Fill Blank' : 'Subjective'}
              </span>
              <span className="text-xs text-muted-foreground">
                {deleteConfirmQuestion?.points} {deleteConfirmQuestion?.points === 1 ? 'point' : 'points'}
                {deleteConfirmQuestion?.negativePoints > 0 && ` (${deleteConfirmQuestion.negativePoints} neg.)`}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}