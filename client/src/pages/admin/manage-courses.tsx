import { useState } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
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
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  BookOpen, 
  Edit, 
  Trash, 
  Plus,
  Loader2,
  PlusCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

// Form schema for a course
const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function ManageCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deleteConfirmCourse, setDeleteConfirmCourse] = useState<any>(null);
  
  // Fetch courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['/api/courses'],
  });
  
  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: z.infer<typeof courseSchema>) => {
      const res = await apiRequest('POST', '/api/courses', courseData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: 'Course Created',
        description: 'The course has been created successfully.',
      });
      setShowCourseDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Course',
        description: error.message || 'There was an error creating the course.',
        variant: 'destructive',
      });
    }
  });
  
  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof courseSchema> }) => {
      const res = await apiRequest('PUT', `/api/courses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: 'Course Updated',
        description: 'The course has been updated successfully.',
      });
      setShowCourseDialog(false);
      setEditingCourse(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Course',
        description: error.message || 'There was an error updating the course.',
        variant: 'destructive',
      });
    }
  });
  
  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/courses/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: 'Course Deleted',
        description: 'The course has been deleted successfully.',
      });
      setDeleteConfirmCourse(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Course',
        description: error.message || 'There was an error deleting the course.',
        variant: 'destructive',
      });
    }
  });
  
  // Form handling
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      thumbnail: '',
      isActive: true,
    },
  });
  
  // Table columns for courses
  const courseColumns = [
    {
      accessorKey: 'title',
      header: 'Course Title',
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-gray-500" />
            </div>
            <div className="font-medium">{row.getValue('title')}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: any) => {
        return (
          <Badge variant="outline">
            {row.getValue('category')}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => {
        return format(new Date(row.getValue('createdAt')), 'MMM d, yyyy');
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => {
        return row.getValue('isActive') ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Inactive
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const course = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditCourse(course)}
              title="Edit Course"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteConfirmCourse(course)}
              title="Delete Course"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
            </Button>
            <a 
              href={`/admin/manage-enrollments?courseId=${course.id}`}
              className="text-primary hover:underline text-sm"
            >
              Enrollments
            </a>
          </div>
        );
      }
    },
  ];
  
  // Handle creating a new course
  const handleCreateCourse = () => {
    setEditingCourse(null);
    form.reset({
      title: '',
      description: '',
      category: '',
      thumbnail: '',
      isActive: true,
    });
    setShowCourseDialog(true);
  };
  
  // Handle editing a course
  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail || '',
      isActive: course.isActive,
    });
    setShowCourseDialog(true);
  };
  
  // Handle form submission
  function onSubmit(values: z.infer<typeof courseSchema>) {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: values });
    } else {
      createCourseMutation.mutate(values);
    }
  }
  
  // Handle course deletion
  const handleDeleteCourse = () => {
    if (deleteConfirmCourse) {
      deleteCourseMutation.mutate(deleteConfirmCourse.id);
    }
  };
  
  return (
    <Layout 
      title="Manage Courses" 
      description="Create, edit, and manage courses for students"
      rightContent={
        <Button onClick={handleCreateCourse} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Course
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <DataTable 
          columns={courseColumns} 
          data={courses} 
          searchable={true}
          searchPlaceholder="Search courses..."
        />
      )}
      
      {/* Course Dialog (Create/Edit) */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Edit Course' : 'Create New Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse 
                ? 'Update the details of the existing course.' 
                : 'Fill in the details to create a new course.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Algebra Fundamentals" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Algebra, Geometry, Calculus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what students will learn in this course" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Determine if this course is visible to students
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
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCourseDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                >
                  {(createCourseMutation.isPending || updateCourseMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmCourse} onOpenChange={(open) => !open && setDeleteConfirmCourse(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the course 
              <span className="font-medium"> "{deleteConfirmCourse?.title}"</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmCourse(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
