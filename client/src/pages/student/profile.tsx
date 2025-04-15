import { useState } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/ui/user-avatar';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CalendarClock, 
  GraduationCap, 
  Clock, 
  FileText, 
  Loader2, 
  Mail, 
  User, 
  Shield
} from 'lucide-react';

// Form schema for profile update
const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

// Form schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function StudentProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch student analytics/progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/analytics/student-progress'],
    enabled: !!user,
  });
  
  // Fetch completed tests
  const { data: testAttempts = [], isLoading: testsLoading } = useQuery({
    queryKey: ['/api/test-attempts'],
    enabled: !!user,
  });
  
  // Profile update form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
    },
  });
  
  // Password change form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: z.infer<typeof profileSchema>) => {
      const res = await apiRequest('PUT', `/api/users/${user?.id}`, profileData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update your profile.',
        variant: 'destructive',
      });
    }
  });
  
  // Password change mutation (note: this would need to be implemented on the server)
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: z.infer<typeof passwordSchema>) => {
      // This endpoint doesn't exist yet but would need to be implemented
      const res = await apiRequest('POST', '/api/auth/change-password', passwordData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'Your password has been changed successfully.',
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Password Change Failed',
        description: error.message || 'Failed to change your password.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle profile update
  function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    updateProfileMutation.mutate(values);
  }
  
  // Handle password change
  function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    changePasswordMutation.mutate(values);
  }
  
  // Loading state
  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  // Calculate completed tests
  const completedTests = testAttempts.filter((attempt: any) => attempt.status === 'completed');
  
  return (
    <Layout title="My Profile" description="View and manage your account settings">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Summary Card */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-4">
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <UserAvatar user={user} className="h-20 w-20 mb-4" />
                <h3 className="font-bold text-xl">{user?.fullName}</h3>
                <p className="text-gray-500 mb-2">{user?.email}</p>
                <Badge className="mt-1 inline-flex items-center text-xs font-medium bg-primary/10 text-primary rounded-full px-2.5 py-0.5">
                  <span className="capitalize">{user?.role}</span>
                </Badge>
                <div className="w-full mt-6 pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Username</span>
                    <span className="text-sm font-medium">{user?.username}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Joined</span>
                    <span className="text-sm font-medium">Apr 15, 2025</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Progress Stats Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Learning Statistics</CardTitle>
                <CardDescription>Your achievements and progress</CardDescription>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-50">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Course Completion</span>
                          <span className="text-sm font-medium">{progress?.courseProgress || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${progress?.courseProgress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-green-50">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Test Performance</span>
                          <span className="text-sm font-medium">{progress?.testPerformance || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-600 rounded-full" 
                            style={{ width: `${progress?.testPerformance || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-amber-50">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Study Time (This Week)</span>
                          <span className="text-sm font-medium">{progress?.studyTimeThisWeek || 0} hours</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${Math.min((progress?.studyTimeThisWeek || 0) * 5, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-primary">{completedTests.length}</p>
                        <p className="text-sm text-gray-500">Tests Completed</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-primary">0</p>
                        <p className="text-sm text-gray-500">Certificates Earned</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Activity Card */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest actions and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testsLoading ? (
                    <>
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </>
                  ) : completedTests.length > 0 ? (
                    completedTests.slice(0, 5).map((test: any) => (
                      <div key={test.id} className="flex items-start p-3 border border-border rounded-lg">
                        <div className="p-2 bg-blue-50 rounded-full mr-3">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">Completed a test</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(test.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            You scored {test.score}% on the test
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarClock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No recent activity</h3>
                      <p className="text-sm text-gray-500">
                        Your recent activities will appear here
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Profile Settings Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="md:w-1/4 flex flex-col items-center">
                      <UserAvatar user={user} className="h-24 w-24 mb-4" />
                      <Button variant="outline" className="w-full" disabled>
                        Change Avatar
                      </Button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Avatar changes are currently disabled
                      </p>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <Input
                                  placeholder="Your full name"
                                  {...field}
                                  disabled={!isEditing}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                <Input
                                  type="email"
                                  placeholder="your.email@example.com"
                                  {...field}
                                  disabled={!isEditing}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save Changes
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            type="button" 
                            onClick={() => setIsEditing(true)}
                          >
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to maintain account security</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-gray-400 mr-2" />
                            <Input
                              type="password"
                              placeholder="Enter your current password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-gray-400 mr-2" />
                            <Input
                              type="password"
                              placeholder="Enter a new password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-gray-400 mr-2" />
                            <Input
                              type="password"
                              placeholder="Confirm your new password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-2">
                    <Button 
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="mt-2"
                    >
                      {changePasswordMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Change Password
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Essential account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <div>
                    <h4 className="font-medium">Username</h4>
                    <p className="text-sm text-gray-500">Your unique identifier</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{user?.username}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <div>
                    <h4 className="font-medium">Account Type</h4>
                    <p className="text-sm text-gray-500">Your role in the platform</p>
                  </div>
                  <div className="text-right">
                    <Badge className="capitalize">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Account Status</h4>
                    <p className="text-sm text-gray-500">Your current status</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

// Badge component since it was not in the existing code
function Badge({ children, className, variant = "default" }: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: "default" | "outline";
}) {
  return (
    <span 
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        variant === "default" ? "bg-primary text-white" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}
