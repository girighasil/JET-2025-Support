import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, PlusCircle, Edit, Trash, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, isAfter, isBefore } from 'date-fns';

// Type for promo banners from API
type PromoBanner = {
  id: number;
  text: string;
  url?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

// Schema for creating/editing promo banners
const promoBannerSchema = z.object({
  text: z.string().min(5, 'Announcement text must be at least 5 characters'),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(1, 'Order must be at least 1'),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

export default function PromotionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [deletingBannerId, setDeletingBannerId] = useState<number | null>(null);

  // Fetch promotional banners
  const { data: banners = [], isLoading } = useQuery<PromoBanner[]>({
    queryKey: ['/api/admin/promo-banners'],
    staleTime: 60000,
  });

  // Form for creating/editing banners
  const form = useForm<z.infer<typeof promoBannerSchema>>({
    resolver: zodResolver(promoBannerSchema),
    defaultValues: {
      text: '',
      url: '',
      isActive: true,
      order: 1,
      startDate: '',
      endDate: '',
    },
  });

  // Create banner mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof promoBannerSchema>) => {
      return apiRequest('POST', '/api/admin/promo-banners', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-banners'] });
      toast({
        title: 'Success',
        description: 'Promotional banner added successfully',
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to add promotional banner',
        variant: 'destructive',
      });
    },
  });

  // Update banner mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof promoBannerSchema> }) => {
      return apiRequest('PUT', `/api/admin/promo-banners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-banners'] });
      toast({
        title: 'Success',
        description: 'Promotional banner updated successfully',
      });
      setEditingBanner(null);
      form.reset();
    },
    onError: (error) => {
      console.error('Error updating banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to update promotional banner',
        variant: 'destructive',
      });
    },
  });

  // Delete banner mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/promo-banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-banners'] });
      toast({
        title: 'Success',
        description: 'Promotional banner deleted successfully',
      });
      setDeletingBannerId(null);
    },
    onError: (error) => {
      console.error('Error deleting banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete promotional banner',
        variant: 'destructive',
      });
    },
  });

  // Toggle banner active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest('PUT', `/api/admin/promo-banners/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-banners'] });
    },
    onError: (error) => {
      console.error('Error toggling banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to update banner status',
        variant: 'destructive',
      });
    },
  });

  // Handle create/edit form submission
  const onSubmit = (data: z.infer<typeof promoBannerSchema>) => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Edit a banner
  const handleEdit = (banner: PromoBanner) => {
    setEditingBanner(banner);
    form.reset({
      text: banner.text,
      url: banner.url || '',
      isActive: banner.isActive,
      order: banner.order,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
    });
  };

  // Check if a banner is expired
  const isBannerExpired = (banner: PromoBanner) => {
    if (!banner.endDate) return false;
    return isBefore(new Date(banner.endDate), new Date());
  };

  // Check if a banner is scheduled for future
  const isBannerScheduled = (banner: PromoBanner) => {
    if (!banner.startDate) return false;
    return isAfter(new Date(banner.startDate), new Date());
  };

  // Get banner status badge
  const getBannerStatusBadge = (banner: PromoBanner) => {
    if (!banner.isActive) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-500">
          Inactive
        </Badge>
      );
    }
    
    if (isBannerExpired(banner)) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-700">
          Expired
        </Badge>
      );
    }
    
    if (isBannerScheduled(banner)) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-700">
          Scheduled
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-green-100 text-green-700">
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Promotional Banners</h1>
          <p className="text-muted-foreground mt-1">
            Manage announcements and promotional messages displayed at the top of the website
          </p>
        </div>
        <Button 
          onClick={() => {
            form.reset({
              text: '',
              url: '',
              isActive: true,
              order: banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 1,
              startDate: '',
              endDate: '',
            });
            setIsAddDialogOpen(true);
          }}
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No promotional banners found</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Create your first promotional banner to display important announcements and updates to your users.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                Create Banner
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-md shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {banners.sort((a, b) => a.order - b.order).map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                      {banner.order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md truncate" title={banner.text}>
                        {banner.text}
                      </div>
                      {banner.url && (
                        <a 
                          href={banner.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 block"
                        >
                          {banner.url}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getBannerStatusBadge(banner)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Switch 
                        checked={banner.isActive} 
                        onCheckedChange={(checked) => {
                          toggleActiveMutation.mutate({ id: banner.id, isActive: checked });
                        }} 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {banner.startDate && (
                        <div className="text-gray-600">
                          From: {format(new Date(banner.startDate), 'MMM d, yyyy')}
                        </div>
                      )}
                      {banner.endDate && (
                        <div className="text-gray-600">
                          To: {format(new Date(banner.endDate), 'MMM d, yyyy')}
                        </div>
                      )}
                      {!banner.startDate && !banner.endDate && (
                        <span className="text-gray-500">No date restriction</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(banner)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingBannerId(banner.id)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Banner Dialog */}
      <Dialog 
        open={isAddDialogOpen || editingBanner !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingBanner(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
            <DialogDescription>
              {editingBanner 
                ? 'Update the promotional banner information.' 
                : 'Create a new promotional banner to display on the website.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Announcement Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the announcement text..." 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      This text will be displayed in the promotional banner.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/details" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional link when users click on the banner.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Lower numbers appear first.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Display this banner on the website
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When to start showing the banner
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When to stop showing the banner
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingBanner(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingBanner ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingBanner ? 'Update Banner' : 'Create Banner'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deletingBannerId !== null} 
        onOpenChange={(open) => !open && setDeletingBannerId(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this promotional banner? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeletingBannerId(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingBannerId !== null) {
                  deleteMutation.mutate(deletingBannerId);
                }
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete Banner</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}