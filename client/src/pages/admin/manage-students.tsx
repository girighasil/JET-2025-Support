import { useState } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  Plus, 
  Edit, 
  Trash, 
  Mail,
  GraduationCap,
  BarChart2,
  Loader2,
  BookOpen,
  Check,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ManageStudents() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any>(null);
  const [enrollmentUser, setEnrollmentUser] = useState<any>(null);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [viewEnrollmentUser, setViewEnrollmentUser] = useState<any>(null);
  const [deleteConfirmEnrollment, setDeleteConfirmEnrollment] = useState<any>(null);
  
  // Fetch students
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Fetch all courses for enrollment dialog
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
  });
  
  // Fetch enrollments when a student is selected for enrollment
  const { data: studentEnrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments', enrollmentUser?.id],
    enabled: !!enrollmentUser,
    queryFn: async () => {
      if (!enrollmentUser) return [];
      
      console.log(`Fetching enrollments for student ${enrollmentUser.id}`);
      // Explicitly fetch enrollments with userId filter
      const res = await apiRequest('GET', `/api/enrollments?userId=${enrollmentUser.id}`);
      const data = await res.json();
      
      console.log(`Found ${data.length} enrollments for student ${enrollmentUser.id}:`, data);
      return data;
    }
  });
  
  // Fetch enrollments when viewing a student's enrollments
  const { data: viewStudentEnrollments = [], isLoading: isViewEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments', viewEnrollmentUser?.id],
    enabled: !!viewEnrollmentUser,
    queryFn: async () => {
      if (!viewEnrollmentUser) return [];
      
      console.log(`Fetching enrollments for student ${viewEnrollmentUser.id} for viewing`);
      // Get enrollments with course details
      const res = await apiRequest('GET', `/api/enrollments?userId=${viewEnrollmentUser.id}`);
      const enrollments = await res.json();
      
      // Enrich with course details
      const enrichedEnrollments = enrollments.map((enrollment: any) => {
        const course = courses.find((c: any) => c.id === enrollment.courseId);
        return {
          ...enrollment,
          courseName: course?.title || `Course ${enrollment.courseId}`,
          courseCategory: course?.category || 'Unknown',
          courseDescription: course?.description || '',
        };
      });
      
      console.log(`Found ${enrichedEnrollments.length} enriched enrollments for student ${viewEnrollmentUser.id}:`, enrichedEnrollments);
      return enrichedEnrollments;
    }
  });
  
  // Extract enrolled course IDs with safety check
  const enrolledCourseIds = Array.isArray(studentEnrollments) 
    ? studentEnrollments.map((enrollment: any) => enrollment.courseId) 
    : [];
  
  // Filter to get only students
  const students = users.filter((user: any) => user.role === 'student');
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/users/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Student Deleted',
        description: 'The student has been deleted successfully.',
      });
      setDeleteConfirmUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Student',
        description: error.message || 'There was an error deleting the student.',
        variant: 'destructive',
      });
    }
  });
  
  // Delete enrollment mutation
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: number, courseId: number }) => {
      console.log(`Deleting enrollment for student ${userId} in course ${courseId}`);
      const res = await apiRequest('DELETE', `/api/enrollments/${userId}/${courseId}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error deleting enrollment');
      }
      
      return { userId, courseId };
    },
    onSuccess: ({ userId, courseId }) => {
      console.log(`Successfully deleted enrollment: user ${userId}, course ${courseId}`);
      
      // Update view enrollments cache
      const currentEnrollments = queryClient.getQueryData(['/api/enrollments', userId]) || [];
      if (Array.isArray(currentEnrollments)) {
        // Optimistic update - modify the cache directly
        const updatedEnrollments = (currentEnrollments as any[]).filter(
          e => e.courseId !== courseId
        );
        queryClient.setQueryData(['/api/enrollments', userId], updatedEnrollments);
      }
      
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: 'Enrollment Removed',
        description: 'The student has been unenrolled from the course.',
      });
      
      // Close the confirmation dialog
      setDeleteConfirmEnrollment(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Remove Enrollment',
        description: error.message || 'There was an error removing the enrollment.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle removing an enrollment
  const handleDeleteEnrollment = () => {
    if (deleteConfirmEnrollment) {
      deleteEnrollmentMutation.mutate({
        userId: deleteConfirmEnrollment.userId,
        courseId: deleteConfirmEnrollment.courseId
      });
    }
  };
  
  // Handle opening the view enrollments dialog
  const handleOpenViewEnrollmentsDialog = (student: any) => {
    console.log(`Opening view enrollments dialog for student:`, student);
    
    // Reset state
    setViewEnrollmentUser(student);
    
    // Force refresh enrollments data for this student
    queryClient.invalidateQueries({ queryKey: ['/api/enrollments', student.id] });
  };

  // Table columns for students
  const studentColumns = [
    {
      accessorKey: 'fullName',
      header: 'Student Name',
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="font-medium">{row.getValue('fullName')}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{row.getValue('email')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Registration Date',
      cell: ({ row }: any) => {
        const date = row.getValue('createdAt');
        return date ? (
          <span>{format(new Date(date), 'MMM d, yyyy')}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Not available</span>
        );
      }
    },
    {
      id: 'enrolledCourses',
      header: 'Enrolled Courses',
      cell: ({ row }: any) => {
        const student = row.original;
        const enrollmentCount = student.enrollmentCount || 0;
        
        return (
          <div className="flex items-center">
            <Badge 
              variant="outline" 
              className="whitespace-nowrap cursor-pointer px-2 py-1 hover:bg-gray-100 transition-colors rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                if (enrollmentCount > 0) {
                  handleOpenViewEnrollmentsDialog(student);
                } else {
                  handleOpenEnrollDialog(student);
                }
              }}
            >
              {enrollmentCount} {enrollmentCount === 1 ? 'Course' : 'Courses'}
            </Badge>
          </div>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const student = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/student-details/${student.id}`)}
              title="View Details"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            {/* Enroll Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEnrollDialog(student)}
              title="Enroll in Courses"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteConfirmUser(student)}
              title="Delete Student"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/student-progress/${student.id}`)}
              title="View Progress"
            >
              <BarChart2 className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
        );
      }
    },
  ];
  
  // Handle creating a new student
  const handleAddStudent = () => {
    navigate('/admin/student-add');
  };
  
  // Handle student deletion
  const handleDeleteStudent = () => {
    if (deleteConfirmUser) {
      deleteUserMutation.mutate(deleteConfirmUser.id);
    }
  };
  
  // Enroll student mutation
  const enrollStudentMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: number, courseId: number }) => {
      console.log(`Enrolling student ${userId} in course ${courseId}`);
      try {
        const res = await apiRequest('POST', '/api/enrollments', {
          userId,
          courseId
        });
        
        // Check if response is ok before parsing JSON
        if (!res.ok) {
          const errorData = await res.json();
          // If the error is that student is already enrolled, we can handle this gracefully
          if (errorData.message?.includes("already enrolled")) {
            console.log(`Student ${userId} is already enrolled in course ${courseId}`);
            return { 
              alreadyEnrolled: true, 
              message: errorData.message,
              enrollment: errorData.enrollment 
            };
          }
          throw new Error(errorData.message || 'Error enrolling student');
        }
        
        const data = await res.json();
        console.log(`Successfully enrolled student ${userId}, result:`, data);
        return data;
      } catch (error: any) {
        console.error(`Failed to enroll student ${userId} in course ${courseId}:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (!data.alreadyEnrolled) {
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Enroll Student',
        description: error.message || 'There was an error enrolling the student.',
        variant: 'destructive',
      });
    }
  });
  
  // Open enrollment dialog
  const handleOpenEnrollDialog = (student: any) => {
    console.log(`Opening enrollment dialog for student:`, student);
    
    // Reset state
    setSelectedCourses([]);
    setEnrollmentUser(student);
    
    // Force refresh enrollments data for this student
    queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['/api/enrollments', student.id] });
    
    // Explicitly fetch student enrollments to ensure we have the latest data
    setTimeout(() => {
      // This timeout ensures that the invalidation has time to complete
      // before we update our UI state
      console.log(`Refreshing enrollment data for student ${student.id}`);
    }, 100);
  };
  
  // Handle enrollment submission
  const handleEnrollStudent = async () => {
    if (!enrollmentUser || selectedCourses.length === 0) return;
    
    setEnrollmentLoading(true);
    console.log(`Starting enrollment process for student:`, enrollmentUser);
    console.log(`Selected course IDs:`, selectedCourses);
    
    // Track enrollment results
    const results = {
      success: 0,
      alreadyEnrolled: 0,
      failed: 0
    };
    
    try {
      // Process each enrollment sequentially
      for (const courseId of selectedCourses) {
        try {
          console.log(`Processing enrollment for student ${enrollmentUser.id} in course ${courseId}`);
          
          // Get course info for better error messages
          const course = courses.find((c: any) => c.id === courseId);
          const courseName = course ? course.title : `Course ${courseId}`;
          
          const result = await enrollStudentMutation.mutateAsync({ 
            userId: enrollmentUser.id, 
            courseId 
          });
          
          if (result.alreadyEnrolled) {
            console.log(`Student ${enrollmentUser.id} is already enrolled in course ${courseId}`);
            results.alreadyEnrolled++;
          } else {
            console.log(`Successfully enrolled student ${enrollmentUser.id} in course ${courseId}`);
            results.success++;
          }
        } catch (error) {
          console.error(`Error enrolling student ${enrollmentUser.id} in course ${courseId}:`, error);
          results.failed++;
        }
      }
      
      // Force refresh enrollments after all the operations
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Show appropriate toast message based on results
      if (results.success > 0 || results.alreadyEnrolled > 0) {
        const successMsg = results.success > 0 
          ? `${results.success} ${results.success === 1 ? 'course' : 'courses'} successfully` 
          : '';
        
        const alreadyMsg = results.alreadyEnrolled > 0 
          ? `${results.alreadyEnrolled} ${results.alreadyEnrolled === 1 ? 'course' : 'courses'} already enrolled` 
          : '';
        
        const failedMsg = results.failed > 0 
          ? `${results.failed} ${results.failed === 1 ? 'enrollment' : 'enrollments'} failed` 
          : '';
        
        const messages = [successMsg, alreadyMsg, failedMsg].filter(Boolean).join(', ');
        
        toast({
          title: 'Enrollment Process Complete',
          description: `${enrollmentUser.fullName}: ${messages}.`,
          variant: results.failed > 0 ? 'default' : 'default',
        });
      } else if (results.failed > 0) {
        toast({
          title: 'Enrollment Failed',
          description: `Failed to enroll ${enrollmentUser.fullName} in any courses.`,
          variant: 'destructive',
        });
      }
      
      setEnrollmentUser(null);
      setSelectedCourses([]);
    } catch (error: any) {
      console.error('Unexpected error in batch enrollment:', error);
      toast({
        title: 'Enrollment Error',
        description: error.message || 'An unexpected error occurred during enrollment.',
        variant: 'destructive',
      });
    } finally {
      setEnrollmentLoading(false);
    }
  };
  
  // Toggle course selection
  const toggleCourseSelection = (courseId: number) => {
    // Check if the course is already enrolled, and if so, don't allow toggling
    if (enrolledCourseIds.includes(courseId)) {
      return;
    }
    
    setSelectedCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };
  
  // Toggle all courses
  const toggleAllCourses = (checked: boolean) => {
    if (checked) {
      // Only select courses that the student is not already enrolled in
      const availableCourseIds = courses
        .filter((course: any) => !enrolledCourseIds.includes(course.id))
        .map((course: any) => course.id);
      setSelectedCourses(availableCourseIds);
    } else {
      setSelectedCourses([]);
    }
  };

  return (
    <Layout 
      title="Manage Students" 
      description="View and manage student accounts"
      rightContent={
        <Button onClick={handleAddStudent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Student
        </Button>
      }
    >
      {isUsersLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : students.length > 0 ? (
        <DataTable 
          columns={studentColumns} 
          data={students} 
          searchable={true}
          searchPlaceholder="Search students..."
        />
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Add your first student to start managing your classroom.
            </p>
            <Button onClick={handleAddStudent} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Student
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the student 
              <span className="font-medium"> "{deleteConfirmUser?.fullName}"</span>?
              This action cannot be undone and will delete all associated enrollments and test attempts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmUser(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteStudent}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Enrollment Dialog */}
      <Dialog open={!!enrollmentUser} onOpenChange={(open) => !open && setEnrollmentUser(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Enroll Student in Courses</DialogTitle>
            <DialogDescription>
              Select courses to enroll <span className="font-medium">{enrollmentUser?.fullName}</span> in.
              You can select multiple courses.
            </DialogDescription>
          </DialogHeader>
          
          {isCoursesLoading ? (
            <div className="py-6">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : courses.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">No courses available. Please create a course first.</p>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="border-b pb-2 mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all" 
                    checked={
                      courses.length > 0 &&
                      selectedCourses.length === 
                        courses.filter((course: any) => !enrolledCourseIds.includes(course.id)).length &&
                      selectedCourses.length > 0
                    }
                    onCheckedChange={toggleAllCourses}
                  />
                  <label 
                    htmlFor="select-all" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All Available Courses
                  </label>
                </div>
              </div>
              
              {/* Course List */}
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {courses.map((course: any) => {
                    const isEnrolled = enrolledCourseIds.includes(course.id);
                    return (
                      <div 
                        key={course.id} 
                        className={`flex items-center space-x-3 border rounded-md p-3 ${
                          isEnrolled ? 'bg-muted' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Checkbox 
                          id={`course-${course.id}`} 
                          checked={isEnrolled ? true : selectedCourses.includes(course.id)}
                          onCheckedChange={() => toggleCourseSelection(course.id)}
                          disabled={isEnrolled}
                        />
                        <div className="grid gap-1">
                          <label 
                            htmlFor={`course-${course.id}`} 
                            className={`text-sm font-medium leading-none ${
                              isEnrolled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'
                            }`}
                          >
                            {course.title}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {course.description?.substring(0, 100)}
                            {course.description?.length > 100 ? '...' : ''}
                          </p>
                          {isEnrolled && (
                            <p className="text-xs text-green-600 mt-1">
                              <CheckCircle2 className="h-3 w-3 inline-block mr-1" />
                              Already enrolled
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
          
          <DialogFooter className="pt-4 gap-2">
            <div className="mr-auto text-sm text-muted-foreground">
              {selectedCourses.length} {selectedCourses.length === 1 ? 'course' : 'courses'} selected
            </div>
            <Button 
              variant="outline" 
              onClick={() => setEnrollmentUser(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEnrollStudent}
              disabled={enrollmentLoading || selectedCourses.length === 0}
              className="gap-2"
            >
              {enrollmentLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Enroll Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Enrollments Dialog */}
      <Dialog open={!!viewEnrollmentUser} onOpenChange={(open) => !open && setViewEnrollmentUser(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Student Enrollments</DialogTitle>
            <DialogDescription>
              Viewing courses that <span className="font-medium">{viewEnrollmentUser?.fullName}</span> is enrolled in.
              You can remove students from courses using the remove button.
            </DialogDescription>
          </DialogHeader>
          
          {isViewEnrollmentsLoading ? (
            <div className="py-6">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : viewStudentEnrollments.length === 0 ? (
            <div className="py-6 text-center">
              <BookOpen className="h-14 w-14 mx-auto mb-4 text-muted-foreground/60" />
              <p className="font-medium text-muted-foreground mb-2">No enrollments found</p>
              <p className="text-sm text-muted-foreground mb-4">
                The student is not enrolled in any courses.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setViewEnrollmentUser(null);
                  handleOpenEnrollDialog(viewEnrollmentUser);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Enroll in Courses
              </Button>
            </div>
          ) : (
            <div className="py-4">
              <div className="rounded-md border">
                <ScrollArea className="h-[300px]">
                  <div className="p-4">
                    {viewStudentEnrollments.map((enrollment: any) => (
                      <div 
                        key={`${enrollment.userId}-${enrollment.courseId}`} 
                        className="flex items-center justify-between py-3 px-2 border-b last:border-0"
                      >
                        <div className="max-w-[400px]">
                          <h4 className="font-medium">{enrollment.courseName}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {enrollment.courseDescription || 'No description available'}
                          </p>
                          <div className="mt-1 text-xs text-muted-foreground flex items-center">
                            <span className="flex items-center">
                              Enrolled on {enrollment.enrolledAt 
                                ? format(new Date(enrollment.enrolledAt), 'MMM d, yyyy') 
                                : 'unknown date'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteConfirmEnrollment({
                              userId: enrollment.userId,
                              courseId: enrollment.courseId,
                              courseName: enrollment.courseName,
                              studentName: viewEnrollmentUser.fullName
                            });
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="ml-1">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setViewEnrollmentUser(null)}>
              Close
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                setViewEnrollmentUser(null);
                handleOpenEnrollDialog(viewEnrollmentUser);
              }}
            >
              Enroll in More Courses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Enrollment Confirmation Dialog */}
      <Dialog open={!!deleteConfirmEnrollment} onOpenChange={(open) => !open && setDeleteConfirmEnrollment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Unenrollment</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-medium">{deleteConfirmEnrollment?.studentName}</span> from <span className="font-medium">{deleteConfirmEnrollment?.courseName}</span>?
              This action cannot be undone and the student will lose access to all course content and progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmEnrollment(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteEnrollment}
              disabled={deleteEnrollmentMutation.isPending}
            >
              {deleteEnrollmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}