import { useState } from "react";
import { Layout } from "@/components/ui/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { safeFetch } from "@/lib/safeFetch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useRoute } from "wouter";
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
import MultipleVideoUrls from "@/components/ui/multiple-video-urls";
import ResourceLinksInput from "@/components/ui/resource-links-input";

// Define the Course type
type Course = {
  id: number;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  isActive: boolean;
  richContent?: string;
  videoUrls?: string[];
  resourceLinks?: {
    url: string;
    type: string;
    label: string;
  }[];
  attachments?: FileItem[];
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  creatorName?: string;
};

// Form schema for a course
const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(true),
  richContent: z.string().optional(),
  videoUrls: z.array(z.string().url("Please enter a valid URL")).optional(),
  resourceLinks: z
    .array(
      z.object({
        url: z.string().url("Please enter a valid URL"),
        type: z.string(),
        label: z.string(),
      }),
    )
    .optional(),
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
  const isTeacher = user?.role === "teacher";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation(); // Add useLocation hook to get navigate function
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

  // Fetch all students for enrollment dialog (only for admins)
  const { data: users = [], isLoading: isUsersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: user?.role !== "teacher", // Only enable this query for non-teachers
  });

  // Filter to get only students
  const students = Array.isArray(users)
    ? users.filter((user: any) => user && user.role === "student")
    : [];

  // Fetch enrollments when a course is selected for enrollment
  const { data: courseEnrollments = [], isLoading: isEnrollmentsLoading } =
    useQuery({
      queryKey: ["/api/enrollments", enrollmentCourse?.id],
      enabled: !!enrollmentCourse,
      queryFn: async () => {
        if (!enrollmentCourse) return [];
        // Explicitly request enrollments for this course by ID
        return await safeFetch(
          `/api/enrollments?courseId=${enrollmentCourse.id}`,
        );
      },
    });

  // Extract enrolled student IDs
  const enrolledStudentIds = courseEnrollments.map(
    (enrollment: any) => enrollment.userId,
  );

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
        description: "The course has been deleted successfully",
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
      videoUrls: [],
      resourceLinks: [],
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
    // Add the Created By column here, after the category column
    {
      accessorKey: "creatorName",
      header: "Created By",
      cell: ({ row }: any) => {
        return (
          <span className="text-sm">
            {row.getValue("creatorName") || "Unknown"}
          </span>
        );
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
            {/* Only show View Enrollments and Enroll Students for admins */}
            {user?.role !== "teacher" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/admin/manage-enrollments?courseId=${course.id}`)
                  }
                  className="text-primary hover:text-primary-dark p-0.5 h-auto"
                >
                  View Enrollments
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEnrollDialog(course)}
                  title="Enroll Students in this Course"
                  className="text-green-600 flex items-center flex gap-1 p-0.5 h-auto"
                >
                  <UserPlus className="h-1.5 w-1.5" />
                  <span>Enroll Students</span>
                </Button>
              </>
            )}
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
      videoUrls: [],
      resourceLinks: [],
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
      videoUrls: course.videoUrls || [],
      resourceLinks: course.resourceLinks || [],
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
    mutationFn: async ({
      userId,
      courseId,
    }: {
      userId: number;
      courseId: number;
    }) => {
      const res = await apiRequest("POST", "/api/enrollments", {
        userId,
        courseId,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate all enrollment-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/all"] });

      // Specifically invalidate course enrollments for this course
      queryClient.invalidateQueries({
        queryKey: ["/api/enrollments", variables.courseId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Enroll Student",
        description:
          error.message || "There was an error enrolling the student.",
        variant: "destructive",
      });
    },
  });

  // Open enrollment dialog
  const handleOpenEnrollDialog = async (course: Course) => {
    setEnrollmentCourse(course);
    setSelectedStudentIds([]);

    try {
      // Force refresh enrollments data for this course
      await queryClient.invalidateQueries({
        queryKey: ["/api/enrollments/all"],
      });

      // This ensures we reload the correct enrollments for the specific course
      await queryClient.invalidateQueries({
        queryKey: ["/api/enrollments", course.id],
      });

      // Force a direct fetch to make sure we have the latest data before showing UI
      const freshEnrollments = await safeFetch(
        `/api/enrollments?courseId=${course.id}`,
      );
      queryClient.setQueryData(
        ["/api/enrollments", course.id],
        freshEnrollments,
      );
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  // Handle enrollment submission
  const handleEnrollStudents = async () => {
    if (!enrollmentCourse || selectedStudentIds.length === 0) return;

    setBatchEnrollmentLoading(true);
    console.log("Starting enrollment process for course:", enrollmentCourse);
    console.log("Selected student IDs before filtering:", selectedStudentIds);
    console.log("Already enrolled student IDs:", enrolledStudentIds);

    try {
      // First, let's refresh the enrollments data to ensure we have the most current information
      const freshEnrollments = await safeFetch(
        `/api/enrollments?courseId=${enrollmentCourse.id}`,
      );
      const freshEnrolledIds = freshEnrollments.map(
        (enrollment: any) => enrollment.userId,
      );
      console.log("Refreshed enrolled student IDs:", freshEnrolledIds);

      // Filter out any already enrolled students (safety check)
      const notEnrolledStudentIds = selectedStudentIds.filter(
        (id) => !freshEnrolledIds.includes(id),
      );
      console.log(
        "Filtered student IDs eligible for enrollment:",
        notEnrolledStudentIds,
      );

      if (notEnrolledStudentIds.length === 0) {
        toast({
          title: "No New Enrollments",
          description:
            "All selected students are already enrolled in this course.",
        });
        setEnrollmentCourse(null);
        setSelectedStudentIds([]);
        return;
      }

      // Process each enrollment sequentially with better error handling
      let successCount = 0;
      let errorCount = 0;
      const errorMessages: string[] = [];

      for (const userId of notEnrolledStudentIds) {
        try {
          console.log(
            `Enrolling student ${userId} in course ${enrollmentCourse.id}`,
          );

          // Don't do a double check against the server - just use our refreshed list from earlier
          if (freshEnrolledIds.includes(userId)) {
            console.log(
              `Student ${userId} is already enrolled (from refreshed list), skipping`,
            );
            continue; // Skip already enrolled students
          }

          // Trust our cached data since we just refreshed it at the start of this function
          console.log(
            `Student ${userId} is not enrolled yet, proceeding with enrollment`,
          );

          // Attempt enrollment with detailed error capture using apiRequest for consistency
          try {
            const result = await apiRequest("POST", "/api/enrollments", {
              userId,
              courseId: enrollmentCourse.id,
            }).then((res) => res.json());

            console.log(
              `Successfully enrolled student ${userId}, result:`,
              result,
            );
            successCount++;
          } catch (error: any) {
            // Get detailed error information
            const errorMessage = error.message || "Unknown error";
            errorMessages.push(`Student ${userId}: ${errorMessage}`);
            errorCount++;
            console.error(`Failed to enroll student ${userId}:`, error);
          }
        } catch (error) {
          console.error(`Exception enrolling student ${userId}:`, error);
          errorCount++;
        }
      }

      // Invalidate all enrollment-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/all"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/enrollments", enrollmentCourse.id],
      });

      // Display appropriate toast based on results
      if (successCount > 0) {
        toast({
          title: "Enrollment Successful",
          description: `${successCount} ${successCount === 1 ? "student has" : "students have"} been enrolled in ${enrollmentCourse.title}.`,
        });
      }

      if (errorCount > 0) {
        toast({
          title: `${errorCount} Enrollment(s) Failed`,
          description:
            errorMessages.length > 0
              ? errorMessages.slice(0, 3).join("; ") +
                (errorMessages.length > 3 ? "..." : "")
              : "Some enrollments could not be completed",
          variant: "destructive",
        });
      }

      setEnrollmentCourse(null);
      setSelectedStudentIds([]);
    } catch (error) {
      console.error("Enrollment process error:", error);
      toast({
        title: "Enrollment Process Error",
        description:
          "There was a problem with the enrollment process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBatchEnrollmentLoading(false);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    // Skip if already enrolled - we never want to modify enrollment status of already enrolled students
    if (enrolledStudentIds.includes(studentId)) {
      console.log(
        `Student ${studentId} is already enrolled, skipping selection toggle`,
      );
      return;
    }

    setSelectedStudentIds((prev) => {
      const isCurrentlySelected = prev.includes(studentId);

      // If currently selected, remove from selection
      if (isCurrentlySelected) {
        return prev.filter((id) => id !== studentId);
      }
      // If not selected, add to selection
      else {
        return [...prev, studentId];
      }
    });
  };

  // Toggle all students
  const toggleAllStudents = (checked: boolean) => {
    // Get console output for debugging
    console.log(`toggleAllStudents called with checked=${checked}`);
    console.log(`Current enrolled student IDs:`, enrolledStudentIds);

    if (checked) {
      // Find all students who are eligible for enrollment (not already enrolled)
      const eligibleStudents = students.filter((student: any) => {
        // Skip if id is invalid
        if (!student || typeof student.id !== "number") {
          console.warn("Invalid student object found:", student);
          return false;
        }

        // Only include students who are not already enrolled
        const isEligible = !enrolledStudentIds.includes(student.id);
        console.log(
          `Student ${student.id} (${student.fullName}) eligibility:`,
          isEligible,
        );
        return isEligible;
      });

      // Extract just the IDs for selection
      const availableStudentIds = eligibleStudents.map(
        (student: any) => student.id,
      );

      console.log(
        `Found ${availableStudentIds.length} eligible students for enrollment:`,
        availableStudentIds,
      );
      setSelectedStudentIds(availableStudentIds);
    } else {
      // Deselect all
      console.log("Deselecting all students");
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
      title={isTeacher ? "Manage Your Courses" : "Manage All Courses"}
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
      {isTeacher && (
        <div className="mb-6 p-4 border rounded-md bg-amber-50">
          <p className="text-sm text-amber-800">
            As a teacher, you can only view, edit, and modify courses you have
            created.
          </p>
        </div>
      )}
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
                    name="videoUrls"
                    label="Video Content (Optional)"
                    render={({ field }) => (
                      <MultipleVideoUrls
                        values={field.value || []}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <EnhancedFormField
                    name="resourceLinks"
                    label="Resource Links (Optional)"
                    render={({ field }) => (
                      <ResourceLinksInput
                        values={field.value || []}
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
                            "video/mp4": [".mp4"],
                            "video/webm": [".webm"],
                            "video/ogg": [".ogg"],
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
              Select students to enroll in{" "}
              <span className="font-medium">{enrollmentCourse?.title}</span>.
              You can select multiple students.
            </DialogDescription>
          </DialogHeader>

          {isUsersLoading || isEnrollmentsLoading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-center text-muted-foreground">
                Loading enrollment data...
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">
                No students available. Please add students first.
              </p>
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
                      selectedStudentIds.length > 0 &&
                      // Only consider non-enrolled students for the "all selected" state
                      selectedStudentIds.length ===
                        students.filter(
                          (student: any) =>
                            !enrolledStudentIds.includes(student.id),
                        ).length
                    }
                    onCheckedChange={(checked) =>
                      toggleAllStudents(checked === true)
                    }
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All Available Students
                  </label>
                </div>
              </div>

              {/* Student List */}
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {students.map((student: any) => {
                    // Check if student is already enrolled
                    const isEnrolled = enrolledStudentIds.includes(student.id);
                    // Check if student is currently selected for enrollment
                    const isSelected = selectedStudentIds.includes(student.id);

                    return (
                      <div
                        key={student.id}
                        className={`flex items-center space-x-3 border rounded-md p-3 ${
                          isEnrolled
                            ? "bg-muted/40"
                            : isSelected
                              ? "bg-primary/5"
                              : "hover:bg-gray-50"
                        }`}
                      >
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={isEnrolled || isSelected}
                          onCheckedChange={() =>
                            toggleStudentSelection(student.id)
                          }
                          disabled={isEnrolled}
                          className={isEnrolled ? "opacity-70" : ""}
                        />

                        <div className="flex-1 flex justify-between items-center">
                          <div>
                            <label
                              htmlFor={`student-${student.id}`}
                              className={`text-sm font-medium leading-none ${
                                isEnrolled
                                  ? "cursor-not-allowed text-muted-foreground"
                                  : "cursor-pointer"
                              }`}
                            >
                              {student.fullName}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {student.email}
                            </p>
                          </div>

                          {isEnrolled && (
                            <Badge className="bg-green-50 text-green-700 hover:bg-green-50 ml-2">
                              <CheckCircle2 className="h-3 w-3 inline-block mr-1" />
                              Already Enrolled
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          <DialogFooter className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="text-sm text-muted-foreground">
              {selectedStudentIds.length}{" "}
              {selectedStudentIds.length === 1 ? "student" : "students"}{" "}
              selected
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
                disabled={
                  batchEnrollmentLoading || selectedStudentIds.length === 0
                }
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
