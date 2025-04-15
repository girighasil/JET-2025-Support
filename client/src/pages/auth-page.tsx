import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'student') {
        setLocation('/student/dashboard');
      } else {
        setLocation('/admin/dashboard');
      }
    }
  }, [user, isLoading, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <header className="w-full py-6 bg-white border-b">
        <div className="container max-w-7xl mx-auto px-4 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
              M
            </div>
            <div>
              <h1 className="font-bold text-xl">Maths Magic Town</h1>
              <p className="text-xs text-gray-500">Personalized learning for competitive exam preparation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Maths Magic Town. All rights reserved.</p>
      </footer>
    </div>
  );
}
