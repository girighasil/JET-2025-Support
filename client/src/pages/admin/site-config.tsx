import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

import { useSiteConfig, useUpdateSiteConfig, type SiteConfigData } from '@/hooks/use-site-config';

// Form schema for the site configuration
const siteConfigSchema = z.object({
  siteTitle: z.string().optional(),
  tagline: z.string().optional(),
  instituteName: z.string().optional(),
  logoUrl: z.string().optional(),

  // Exam info
  examName: z.string().optional(),
  examFullName: z.string().optional(),
  examYear: z.string().optional(),
  applicationStartDate: z.string().optional(),
  applicationEndDate: z.string().optional(),
  examDate: z.string().optional(),
  universityName: z.string().optional(),
  universityLogo: z.string().optional(),

  // Contact info
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  contactAddress: z.string().optional(),
  whatsappLink: z.string().optional(),
});

export default function SiteConfigPage() {
  const { toast } = useToast();
  const { config, isLoading } = useSiteConfig();
  const { updateConfig, isUpdating } = useUpdateSiteConfig();
  const [activeTab, setActiveTab] = useState('general');

  // Initialize form with the current config values
  const form = useForm<z.infer<typeof siteConfigSchema>>({
    resolver: zodResolver(siteConfigSchema),
    defaultValues: {
      siteTitle: '',
      tagline: '',
      instituteName: '',
      logoUrl: '',
      examName: '',
      examFullName: '',
      examYear: '',
      applicationStartDate: '',
      applicationEndDate: '',
      examDate: '',
      universityName: '',
      universityLogo: '',
      contactPhone: '',
      contactEmail: '',
      contactAddress: '',
      whatsappLink: '',
    },
  });

  // Update form values when config data is loaded
  useEffect(() => {
    if (config) {
      form.reset({
        siteTitle: config.siteTitle || '',
        tagline: config.tagline || '',
        instituteName: config.instituteName || '',
        logoUrl: config.logoUrl || '',
        
        // Exam info
        examName: config.examInfo?.name || '',
        examFullName: config.examInfo?.fullName || '',
        examYear: config.examInfo?.year || '',
        applicationStartDate: config.examInfo?.applicationStartDate || '',
        applicationEndDate: config.examInfo?.applicationEndDate || '',
        examDate: config.examInfo?.examDate || '',
        universityName: config.examInfo?.universityName || '',
        universityLogo: config.examInfo?.universityLogo || '',
        
        // Contact info
        contactPhone: config.footer?.phone || '',
        contactEmail: config.footer?.email || '',
        contactAddress: config.footer?.address || '',
        whatsappLink: config.social?.whatsapp || '',
      });
    }
  }, [config, form]);

  const onSubmit = async (data: z.infer<typeof siteConfigSchema>) => {
    try {
      // Update general site settings
      await updateConfig({
        key: 'siteSettings',
        value: {
          siteTitle: data.siteTitle,
          tagline: data.tagline,
          instituteName: data.instituteName,
          logoUrl: data.logoUrl,
        },
      });

      // Update exam info
      await updateConfig({
        key: 'examInfo',
        value: {
          name: data.examName,
          fullName: data.examFullName,
          year: data.examYear,
          applicationStartDate: data.applicationStartDate,
          applicationEndDate: data.applicationEndDate,
          examDate: data.examDate,
          universityName: data.universityName,
          universityLogo: data.universityLogo,
        },
      });

      // Update contact & social info
      await updateConfig({
        key: 'contactAndSocial',
        value: {
          footer: {
            phone: data.contactPhone,
            email: data.contactEmail,
            address: data.contactAddress,
          },
          social: {
            whatsapp: data.whatsappLink,
          },
        },
      });

      toast({
        title: 'Success',
        description: 'Site configuration has been updated successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating site configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to update site configuration. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Site Configuration</h1>
      <p className="text-muted-foreground mb-6">
        Manage all website settings from a central location. Changes will reflect immediately on the website.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="exam">Exam Information</TabsTrigger>
              <TabsTrigger value="contact">Contact & Social</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Basic information about your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Learning Center" {...field} />
                        </FormControl>
                        <FormDescription>
                          The title of your website, displayed in browser tabs and search results
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Input placeholder="Your path to success" {...field} />
                        </FormControl>
                        <FormDescription>
                          A short description of your website
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instituteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institute Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Institute Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your institution or organization name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to your logo image (recommended size: 200x200px)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exam Information Tab */}
            <TabsContent value="exam">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Information</CardTitle>
                  <CardDescription>
                    Details about the entrance exam
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="examName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Name</FormLabel>
                          <FormControl>
                            <Input placeholder="JET" {...field} />
                          </FormControl>
                          <FormDescription>
                            Short name of the exam (e.g., JET)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="examFullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Exam Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Joint Entrance Test" {...field} />
                          </FormControl>
                          <FormDescription>
                            Full name of the exam
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="examYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Year</FormLabel>
                        <FormControl>
                          <Input placeholder="2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="applicationStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Start Date</FormLabel>
                          <FormControl>
                            <Input placeholder="February 20, 2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applicationEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application End Date</FormLabel>
                          <FormControl>
                            <Input placeholder="March 30, 2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl>
                          <Input placeholder="May 14, 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="universityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Swami Keshwanand Rajasthan Agricultural University, Bikaner" {...field} />
                        </FormControl>
                        <FormDescription>
                          Full name of the university
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="universityLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/university-logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL to the university's logo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact & Social Tab */}
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Social Media</CardTitle>
                  <CardDescription>
                    Contact information and social media links
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} />
                        </FormControl>
                        <FormDescription>
                          Main contact phone number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Main contact email address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Main St, City, State" {...field} />
                        </FormControl>
                        <FormDescription>
                          Physical address of your institution
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Group Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://whatsapp.com/channel/0029VbAudzTHbFV5ppcj0b07" {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to your WhatsApp group or channel
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isUpdating} className="flex items-center">
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}