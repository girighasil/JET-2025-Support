import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, RegisterData } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Register form schema
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits')
    .regex(/^\+?[0-9]+$/, 'Mobile number must contain only digits and optionally a + prefix'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  fullName: z.string().min(2, 'Full name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function AuthForm() {
  const [activeTab, setActiveTab] = useState("login");
  const [isPending, setIsPending] = useState(false);
  const { login, register } = useAuth();
  
  // Derived state to check if we're on the login tab
  const isLogin = activeTab === "login";

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
  });

  // Handle login submission
  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setIsPending(true);
    try {
      await login(values.username, values.password);
    } finally {
      setIsPending(false);
    }
  }

  // Handle register submission
  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    setIsPending(true);
    try {
      // Remove confirmPassword before sending to the API
      const { confirmPassword, ...registerData } = values;
      const userData: RegisterData = {
        ...registerData,
        role: 'student', // Default role for new registrations
      };
      await register(userData);
    } finally {
      setIsPending(false);
    }
  }

  // Demo login handlers
  const handleDemoLogin = (role: string) => {
    let username = '';
    let password = '';

    switch (role) {
      case 'admin':
        username = 'admin';
        password = 'admin123';
        break;
      case 'teacher':
        username = 'teacher';
        password = 'teacher123';
        break;
      case 'student':
        username = 'student';
        password = 'student123';
        break;
    }

    if (username && password) {
      loginForm.setValue('username', username);
      loginForm.setValue('password', password);
      onLoginSubmit({ username, password });
    }
  };

  // Function to handle tab changes
  const handleTabChange = (value: string) => {
    // Reset form fields when switching tabs
    if (value === 'login') {
      registerForm.reset({
        username: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: '',
        fullName: '',
      });
    } else {
      loginForm.reset({
        username: '',
        password: '',
      });
    }
    
    // Update the active tab
    setActiveTab(value);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <Tabs defaultValue="login" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </Form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Demo accounts</span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => handleDemoLogin('admin')}>
                  Admin Login
                </Button>
                <Button variant="outline" onClick={() => handleDemoLogin('teacher')}>
                  Teacher Login
                </Button>
                <Button variant="outline" onClick={() => handleDemoLogin('student')}>
                  Student Login
                </Button>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="register">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create a new account to start learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Register
                </Button>
              </form>
            </Form>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-center border-t p-4">
        <p className="text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => handleTabChange(isLogin ? "register" : "login")}
            className="text-primary hover:underline"
            type="button"
          >
            {isLogin ? "Register now" : "Sign in"}
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}
