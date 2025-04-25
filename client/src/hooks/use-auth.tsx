import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient, setLoggingOut } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { safeFetch } from "@/lib/safeFetch";

// User type definition
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "teacher" | "student";
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
  role?: "admin" | "teacher" | "student";
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
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      try {
        // Using our enhanced safeFetch utility
        return await safeFetch(queryKey[0] as string, { allowNotFound: true });
      } catch (error) {
        console.error("Auth session error:", error);
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
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      const res = await apiRequest("/api/login", "POST", {
        username,
        password,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.fullName}!`,
      });

      // Redirect based on role
      if (data.role === "student") {
        setLocation("/student/dashboard");
      } else {
        setLocation("/admin/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("/api/register", "POST", userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You have been registered successfully. Please login.",
      });
      setLocation("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/logout", "POST");
    },
    onSuccess: () => {
      // Clear user data
      setUser(null);

      // Clear user query data
      queryClient.setQueryData(["/api/user"], null);

      // Invalidate and remove all queries that require authentication
      queryClient.clear();

      // Optional: Instead of clear(), you could specifically invalidate known endpoints:
      // queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      // queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      // etc.
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message || "Something went wrong while logging out",
        variant: "destructive",
      });
    },
  });

  // Login function
  const login = async (username: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ username, password });
    } catch (error) {
      // Error is already handled by onError callback, no need to rethrow
      // This prevents the error from propagating up and showing the runtime error overlay
      console.error("Login error handled:", error);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      await registerMutation.mutateAsync(userData);
    } catch (error) {
      // Error is already handled by onError callback, no need to rethrow
      // This prevents the error from propagating up and showing the runtime error overlay
      console.error("Registration error handled:", error);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Set logging out flag to prevent 401 errors from showing
      setLoggingOut(true);

      // Execute the logout
      await logoutMutation.mutateAsync();

      // Clear all queries from the cache to prevent re-fetching with stale credentials
      queryClient.clear();

      // Reset the logging out flag immediately after successful logout
      setLoggingOut(false);

      // Show successful logout message
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });

      // Redirect to home page instead of auth page
      setLocation("/");
    } catch (error) {
      // Reset the logging out flag
      setLoggingOut(false);

      console.error("Logout error handled:", error);
    }
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
