import { useState } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, HelpCircle, User, Plus } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';

// Form schema for booking a doubt session
const sessionSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  scheduledFor: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date and time',
  }),
});

export default function StudentDoubts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Fetch doubt sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/doubt-sessions'],
  });
  
  // Create a new doubt session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: z.infer<typeof sessionSchema>) => {
      const res = await apiRequest('POST', '/api/doubt-sessions', sessionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doubt-sessions'] });
      toast({
        title: 'Session Scheduled',
        description: 'Your doubt session has been scheduled successfully.',
      });
      setShowBookingForm(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Schedule Session',
        description: error.message || 'There was an error scheduling your session.',
        variant: 'destructive',
      });
    }
  });
  
  // Cancel a doubt session mutation
  const cancelSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const res = await apiRequest('PUT', `/api/doubt-sessions/${sessionId}`, {
        status: 'cancelled'
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doubt-sessions'] });
      toast({
        title: 'Session Cancelled',
        description: 'Your doubt session has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Cancel Session',
        description: error.message || 'There was an error cancelling your session.',
        variant: 'destructive',
      });
    }
  });

  // Form handling
  const form = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      topic: '',
      description: '',
      scheduledFor: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof sessionSchema>) {
    // Convert scheduledFor string to Date object before submitting
    createSessionMutation.mutate({
      ...values,
      scheduledFor: new Date(values.scheduledFor).toISOString()
    });
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout 
      title="Doubt Sessions" 
      description="Schedule and manage your doubt sessions with teachers"
      rightContent={
        <Button 
          onClick={() => setShowBookingForm(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Schedule New Session
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session: any) => (
            <Card key={session.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{session.topic}</CardTitle>
                  <Badge className={getStatusColor(session.status)}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{session.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {format(new Date(session.scheduledFor), 'MMMM d, yyyy')} at{' '}
                        {format(new Date(session.scheduledFor), 'h:mm a')}
                      </span>
                    </div>
                    
                    {session.teacherId && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>Teacher assigned</span>
                      </div>
                    )}
                  </div>
                  
                  {session.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => cancelSessionMutation.mutate(session.id)}
                      disabled={cancelSessionMutation.isPending}
                    >
                      Cancel Session
                    </Button>
                  )}
                  
                  {session.status === 'confirmed' && (
                    <div className="flex flex-col mt-2 p-3 bg-blue-50 rounded-md text-sm">
                      <p className="font-medium text-blue-800">Your session has been confirmed!</p>
                      <p className="text-blue-700 mt-1">Be ready at the scheduled time. A link to join will be provided 15 minutes before the session.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white rounded-lg shadow-sm border border-border p-6">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doubt sessions yet</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              Schedule a doubt session with our teachers to get personalized help with topics you're struggling with.
            </p>
            <Button 
              onClick={() => setShowBookingForm(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Schedule a Doubt Session
            </Button>
          </div>
        </Card>
      )}
      
      {/* Schedule Session Dialog */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule a Doubt Session</DialogTitle>
            <DialogDescription>
              Book a session with our teachers to get help with your doubts.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the topic you need help with" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your doubt in detail..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="scheduledFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? 'Scheduling...' : 'Schedule Session'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
