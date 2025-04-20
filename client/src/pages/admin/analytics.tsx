import { useState } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  BarChart2,
  PieChart,
  LineChart,
  TrendingUp,
  Users,
  BookOpen,
  ClipboardList,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Calendar
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { Link } from 'wouter';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Legend
} from 'recharts';

interface AnalyticsData {
  counts: {
    users: number;
    courses: number;
    tests: number;
    doubtSessions: number;
    testAttempts: number;
  };
  performance: {
    avgScore: number;
  };
}

// Secondary interface to handle potentially different response shapes
interface ServerAnalyticsData {
  counts: {
    users: number;
    courses: number;
    tests: number;
    sessions?: number;
    doubtSessions?: number;
    testAttempts: number;
  };
  performance?: {
    avgScore: number;
  };
  testPerformance?: {
    averageScore: number;
    totalAttempts: number;
    scoresByType: Array<{
      type: string;
      averageScore: number;
      attemptCount: number;
    }>;
  };
  enrollmentData?: Array<{
    courseId: number;
    courseName: string;
    enrollmentCount: number;
  }>;
  performanceOverTime?: Array<{
    month: string;
    averageScore: number;
    attemptCount: number;
  }>;
}

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('last30days');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery<ServerAnalyticsData>({
    queryKey: ['/api/analytics/overall'],
  });
  
  // Fetch course enrollment data
  const { data: enrollmentData, isLoading: isEnrollmentLoading } = useQuery({
    queryKey: ['/api/analytics/enrollments', timeRange],
  });
  
  // Fetch test performance data
  const { data: testPerformanceData, isLoading: isTestPerformanceLoading } = useQuery({
    queryKey: ['/api/analytics/test-performance', timeRange],
  });
  
  // Calculate time periods for dropdown
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'last7days':
        return 'Last 7 Days';
      case 'last30days':
        return 'Last 30 Days';
      case 'last3months':
        return 'Last 3 Months';
      case 'last6months':
        return 'Last 6 Months';
      case 'last12months':
        return 'Last 12 Months';
      default:
        return 'Last 30 Days';
    }
  };
  
  // Format date range for display
  const formatDateRange = () => {
    const endDate = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'last7days':
        startDate = subMonths(endDate, 0.25);
        break;
      case 'last30days':
        startDate = subMonths(endDate, 1);
        break;
      case 'last3months':
        startDate = subMonths(endDate, 3);
        break;
      case 'last6months':
        startDate = subMonths(endDate, 6);
        break;
      case 'last12months':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subMonths(endDate, 1);
    }
    
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };
  
  // Handle exporting data (placeholder)
  const handleExportData = () => {
    alert('This would download analytics data in CSV format');
  };
  
  const isLoading = isAnalyticsLoading || isEnrollmentLoading || isTestPerformanceLoading;
  
  // Mock or placeholder data if API hasn't been implemented yet
  const placeholderData = {
    counts: {
      users: 120,
      courses: 15,
      tests: 42,
      sessions: 28,
      testAttempts: 567
    },
    testPerformance: {
      averageScore: 72.5,
      totalAttempts: 567,
      scoresByType: [
        { type: 'Mathematics', averageScore: 68.2, attemptCount: 230 },
        { type: 'Physics', averageScore: 74.8, attemptCount: 185 },
        { type: 'Chemistry', averageScore: 77.3, attemptCount: 152 }
      ]
    },
    enrollmentData: [
      { courseId: 1, courseName: 'Advanced Mathematics', enrollmentCount: 42 },
      { courseId: 2, courseName: 'Physics for JEE', enrollmentCount: 38 },
      { courseId: 3, courseName: 'Chemistry Fundamentals', enrollmentCount: 35 },
      { courseId: 4, courseName: 'Complete JEE Preparation', enrollmentCount: 29 },
      { courseId: 5, courseName: 'Mathematics Basics', enrollmentCount: 24 }
    ],
    performanceOverTime: [
      { month: 'Jan', averageScore: 65, attemptCount: 42 },
      { month: 'Feb', averageScore: 68, attemptCount: 48 },
      { month: 'Mar', averageScore: 72, attemptCount: 53 },
      { month: 'Apr', averageScore: 70, attemptCount: 61 },
      { month: 'May', averageScore: 74, attemptCount: 57 },
      { month: 'Jun', averageScore: 75, attemptCount: 64 }
    ]
  };
  
  // Use actual data if available, otherwise use placeholder data
  const data = analyticsData || placeholderData;
  
  return (
    <Layout 
      title="Analytics" 
      description="View and analyze platform performance metrics"
      rightContent={
        <div className="flex items-center gap-3">
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={getTimeRangeLabel()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last3months">Last 3 Months</SelectItem>
              <SelectItem value="last6months">Last 6 Months</SelectItem>
              <SelectItem value="last12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[350px] w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 p-4 rounded-lg">
            <div>
              <h2 className="text-lg font-medium">Analytics Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                {formatDateRange()}
              </p>
            </div>
            <Link href="/admin/analytics-dashboard">
              <Button className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                View Detailed Dashboard
              </Button>
            </Link>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="font-normal text-xs">
                    Students
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-bold">{data.counts.users}</p>
                  <p className="text-xs text-muted-foreground mt-1">Registered users</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge variant="outline" className="font-normal text-xs">
                    Courses
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-bold">{data.counts.courses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active courses</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-amber-600" />
                  </div>
                  <Badge variant="outline" className="font-normal text-xs">
                    Tests
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-bold">{data.counts.tests}</p>
                  <p className="text-xs text-muted-foreground mt-1">Created tests</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="font-normal text-xs">
                    Sessions
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-bold">{data.counts.doubtSessions}</p>
                  <p className="text-xs text-muted-foreground mt-1">Doubt sessions</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-red-600" />
                  </div>
                  <Badge variant="outline" className="font-normal text-xs">
                    Attempts
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-bold">{data.counts.testAttempts}</p>
                  <p className="text-xs text-muted-foreground mt-1">Test attempts</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs 
            defaultValue="overview" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="enrollments">Course Enrollments</TabsTrigger>
              <TabsTrigger value="performance">Test Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Performance Over Time</CardTitle>
                    <CardDescription>Average scores across all tests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { month: 'Current Month', averageScore: data?.performance?.avgScore || 0, attemptCount: data?.counts?.testAttempts || 0 }
                          ]}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }} 
                            formatter={(value) => [`${value}%`, 'Average Score']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="averageScore" 
                            stroke="#0088FE" 
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Subject-wise Performance</CardTitle>
                    <CardDescription>Average scores by subject area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={[{ name: 'Overall Score', value: data?.performance?.avgScore || 0 }]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill={COLORS[0]} />
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => [
                              `${value} attempts`,
                              props.payload.type
                            ]}
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}
                          />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="enrollments">
              <Card>
                <CardHeader>
                  <CardTitle>Top Enrolled Courses</CardTitle>
                  <CardDescription>Most popular courses by enrollment count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={[{ courseName: 'No enrollment data available', enrollmentCount: 0 }]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis 
                          dataKey="courseName" 
                          axisLine={false} 
                          tickLine={false}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          label={{ value: 'Number of Enrollments', angle: -90, position: 'insideLeft' }} 
                        />
                        <Tooltip
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                          }}
                          formatter={(value) => [`${value} students`, 'Enrollments']}
                        />
                        <Bar 
                          dataKey="enrollmentCount" 
                          fill="#0088FE" 
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href="/admin/manage-courses">
                      <span className="flex items-center gap-1">
                        View All Courses
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Test Performance Analysis</CardTitle>
                  <CardDescription>Analysis of student performance in tests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-muted/30 rounded-xl p-5 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">Average Score</p>
                      <h3 className="text-3xl font-bold mt-1">{data?.performance?.avgScore.toFixed(1)}%</h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        Across all test attempts
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 rounded-xl p-5 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">Total Attempts</p>
                      <h3 className="text-3xl font-bold mt-1">{data?.counts?.testAttempts || 0}</h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        Test attempts in selected period
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 rounded-xl p-5 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <BarChart className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">Passing Rate</p>
                      <h3 className="text-3xl font-bold mt-1">78.3%</h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        Students achieving passing score
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Performance by Subject</h3>
                    <div className="space-y-4">
                      {/* Show just one performance summary using the overall average score */}
                      <div className="bg-card rounded-lg p-4 border">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">Overall Performance</div>
                          <Badge variant="outline">
                            {data?.counts?.testAttempts || 0} attempts
                          </Badge>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${data?.performance?.avgScore || 0}%`, 
                              backgroundColor: COLORS[0] 
                            }} 
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm">{(data?.performance?.avgScore || 0).toFixed(1)}% Average</div>
                          <div className="text-xs text-muted-foreground">
                            {(data?.performance?.avgScore || 0) > 75 ? 'High Performance' : 
                              (data?.performance?.avgScore || 0) > 60 ? 'Average Performance' : 'Needs Improvement'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href="/admin/manage-tests">
                      <span className="flex items-center gap-1">
                        View All Tests
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Layout>
  );
}