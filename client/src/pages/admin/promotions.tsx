import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { usePromoBanners } from '@/hooks/use-site-config';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const promoFormSchema = z.object({
  text: z.string().min(5, 'Announcement text must be at least 5 characters'),
  url: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  order: z.number().int().min(1, 'Order must be a positive number').default(1),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});

type PromoFormValues = z.infer<typeof promoFormSchema>;

export default function PromotionsPage() {
  const { toast } = useToast();
  const { banners = [], createBanner, updateBanner, deleteBanner } = usePromoBanners();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any | null>(null);
  
  // Form for creating/editing announcements
  const form = useForm<PromoFormValues>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: {
      text: '',
      url: '',
      isActive: true,
      order: 1,
      startDate: null,
      endDate: null,
    },
  });
  
  // Open edit dialog and populate form with banner data
  const handleEditBanner = (banner: any) => {
    setSelectedBanner(banner);
    form.reset({
      text: banner.text,
      url: banner.url || '',
      isActive: banner.isActive,
      order: banner.order,
      startDate: banner.startDate ? new Date(banner.startDate) : null,
      endDate: banner.endDate ? new Date(banner.endDate) : null,
    });
    setIsEditDialogOpen(true);
  };
  
  // Reset form on dialog close
  const handleDialogClose = () => {
    setSelectedBanner(null);
    form.reset({
      text: '',
      url: '',
      isActive: true,
      order: 1,
      startDate: null,
      endDate: null,
    });
    setIsEditDialogOpen(false);
  };
  
  // Handle form submission for create/edit
  const onSubmit = async (data: PromoFormValues) => {
    try {
      console.log('Submitting form with data:', data);
      
      if (selectedBanner) {
        // Update existing banner
        console.log('Updating existing banner ID:', selectedBanner.id);
        await updateBanner.mutateAsync({
          id: selectedBanner.id,
          ...data,
        });
        console.log('Banner update successful');
        
        toast({
          title: 'Banner updated',
          description: 'The promotional banner has been updated successfully',
        });
      } else {
        // Create new banner
        console.log('Creating new banner');
        await createBanner.mutateAsync(data);
        console.log('Banner creation successful');
        
        toast({
          title: 'Banner created',
          description: 'A new promotional banner has been created successfully',
        });
      }
      handleDialogClose();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      // Log detailed error information for debugging
      if (error.message) console.error('Error message:', error.message);
      if (error.originalData) console.error('Original error data:', error.originalData);
      if (error.status) console.error('Status code:', error.status);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to save the promotional banner',
        variant: 'destructive',
      });
    }
  };
  
  // Handle banner deletion
  const handleDeleteBanner = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await deleteBanner.mutateAsync(id);
        toast({
          title: 'Banner deleted',
          description: 'The promotional banner has been deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting banner:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete the promotional banner',
          variant: 'destructive',
        });
      }
    }
  };
  
  // Format date for display
  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'PPP');
  };
  
  return (
    <div className="container mx-auto py-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Promotional Banners</h1>
          <p className="text-muted-foreground">
            Manage promotional announcements displayed on the homepage
          </p>
        </div>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedBanner(null)} className="flex items-center gap-1">
              <Plus size={16} />
              <span>New Banner</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedBanner ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
              <DialogDescription>
                {selectedBanner 
                  ? 'Update the promotional banner details below.' 
                  : 'Add a new promotional banner to be displayed on the homepage.'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Announcement Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter announcement text" {...field} />
                      </FormControl>
                      <FormDescription>
                        The text to display in the announcement banner
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
                      <FormLabel>Link URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/details" {...field} />
                      </FormControl>
                      <FormDescription>
                        Add a link to more information (leave empty for no link)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormDescription>
                          Order of appearance (lowest first)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-8">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Active
                          </FormLabel>
                          <FormDescription>
                            Show this announcement
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Select start date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When to start showing this banner
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Select end date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When to stop showing this banner
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" className="ml-2">
                    {form.formState.isSubmitting ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Banner
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Current Banners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Promotional Banners</CardTitle>
          <CardDescription>
            These banners will be displayed in a rotating carousel on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No promotional banners found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="w-[300px]">Text</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner: any) => (
                  <TableRow key={banner.id}>
                    <TableCell>{banner.order}</TableCell>
                    <TableCell className="font-medium">
                      {banner.text}
                      {banner.url && (
                        <div>
                          <a 
                            href={banner.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            {banner.url}
                          </a>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(banner.startDate)}</TableCell>
                    <TableCell>{formatDate(banner.endDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditBanner(banner)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteBanner(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}