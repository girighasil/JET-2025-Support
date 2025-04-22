import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import MediaGallery from "@/components/ui/media-gallery";
import { DirectResourceViewer } from "@/components/ui/direct-resource-viewer";
import { FileItem } from "@/components/ui/file-upload";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Video,
  UserCircle,
  ChevronLeft,
  ExternalLink,
  Globe,
  Link2,
  ArrowUpRight,
  Hash,
} from "lucide-react";

export default function StudentCourseDetail() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth(); // Get the user to check role

  // State for resource viewer dialog
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{
    url: string;
    type: string;
    label: string;
    index: number;
  } | null>(null);

  // Fetch course details
  const {
    data: course,
    isLoading,
    isError,
  } = useQuery<{
    id: number;
    title: string;
    description: string;
    category: string;
    thumbnail?: string;
    isActive: boolean;
    richContent?: string;
    videoUrl?: string; // Keep for backward compatibility
    videoUrls?: string[]; // Add the new videoUrls array field
    resourceLinks?: {
      url: string;
      type: string;
      label: string;
    }[];
    attachments?: FileItem[];
    createdAt: string;
    updatedAt: string;
    instructor?: {
      name: string;
      avatar?: string;
    };
  }>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: courseId > 0,
    // Use includedCredentials to ensure auth cookies are sent
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error fetching course: ${response.status}`);
      }

      return response.json();
    },
  });

  // Define the Module type
  type Module = {
    id: number;
    title: string;
    description: string;
    courseId: number;
    sortOrder: number;
    lessonCount?: number;
    createdAt: string;
  };

  // Fetch modules for this course
  const { data: modules = [] as Module[], isLoading: isModulesLoading } =
    useQuery<Module[]>({
      queryKey: [`/api/courses/${courseId}/modules`],
      enabled: courseId > 0,
      // Use includedCredentials to ensure auth cookies are sent
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error fetching modules: ${response.status}`);
        }

        return response.json();
      },
    });

  // Handle course data that might be returned as an array
  const courseItem = Array.isArray(course) ? course[0] : course;

  // Handle error state
  if (isError) {
    return (
      <Layout
        title="Course Not Found"
        description="The requested course could not be found"
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="rounded-full bg-red-100 p-6 mb-4">
            <BookOpen className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <p className="text-gray-500 mb-6">
            The course you're looking for doesn't exist or you don't have
            access.
          </p>
          <Button asChild>
            <a href="/student/courses">Back to Courses</a>
          </Button>
        </div>
      </Layout>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <Layout
        title="Loading Course..."
        description="Please wait while the course details are loading"
      >
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  // Render HTML content safely
  const renderHTML = (htmlContent: string) => {
    return { __html: htmlContent };
  };
  // Add error handling for media rendering
  const renderMediaContent = () => {
    try {
      // Safely access the course object
      if (!course) {
        console.log("Course data is not loaded yet");
        return <div>Loading course content...</div>;
      }

      console.log("Full course data:", course);
      // Check if course data is nested in a 'data' property (common with some API responses)
      const courseData = (course as any).data || course;

      // Direct access to first element in course array if it's an array
      const courseItem = Array.isArray(course) ? course[0] : course;

      console.log("Using course item:", courseItem);
      console.log("Course item props:", Object.keys(courseItem));

      // Add debug info for data types
      console.log("Data types:", {
        videoUrls: courseItem.videoUrls
          ? typeof courseItem.videoUrls
          : "undefined",
        resourceLinks: courseItem.resourceLinks
          ? typeof courseItem.resourceLinks
          : "undefined",
        attachments: courseItem.attachments
          ? typeof courseItem.attachments
          : "undefined",
      });

      return (
        <div className="flex flex-col space-y-6">
          {/* Video Content */}
          {(() => {
            // Handle both old and new video URL formats safely
            let videoUrlsToDisplay: string[] = [];

            // First check if videoUrls field exists and is populated
            // Use courseItem which is the first item from the course array
            const videoUrls = courseItem.videoUrls;

            if (videoUrls) {
              // If it's already an array, use it directly
              if (Array.isArray(videoUrls)) {
                videoUrlsToDisplay = videoUrls;
              }
              // If it's an object but not an array, it might be a parsed JSON object
              else if (typeof videoUrls === "object") {
                const values = Object.values(videoUrls);
                if (values.length > 0) {
                  videoUrlsToDisplay = values.map((v) => String(v));
                }
              }
              // If it's a string, try to parse it as JSON
              else if (typeof videoUrls === "string") {
                try {
                  const parsed = JSON.parse(videoUrls);
                  if (Array.isArray(parsed)) {
                    videoUrlsToDisplay = parsed;
                  } else if (typeof parsed === "object") {
                    videoUrlsToDisplay = Object.values(parsed).map((v) =>
                      String(v),
                    );
                  }
                } catch (e) {
                  // If it doesn't parse as JSON but is a single URL, use it
                  if (
                    typeof videoUrls === "string" &&
                    videoUrls.includes("http")
                  ) {
                    videoUrlsToDisplay = [videoUrls];
                  }
                  console.error("Error parsing videoUrls:", e);
                }
              }
            }

            // Fallback to legacy videoUrl if available
            if (videoUrlsToDisplay.length === 0 && courseItem.videoUrl) {
              videoUrlsToDisplay = [courseItem.videoUrl];
            }

            console.log("Video URLs to display:", videoUrlsToDisplay);

            return videoUrlsToDisplay.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Video Content</h3>
                </div>

                {videoUrlsToDisplay.map((videoUrl, index) => {
                  // Extract video ID and create proper embed URL
                  let embedUrl = videoUrl;

                  // Process YouTube URLs
                  if (
                    videoUrl.includes("youtube.com") ||
                    videoUrl.includes("youtu.be")
                  ) {
                    let videoId = "";
                    if (videoUrl.includes("youtube.com/watch?v=")) {
                      videoId = videoUrl.split("watch?v=")[1].split("&")[0];
                    } else if (videoUrl.includes("youtu.be/")) {
                      videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
                    }

                    if (videoId) {
                      embedUrl = `https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}&enablejsapi=1`;
                    }
                  }

                  return (
                    <div key={index} className="aspect-video mb-4">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full rounded-md"
                        title={`Video ${index + 1}`}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null;
          })()}

          {/* Resource Links */}
          {(() => {
            // Safely parse resourceLinks
            let resourceLinksToDisplay: Array<{
              url: string;
              type: string;
              label: string;
            }> = [];

            // Use courseItem which is the first item from the course array
            const resourceLinks = courseItem.resourceLinks;

            if (resourceLinks) {
              // Handle if it's already an array
              if (Array.isArray(resourceLinks)) {
                resourceLinksToDisplay = resourceLinks;
              }
              // If it's an object but not an array, it might be a parsed JSON object
              else if (typeof resourceLinks === "object") {
                const values = Object.values(resourceLinks).map(
                  (item) =>
                    item as {
                      url: string;
                      type: string;
                      label: string;
                    },
                );
                if (values.length > 0) {
                  resourceLinksToDisplay = values;
                }
              }
              // Handle if it's a JSON string
              else if (typeof resourceLinks === "string") {
                try {
                  const parsed = JSON.parse(resourceLinks);
                  if (Array.isArray(parsed)) {
                    resourceLinksToDisplay = parsed;
                  } else if (typeof parsed === "object") {
                    resourceLinksToDisplay = Object.values(parsed).map(
                      (item) =>
                        item as {
                          url: string;
                          type: string;
                          label: string;
                        },
                    );
                  }
                } catch (e) {
                  console.error("Error parsing resourceLinks:", e);
                }
              }
            }

            console.log("Resource links to display:", resourceLinksToDisplay);

            return resourceLinksToDisplay.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Resource Links</h3>
                </div>

                <div className="space-y-3">
                  {resourceLinksToDisplay.map((link, index) => {
                    // Set icon based on resource type
                    let Icon = FileText;
                    if (link.type === "webpage") Icon = Globe;
                    if (link.type === "video") Icon = Video;

                    // Generate proxy URL for students, show actual URL for admins/teachers
                    const isStudent = user?.role === "student";
                    const resourceProxyUrl = `/api/resource-proxy/${index}?courseId=${courseId}`;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-md bg-muted/10"
                      >
                        <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-md relative">
                          <span className="text-primary font-semibold">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {link.label}
                          </h4>
                          {isStudent ? (
                            // For students: Show resource type instead of number (since the number is already in the icon)
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="truncate">
                                {link.type.charAt(0).toUpperCase() +
                                  link.type.slice(1)}
                              </span>
                              <Link2 className="h-3 w-3 flex-shrink-0" />
                            </div>
                          ) : (
                            // For teachers/admins: Show the actual URL
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <span className="truncate">
                                {link.url.length > 50
                                  ? `${link.url.substring(0, 50)}...`
                                  : link.url}
                              </span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          )}
                        </div>
                        {isStudent ? (
                          // For students: Use DirectResourceViewer to open content in-app
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-shrink-0"
                            onClick={() => {
                              setSelectedResource({
                                url: link.url,
                                type: link.type,
                                label: link.label || `Resource ${index + 1}`,
                                index,
                              });
                              setViewerOpen(true);
                            }}
                          >
                            View Resource
                          </Button>
                        ) : (
                          // For teachers/admins: Direct URL access
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="flex-shrink-0"
                          >
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                            </a>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null;
          })()}

          {/* Attachments */}
          {(() => {
            // Safely parse attachments
            let attachmentsToDisplay: Array<any> = [];

            // Use courseItem which is the first item from the course array
            const attachments = courseItem.attachments;

            if (attachments) {
              // Handle if it's already an array
              if (Array.isArray(attachments)) {
                attachmentsToDisplay = attachments;
              }
              // If it's an object but not an array
              else if (typeof attachments === "object") {
                const values = Object.values(attachments);
                if (values.length > 0) {
                  attachmentsToDisplay = values;
                }
              }
              // Handle if it's a JSON string
              else if (typeof attachments === "string") {
                try {
                  const parsed = JSON.parse(attachments);
                  if (Array.isArray(parsed)) {
                    attachmentsToDisplay = parsed;
                  } else if (typeof parsed === "object") {
                    attachmentsToDisplay = Object.values(parsed);
                  }
                } catch (e) {
                  console.error("Error parsing attachments:", e);
                }
              }
            }

            console.log("Attachments to display:", attachmentsToDisplay);

            return attachmentsToDisplay.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Course Materials</h3>
                </div>

                <MediaGallery
                  files={
                    Array.isArray(attachmentsToDisplay)
                      ? attachmentsToDisplay
                      : []
                  }
                />
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <FileText className="h-10 w-10 text-gray-400 mb-3 mx-auto" />
                <h3 className="text-lg font-medium mb-1">
                  No Attachments Available
                </h3>
                <p className="text-gray-500">
                  The instructor hasn't added any downloadable materials yet.
                </p>
              </div>
            );
          })()}
        </div>
      );
    } catch (error) {
      console.error("Error rendering media content:", error);
      return (
        <div className="p-6 bg-red-50 text-red-600 rounded-md">
          <h3 className="font-medium mb-2">Error Loading Media Content</h3>
          <p>
            There was a problem displaying the course media. Please try
            refreshing the page.
          </p>
        </div>
      );
    }
  };
  return (
    <Layout
      title={courseItem?.title || "Course Details"}
      description={courseItem?.description}
    >
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <a href="/student/courses">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </a>
      </Button>
      {courseItem && (
        <div className="flex flex-col space-y-6">
          {/* Course Header */}
          <div className="flex flex-col md:flex-row items-start gap-6 pb-6 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{courseItem.category}</Badge>
                <Badge
                  variant={courseItem.isActive ? "secondary" : "outline"}
                  className={
                    courseItem.isActive
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : ""
                  }
                >
                  {courseItem.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-4">
                {courseItem.title}
              </h1>
              <p className="text-gray-600 mb-4">{courseItem.description}</p>

              {courseItem.instructor && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={courseItem.instructor.avatar}
                      alt={courseItem.instructor.name}
                    />
                    <AvatarFallback>
                      <UserCircle className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    Instructor:{" "}
                    <span className="font-medium">
                      {courseItem.instructor.name}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {courseItem.thumbnail && (
              <div className="w-full md:w-1/3 rounded-lg overflow-hidden">
                <img
                  src={courseItem.thumbnail}
                  alt={courseItem.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>

          {/* Course Tabs */}
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 md:grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center mb-2">
                    <BookOpen className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-medium">Course Progress</h3>
                  </div>
                  <p className="text-2xl font-bold">25%</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center mb-2">
                    <ClipboardList className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-medium">Assignments</h3>
                  </div>
                  <p className="text-2xl font-bold">2/8</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-medium">Enrolled On</h3>
                  </div>
                  <p className="text-lg font-medium">
                    {new Date(courseItem.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>

              {courseItem?.richContent && (
                <div className="prose dark:prose-invert max-w-none">
                  <h2 className="text-xl font-bold mb-4">Course Information</h2>
                  <div
                    dangerouslySetInnerHTML={renderHTML(courseItem.richContent)}
                  />
                </div>
              )}

              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-bold mb-4">What You'll Learn</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Core mathematical concepts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Problem-solving techniques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Step-by-step calculation methods</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Application to real-world scenarios</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="py-4 space-y-4">
              {courseItem?.richContent ? (
                <div className="prose dark:prose-invert max-w-none">
                  <div
                    dangerouslySetInnerHTML={renderHTML(courseItem.richContent)}
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <FileText className="h-10 w-10 text-gray-400 mb-3 mx-auto" />
                  <h3 className="text-lg font-medium mb-1">
                    No Content Available
                  </h3>
                  <p className="text-gray-500">
                    The instructor hasn't added any content yet.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="py-4 space-y-4">
              {renderMediaContent()}
            </TabsContent>

            {/* Modules Tab */}
            <TabsContent value="modules" className="py-4">
              {isModulesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-lg font-medium mb-2">
                        {module.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{module.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{module.lessonCount || 0} Lessons</span>
                        </div>
                        <Button size="sm" asChild>
                          <a href={`/student/modules/${module.id}`}>
                            View Module
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <BookOpen className="h-10 w-10 text-gray-400 mb-3 mx-auto" />
                  <h3 className="text-lg font-medium mb-1">
                    No Modules Available
                  </h3>
                  <p className="text-gray-500">
                    The instructor hasn't added any modules to this course yet.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      {/* Resource Viewer Component */}
      {selectedResource && (
        <DirectResourceViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          resourceUrl={selectedResource.url}
          resourceType={selectedResource.type}
          resourceTitle={selectedResource.label}
          courseId={courseId}
          resourceIndex={selectedResource.index}
        />
      )}
    </Layout>
  );
}
