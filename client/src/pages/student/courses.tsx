import { Layout } from '@/components/ui/layout';
import { CourseCard } from '@/components/dashboard/course-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from "wouter";
import { Course } from "../../shared/schema";
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { 
  ArrowRight, 
  Search,
  BookOpen, 
  Clock, 
  GraduationCap, 
  UserPlus, 
  Check, 
  X, 
  Info 
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema for enrollment request form
const enrollmentRequestSchema = z.object({
  courseId: z.number(),
  notes: z.string().optional(),
});

type EnrollmentRequestFormValues = z.infer<typeof enrollmentRequestSchema>;

export default function StudentCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  
  // Fetch all active courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses', { isActive: true }],
  });
  
  // Fetch enrolled courses
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments'],
  });
  
  // Fetch user's enrollment requests
  const { data: enrollmentRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/enrollment-requests"],
    queryFn: () => fetch(`/api/enrollment-requests`).then(res => res.json()),
  });
  
  // Form for enrollment request
  const form = useForm<EnrollmentRequestFormValues>({
    resolver: zodResolver(enrollmentRequestSchema),
    defaultValues: {
      notes: "",
    },
  });
  
  // Mutation for submitting enrollment request
  const requestMutation = useMutation({
    mutationFn: (values: EnrollmentRequestFormValues) => {
      return apiRequest("POST", "/api/enrollment-requests", values);
    },
    onSuccess: () => {
      toast({
        title: "Enrollment Request Submitted",
        description: "Your enrollment request has been submitted successfully and is pending approval.",
      });
      setIsRequestDialogOpen(false);
      form.reset();
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Request",
        description: error.message || "An error occurred while submitting your enrollment request.",
        variant: "destructive",
      });
    },
  });
  
  // Handle enrollment request submission
  const onSubmit = (values: EnrollmentRequestFormValues) => {
    if (selectedCourse) {
      requestMutation.mutate({
        courseId: selectedCourse.id,
        notes: values.notes,
      });
    }
  };
  
  // Check if user is already enrolled in a course
  const isEnrolled = (courseId: number) => {
    if (!enrollments) return false;
    return enrollments.some((enrollment: any) => enrollment.courseId === courseId);
  };
  
  // Check if user has a pending request for a course
  const hasPendingRequest = (courseId: number) => {
    if (!enrollmentRequests) return false;
    return enrollmentRequests.some(
      (request: any) => request.courseId === courseId && request.status === "pending"
    );
  };
  
  // Get request status for a course
  const getRequestStatus = (courseId: number) => {
    if (!enrollmentRequests) return null;
    const request = enrollmentRequests.find((req: any) => req.courseId === courseId);
    return request ? request.status : null;
  };
  
  // Handle "Request Enrollment" button click
  const handleRequestEnrollment = (course: any) => {
    setSelectedCourse(course);
    form.setValue("courseId", course.id);
    setIsRequestDialogOpen(true);
  };
  
  // Enroll in a course mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest('POST', '/api/enrollments', { courseId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: 'Enrolled Successfully',
        description: 'You have been enrolled in the course.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Failed to enroll in the course.',
        variant: 'destructive',
      });
    }
  });

  // Handle enrollment
  const handleEnroll = async (courseId: number) => {
    await enrollMutation.mutateAsync(courseId);
  };

  // Process courses data
  const enrolledCourseIds = enrollments.map((enrollment: any) => enrollment.courseId);
  
  // Get all unique categories
  const categories = courses && courses.length 
    ? ['all', ...new Set(courses.map((course: any) => course.category))]
    : ['all'];
  
  // Filter and organize courses
  const myCourses = courses
    .filter((course: any) => enrolledCourseIds.includes(course.id))
    .map((course: any) => {
      const enrollment = enrollments.find((e: any) => e.courseId === course.id);
      return {
        ...course,
        progress: enrollment ? enrollment.progress : 0,
        isCompleted: enrollment ? enrollment.isCompleted : false,
        isEnrolled: true
      };
    });
  
  const availableCourses = courses
    .filter((course: any) => !enrolledCourseIds.includes(course.id))
    .map((course: any) => ({
      ...course,
      progress: 0,
      isEnrolled: false
    }));
  
  // Apply search and category filters
  const filterCourses = (courseList: any[]) => {
    return courseList.filter((course: any) => {
      const matchesSearch = searchQuery === '' || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || 
        course.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  };
  
  const filteredMyCourses = filterCourses(myCourses);
  const filteredAvailableCourses = filterCourses(availableCourses);

  return (
    <Layout title="Courses" description="Browse and manage your enrolled courses">
      {/* Search and Filter */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search courses..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Courses Tabs */}
      <Tabs defaultValue="myCourses" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="myCourses">My Courses</TabsTrigger>
          <TabsTrigger value="availableCourses">Available Courses</TabsTrigger>
        </TabsList>
        
        {/* My Courses Tab */}
        <TabsContent value="myCourses">
          {isCoursesLoading || isEnrollmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          ) : filteredMyCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyCourses.map((course: any) => (
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
            <div className="text-center py-12 border rounded-lg border-dashed bg-gray-50">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {searchQuery || categoryFilter !== 'all' 
                  ? "No courses match your search criteria. Try adjusting your filters."
                  : "You haven't enrolled in any courses yet. Explore available courses to get started."}
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Available Courses Tab */}
        <TabsContent value="availableCourses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {isCoursesLoading || isLoadingRequests || isEnrollmentsLoading ? (
              // Loading skeletons
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-24 w-full mb-2" />
                      <Skeleton className="h-4 w-1/3 mt-4" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))
            ) : filterCourses(courses) && filterCourses(courses).length > 0 ? (
              filterCourses(courses).map((course: any) => (
                <Card key={course.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {course.category}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-1">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 flex flex-col gap-2">
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        <span>Created by {course.creatorName || "Unknown"}</span>
                      </div>
                      {course.modules && (
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          <span>{course.modules?.length || 0} Modules</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2">
                    {isEnrolled(course.id) ? (
                      <Button variant="default" className="w-full" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Already Enrolled
                      </Button>
                    ) : hasPendingRequest(course.id) ? (
                      <Button variant="outline" className="w-full" disabled>
                        <Clock className="h-4 w-4 mr-2" />
                        Enrollment Request Pending
                      </Button>
                    ) : getRequestStatus(course.id) === "rejected" ? (
                      <Alert variant="destructive" className="py-2">
                        <X className="h-4 w-4" />
                        <AlertTitle>Enrollment Request Rejected</AlertTitle>
                        <AlertDescription>
                          Your request to enroll in this course was rejected. Contact an administrator for more information.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => handleRequestEnrollment(course)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Request Enrollment
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-10">
                <Info className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-600">No Courses Available</h3>
                <p className="text-gray-500 mt-2 text-center max-w-md">
                  There are currently no active courses available. Please check back later.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Enrollment Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Enrollment</DialogTitle>
            <DialogDescription>
              Request to enroll in {selectedCourse?.title}. Your request will be reviewed by an administrator.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Enrollment (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please briefly explain why you want to enroll in this course..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRequestDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={requestMutation.isPending}>
                  {requestMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
