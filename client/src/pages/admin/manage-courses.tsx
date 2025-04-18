import { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BookOpen,
  Edit,
  Trash,
  Plus,
  Loader2,
  PlusCircle,
  FileText,
  Video,
  UserPlus,
  Check,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/ui/rich-text-editor";
import FileUpload, { FileItem } from "@/components/ui/file-upload";
import VideoEmbed from "@/components/ui/video-embed";
import ImportExport from "@/components/ui/import-export";
import MediaGallery from "@/components/ui/media-gallery";

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
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(true),
  richContent: z.string().optional(),
  videoUrl: z
    .string()
    .url("Please enter a valid URL, including http:// or https://")
    .or(z.literal(""))
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        url: z.string(),
        size: z.number().optional(),
      }),
    )
    .optional(),
});

import { useFormError } from "@/hooks/use-form-error";
import FormSubmitError from "@/components/ui/form-submit-error";
import { EnhancedFormField } from "@/components/ui/enhanced-form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ManageCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteConfirmCourse, setDeleteConfirmCourse] = useState<Course | null>(
    null,
  );
  const [enrollmentCourse, setEnrollmentCourse] = useState<Course | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [batchEnrollmentLoading, setBatchEnrollmentLoading] = useState(false);
  const {
    error: formError,
    handleApiError: handleError,
    clearError,
  } = useFormError();

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  // Fetch all students for enrollment dialog
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Filter to get only students
  const students = users.filter((user: any) => user.role === 'student');
  
  // Fetch enrollments when a course is selected for enrollment
  const { data: courseEnrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments', enrollmentCourse?.id],
    enabled: !!enrollmentCourse,
    queryFn: async () => {
      if (!enrollmentCourse) return [];
      // Explicitly request enrollments for this course by ID
      const res = await fetch(`/api/enrollments?courseId=${enrollmentCourse.id}`);
      if (!res.ok) return [];
      return res.json();
    }
  });
  
  // Extract enrolled student IDs
  const enrolledStudentIds = courseEnrollments.map((enrollment: any) => enrollment.userId);

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: z.infer<typeof courseSchema>) => {
      const res = await apiRequest("POST", "/api/courses", courseData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "The course has been created successfully",
      });
      setShowCourseDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      handleError(error);
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof courseSchema>;
    }) => {
      const res = await apiRequest("PUT", `/api/courses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "The course has been updated successfully",
      });
      setShowCourseDialog(false);
      setEditingCourse(null);
      form.reset();
    },
    onError: (error: Error) => {
      handleError(error);
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/courses/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "The course has been deleted successfully"
      });
      setDeleteConfirmCourse(null);
    },
    onError: (error: Error) => {
      handleError(error);
    },
  });

  // Form handling
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      thumbnail: "",
      isActive: true,
      richContent: "",
      videoUrl: "",
      attachments: [],
    },
  });

  // Table columns for courses
  const courseColumns: any[] = [
    {
      accessorKey: "title",
      header: "Course Title",
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-gray-500" />
            </div>
            <div className="font-medium">{row.getValue("title")}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }: any) => {
        return <Badge variant="outline">{row.getValue("category")}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }: any) => {
        return format(new Date(row.getValue("createdAt")), "MMM d, yyyy");
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: any) => {
        return row.getValue("isActive") ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Inactive
          </Badge>
        );
      },
    },
    {
      id: "actions",
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
              className="text-primary hover:underline text-sm mr-2"
            >
              View Enrollments
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEnrollDialog(course)}
              title="Enroll Students in this Course"
              className="text-green-600 flex items-center gap-1"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Enroll Students</span>
            </Button>
          </div>
        );
      },
    },
  ];

  // Handle creating a new course
  const handleCreateCourse = () => {
    setEditingCourse(null);
    form.reset({
      title: "",
      description: "",
      category: "",
      thumbnail: "",
      isActive: true,
      richContent: "",
      videoUrl: "",
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
      thumbnail: course.thumbnail || "",
      isActive: course.isActive,
      richContent: course.richContent || "",
      videoUrl: course.videoUrl || "",
      attachments: course.attachments || [],
    });
    setShowCourseDialog(true);
  };

  // Handle form submission
  function onSubmit(values: z.infer<typeof courseSchema>) {
    clearError();

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

  // Enroll student mutation
  const enrollStudentMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: number, courseId: number }) => {
      const res = await apiRequest('POST', '/api/enrollments', {
        userId,
        courseId
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate all enrollment-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/all'] });
      
      // Specifically invalidate course enrollments for this course
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments', variables.courseId] });
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
  const handleOpenEnrollDialog = (course: Course) => {
    setEnrollmentCourse(course);
    setSelectedStudentIds([]);
    
    // Force refresh enrollments data for this course
    queryClient.invalidateQueries({ queryKey: ['/api/enrollments/all'] });
    
    // This ensures we reload the correct enrollments for the specific course
    queryClient.invalidateQueries({ queryKey: ['/api/enrollments', course.id] });
  };
  
  // Handle enrollment submission
  const handleEnrollStudents = async () => {
    if (!enrollmentCourse || selectedStudentIds.length === 0) return;
    
    setBatchEnrollmentLoading(true);
    
    try {
      // Process each enrollment sequentially
      for (const userId of selectedStudentIds) {
        await enrollStudentMutation.mutateAsync({ 
          userId,
          courseId: enrollmentCourse.id
        });
      }
      
      toast({
        title: 'Enrollment Successful',
        description: `${selectedStudentIds.length} ${selectedStudentIds.length === 1 ? 'student has' : 'students have'} been enrolled in ${enrollmentCourse.title}.`,
      });
      
      setEnrollmentCourse(null);
      setSelectedStudentIds([]);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setBatchEnrollmentLoading(false);
    }
  };
  
  // Toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    // Skip if already enrolled
    if (enrolledStudentIds.includes(studentId)) {
      return;
    }
    
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  // Toggle all students
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

  // Handle import success
  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    toast({
      title: "Courses Imported",
      description: "Courses have been successfully imported.",
    });
  };

  return (
    <Layout
      title="Manage Courses"
      description="Create, edit, and manage courses for students"
      rightContent={
        <Button
          onClick={handleCreateCourse}
          className="flex items-center gap-2"
        >
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
              Import courses from CSV/Excel or export existing courses for
              backup or editing.
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
              {editingCourse ? "Edit Course" : "Create New Course"}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Update the details of the existing course."
                : "Fill in the details to create a new course."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Display form-level errors */}
              {formError && (
                <FormSubmitError
                  message={formError}
                  title={
                    editingCourse
                      ? "Failed to Update Course"
                      : "Failed to Create Course"
                  }
                  className="mt-4"
                />
              )}

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="content">Rich Content</TabsTrigger>
                  <TabsTrigger value="media">Media & Files</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <EnhancedFormField
                    name="title"
                    label="Course Title"
                    required={true}
                  >
                    <Input placeholder="e.g. Algebra Fundamentals" />
                  </EnhancedFormField>

                  <EnhancedFormField
                    name="category"
                    label="Category"
                    required={true}
                  >
                    <Input placeholder="e.g. Algebra, Geometry, Calculus" />
                  </EnhancedFormField>

                  <EnhancedFormField
                    name="description"
                    label="Description"
                    required={true}
                  >
                    <Textarea
                      placeholder="Describe what students will learn in this course"
                      className="min-h-[100px]"
                    />
                  </EnhancedFormField>

                  <EnhancedFormField
                    name="thumbnail"
                    label="Thumbnail URL (Optional)"
                  >
                    <Input placeholder="https://example.com/image.jpg" />
                  </EnhancedFormField>

                  <EnhancedFormField
                    name="isActive"
                    className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"
                  >
                    <div className="flex w-full justify-between items-center">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Determine if this course is visible to students
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </EnhancedFormField>
                </TabsContent>

                {/* Rich Content Tab */}
                <TabsContent value="content" className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Course Content</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the rich text editor below to create detailed course
                    content with formatting, lists, links, and more.
                  </p>

                  <EnhancedFormField
                    name="richContent"
                    label="Course Content"
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Create rich content for your course here..."
                      />
                    )}
                  />

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabTriggers =
                          document.querySelectorAll('[role="tab"]');
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
                        const tabTriggers =
                          document.querySelectorAll('[role="tab"]');
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
                    <h3 className="text-lg font-medium">
                      Video & File Attachments
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add supplementary materials to enhance your course,
                    including videos and downloadable resources.
                  </p>

                  <EnhancedFormField
                    name="videoUrl"
                    label="Video Content (Optional)"
                    render={({ field }) => (
                      <VideoEmbed
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  <EnhancedFormField
                    name="attachments"
                    label="File Attachments (Optional)"
                    render={({ field }) => (
                      <>
                        <FileUpload
                          existingFiles={field.value || []}
                          onUpload={(files) => {
                            const currentFiles = field.value || [];
                            field.onChange([...currentFiles, ...files]);
                          }}
                          onRemove={(file) => {
                            const currentFiles = field.value || [];
                            field.onChange(
                              currentFiles.filter(
                                (f: { id: string }) => f.id !== file.id,
                              ),
                            );
                          }}
                          accept={{
                            "application/pdf": [".pdf"],
                            "application/msword": [".doc"],
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                              [".docx"],
                            "application/vnd.ms-excel": [".xls"],
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                              [".xlsx"],
                            "application/vnd.ms-powerpoint": [".ppt"],
                            "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                              [".pptx"],
                            "image/jpeg": [".jpg", ".jpeg"],
                            "image/png": [".png"],
                          }}
                          maxFiles={5}
                        />

                        {/* Display Media Gallery when files exist */}
                        {field.value && field.value.length > 0 && (
                          <div className="mt-6">
                            <MediaGallery
                              files={field.value}
                              onRemove={(file) => {
                                const currentFiles = field.value || [];
                                field.onChange(
                                  currentFiles.filter(
                                    (f: { id: string }) => f.id !== file.id,
                                  ),
                                );
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  />

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabTriggers =
                          document.querySelectorAll('[role="tab"]');
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
                  disabled={
                    createCourseMutation.isPending ||
                    updateCourseMutation.isPending
                  }
                >
                  {(createCourseMutation.isPending ||
                    updateCourseMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCourse ? "Update Course" : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmCourse}
        onOpenChange={(open) => !open && setDeleteConfirmCourse(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the course
              <span className="font-medium">
                {" "}
                "{deleteConfirmCourse?.title}"
              </span>
              ? This action cannot be undone.
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

      {/* Enrollment Dialog */}
      <Dialog 
        open={!!enrollmentCourse} 
        onOpenChange={(open) => !open && setEnrollmentCourse(null)}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Enroll Students in Course</DialogTitle>
            <DialogDescription>
              Select students to enroll in <span className="font-medium">{enrollmentCourse?.title}</span>.
              You can select multiple students.
            </DialogDescription>
          </DialogHeader>
          
          {isUsersLoading ? (
            <div className="py-6">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">No students available. Please add students first.</p>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="border-b pb-2 mb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all"
                    checked={
                      students.length > 0 &&
                      selectedStudentIds.length === 
                        students.filter((student: any) => !enrolledStudentIds.includes(student.id)).length &&
                      selectedStudentIds.length > 0
                    }
                    onCheckedChange={toggleAllStudents}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All Students
                  </label>
                </div>
              </div>
              
              {/* Student List */}
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {students.map((student: any) => {
                    const isEnrolled = enrolledStudentIds.includes(student.id);
                    return (
                      <div 
                        key={student.id} 
                        className={`flex items-center space-x-3 border rounded-md p-3 ${
                          isEnrolled ? 'bg-muted' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Checkbox 
                          id={`student-${student.id}`}
                          checked={isEnrolled ? true : selectedStudentIds.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                          disabled={isEnrolled}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`student-${student.id}`}
                            className={`text-sm font-medium leading-none ${
                              isEnrolled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'
                            }`}
                          >
                            {student.fullName}
                          </label>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          {isEnrolled && (
                            <p className="text-xs text-green-600 mt-1">
                              <CheckCircle2 className="h-3 w-3 inline-block mr-1" />
                              Already enrolled
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </>
          )}
          
          <DialogFooter className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="text-sm text-muted-foreground">
              {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'student' : 'students'} selected
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEnrollmentCourse(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEnrollStudents}
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
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
