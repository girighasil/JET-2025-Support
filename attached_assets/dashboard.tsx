import { useQuery } from "@tanstack/react-query";
import SidebarLayout from "@/layouts/sidebar-layout";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Users,
  BookOpen,
  ClipboardList,
  Video,
  Plus,
  Download,
  ArrowUpRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Course, Test, Session, TestAttempt } from "@shared/schema";

export default function AdminDashboard() {
  const isMobile = useMobile();
  
  // Fetch data for dashboard overview
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  const { data: tests = [] } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });
  
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  const { data: testAttempts = [] } = useQuery<TestAttempt[]>({
    queryKey: ["/api/test-attempts"],
  });
  
  // Filter recent enrollments
  const recentEnrollments = users
    .filter(user => user.role === "student")
    .slice(0, 5);

  // Filter scheduled sessions
  const scheduledSessions = sessions
    .filter(session => session.status === "scheduled")
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
    .slice(0, 3);
  
  // Calculate activity data for the chart
  const activityData = [
    { day: 'Mon', value: 60 },
    { day: 'Tue', value: 80 },
    { day: 'Wed', value: 75 },
    { day: 'Thu', value: 90 },
    { day: 'Fri', value: 65 },
    { day: 'Sat', value: 40 },
    { day: 'Sun', value: 30 },
  ];
  
  // Calculate subject performance data
  const subjectPerformance = [
    { subject: 'Calculus', score: 78 },
    { subject: 'Algebra', score: 82 },
    { subject: 'Geometry', score: 65 },
    { subject: 'Statistics', score: 71 },
  ];

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SidebarLayout>
      <div className={isMobile ? "mt-16 mb-16" : ""}>
        <div className="lg:flex lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage courses, students, and track platform analytics.
            </p>
          </div>
          <div className="mt-4 flex space-x-3 lg:mt-0">
            <Link href="/admin/manage-courses">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Course
              </Button>
            </Link>
            <Link href="/admin/analytics-dashboard">
              <Button variant="secondary" className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3">
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
                Analytics Dashboard
              </Button>
            </Link>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Reports
            </Button>
          </div>
        </div>
        
        {/* Platform Overview */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900">Platform Overview</h2>
          <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Students */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Users className="text-blue-600 text-xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {users.filter(user => user.role === "student").length}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href="/admin/manage-students" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
                    View all students
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Active Courses */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <BookOpen className="text-green-600 text-xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Courses</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{courses.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href="/admin/manage-courses" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
                    Manage courses
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Tests Created */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <ClipboardList className="text-purple-600 text-xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tests Created</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{tests.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href="/admin/manage-tests" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
                    Manage tests
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Active Sessions */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
                    <Video className="text-amber-500 text-xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Scheduled Sessions</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {sessions.filter(session => session.status === "scheduled").length}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href="/admin/session-schedule" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
                    View schedule
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Recent Activity & Analytics */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Student Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Student Activity</h3>
              <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
              <div className="mt-6" style={{ height: "200px", position: "relative" }}>
                {/* Chart */}
                <div className="absolute inset-0 flex items-end px-4">
                  {activityData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col justify-end items-center">
                      <div 
                        className="bg-primary-500 w-4/5 rounded-t-md" 
                        style={{ height: `${day.value}%` }}
                      />
                      <p className="text-xs mt-1 text-gray-500">{day.day}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Performance Overview</h3>
                  <p className="text-sm text-gray-500 mt-1">Average test scores by subject</p>
                </div>
                <Link href="/admin/analytics-dashboard" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
                  Advanced Analytics
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
              <div className="mt-6">
                {subjectPerformance.map((subject, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                      <span className="text-sm text-gray-500">{subject.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          subject.score >= 80 
                            ? "bg-green-500" 
                            : subject.score >= 65 
                            ? "bg-yellow-500" 
                            : "bg-red-500"
                        }`} 
                        style={{ width: `${subject.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Enrollments */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Enrollments</h2>
            <Link href="/admin/manage-students" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all students
            </Link>
          </div>
          <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEnrollments.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">{user.username}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt || '')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/manage-students?id=${user.id}`} className="text-primary-600 hover:text-primary-900">
                        View Profile
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}

                {recentEnrollments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                      No recent enrollments
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
            <Link href="/admin/session-schedule" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all sessions
            </Link>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {scheduledSessions.map(session => {
              const sessionDate = new Date(session.sessionDate);
              const timeString = sessionDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              const dateString = sessionDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
              
              const student = users.find(u => u.id === session.userId);
              const instructor = users.find(u => u.id === session.instructorId);
              
              return (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">{session.title}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {session.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{session.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span>{dateString}, {timeString}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span>{session.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Student:</span>
                        <span>{student?.name || 'Group Session'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Instructor:</span>
                        <span>{instructor?.name || 'Not assigned'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Link href={`/admin/session-schedule?id=${session.id}`}>
                        <Button variant="outline" size="sm">
                          Manage Session
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {scheduledSessions.length === 0 && (
              <div className="col-span-3 text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No upcoming sessions scheduled</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
