import { useState } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Users,
  Trash,
  Pencil,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { format, isSameDay, parseISO, addHours, set } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

// Session schema
const sessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  teacherId: z.number({
    required_error: "Teacher is required"
  }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.date({
    required_error: "Date is required"
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  meetingLink: z.string().url('Please enter a valid URL'),
  maxParticipants: z.number().min(1, 'At least 1 participant is required'),
});

export default function SessionSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<any>(null);
  
  // Fetch sessions
  const { data: sessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ['/api/doubt-sessions'],
  });
  
  // Fetch teachers for the select input
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Filter to get only teachers
  const teachers = users.filter((user: any) => user.role === 'teacher' || user.role === 'admin');
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      // Format the data for API
      const formattedData = {
        ...data,
        // Combine date and time
        scheduledFor: new Date(
          data.date.getFullYear(),
          data.date.getMonth(),
          data.date.getDate(),
          ...data.startTime.split(':').map(Number)
        ).toISOString(),
      };
      
      const res = await apiRequest('POST', '/api/doubt-sessions', formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doubt-sessions'] });
      toast({
        title: 'Session Created',
        description: 'The doubt session has been scheduled successfully.',
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Schedule Session',
        description: error.message || 'There was an error scheduling the session.',
        variant: 'destructive',
      });
    }
  });
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      // Format the data for API
      const formattedData = {
        ...data,
        // Combine date and time
        scheduledFor: new Date(
          data.date.getFullYear(),
          data.date.getMonth(),
          data.date.getDate(),
          ...data.startTime.split(':').map(Number)
        ).toISOString(),
      };
      
      const res = await apiRequest('PUT', `/api/doubt-sessions/${id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doubt-sessions'] });
      toast({
        title: 'Session Updated',
        description: 'The doubt session has been updated successfully.',
      });
      setSelectedSession(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Session',
        description: error.message || 'There was an error updating the session.',
        variant: 'destructive',
      });
    }
  });
  
  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/doubt-sessions/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doubt-sessions'] });
      toast({
        title: 'Session Deleted',
        description: 'The doubt session has been deleted successfully.',
      });
      setDeleteConfirmSession(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Session',
        description: error.message || 'There was an error deleting the session.',
        variant: 'destructive',
      });
    }
  });
  
  // Form for creating/editing sessions
  const form = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: '',
      teacherId: undefined,
      description: '',
      date: new Date(),
      startTime: '14:00',
      duration: 60,
      meetingLink: '',
      maxParticipants: 20,
    },
  });
  
  // Handle form submission
  function onSubmit(values: z.infer<typeof sessionSchema>) {
    if (selectedSession) {
      // Update existing session
      updateSessionMutation.mutate({ id: selectedSession.id, data: values });
    } else {
      // Create new session
      createSessionMutation.mutate(values);
    }
  }
  
  // Filter sessions for the selected date
  const sessionsForSelectedDate = sessions.filter((session: any) => {
    return selectedDate && session.scheduledFor && 
      isSameDay(parseISO(session.scheduledFor), selectedDate);
  });
  
  // Handle edit session
  const handleEditSession = (session: any) => {
    // Parse the date and time from the scheduledFor string
    const sessionDate = parseISO(session.scheduledFor);
    const hours = sessionDate.getHours();
    const minutes = sessionDate.getMinutes();
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    form.reset({
      title: session.title,
      teacherId: session.teacherId,
      description: session.description,
      date: sessionDate,
      startTime: formattedTime,
      duration: session.duration,
      meetingLink: session.meetingLink,
      maxParticipants: session.maxParticipants,
    });
    
    setSelectedSession(session);
  };
  
  // Handle delete session
  const handleDeleteSession = () => {
    if (deleteConfirmSession) {
      deleteSessionMutation.mutate(deleteConfirmSession.id);
    }
  };
  
  // Helper to format time from date
  const formatTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'h:mm a');
  };
  
  // Helper to calculate end time
  const calculateEndTime = (dateString: string, durationMinutes: number) => {
    const date = parseISO(dateString);
    const endTime = addHours(date, durationMinutes / 60);
    return format(endTime, 'h:mm a');
  };
  
  const isPending = createSessionMutation.isPending || updateSessionMutation.isPending;
  const isLoading = isSessionsLoading || isUsersLoading;

  return (
    <Layout 
      title="Doubt Session Schedule" 
      description="Schedule and manage doubt clearing sessions"
      rightContent={
        <Dialog 
          open={isCreateDialogOpen || !!selectedSession} 
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setSelectedSession(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{selectedSession ? 'Edit Doubt Session' : 'Schedule New Doubt Session'}</DialogTitle>
              <DialogDescription>
                {selectedSession 
                  ? 'Update the details for this doubt clearing session.'
                  : 'Schedule a new doubt clearing session for students.'
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Math Doubt Clearing Session" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal flex justify-between"
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={15} 
                            step={15} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Participants</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher/Instructor</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher: any) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="meetingLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://meet.google.com/..." {...field} />
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
                          placeholder="Provide details about the session topics and what students should prepare..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setSelectedSession(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isPending}
                  >
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedSession ? 'Update Session' : 'Schedule Session'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Sessions'}
                </CardTitle>
                <CardDescription>
                  {sessionsForSelectedDate.length} 
                  {sessionsForSelectedDate.length === 1 ? ' session' : ' sessions'} scheduled
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Session
              </Button>
            </CardHeader>
            <CardContent>
              {sessionsForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {sessionsForSelectedDate.map((session: any) => (
                    <Card key={session.id} className="overflow-hidden">
                      <div className="bg-primary h-1" />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{session.title}</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatTime(session.scheduledFor)} - {calculateEndTime(session.scheduledFor, session.duration)}
                                </span>
                              </div>
                              <div className="hidden sm:block">•</div>
                              <div className="flex items-center gap-1">
                                <Video className="h-4 w-4" />
                                <span>
                                  Online Meeting
                                </span>
                              </div>
                            </div>
                            <p className="mt-3 text-sm line-clamp-2">{session.description}</p>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{session.participantCount || 0} / {session.maxParticipants}</span>
                              </Badge>
                              {session.status && (
                                <Badge className={session.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                  {session.status === 'upcoming' ? 'Upcoming' : 'In Progress'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSession(session)}
                              title="Edit Session"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmSession(session)}
                              title="Delete Session"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions scheduled</h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                    There are no doubt clearing sessions scheduled for this date.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Schedule Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmSession} onOpenChange={(open) => !open && setDeleteConfirmSession(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the session 
              <span className="font-medium"> "{deleteConfirmSession?.title}"</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmSession(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSession}
              disabled={deleteSessionMutation.isPending}
            >
              {deleteSessionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}