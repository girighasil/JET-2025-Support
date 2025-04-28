import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, ListChecks } from "lucide-react";

// Test schema
const testSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  courseId: z.number().optional().nullable(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  passingScore: z
    .number()
    .min(1, "Passing score must be at least 1%")
    .max(100, "Passing score cannot exceed 100%"),
  isActive: z.boolean().default(true),
  hasNegativeMarking: z.boolean().default(false),
  defaultNegativeMarking: z
    .string()
    .regex(/^\d*\.?\d*$/, "Must be a valid number")
    .default("0"),
  defaultPoints: z
    .string()
    .regex(/^\d*\.?\d*$/, "Must be a valid number")
    .default("1"),
  scheduledFor: z.string().optional().nullable(),
  visibility: z.enum(["private", "public"]).default("private"),
  testType: z.enum(["formal", "practice"]).default("formal"),
});

export default function TestCreator() {
  const [matched, params] = useRoute<{ id: string }>("/admin/test-creator/:id");
  const testId = matched && params?.id ? parseInt(params.id) : undefined;
  const isEditMode = !!testId;

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<any[]>([]);

  // Fetch test if editing
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });

  // Fetch questions if editing
  const { data: fetchedQuestions = [], isLoading: isQuestionsLoading } =
    useQuery({
      queryKey: [`/api/tests/${testId}/questions`],
      enabled: !!testId,
    });

  // Fetch courses for dropdown
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: z.infer<typeof testSchema>) => {
      const res = await apiRequest("POST", "/api/tests", testData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Test Created",
        description: "The test has been created successfully.",
      });
      navigate(`/admin/test-creator/${data.id}`, { replace: true });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Test",
        description: error.message || "There was an error creating the test.",
        variant: "destructive",
      });
    },
  });

  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async (testData: z.infer<typeof testSchema>) => {
      const res = await apiRequest("PUT", `/api/tests/${testId}`, testData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
      toast({
        title: "Test Updated",
        description: "The test has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Test",
        description: error.message || "There was an error updating the test.",
        variant: "destructive",
      });
    },
  });

  // Test form
  const testForm = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: null,
      duration: 60,
      passingScore: 70,
      isActive: true,
      hasNegativeMarking: false,
      defaultNegativeMarking: "0",
      defaultPoints: "1",
      scheduledFor: null,
      visibility: "private",
      testType: "formal",
    },
  });

  // Initialize from existing test data
  useEffect(() => {
    if (test) {
      testForm.reset({
        title: test.title || "",
        description: test.description || "",
        courseId: test.courseId,
        duration: test.duration || 60,
        passingScore: test.passingScore || 70,
        isActive: test.isActive !== undefined ? test.isActive : true,
        hasNegativeMarking:
          test.hasNegativeMarking !== undefined
            ? test.hasNegativeMarking
            : false,
        defaultNegativeMarking: test.defaultNegativeMarking || "0",
        defaultPoints: test.defaultPoints || "1",
        scheduledFor: test.scheduledFor || null,
        visibility: test.visibility || "private",
        testType: test.testType || "formal",
      });
    }
  }, [test, testForm]);

  // Initialize questions from fetched data
  useEffect(() => {
    if (
      fetchedQuestions &&
      Array.isArray(fetchedQuestions) &&
      fetchedQuestions.length > 0
    ) {
      // Sort by sortOrder
      const sortedQuestions = [...fetchedQuestions].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      setQuestions(sortedQuestions);
    }
  }, [fetchedQuestions]);

  // Handle test form submission
  function onTestSubmit(values: z.infer<typeof testSchema>) {
    if (isEditMode) {
      updateTestMutation.mutate(values);
    } else {
      createTestMutation.mutate(values);
    }
  }

  // Loading state
  const isLoading = isEditMode && (isTestLoading || isQuestionsLoading);

  return (
    <Layout title={isEditMode ? "Edit Test" : "Create New Test"}>
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => navigate("/admin/manage-tests")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </Button>

        {isEditMode && (
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => navigate(`/admin/tests/${testId}/questions`)}
          >
            <ListChecks className="h-4 w-4" />
            Manage Questions ({questions.length})
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? "Edit Test" : "Create New Test"}
            </CardTitle>
            <CardDescription>
              {isEditMode ? (
                <>
                  Update the test details and settings.
                  {test?.creatorName && (
                    <span className="mt-2 block text-sm font-medium">
                      Created by: {test.creatorName}
                    </span>
                  )}
                </>
              ) : (
                "Fill in the details to create a new test. You can add questions after saving the test."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...testForm}>
              <form
                onSubmit={testForm.handleSubmit(onTestSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={testForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Algebra Mid-Term Exam"
                          {...field}
                        />
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
                          value={field.value?.toString() || ""}
                          onValueChange={(value) =>
                            field.onChange(
                              value === "null" ? null : parseInt(value),
                            )
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">
                              No specific course
                            </SelectItem>
                            {Array.isArray(courses) &&
                              courses.map((course: any) => (
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
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
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
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
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
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <FormField
                    control={testForm.control}
                    name="hasNegativeMarking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Negative Marking</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Deduct marks for incorrect answers
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
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-medium mb-4">Points Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={testForm.control}
                      name="defaultPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Default Points for Correct Answer
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="1.0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground mt-1">
                            Points awarded for correct answers (applies to all
                            questions by default)
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {testForm.watch("hasNegativeMarking") && (
                      <FormField
                        control={testForm.control}
                        name="defaultNegativeMarking"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Negative Points</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.25"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground mt-1">
                              Points to deduct for incorrect answers (applies to
                              all questions by default)
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30 mb-6">
                  <h3 className="font-medium mb-4">Access Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={testForm.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Visibility</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select visibility" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="private">
                                <div className="flex items-center gap-2">
                                  <span className="bg-amber-100 p-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-600">
                                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                  <div>
                                    <p className="font-medium">Private</p>
                                    <p className="text-xs text-muted-foreground">Only enrolled students can access</p>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="public">
                                <div className="flex items-center gap-2">
                                  <span className="bg-green-100 p-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-600">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                  <div>
                                    <p className="font-medium">Public</p>
                                    <p className="text-xs text-muted-foreground">All students can access</p>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {field.value === "public" && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Public tests are available to all students regardless of course enrollment.
                              </p>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={testForm.control}
                      name="testType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Type</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select test type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="formal">
                                <div className="flex items-center gap-2">
                                  <span className="bg-blue-100 p-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600">
                                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                    </svg>
                                  </span>
                                  <div>
                                    <p className="font-medium">Formal Assessment</p>
                                    <p className="text-xs text-muted-foreground">Counts toward course progress</p>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="practice">
                                <div className="flex items-center gap-2">
                                  <span className="bg-purple-100 p-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-purple-600">
                                      <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                                    </svg>
                                  </span>
                                  <div>
                                    <p className="font-medium">Practice Test</p>
                                    <p className="text-xs text-muted-foreground">For learning purposes only</p>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={
                      createTestMutation.isPending ||
                      updateTestMutation.isPending
                    }
                  >
                    {(createTestMutation.isPending ||
                      updateTestMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? "Update Test" : "Create Test"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
