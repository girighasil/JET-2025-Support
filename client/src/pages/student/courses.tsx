import { Layout } from '@/components/ui/layout';
import { CourseCard } from '@/components/dashboard/course-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from "wouter";
import { Course } from "../../shared/schema";
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StudentCourses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Fetch all active courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses', { isActive: true }],
  });
  
  // Fetch enrolled courses
  const { data: enrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments'],
  });
  
  // Enroll in a course mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest('POST', '/api/enrollments', { courseId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: 'Enrolled Successfully',
        description: 'You have been enrolled in the course.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Failed to enroll in the course.',
        variant: 'destructive',
      });
    }
  });

  // Handle enrollment
  const handleEnroll = async (courseId: number) => {
    await enrollMutation.mutateAsync(courseId);
  };

  // Process courses data
  const enrolledCourseIds = enrollments.map((enrollment: any) => enrollment.courseId);
  
  // Get all unique categories
  const categories = courses && courses.length 
    ? ['all', ...new Set(courses.map((course: any) => course.category))]
    : ['all'];
  
  // Filter and organize courses
  const myCourses = courses
    .filter((course: any) => enrolledCourseIds.includes(course.id))
    .map((course: any) => {
      const enrollment = enrollments.find((e: any) => e.courseId === course.id);
      return {
        ...course,
        progress: enrollment ? enrollment.progress : 0,
        isCompleted: enrollment ? enrollment.isCompleted : false,
        isEnrolled: true
      };
    });
  
  const availableCourses = courses
    .filter((course: any) => !enrolledCourseIds.includes(course.id))
    .map((course: any) => ({
      ...course,
      progress: 0,
      isEnrolled: false
    }));
  
  // Apply search and category filters
  const filterCourses = (courseList: any[]) => {
    return courseList.filter((course: any) => {
      const matchesSearch = searchQuery === '' || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || 
        course.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  };
  
  const filteredMyCourses = filterCourses(myCourses);
  const filteredAvailableCourses = filterCourses(availableCourses);

  return (
    <Layout title="Courses" description="Browse and manage your enrolled courses">
      {/* Search and Filter */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search courses..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Courses Tabs */}
      <Tabs defaultValue="myCourses" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="myCourses">My Courses</TabsTrigger>
          <TabsTrigger value="available">Available Courses</TabsTrigger>
        </TabsList>
        
        {/* My Courses Tab */}
        <TabsContent value="myCourses">
          {isCoursesLoading || isEnrollmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          ) : filteredMyCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyCourses.map((course: any) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  category={course.category}
                  thumbnail={course.thumbnail}
                  progress={course.progress}
                  isEnrolled={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg border-dashed bg-gray-50">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {searchQuery || categoryFilter !== 'all' 
                  ? "No courses match your search criteria. Try adjusting your filters."
                  : "You haven't enrolled in any courses yet. Explore available courses to get started."}
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Available Courses Tab */}
        <TabsContent value="available">
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <h3 className="text-xl font-semibold">Explore Available Courses</h3>
            <p className="text-gray-600 text-center max-w-lg">
              Browse our catalog of courses you can enroll in to expand your knowledge.
            </p>
            <a 
              href="/student/available-courses" 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              View Available Courses
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
