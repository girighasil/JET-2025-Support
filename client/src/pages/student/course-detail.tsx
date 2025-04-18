import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/ui/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import MediaGallery from '@/components/ui/media-gallery';
import { FileItem } from '@/components/ui/file-upload';
import { 
  BookOpen, 
  Calendar, 
  ClipboardList,
  FileText,
  Video,
  UserCircle,
  ChevronLeft
} from 'lucide-react';

export default function StudentCourseDetail() {
  const { id } = useParams();
  const courseId = parseInt(id || '0');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch course details
  const { 
    data: course, 
    isLoading, 
    isError 
  } = useQuery<{
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
    instructor?: {
      name: string;
      avatar?: string;
    };
  }>({
    queryKey: ['/api/courses', courseId],
    enabled: courseId > 0,
  });
  
  // Fetch modules for this course
  const {
    data: modules = [],
    isLoading: isModulesLoading
  } = useQuery({
    queryKey: ['/api/modules', { courseId }],
    enabled: courseId > 0,
  });
  
  // Handle error state
  if (isError) {
    return (
      <Layout title="Course Not Found" description="The requested course could not be found">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="rounded-full bg-red-100 p-6 mb-4">
            <BookOpen className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <p className="text-gray-500 mb-6">The course you're looking for doesn't exist or you don't have access.</p>
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
      <Layout title="Loading Course..." description="Please wait while the course details are loading">
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
  
  return (
    <Layout
      title={course?.title || 'Course Details'}
      description={course?.description}
    >
      <Button 
        asChild 
        variant="ghost" 
        size="sm" 
        className="mb-4"
      >
        <a href="/student/courses">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </a>
      </Button>
      {course && (
        <div className="flex flex-col space-y-6">
          {/* Course Header */}
          <div className="flex flex-col md:flex-row items-start gap-6 pb-6 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant={course.isActive ? "success" : "outline"}>
                  {course.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              {course.instructor && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={course.instructor.avatar} alt={course.instructor.name} />
                    <AvatarFallback>
                      <UserCircle className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    Instructor: <span className="font-medium">{course.instructor.name}</span>
                  </span>
                </div>
              )}
            </div>
            
            {course.thumbnail && (
              <div className="w-full md:w-1/3 rounded-lg overflow-hidden">
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
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
                    {new Date(course.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {course.richContent && (
                <div className="prose dark:prose-invert max-w-none">
                  <h2 className="text-xl font-bold mb-4">Course Information</h2>
                  <div 
                    dangerouslySetInnerHTML={renderHTML(course.richContent)}
                  />
                </div>
              )}
              
              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-bold mb-4">What You'll Learn</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Core mathematical concepts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Problem-solving techniques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Step-by-step calculation methods</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Application to real-world scenarios</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
            
            {/* Content Tab */}
            <TabsContent value="content" className="py-4 space-y-4">
              {course.richContent ? (
                <div className="prose dark:prose-invert max-w-none">
                  <div 
                    dangerouslySetInnerHTML={renderHTML(course.richContent)}
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <FileText className="h-10 w-10 text-gray-400 mb-3 mx-auto" />
                  <h3 className="text-lg font-medium mb-1">No Content Available</h3>
                  <p className="text-gray-500">The instructor hasn't added any content yet.</p>
                </div>
              )}
            </TabsContent>
            
            {/* Media Tab */}
            <TabsContent value="media" className="py-4 space-y-4">
              <div className="flex flex-col space-y-6">
                {/* Video Content */}
                {course.videoUrl && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Video className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Video Content</h3>
                    </div>
                    
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                      {course.videoUrl.includes('youtube.com') || course.videoUrl.includes('youtu.be') ? (
                        <iframe
                          src={course.videoUrl.replace('watch?v=', 'embed/')}
                          title="Course Video"
                          className="w-full h-full"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <video 
                          src={course.videoUrl} 
                          controls 
                          className="w-full h-full"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Attachments */}
                {course.attachments && course.attachments.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Course Materials</h3>
                    </div>
                    
                    <MediaGallery 
                      files={course.attachments}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <FileText className="h-10 w-10 text-gray-400 mb-3 mx-auto" />
                    <h3 className="text-lg font-medium mb-1">No Attachments Available</h3>
                    <p className="text-gray-500">The instructor hasn't added any downloadable materials yet.</p>
                  </div>
                )}
              </div>
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
                  {modules.map((module: any) => (
                    <div 
                      key={module.id} 
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-lg font-medium mb-2">{module.title}</h3>
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
                  <h3 className="text-lg font-medium mb-1">No Modules Available</h3>
                  <p className="text-gray-500">The instructor hasn't added any modules to this course yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Layout>
  );
}