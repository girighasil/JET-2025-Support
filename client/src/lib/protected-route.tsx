import { ReactElement } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  roles?: string[];
}

export function ProtectedRoute({ component: Component, roles, ...rest }: ProtectedRouteProps): ReactElement {
  const { user, isLoading } = useAuth();
  
  // Show loading spinner while auth state is loading
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  // Check role authorization if roles are specified
  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'student') {
      return <Redirect to="/student/dashboard" />;
    } else {
      return <Redirect to="/admin/dashboard" />;
    }
  }
  
  // Render the protected component
  return <Component {...rest} />;
}
