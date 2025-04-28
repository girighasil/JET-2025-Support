import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/ui/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Clock, GraduationCap, UserPlus, Check, X, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema for enrollment request form
const enrollmentRequestSchema = z.object({
  courseId: z.number(),
  notes: z.string().optional(),
});

type EnrollmentRequestFormValues = z.infer<typeof enrollmentRequestSchema>;

export default function AvailableCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  // Fetch active courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses", { isActive: true }],
    queryFn: () => fetch(`/api/courses?isActive=true`).then(res => res.json()),
  });

  // Fetch user's enrollment requests
  const { data: enrollmentRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/enrollment-requests"],
    queryFn: () => fetch(`/api/enrollment-requests`).then(res => res.json()),
  });

  // Fetch user's enrollments
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["/api/enrollments"],
    queryFn: () => fetch(`/api/enrollments`).then(res => res.json()),
  });

  // Form for enrollment request
  const form = useForm<EnrollmentRequestFormValues>({
    resolver: zodResolver(enrollmentRequestSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Mutation for submitting enrollment request
  const mutation = useMutation({
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
      mutation.mutate({
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

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Available Courses</h1>
            <p className="text-gray-500 mt-1">
              Browse and request enrollment in available courses
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {isLoadingCourses || isLoadingRequests || isLoadingEnrollments ? (
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
          ) : courses && courses.length > 0 ? (
            courses.map((course: any) => (
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
                      {/*<span>Created by {course.creatorName || "Unknown"}</span>*/}
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
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? (
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
      </div>
    </Layout>
  );
}