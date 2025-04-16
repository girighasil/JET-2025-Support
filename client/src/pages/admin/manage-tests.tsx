import { useState } from 'react';
import { Layout } from '@/components/ui/layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash, 
  Clock, 
  Calendar,
  BookOpen,
  ArrowUpRight,
  BarChart2,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent
} from '@/components/ui/card';

export default function ManageTests() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [deleteConfirmTest, setDeleteConfirmTest] = useState<any>(null);
  
  // Fetch tests
  const { data: tests = [], isLoading: isTestsLoading } = useQuery({
    queryKey: ['/api/tests'],
  });
  
  // Fetch courses for reference
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['/api/courses'],
  });
  
  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/tests/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tests'] });
      toast({
        title: 'Test Deleted',
        description: 'The test has been deleted successfully.',
      });
      setDeleteConfirmTest(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Test',
        description: error.message || 'There was an error deleting the test.',
        variant: 'destructive',
      });
    }
  });
  
  // Table columns for tests
  const testColumns = [
    {
      accessorKey: 'title',
      header: 'Test Title',
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="font-medium">{row.getValue('title')}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'courseId',
      header: 'Course',
      cell: ({ row }: any) => {
        const courseId = row.getValue('courseId');
        const course = courses.find((c: any) => c.id === courseId);
        
        return courseId ? (
          <Badge variant="outline" className="whitespace-nowrap">
            {course ? course.title : `Course #${courseId}`}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No course</span>
        );
      }
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }: any) => {
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{row.getValue('duration')} min</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'scheduledFor',
      header: 'Schedule',
      cell: ({ row }: any) => {
        const date = row.getValue('scheduledFor');
        return date ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(date), 'MMM d, yyyy')}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not scheduled</span>
        );
      }
    },
    {
      accessorKey: 'creatorName',
      header: 'Created By',
      cell: ({ row }: any) => {
        const creatorName = row.getValue('creatorName');
        return (
          <div className="flex items-center">
            <span className="font-medium">{creatorName || "Unknown"}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => {
        return row.getValue('isActive') ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Inactive
          </Badge>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        const test = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/test-creator/${test.id}`)}
              title="Edit Test"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteConfirmTest(test)}
              title="Delete Test"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/analytics/test/${test.id}`)}
              title="View Analytics"
            >
              <BarChart2 className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
        );
      }
    },
  ];
  
  // Handle creating a new test
  const handleCreateTest = () => {
    navigate('/admin/test-creator');
  };
  
  // Handle test deletion
  const handleDeleteTest = () => {
    if (deleteConfirmTest) {
      deleteTestMutation.mutate(deleteConfirmTest.id);
    }
  };
  
  // Check if tests are grouped by courses
  const isLoading = isTestsLoading || isCoursesLoading;

  return (
    <Layout 
      title="Manage Tests" 
      description="Create, edit, and manage tests for students"
      rightContent={
        <Button onClick={handleCreateTest} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Test
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-[600px] w-full" />
      ) : tests.length > 0 ? (
        <DataTable 
          columns={testColumns} 
          data={tests} 
          searchable={true}
          searchPlaceholder="Search tests..."
        />
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tests created yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Create your first test to assess student knowledge and track their progress.
            </p>
            <Button onClick={handleCreateTest} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Test
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmTest} onOpenChange={(open) => !open && setDeleteConfirmTest(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the test 
              <span className="font-medium"> "{deleteConfirmTest?.title}"</span>?
              This action cannot be undone and will delete all associated questions and student attempts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmTest(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTest}
              disabled={deleteTestMutation.isPending}
            >
              {deleteTestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
