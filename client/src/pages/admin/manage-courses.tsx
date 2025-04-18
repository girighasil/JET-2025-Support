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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  BookOpen, 
  Edit, 
  Trash, 
  Plus,
  Loader2,
  PlusCircle,
  FileText,
  Video
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/ui/rich-text-editor';
import FileUpload, { FileItem } from '@/components/ui/file-upload';
import VideoEmbed from '@/components/ui/video-embed';
import ImportExport from '@/components/ui/import-export';
import MediaGallery from '@/components/ui/media-gallery';

// Define the Course type
type Course = {
  id: number;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  isActive: boolean;
  richContent?: string;
  videoUrl?: string;
  attachments?: FileItem[];
  createdAt: string;
  updatedAt: string;
};

// Form schema for a course
const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(true),
  richContent: z.string().optional(),
  videoUrl: z.string().optional(),
  attachments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      url: z.string(),
      size: z.number().optional()
    })
  ).optional(),
});

export default function ManageCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteConfirmCourse, setDeleteConfirmCourse] = useState<Course | null>(null);

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
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
      richContent: '',
      videoUrl: '',
      attachments: [],
    },
  });
  
  // Table columns for courses
  const courseColumns: any[] = [
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
      richContent: '',
      videoUrl: '',
      attachments: [],
    });
    setShowCourseDialog(true);
  };
  
  // Handle editing a course
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail || '',
      isActive: course.isActive,
      richContent: course.richContent || '',
      videoUrl: course.videoUrl || '',
      attachments: course.attachments || [],
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
  
  // Handle import success
  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    toast({
      title: 'Courses Imported',
      description: 'Courses have been successfully imported.',
    });
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
      {/* Import/Export Section */}
      <div className="mb-6 p-4 border rounded-md bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-medium">Course Import & Export</h3>
            <p className="text-sm text-muted-foreground">
              Import courses from CSV/Excel or export existing courses for backup or editing.
            </p>
          </div>
          
          <ImportExport 
            resourceType="Course"
            onImportSuccess={handleImportSuccess}
          />
        </div>
      </div>
      
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="content">Rich Content</TabsTrigger>
                  <TabsTrigger value="media">Media & Files</TabsTrigger>
                </TabsList>
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 pt-4">
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
                </TabsContent>
                
                {/* Rich Content Tab */}
                <TabsContent value="content" className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Course Content</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the rich text editor below to create detailed course content with formatting, lists, links, and more.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="richContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Content</FormLabel>
                        <FormControl>
                          <RichTextEditor 
                            content={field.value || ''} 
                            onChange={field.onChange}
                            placeholder="Create rich content for your course here..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabTriggers = document.querySelectorAll('[role="tab"]');
                        if (tabTriggers[0]) {
                          (tabTriggers[0] as HTMLElement).click();
                        }
                      }}
                    >
                      Previous
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => {
                        const tabTriggers = document.querySelectorAll('[role="tab"]');
                        if (tabTriggers[2]) {
                          (tabTriggers[2] as HTMLElement).click();
                        }
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Media & Files Tab */}
                <TabsContent value="media" className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Video & File Attachments</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add supplementary materials to enhance your course, including videos and downloadable resources.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Content (Optional)</FormLabel>
                        <FormControl>
                          <VideoEmbed 
                            value={field.value || ''} 
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="attachments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Attachments (Optional)</FormLabel>
                        <FormControl>
                          <FileUpload
                            existingFiles={field.value || []}
                            onUpload={(files) => {
                              const currentFiles = field.value || [];
                              field.onChange([...currentFiles, ...files]);
                            }}
                            onRemove={(file) => {
                              const currentFiles = field.value || [];
                              field.onChange(currentFiles.filter(f => f.id !== file.id));
                            }}
                            accept={{
                              'application/pdf': ['.pdf'],
                              'application/msword': ['.doc'],
                              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                              'application/vnd.ms-excel': ['.xls'],
                              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                              'application/vnd.ms-powerpoint': ['.ppt'],
                              'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                              'image/jpeg': ['.jpg', '.jpeg'],
                              'image/png': ['.png']
                            }}
                            maxFiles={5}
                          />
                        </FormControl>
                        <FormMessage />
                        
                        {/* Display Media Gallery when files exist */}
                        {field.value && field.value.length > 0 && (
                          <div className="mt-6">
                            <MediaGallery 
                              files={field.value} 
                              onRemove={(file) => {
                                const currentFiles = field.value || [];
                                field.onChange(currentFiles.filter(f => f.id !== file.id));
                              }}
                            />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabTriggers = document.querySelectorAll('[role="tab"]');
                        if (tabTriggers[1]) {
                          (tabTriggers[1] as HTMLElement).click();
                        }
                      }}
                    >
                      Previous
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="pt-4 border-t mt-6">
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
