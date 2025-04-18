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
  
  // Fetch enrollments
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments'],
  });
  
  // Fetch students for the select input
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Filter to get only students
  const students = users.filter((user: any) => user.role === 'student');
  
  // Fetch courses for the select input
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
  });
  
  // Create enrollment mutation
  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof enrollmentSchema>) => {
      const res = await apiRequest('POST', '/api/enrollments', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
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
      const res = await apiRequest('DELETE', `/api/enrollments/${userId}/${courseId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: 'Enrollment Deleted',
        description: 'The enrollment has been deleted successfully.',
      });
      setDeleteConfirmEnrollment(null);
    },
    onError: (error: Error) => {
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
  const enrollmentColumns = [
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{row.getValue('studentName')}</span>
              <span className="text-xs text-gray-500">{row.original.studentEmail}</span>
            </div>
          </div>
        );
      }
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
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-blue-50 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <span>{row.getValue('courseName')}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openBatchEnrollDialog(courseData)}
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              <span>Enroll Students</span>
            </Button>
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
      cell: ({ row }: any) => {
        return row.getValue('isActive') ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active</span>
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 flex items-center gap-1 w-fit">
            <XCircle className="h-3.5 w-3.5" />
            <span>Inactive</span>
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const enrollment = row.original;
        // Get course information for the current enrollment
        const courseId = enrollment.courseId;
        const courseName = enrollment.courseName;
        const courseData = {
          id: courseId,
          title: courseName
        };
        
        return (
          <div className="flex items-center gap-2">
            {/* Enroll Students button for the course */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openBatchEnrollDialog(courseData)}
              title="Enroll Students in this Course"
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              <span>Enroll</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteConfirmEnrollment(enrollment)}
              title="Delete Enrollment"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
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
      deleteEnrollmentMutation.mutate({
        userId: deleteConfirmEnrollment.studentId,
        courseId: deleteConfirmEnrollment.courseId
      });
    }
  };
  
  // Toggle student selection for batch enrollment
  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  // Toggle all students selection for batch enrollment
  const toggleAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(students.map((student: any) => student.id));
    } else {
      setSelectedStudentIds([]);
    }
  };
  
  // Open batch enrollment dialog with selected course
  const openBatchEnrollDialog = (course: any) => {
    setSelectedCourse(course);
    setSelectedStudentIds([]);
    setIsBatchEnrollDialogOpen(true);
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
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : enrollments.length > 0 ? (
        <DataTable 
          columns={enrollmentColumns} 
          data={enrollments} 
          searchable={true}
          searchPlaceholder="Search enrollments..."
        />
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments found</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Enroll students in courses to track their progress and provide access to course materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Single Enrollment
              </Button>
              {courses.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => openBatchEnrollDialog(courses[0])}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Batch Enroll Students
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmEnrollment} onOpenChange={(open) => !open && setDeleteConfirmEnrollment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this enrollment? This will remove <span className="font-medium">{deleteConfirmEnrollment?.studentName}</span> from the course <span className="font-medium">{deleteConfirmEnrollment?.courseName}</span>.
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
              Delete Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Batch Enrollment Dialog */}
      <Dialog open={isBatchEnrollDialogOpen} onOpenChange={(open) => !open && setIsBatchEnrollDialogOpen(false)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Enroll Students in Course</DialogTitle>
            <DialogDescription>
              Select students to enroll in <span className="font-medium">{selectedCourse?.title}</span>.
              You can select multiple students at once.
            </DialogDescription>
          </DialogHeader>
          
          {isUsersLoading ? (
            <div className="py-6">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">No students available. Please create students first.</p>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="border-b pb-2 mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all-students" 
                    checked={selectedStudentIds.length === students.length && students.length > 0}
                    onCheckedChange={toggleAllStudents}
                  />
                  <label 
                    htmlFor="select-all-students" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All Students
                  </label>
                </div>
              </div>
              
              {/* Student List */}
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {students.map((student: any) => (
                    <div key={student.id} className="flex items-center space-x-3 py-1">
                      <Checkbox 
                        id={`student-${student.id}`} 
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                      <div className="grid gap-1">
                        <label 
                          htmlFor={`student-${student.id}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {student.fullName}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
          
          <DialogFooter className="pt-4 gap-2">
            <div className="mr-auto text-sm text-muted-foreground">
              {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'student' : 'students'} selected
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsBatchEnrollDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBatchEnroll}
              disabled={batchEnrollmentLoading || selectedStudentIds.length === 0}
              className="gap-2"
            >
              {batchEnrollmentLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Enroll Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}