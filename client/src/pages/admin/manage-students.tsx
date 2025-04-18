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
  Check
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
  
  // Fetch students
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Fetch all courses for enrollment dialog
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
  });
  
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
        const enrollmentCount = row.original.enrollmentCount || 0;
        return (
          <Badge variant="outline" className="whitespace-nowrap">
            {enrollmentCount} {enrollmentCount === 1 ? 'Course' : 'Courses'}
          </Badge>
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
      const res = await apiRequest('POST', '/api/enrollments', {
        userId,
        courseId
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
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
    setEnrollmentUser(student);
    setSelectedCourses([]);
  };
  
  // Handle enrollment submission
  const handleEnrollStudent = async () => {
    if (!enrollmentUser || selectedCourses.length === 0) return;
    
    setEnrollmentLoading(true);
    
    try {
      // Process each enrollment sequentially
      for (const courseId of selectedCourses) {
        await enrollStudentMutation.mutateAsync({ 
          userId: enrollmentUser.id, 
          courseId 
        });
      }
      
      toast({
        title: 'Enrollment Successful',
        description: `${enrollmentUser.fullName} has been enrolled in ${selectedCourses.length} ${selectedCourses.length === 1 ? 'course' : 'courses'}.`,
      });
      
      setEnrollmentUser(null);
      setSelectedCourses([]);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setEnrollmentLoading(false);
    }
  };
  
  // Toggle course selection
  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };
  
  // Toggle all courses
  const toggleAllCourses = (checked: boolean) => {
    if (checked) {
      setSelectedCourses(courses.map((course: any) => course.id));
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
                    checked={selectedCourses.length === courses.length && courses.length > 0}
                    onCheckedChange={toggleAllCourses}
                  />
                  <label 
                    htmlFor="select-all" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All Courses
                  </label>
                </div>
              </div>
              
              {/* Course List */}
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {courses.map((course: any) => (
                    <div key={course.id} className="flex items-center space-x-3 py-1">
                      <Checkbox 
                        id={`course-${course.id}`} 
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => toggleCourseSelection(course.id)}
                      />
                      <div className="grid gap-1">
                        <label 
                          htmlFor={`course-${course.id}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {course.title}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {course.description?.substring(0, 100)}
                          {course.description?.length > 100 ? '...' : ''}
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
    </Layout>
  );
}