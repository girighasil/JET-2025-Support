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
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  ClipboardList,
  Clock,
  Check,
  X,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Calendar,
  AlertTriangle,
  Info,
  Zap,
  BrainCircuit
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { Link, useNavigate } from 'wouter';
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
  Legend,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF5252'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('last30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [, navigate] = useNavigate();
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard', timeRange],
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
  
  // Mock data based on the reference from the analytics component
  const mockData = {
    counts: {
      users: 120,
      activeUsers: 87,
      courses: 15,
      tests: 42,
      sessions: 28,
      testAttempts: 567
    },
    studentActivity: {
      dailyActiveUsers: [
        { date: '2023-01-01', count: 45 },
        { date: '2023-01-02', count: 52 },
        { date: '2023-01-03', count: 49 },
        { date: '2023-01-04', count: 63 },
        { date: '2023-01-05', count: 58 },
        { date: '2023-01-06', count: 41 },
        { date: '2023-01-07', count: 39 },
        { date: '2023-01-08', count: 47 },
        { date: '2023-01-09', count: 54 },
        { date: '2023-01-10', count: 62 },
        { date: '2023-01-11', count: 58 },
        { date: '2023-01-12', count: 65 },
        { date: '2023-01-13', count: 59 },
        { date: '2023-01-14', count: 47 }
      ],
      studyHours: [
        { date: '2023-01-01', hours: 123 },
        { date: '2023-01-02', hours: 145 },
        { date: '2023-01-03', hours: 132 },
        { date: '2023-01-04', hours: 167 },
        { date: '2023-01-05', hours: 178 },
        { date: '2023-01-06', hours: 129 },
        { date: '2023-01-07', hours: 103 },
        { date: '2023-01-08', hours: 127 },
        { date: '2023-01-09', hours: 149 },
        { date: '2023-01-10', hours: 162 },
        { date: '2023-01-11', hours: 156 },
        { date: '2023-01-12', hours: 170 },
        { date: '2023-01-13', hours: 159 },
        { date: '2023-01-14', hours: 131 }
      ]
    },
    testPerformance: {
      averageScore: 72.5,
      totalAttempts: 567,
      passingRate: 78.3,
      scoreDistribution: [
        { range: '0-20%', count: 12 },
        { range: '21-40%', count: 28 },
        { range: '41-60%', count: 83 },
        { range: '61-80%', count: 295 },
        { range: '81-100%', count: 149 }
      ],
      scoresByType: [
        { type: 'Mathematics', averageScore: 68.2, attemptCount: 230 },
        { type: 'Physics', averageScore: 74.8, attemptCount: 185 },
        { type: 'Chemistry', averageScore: 77.3, attemptCount: 152 }
      ],
      topPerformingTests: [
        { id: 1, title: 'Calculus Fundamentals', averageScore: 82.7, attempts: 89 },
        { id: 2, title: 'Organic Chemistry Basics', averageScore: 79.4, attempts: 67 },
        { id: 3, title: 'Mechanics', averageScore: 76.8, attempts: 72 },
        { id: 4, title: 'Algebra Practice', averageScore: 75.3, attempts: 94 },
        { id: 5, title: 'Periodic Table Quiz', averageScore: 74.1, attempts: 61 }
      ],
      lowPerformingTests: [
        { id: 6, title: 'Advanced Integration', averageScore: 59.2, attempts: 48 },
        { id: 7, title: 'Quantum Physics Intro', averageScore: 61.7, attempts: 39 },
        { id: 8, title: 'Chemical Bonding', averageScore: 62.5, attempts: 53 },
        { id: 9, title: 'Trigonometry Quiz', averageScore: 63.8, attempts: 72 },
        { id: 10, title: 'Thermodynamics', averageScore: 65.2, attempts: 58 }
      ]
    },
    courseEngagement: {
      topCourses: [
        { id: 1, title: 'Advanced Mathematics', enrollments: 42, completionRate: 68.5 },
        { id: 2, title: 'Physics for JEE', enrollments: 38, completionRate: 72.1 },
        { id: 3, title: 'Chemistry Fundamentals', enrollments: 35, completionRate: 74.6 },
        { id: 4, title: 'Complete JEE Preparation', enrollments: 29, completionRate: 65.3 },
        { id: 5, title: 'Mathematics Basics', enrollments: 24, completionRate: 81.2 }
      ],
      moduleCompletionRates: [
        { courseId: 1, moduleName: 'Calculus', completionRate: 75.2 },
        { courseId: 1, moduleName: 'Algebra', completionRate: 82.4 },
        { courseId: 1, moduleName: 'Trigonometry', completionRate: 68.9 },
        { courseId: 2, moduleName: 'Mechanics', completionRate: 78.3 },
        { courseId: 2, moduleName: 'Electromagnetism', completionRate: 72.1 },
        { courseId: 3, moduleName: 'Organic Chemistry', completionRate: 79.7 },
        { courseId: 3, moduleName: 'Inorganic Chemistry', completionRate: 71.5 }
      ]
    },
    doubtSessions: {
      sessionsOverTime: [
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: 15 },
        { month: 'Mar', count: 18 },
        { month: 'Apr', count: 22 },
        { month: 'May', count: 20 },
        { month: 'Jun', count: 24 }
      ],
      topSubjects: [
        { subject: 'Mathematics', sessions: 36 },
        { subject: 'Physics', sessions: 28 },
        { subject: 'Chemistry', sessions: 23 },
        { subject: 'Biology', sessions: 15 },
        { subject: 'Computer Science', sessions: 8 }
      ],
      averageRating: 4.6,
      averageDuration: 47
    },
    predictiveAnalytics: {
      areaOfImprovement: [
        { area: 'Calculus', studentCount: 42, averageScore: 61.3 },
        { area: 'Organic Chemistry', studentCount: 38, averageScore: 63.7 },
        { area: 'Electromagnetism', studentCount: 35, averageScore: 59.2 },
        { area: 'Thermodynamics', studentCount: 31, averageScore: 62.4 },
        { area: 'Wave Optics', studentCount: 28, averageScore: 60.8 }
      ],
      recommendedSessions: [
        { subject: 'Calculus - Integration Techniques', potentialStudents: 42 },
        { subject: 'Organic Chemistry - Reaction Mechanisms', potentialStudents: 38 },
        { subject: 'Physics - Electromagnetic Induction', potentialStudents: 35 },
        { subject: 'Physics - Heat Cycles', potentialStudents: 31 },
        { subject: 'Physics - Interference and Diffraction', potentialStudents: 28 }
      ],
      predictedPerformance: [
        { student: 'Rahul Sharma', id: 234, predictedScore: 82, confidence: 'high' },
        { student: 'Priya Patel', id: 157, predictedScore: 78, confidence: 'medium' },
        { student: 'Amit Kumar', id: 302, predictedScore: 65, confidence: 'medium' },
        { student: 'Deepa Singh', id: 189, predictedScore: 88, confidence: 'high' },
        { student: 'Vikram Mehta', id: 276, predictedScore: 73, confidence: 'low' }
      ]
    }
  };
  
  // Use the mock data for now
  const data = analyticsData || mockData;
  
  const isLoading = isAnalyticsLoading;

  return (
    <Layout 
      title="Analytics Dashboard" 
      description="Comprehensive analytics and insights about platform performance"
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
            Export Report
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
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/40 p-4 rounded-lg">
            <div>
              <h2 className="text-lg font-medium">Analytics Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                {formatDateRange()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={() => navigate('/admin/analytics')}
              >
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Return to Analytics
              </Button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{data.counts.users}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Users</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{data.counts.activeUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active Users</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{data.counts.courses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Courses</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{data.counts.tests}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tests</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{data.counts.sessions}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sessions</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{data.counts.testAttempts}</p>
                  <p className="text-xs text-muted-foreground mt-1">Test Attempts</p>
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
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Student Activity</TabsTrigger>
              <TabsTrigger value="courses">Course Engagement</TabsTrigger>
              <TabsTrigger value="tests">Test Performance</TabsTrigger>
              <TabsTrigger value="predictions">Predictive Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Active Users</CardTitle>
                    <CardDescription>Number of active students per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.studentActivity.dailyActiveUsers}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                          />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }} 
                            formatter={(value) => [value, 'Active Users']}
                            labelFormatter={(date) => format(new Date(date), 'dd MMM yyyy')}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#0088FE" 
                            fillOpacity={1} 
                            fill="url(#colorUsers)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Student Study Hours</CardTitle>
                    <CardDescription>Total platform study time per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.studentActivity.studyHours}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#00C49F" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                          />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }} 
                            formatter={(value) => [`${value} hours`, 'Study Time']}
                            labelFormatter={(date) => format(new Date(date), 'dd MMM yyyy')}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="hours" 
                            stroke="#00C49F" 
                            fillOpacity={1} 
                            fill="url(#colorHours)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Score Distribution</CardTitle>
                    <CardDescription>Distribution of test scores by percentage ranges</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={data.testPerformance.scoreDistribution}
                          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                          barCategoryGap={30}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis 
                            dataKey="range" 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }} 
                            formatter={(value) => [`${value} attempts`, 'Count']}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="#8884d8"
                            radius={[4, 4, 0, 0]}
                          >
                            {data.testPerformance.scoreDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Doubt Sessions by Subject</CardTitle>
                    <CardDescription>Number of doubt clearing sessions by subject area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={data.doubtSessions.topSubjects}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="sessions"
                            nameKey="subject"
                          >
                            {data.doubtSessions.topSubjects.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => [
                              `${value} sessions`,
                              props.payload.subject
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
            
            <TabsContent value="students">
              <div className="grid grid-cols-1 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Student Engagement</CardTitle>
                    <CardDescription>Trends in active user count and study hours over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={data.studentActivity.dailyActiveUsers.map((day, index) => ({
                            date: day.date,
                            users: day.count,
                            hours: data.studentActivity.studyHours[index]?.hours || 0
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                          />
                          <YAxis 
                            yAxisId="left" 
                            axisLine={false} 
                            tickLine={false} 
                            orientation="left" 
                            domain={[0, 'dataMax + 20']}
                          />
                          <YAxis 
                            yAxisId="right" 
                            axisLine={false} 
                            tickLine={false} 
                            orientation="right" 
                            domain={[0, 'dataMax + 50']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value, name) => [value, name === 'users' ? 'Active Users' : 'Study Hours']}
                            labelFormatter={(date) => format(new Date(date), 'EEEE, MMMM d, yyyy')}
                          />
                          <Legend />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="users" 
                            stroke="#0088FE" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                            name="Active Users"
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="hours" 
                            stroke="#00C49F" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                            name="Study Hours"
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Metrics</CardTitle>
                      <CardDescription>Key metrics about student engagement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex flex-col rounded-lg bg-muted/50 p-4">
                          <dt className="text-sm font-medium text-muted-foreground">Active Users Rate</dt>
                          <dd className="mt-1 text-3xl font-semibold text-primary">
                            {((data.counts.activeUsers / data.counts.users) * 100).toFixed(1)}%
                          </dd>
                          <dd className="mt-2 text-sm text-muted-foreground">
                            Of total registered users
                          </dd>
                        </div>
                        
                        <div className="flex flex-col rounded-lg bg-muted/50 p-4">
                          <dt className="text-sm font-medium text-muted-foreground">Avg. Study Session</dt>
                          <dd className="mt-1 text-3xl font-semibold text-primary">
                            47 min
                          </dd>
                          <dd className="mt-2 text-sm text-muted-foreground">
                            Per active student
                          </dd>
                        </div>
                        
                        <div className="flex flex-col rounded-lg bg-muted/50 p-4">
                          <dt className="text-sm font-medium text-muted-foreground">Course Completion</dt>
                          <dd className="mt-1 text-3xl font-semibold text-primary">
                            72.4%
                          </dd>
                          <dd className="mt-2 text-sm text-muted-foreground">
                            Average completion rate
                          </dd>
                        </div>
                        
                        <div className="flex flex-col rounded-lg bg-muted/50 p-4">
                          <dt className="text-sm font-medium text-muted-foreground">Retention Rate</dt>
                          <dd className="mt-1 text-3xl font-semibold text-primary">
                            83.6%
                          </dd>
                          <dd className="mt-2 text-sm text-muted-foreground">
                            Monthly retention
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Actions</CardTitle>
                      <CardDescription>Top recommended actions to improve engagement</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3 bg-muted/30 p-3 rounded-lg">
                          <div className="mt-1">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Low Engagement in Advanced Calculus Course</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Only 42% completion rate, compared to 72% platform average. Consider reviewing content difficulty.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 bg-muted/30 p-3 rounded-lg">
                          <div className="mt-1">
                            <Info className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Inactive User Segment Identified</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              28 students inactive for 2+ weeks. Consider targeted re-engagement campaign.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 bg-muted/30 p-3 rounded-lg">
                          <div className="mt-1">
                            <Zap className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">High Demand for Physics Sessions</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Physics doubt sessions consistently at 95% capacity. Consider adding more sessions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="courses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Courses by Enrollment</CardTitle>
                    <CardDescription>Most popular courses on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.courseEngagement.topCourses.map((course, i) => (
                        <div key={course.id} className="flex items-center">
                          <div className="w-8 text-center text-muted-foreground text-sm">
                            {i + 1}
                          </div>
                          <div className="flex-1 flex items-center">
                            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium truncate">{course.title}</h4>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {course.enrollments} enrollments
                                </span>
                                <span className="mx-2 text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {course.completionRate}% completion
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Badge variant={i < 2 ? "default" : "outline"}>
                              {i < 2 ? "Popular" : "Active"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Module Completion Rates</CardTitle>
                    <CardDescription>Completion rates for top course modules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={data.courseEngagement.moduleCompletionRates}
                          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                          layout="vertical"
                          barCategoryGap={10}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                          <XAxis 
                            type="number" 
                            axisLine={false} 
                            tickLine={false}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <YAxis 
                            type="category" 
                            dataKey="moduleName" 
                            axisLine={false} 
                            tickLine={false} 
                            width={120}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value) => [`${value}%`, 'Completion Rate']}
                          />
                          <Bar 
                            dataKey="completionRate" 
                            fill="#0088FE"
                            radius={[0, 4, 4, 0]}
                          >
                            {data.courseEngagement.moduleCompletionRates.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Course Engagement Analysis</CardTitle>
                  <CardDescription>Insights and recommendations for improving course engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold border-b pb-2">Key Insights</h3>
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Mathematics Basics</span> has the highest completion rate at 81.2%
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Complete JEE Preparation</span> has the lowest completion rate at 65.3%
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          <Info className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Trigonometry</span> module has the lowest completion rate among Mathematics modules
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold border-b pb-2">Recommendations</h3>
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm">
                            Simplify content in Advanced Mathematics course to improve completion rates
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm">
                            Add more practice problems to Trigonometry module to increase engagement
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm">
                            Break down the Complete JEE Preparation course into smaller, more focused modules
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold border-b pb-2">Content Quality Analysis</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Video Lessons</span>
                            <span className="font-medium">4.7/5</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }} />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Study Materials</span>
                            <span className="font-medium">4.5/5</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '90%' }} />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Interactive Elements</span>
                            <span className="font-medium">3.8/5</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '76%' }} />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Practice Questions</span>
                            <span className="font-medium">4.2/5</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '84%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tests">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Key performance indicators for tests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Average Score</p>
                            <p className="text-2xl font-bold mt-1">{data.testPerformance.averageScore}%</p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Across all {data.testPerformance.totalAttempts} attempts
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Passing Rate</p>
                            <p className="text-2xl font-bold mt-1">{data.testPerformance.passingRate}%</p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Students achieving passing score
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Completion Rate</p>
                            <p className="text-2xl font-bold mt-1">91.2%</p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <Check className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Tests completed vs. started
                        </div>
                      </div>
                      
                      <div className="bg-amber-50 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg. Time Spent</p>
                            <p className="text-2xl font-bold mt-1">42 min</p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-600" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Average time per test attempt
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Subject</CardTitle>
                    <CardDescription>Average scores by subject area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={data.testPerformance.scoresByType}
                          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                          barCategoryGap={40}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis 
                            dataKey="type" 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value) => [`${value}%`, 'Average Score']}
                          />
                          <Bar 
                            dataKey="averageScore" 
                            fill="#0088FE"
                            radius={[4, 4, 0, 0]}
                            barSize={50}
                          >
                            {data.testPerformance.scoresByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Tests</CardTitle>
                    <CardDescription>Tests with highest average scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.testPerformance.topPerformingTests.slice(0, 4).map((test, index) => (
                        <div key={test.id} className="flex items-center">
                          <div className="w-8 text-center text-muted-foreground text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{test.title}</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-muted-foreground">
                                {test.attempts} attempts
                              </span>
                              <span className="mx-2 text-muted-foreground">•</span>
                              <span className="text-xs text-green-600 font-medium">
                                {test.averageScore}% avg. score
                              </span>
                            </div>
                          </div>
                          <div>
                            <Badge className="bg-green-100 text-green-800">
                              High Score
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Tests Needing Attention</CardTitle>
                    <CardDescription>Tests with lower average scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.testPerformance.lowPerformingTests.slice(0, 4).map((test, index) => (
                        <div key={test.id} className="flex items-center">
                          <div className="w-8 text-center text-muted-foreground text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{test.title}</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-muted-foreground">
                                {test.attempts} attempts
                              </span>
                              <span className="mx-2 text-muted-foreground">•</span>
                              <span className="text-xs text-red-600 font-medium">
                                {test.averageScore}% avg. score
                              </span>
                            </div>
                          </div>
                          <div>
                            <Badge variant="outline" className="text-red-500 border-red-200">
                              Needs Review
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="predictions">
              <div className="grid grid-cols-1 gap-5 mb-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Predictive Analytics</CardTitle>
                      <CardDescription>AI-powered insights and predictions</CardDescription>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-4 rounded-lg mb-4 border border-amber-200">
                      <div className="flex items-start gap-3">
                        <div>
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">Predictive Insights Disclaimer</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            These analytics are based on AI predictions using historical data patterns. 
                            They should be used as guidance rather than definitive forecasts. Always 
                            combine these insights with your professional judgment.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-primary/5 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Areas Needing Focus</p>
                            <p className="text-2xl font-bold mt-1">5</p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Subjects with consistently low scores
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Predicted Improvement</p>
                            <p className="text-2xl font-bold mt-1">12.5%</p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Expected score increase with interventions
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">At-Risk Students</p>
                            <p className="text-2xl font-bold mt-1">24</p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                          Students needing additional support
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Areas Needing Improvement</CardTitle>
                    <CardDescription>Subjects with consistently lower performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.predictiveAnalytics.areaOfImprovement.map((area, i) => (
                        <div key={i} className="bg-card border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-medium">{area.area}</h4>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {area.studentCount} students
                                </span>
                                <span className="mx-2 text-muted-foreground">•</span>
                                <span className="text-xs text-red-600 font-medium">
                                  {area.averageScore}% avg. score
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-red-500 border-red-200">
                              Priority
                            </Badge>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Current Score</span>
                              <span className="font-medium">{area.averageScore}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 rounded-full" 
                                style={{ width: `${area.averageScore}%` }} 
                              />
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span>Target</span>
                              <span className="font-medium">75%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Sessions</CardTitle>
                    <CardDescription>AI-recommended doubt clearing sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.predictiveAnalytics.recommendedSessions.map((session, i) => (
                        <div key={i} className="bg-card border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{session.subject}</h4>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {session.potentialStudents} potential students
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="h-8">
                              Schedule
                            </Button>
                          </div>
                          <div className="mt-3 flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${(session.potentialStudents / 50) * 100}%` }} 
                                  />
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground ml-2">
                              {Math.round((session.potentialStudents / 50) * 100)}% interest
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Layout>
  );
}