import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// User type definition
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

// Register data interface
export interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role?: 'admin' | 'teacher' | 'student';
}

// Create auth context
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to get session state
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: 'include',
        });
        if (res.status === 401) {
          return null;
        }
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        console.error('Auth session error:', error);
        return null;
      }
    },
  });

  // Update user state when data changes
  useEffect(() => {
    if (data) {
      setUser(data);
    } else {
      setUser(null);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/login', { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(['/api/user'], data);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.fullName}!`,
      });
      
      // Redirect based on role
      if (data.role === 'student') {
        setLocation('/student/dashboard');
      } else {
        setLocation('/admin/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid username or password',
        variant: 'destructive',
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest('POST', '/api/register', userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Registration successful',
        description: 'You have been registered successfully. Please login.',
      });
      setLocation('/auth');
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to register. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout', {});
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries();
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  });

  // Login function
  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  // Register function
  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Auth context value
  const value = {
    user,
    isLoading,
    isError,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
