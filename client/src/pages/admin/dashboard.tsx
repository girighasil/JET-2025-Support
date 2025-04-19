import { Layout } from '@/components/ui/layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Calendar,
  BarChart2,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Fetch overall analytics - only for admin users
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['/api/analytics/overall'],
    enabled: !!user && user.role === 'admin', // Only enable for admin users
  });
  
  // Fetch recent enrollments for the table
  const { data: recentEnrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/enrollments'],
    enabled: !!user,
  });
  
  // Fetch upcoming sessions
  const { data: sessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/doubt-sessions'],
    enabled: !!user,
  });
  
  // Table columns for recent enrollments
  const enrollmentColumns = [
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
              {row.original.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{row.original.student}</span>
              <span className="text-xs text-gray-500">{row.original.email}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'enrolled',
      header: 'Registered On',
      cell: ({ row }: any) => {
        return format(new Date(row.original.registered), 'MMM d, yyyy');
      }
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        return (
          <a href={`/admin/manage-students?id=${row.original.id}`} className="text-primary hover:underline">
            View Profile
          </a>
        );
      }
    }
  ];
  
  // Mock recent enrollments data (would come from API)
  const recentEnrollmentsData = [
    {
      id: 1,
      student: 'SU',
      email: 'student@mathsmagictown.com',
      registered: '2025-04-15T10:00:00',
      username: 'student'
    }
  ];
  
  // Upcoming session data with processed values
  const upcomingSessions = sessions
    .filter((session: any) => session.status === 'pending' || session.status === 'confirmed')
    .slice(0, 3);

  return (
    <Layout
      title="Dashboard"
      description="Manage courses, students, and track platform analytics."
      rightContent={
        user?.role === 'admin' && (
          <Button asChild className="flex items-center gap-2">
            <a href="/admin/analytics-dashboard">
              <BarChart2 className="h-4 w-4" />
              Advanced Analytics
            </a>
          </Button>
        )
      }
    >
      {/* Platform Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {user?.role === 'admin' ? (
          isAnalyticsLoading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : analytics ? (
            <>
              <StatsCard
                title="Total Students"
                value={analytics.counts.users}
                icon={Users}
                actionLink={{ href: "/admin/manage-students", text: "View all students" }}
                iconVariant="info"
              />
              
              <StatsCard
                title="Active Courses"
                value={analytics.counts.courses}
                icon={BookOpen}
                actionLink={{ href: "/admin/manage-courses", text: "Manage courses" }}
                iconVariant="success"
              />
              
              <StatsCard
                title="Tests Created"
                value={analytics.counts.tests}
                icon={FileText}
                actionLink={{ href: "/admin/manage-tests", text: "Manage tests" }}
                iconVariant="warning"
              />
              
              <StatsCard
                title="Scheduled Sessions"
                value={analytics.counts.sessions}
                icon={Calendar}
                actionLink={{ href: "/admin/session-schedule", text: "View schedule" }}
                iconVariant="error"
              />
            </>
          ) : (
            <div className="col-span-4 text-center p-8 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">No analytics data available</p>
            </div>
          )
        ) : (
          <>
            <StatsCard
              title="Manage Students"
              value=""
              icon={Users}
              actionLink={{ href: "/admin/manage-students", text: "View all students" }}
              iconVariant="info"
            />
            
            <StatsCard
              title="Manage Courses"
              value=""
              icon={BookOpen}
              actionLink={{ href: "/admin/manage-courses", text: "Manage courses" }}
              iconVariant="success"
            />
            
            <StatsCard
              title="Manage Tests"
              value=""
              icon={FileText}
              actionLink={{ href: "/admin/manage-tests", text: "Manage tests" }}
              iconVariant="warning"
            />
            
            <StatsCard
              title="Schedule Sessions"
              value=""
              icon={Calendar}
              actionLink={{ href: "/admin/session-schedule", text: "View schedule" }}
              iconVariant="error"
            />
          </>
        )}
      </div>
      
      {/* Analytics Charts - Only show for admin users */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Student Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Student Activity</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isAnalyticsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : analytics?.performanceOverTime ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.performanceOverTime}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month) - 1]}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="attemptCount"
                      name="Test Attempts"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="averageScore"
                      name="Avg. Score (%)"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Performance Overview Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Average test score by subject</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isAnalyticsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : analytics?.testPerformance ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Calculus", score: 78 },
                      { name: "Algebra", score: 82 },
                      { name: "Geometry", score: 65 },
                      { name: "Statistics", score: 71 }
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" name="Score (%)" fill="#fbbf24" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Recent Enrollments */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Enrollments</h2>
          <a href="/admin/manage-students" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            View all students
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        
        {isEnrollmentsLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <DataTable
            columns={enrollmentColumns}
            data={recentEnrollmentsData}
          />
        )}
      </div>
      
      {/* Upcoming Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Sessions</h2>
          <a href="/admin/session-schedule" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            View all sessions
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        
        {isSessionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : upcomingSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingSessions.map((session: any) => (
              <Card key={session.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-base">{session.topic}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      session.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{session.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {format(new Date(session.scheduledFor), 'MMM d, yyyy')} at{' '}
                        {format(new Date(session.scheduledFor), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>Student: {session.userId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                There are no scheduled doubt sessions at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
