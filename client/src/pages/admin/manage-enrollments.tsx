import { useState, useEffect } from 'react';
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
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  BookOpen,
  Plus,
  Trash,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  UserPlus,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent
} from '@/components/ui/card';

// Enrollment schema
const enrollmentSchema = z.object({
  userId: z.number({
    required_error: "Student is required"
  }),
  courseId: z.number({
    required_error: "Course is required"
  }),
});

export default function ManageEnrollments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteConfirmEnrollment, setDeleteConfirmEnrollment] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isBatchEnrollDialogOpen, setIsBatchEnrollDialogOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [batchEnrollmentLoading, setBatchEnrollmentLoading] = useState(false);
  
  // Get URL search parameters
  const params = new URLSearchParams(window.location.search);
  const courseIdParam = params.get('courseId');
  
  // Fetch courses for the select input
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
  });
  
  // Initialize course filter from URL parameter if present
  useEffect(() => {
    if (courseIdParam && courses && Array.isArray(courses)) {
      console.log(`Initializing with courseId from URL: ${courseIdParam}`);
      
      // Find the course in the courses list
      const course = courses.find((c: any) => c.id === parseInt(courseIdParam));
      if (course) {
        console.log('Found course from URL parameter:', course);
        setSelectedCourse(course);
      } else {
        // If we don't have the courses loaded yet, we'll need to wait
        console.log('Course not found yet, will try once courses are loaded');
      }
    }
  }, [courseIdParam, courses]);
  
  // Fetch students for the select input
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Filter to get only students
  const students = users && Array.isArray(users) 
    ? users.filter((user: any) => user.role === 'student') 
    : [];
  
  // Fetch all enrollments by aggregating enrollments for each course
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments/all'],
    queryFn: async () => {
      // Check if courses and users data is available
      if (!courses || !Array.isArray(courses) || courses.length === 0 || 
          !users || !Array.isArray(users) || users.length === 0) {
        return [];
      }
      
      const processedEnrollments: any[] = [];
      
      // For each course, fetch its enrollments
      for (const course of courses) {
        try {
          const res = await fetch(`/api/enrollments?courseId=${course.id}`);
          
          if (res.ok) {
            const courseEnrollments = await res.json();
            
            if (Array.isArray(courseEnrollments)) {
              // Enrich each enrollment with student and course details
              courseEnrollments.forEach((enrollment: any) => {
                const student = users.find((u: any) => u.id === enrollment.userId);
                
                if (student) {
                  processedEnrollments.push({
                    ...enrollment,
                    courseName: course.title,
                    courseId: course.id,
                    studentName: student.fullName,
                    studentEmail: student.email,
                    studentId: student.id
                  });
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching enrollments for course ${course.id}:`, error);
        }
      }
      
      return processedEnrollments;
    },
    enabled: !!(courses && Array.isArray(courses) && courses.length > 0 && 
               users && Array.isArray(users) && users.length > 0),
  });
  
  // Get already enrolled student IDs for the selected course
  const enrolledStudentIds = selectedCourse 
    ? enrollments
        .filter((enrollment: any) => enrollment.courseId === selectedCourse.id)
        .map((enrollment: any) => enrollment.userId)
    : [];
    
  // Filter enrollments based on the selected course (if any)
  const filteredEnrollments = selectedCourse
    ? enrollments.filter((enrollment: any) => enrollment.courseId === selectedCourse.id)
    : enrollments;
  
  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof enrollmentSchema>) => {
      const res = await apiRequest('POST', '/api/enrollments', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/all'] });
      toast({
        title: 'Enrollment Created',
        description: 'Student has been enrolled in the course successfully.',
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Enrollment',
        description: error.message || 'There was an error enrolling the student.',
        variant: 'destructive',
      });
    }
  });
  
  // Delete enrollment mutation
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: number; courseId: number }) => {
      console.log(`Deleting enrollment for userId=${userId}, courseId=${courseId}`);
      const res = await apiRequest('DELETE', `/api/enrollments/${userId}/${courseId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/all'] });
      toast({
        title: 'Enrollment Deleted',
        description: 'The enrollment has been deleted successfully.',
      });
      setDeleteConfirmEnrollment(null);
    },
    onError: (error: Error) => {
      console.error('Delete enrollment error:', error);
      toast({
        title: 'Failed to Delete Enrollment',
        description: error.message || 'There was an error deleting the enrollment.',
        variant: 'destructive',
      });
    }
  });
  
  // Form for creating enrollments
  const form = useForm<z.infer<typeof enrollmentSchema>>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      userId: undefined,
      courseId: undefined,
    },
  });
  
  // Table columns for enrollments
  const enrollmentColumns = selectedCourse ? [
    // When viewing enrollments for a specific course, don't show the course column
    // Just show student name, enrollment date, status, and remove button
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue('studentName')}</span>
            <span className="text-xs text-gray-500">{row.original.studentEmail}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'enrolledAt',
      header: 'Enrollment Date',
      cell: ({ row }: any) => {
        const date = row.getValue('enrolledAt');
        return date ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(date), 'MMM d, yyyy')}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not available</span>
        );
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => (
        row.getValue('isActive') ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active</span>
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 flex items-center gap-1 w-fit">
            <XCircle className="h-3.5 w-3.5" />
            <span>Inactive</span>
          </Badge>
        )
      )
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const enrollment = row.original;
        
        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmEnrollment(enrollment)}
              title="Remove student from this course"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
            >
              <Trash className="h-4 w-4" />
              <span>Remove</span>
            </Button>
          </div>
        );
      }
    }
  ] : [
    // Regular view showing all enrollments
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue('studentName')}</span>
            <span className="text-xs text-gray-500">{row.original.studentEmail}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'courseName',
      header: 'Course',
      cell: ({ row }: any) => {
        const enrollment = row.original;
        const courseData = {
          id: enrollment.courseId,
          title: enrollment.courseName
        };
        
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-blue-50 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span>{row.getValue('courseName')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'enrolledAt',
      header: 'Enrollment Date',
      cell: ({ row }: any) => {
        const date = row.getValue('enrolledAt');
        return date ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(date), 'MMM d, yyyy')}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not available</span>
        );
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => (
        row.getValue('isActive') ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active</span>
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 flex items-center gap-1 w-fit">
            <XCircle className="h-3.5 w-3.5" />
            <span>Inactive</span>
          </Badge>
        )
      )
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const enrollment = row.original;
        
        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmEnrollment(enrollment)}
              title="Remove student from this course"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
            >
              <Trash className="h-4 w-4" />
              <span>Remove</span>
            </Button>
          </div>
        );
      }
    },
  ];
  
  // Handle form submission
  function onSubmit(values: z.infer<typeof enrollmentSchema>) {
    createEnrollmentMutation.mutate(values);
  }
  
  // Handle enrollment deletion
  const handleDeleteEnrollment = () => {
    if (deleteConfirmEnrollment) {
      console.log('Deletion confirmation object:', deleteConfirmEnrollment);
      
      deleteEnrollmentMutation.mutate({
        userId: deleteConfirmEnrollment.studentId,
        courseId: deleteConfirmEnrollment.courseId
      });
    }
  };
  
  // Toggle student selection for batch enrollment
  const toggleStudentSelection = (studentId: number) => {
    // Skip if student is already enrolled
    if (enrolledStudentIds.includes(studentId)) {
      return;
    }
    
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  // Toggle all students selection for batch enrollment
  const toggleAllStudents = (checked: boolean) => {
    if (checked) {
      // Only select students who are not already enrolled
      const availableStudentIds = students
        .filter((student: any) => !enrolledStudentIds.includes(student.id))
        .map((student: any) => student.id);
      setSelectedStudentIds(availableStudentIds);
    } else {
      setSelectedStudentIds([]);
    }
  };
  
  // Open batch enrollment dialog with selected course
  const openBatchEnrollDialog = (course: any) => {
    setSelectedCourse(course);
    setSelectedStudentIds([]);
    setIsBatchEnrollDialogOpen(true);
    
    // Force refresh enrollments data for this course
    queryClient.invalidateQueries({ queryKey: ['/api/enrollments/all'] });
  };
  
  // Handle batch enrollment of multiple students in a course
  const handleBatchEnroll = async () => {
    if (!selectedCourse || selectedStudentIds.length === 0) return;
    
    setBatchEnrollmentLoading(true);
    
    try {
      // Process enrollments sequentially to ensure they're all created
      for (const studentId of selectedStudentIds) {
        await createEnrollmentMutation.mutateAsync({ 
          userId: studentId, 
          courseId: selectedCourse.id 
        });
      }
      
      toast({
        title: 'Students Enrolled',
        description: `Successfully enrolled ${selectedStudentIds.length} students in ${selectedCourse.title}.`,
      });
      
      // Close dialog and reset state
      setIsBatchEnrollDialogOpen(false);
      setSelectedStudentIds([]);
      setSelectedCourse(null);
    } catch (error: any) {
      toast({
        title: 'Failed to Enroll Students',
        description: error.message || 'There was an error creating the enrollments.',
        variant: 'destructive',
      });
    } finally {
      setBatchEnrollmentLoading(false);
    }
  };
  
  const isLoading = isEnrollmentsLoading || isUsersLoading || isCoursesLoading;

  return (
    <Layout 
      title="Manage Enrollments" 
      description="Manage student course enrollments"
      rightContent={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Enrollment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Enrollment</DialogTitle>
              <DialogDescription>
                Select a student and course to create a new enrollment.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student: any) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course: any) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createEnrollmentMutation.isPending}
                  >
                    {createEnrollmentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Enrollment
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      {selectedCourse && (
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-medium">
            <span className="mr-2">Showing enrollments for:</span>
            <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary">
              {selectedCourse.title}
            </Badge>
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedCourse(null)}
            >
              Show All Enrollments
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => openBatchEnrollDialog(selectedCourse)}
              className="flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              <span>Enroll Students</span>
            </Button>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : filteredEnrollments.length > 0 ? (
        <DataTable 
          columns={enrollmentColumns} 
          data={filteredEnrollments} 
          searchable={true}
          searchPlaceholder="Search enrollments..."
        />
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Enrollments Yet</h3>
            <p className="text-gray-600 max-w-lg mx-auto mb-6">
              Start enrolling students in courses to help them access learning materials and track their progress.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Enrollment
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Batch enrollment dialog */}
      <Dialog 
        open={isBatchEnrollDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsBatchEnrollDialogOpen(false);
            setSelectedStudentIds([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enroll Students</DialogTitle>
            <DialogDescription>
              Select students to enroll in <span className="font-medium">{selectedCourse?.title}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 mb-3">
            <Checkbox 
              id="selectAll" 
              checked={students.length > 0 && 
                selectedStudentIds.length === students.filter((s: any) => !enrolledStudentIds.includes(s.id)).length} 
              onCheckedChange={toggleAllStudents} 
            />
            <label htmlFor="selectAll" className="text-sm font-medium">
              Select All Available Students
            </label>
          </div>
          
          <ScrollArea className="h-[250px] border rounded-md p-2">
            <div className="space-y-2">
              {students.map((student: any) => {
                const isEnrolled = enrolledStudentIds.includes(student.id);
                const isSelected = selectedStudentIds.includes(student.id);
                
                return (
                  <div 
                    key={student.id} 
                    className={`p-2 rounded-md flex items-center justify-between ${
                      isEnrolled ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student.fullName}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div>
                      {isEnrolled ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Already Enrolled</Badge>
                      ) : (
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={() => toggleStudentSelection(student.id)} 
                          className="rounded-sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          
          <DialogFooter className="pt-4">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsBatchEnrollDialogOpen(false);
                  setSelectedStudentIds([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleBatchEnroll}
                disabled={selectedStudentIds.length === 0 || batchEnrollmentLoading}
              >
                {batchEnrollmentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Enroll Selected
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete enrollment confirmation dialog */}
      <Dialog 
        open={!!deleteConfirmEnrollment} 
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmEnrollment(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this enrollment? This will remove the student's access to the course.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirmEnrollment && (
            <div className="flex flex-col gap-4 py-4">
              <div className="p-3 border rounded-md bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">{deleteConfirmEnrollment.studentName}</p>
                    <p className="text-xs text-gray-500">{deleteConfirmEnrollment.studentEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-11">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm">{deleteConfirmEnrollment.courseName}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteConfirmEnrollment(null)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteEnrollment}
              disabled={deleteEnrollmentMutation.isPending}
            >
              {deleteEnrollmentMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Delete Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}