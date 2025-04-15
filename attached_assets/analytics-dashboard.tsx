import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2, Users, BookOpen, FileText, Calendar, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

type DashboardCounts = {
  users: number;
  courses: number;
  tests: number;
  sessions: number;
  testAttempts: number;
};

type TestPerformance = {
  averageScore: number;
  totalAttempts: number;
  scoresByType: Array<{
    type: string;
    averageScore: number;
    attemptCount: number;
  }>;
};

type CourseEnrollment = {
  courseId: number;
  courseName: string;
  enrollmentCount: number;
};

type PerformanceData = {
  month: string;
  averageScore: number;
  attemptCount: number;
};

type AnalyticsData = {
  counts: DashboardCounts;
  testPerformance: TestPerformance;
  enrollmentData: CourseEnrollment[];
  performanceOverTime: PerformanceData[];
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const typeLabels: Record<string, string> = {
  mcq: "Multiple Choice",
  truefalse: "True/False",
  fillblank: "Fill in the Blank",
  subjective: "Descriptive",
};

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-destructive">Failed to load analytics data</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and user engagement
          </p>
        </div>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Test Performance</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.counts.users}</div>
                <p className="text-xs text-muted-foreground">Registered platform users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.counts.courses}</div>
                <p className="text-xs text-muted-foreground">Available courses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.counts.tests}</div>
                <p className="text-xs text-muted-foreground">Created assessments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interactive Sessions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.counts.sessions}</div>
                <p className="text-xs text-muted-foreground">Live classes and discussions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Test Completion Overview</CardTitle>
                <CardDescription>
                  Analysis of test attempts and completion rates
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed Tests', value: analytics.testPerformance.totalAttempts },
                          { name: 'Pending Tests', value: analytics.counts.testAttempts - analytics.testPerformance.totalAttempts },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Total {analytics.counts.testAttempts} test attempts with {analytics.testPerformance.totalAttempts} completions
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Performance</CardTitle>
                <CardDescription>
                  Score distribution by question type
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.testPerformance.scoresByType.map(item => ({
                        type: typeLabels[item.type] || item.type,
                        score: item.averageScore.toFixed(1),
                        count: item.attemptCount
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#8884d8" name="Avg. Score (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Avg. Score</span>
                    <span className="text-sm font-medium">{analytics.testPerformance.averageScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.testPerformance.averageScore} className="h-2" />
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Performance by Type</CardTitle>
              <CardDescription>
                Detailed breakdown of performance across different question formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.testPerformance.scoresByType.map(item => ({
                      type: typeLabels[item.type] || item.type,
                      score: item.averageScore.toFixed(1),
                      count: item.attemptCount
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="score" fill="#8884d8" name="Avg. Score (%)" />
                    <Bar yAxisId="right" dataKey="count" fill="#82ca9d" name="Number of Attempts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>
                  Comparative analysis of performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.testPerformance.scoresByType.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{typeLabels[item.type] || item.type}</span>
                        <span className="text-sm font-medium">{item.averageScore.toFixed(1)}%</span>
                      </div>
                      <Progress value={item.averageScore} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        Based on {item.attemptCount} attempts
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Higher scores indicate better performance
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mastery Achievement</CardTitle>
                <CardDescription>
                  Student achievement of mastery levels
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Excellence (90%+)', value: 10 },
                          { name: 'Proficient (70-89%)', value: 25 },
                          { name: 'Developing (50-69%)', value: 35 },
                          { name: 'Needs Improvement (<50%)', value: 30 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Distribution of student achievement levels across all tests
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollment Statistics</CardTitle>
              <CardDescription>
                Distribution of students across courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.enrollmentData
                      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
                      .map(item => ({
                        course: item.courseName,
                        students: item.enrollmentCount,
                      }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="course" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill="#8884d8" name="Number of Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Popular Courses</CardTitle>
                <CardDescription>Top courses by enrollment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {analytics.enrollmentData
                    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
                    .slice(0, 5)
                    .map((course, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{course.courseName}</span>
                          <span className="font-medium">{course.enrollmentCount} students</span>
                        </div>
                        <Progress
                          value={
                            (course.enrollmentCount /
                              Math.max(
                                ...analytics.enrollmentData.map(c => c.enrollmentCount)
                              )) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Based on total enrollments across all courses
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Distribution</CardTitle>
                <CardDescription>
                  Student distribution across course subjects
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.enrollmentData
                          .filter(course => course.enrollmentCount > 0)
                          .map((course) => ({
                            name: course.courseName,
                            value: course.enrollmentCount,
                          }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {analytics.enrollmentData
                          .filter(course => course.enrollmentCount > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Percentage breakdown of students by course
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends Over Time</CardTitle>
              <CardDescription>
                Student performance metrics tracked by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.performanceOverTime.map(item => ({
                      month: formatMonthLabel(item.month),
                      score: item.averageScore.toFixed(1),
                      attempts: item.attemptCount
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Avg. Score (%)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="attempts"
                      stroke="#82ca9d"
                      name="Number of Attempts"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>
                  Platform engagement and activity levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Test Completion Rate</span>
                      <span className="text-sm font-medium">
                        {analytics.counts.testAttempts > 0
                          ? (
                              (analytics.testPerformance.totalAttempts /
                                analytics.counts.testAttempts) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        analytics.counts.testAttempts > 0
                          ? (analytics.testPerformance.totalAttempts /
                              analytics.counts.testAttempts) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Course Enrollment Rate</span>
                      <span className="text-sm font-medium">
                        {analytics.counts.users > 0 && analytics.enrollmentData.length > 0
                          ? (
                              (analytics.enrollmentData.reduce(
                                (acc, curr) => acc + curr.enrollmentCount,
                                0
                              ) /
                                (analytics.counts.users * analytics.counts.courses)) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        analytics.counts.users > 0 && analytics.enrollmentData.length > 0
                          ? (analytics.enrollmentData.reduce(
                              (acc, curr) => acc + curr.enrollmentCount,
                              0
                            ) /
                              (analytics.counts.users * analytics.counts.courses)) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sessions per User</span>
                      <span className="text-sm font-medium">
                        {analytics.counts.users > 0
                          ? (analytics.counts.sessions / analytics.counts.users).toFixed(1)
                          : 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        analytics.counts.users > 0
                          ? (analytics.counts.sessions / analytics.counts.users) * 20
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Higher values indicate better platform engagement
                </p>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
                <CardDescription>
                  Recent platform activity and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Key Insights</h3>
                    <Separator className="my-2" />
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Award className="h-4 w-4 mt-0.5 text-primary" />
                        <span>
                          {analytics.enrollmentData.length > 0
                            ? `"${
                                analytics.enrollmentData.sort(
                                  (a, b) => b.enrollmentCount - a.enrollmentCount
                                )[0].courseName
                              }" is the most popular course with ${
                                analytics.enrollmentData.sort(
                                  (a, b) => b.enrollmentCount - a.enrollmentCount
                                )[0].enrollmentCount
                              } students`
                            : "No course enrollment data available"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Award className="h-4 w-4 mt-0.5 text-primary" />
                        <span>
                          Overall average test score is{" "}
                          {analytics.testPerformance.averageScore.toFixed(1)}%
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Award className="h-4 w-4 mt-0.5 text-primary" />
                        <span>
                          {analytics.performanceOverTime.length > 1
                            ? `Performance trend is ${
                                analytics.performanceOverTime[
                                  analytics.performanceOverTime.length - 1
                                ].averageScore >
                                analytics.performanceOverTime[
                                  analytics.performanceOverTime.length - 2
                                ].averageScore
                                  ? "improving"
                                  : "declining"
                              } from previous period`
                            : "Not enough data to determine performance trend"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Award className="h-4 w-4 mt-0.5 text-primary" />
                        <span>
                          {analytics.testPerformance.scoresByType.length > 0
                            ? `Students perform best in ${
                                typeLabels[
                                  analytics.testPerformance.scoresByType.sort(
                                    (a, b) => b.averageScore - a.averageScore
                                  )[0].type
                                ]
                              } questions`
                            : "No question performance data available"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  Generate Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}