import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export type SiteSettings = {
  siteTitle: string;
  tagline: string;
  instituteName: string;
};

export type ExamInfo = {
  name: string;
  fullName: string;
  year: string;
  applicationStartDate: string;
  applicationEndDate: string;
  examDate: string;
  universityName: string;
};

export type ContactAndSocial = {
  footer: {
    phone: string;
    email: string;
    address: string;
  };
  social: {
    whatsapp: string;
    youtube?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
};

export type SiteConfig = SiteSettings & {
  examInfo: ExamInfo;
} & Partial<ContactAndSocial>;

const defaultConfig: SiteConfig = {
  siteTitle: 'JET 2025',
  tagline: 'Prepare for JET Entrance Exam',
  instituteName: 'Paras Education',
  examInfo: {
    name: 'JET',
    fullName: 'Joint Entrance Test',
    year: '2025',
    applicationStartDate: 'February 20, 2025',
    applicationEndDate: 'March 30, 2025',
    examDate: 'May 14, 2025',
    universityName: 'Swami Keshwanand Rajasthan Agricultural University, Bikaner'
  },
  footer: {
    phone: '9072345678, 6372345678',
    email: 'contact@example.com',
    address: '123 Main St, City'
  },
  social: {
    whatsapp: 'https://whatsapp.com/channel/0029VbAudzTHbFV5ppcj0b07'
  }
};

export function useSiteConfig() {
  const queryClient = useQueryClient();
  
  // Fetch site configuration
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['/api/site-config'],
    refetchOnWindowFocus: false,
    // Use default config if data is unavailable
    select: (data: SiteConfig) => {
      if (!data) return defaultConfig;
      return {
        ...defaultConfig,
        ...data,
      };
    },
  });
  
  // Update site settings
  const updateSiteSettings = useMutation({
    mutationFn: async (settings: Partial<SiteSettings>) => {
      return apiRequest('/api/site-config/siteSettings', 'PUT', {
        value: {
          ...config?.siteTitle && { siteTitle: config.siteTitle },
          ...config?.tagline && { tagline: config.tagline },
          ...config?.instituteName && { instituteName: config.instituteName },
          ...settings, // Overwrite with new values
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Site configuration has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    },
    onError: (error) => {
      toast({
        title: 'Error saving settings',
        description: 'Failed to update site configuration',
        variant: 'destructive',
      });
      console.error('Error updating site settings:', error);
    },
  });
  
  // Update exam information
  const updateExamInfo = useMutation({
    mutationFn: async (examInfo: Partial<ExamInfo>) => {
      return apiRequest('/api/site-config/examInfo', 'PUT', {
        value: {
          ...config?.examInfo, // Keep existing values
          ...examInfo, // Overwrite with new values
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Exam info saved',
        description: 'Exam information has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    },
    onError: (error) => {
      toast({
        title: 'Error saving exam info',
        description: 'Failed to update exam information',
        variant: 'destructive',
      });
      console.error('Error updating exam info:', error);
    },
  });
  
  // Update contact and social information
  const updateContactAndSocial = useMutation({
    mutationFn: async (contactAndSocial: Partial<ContactAndSocial>) => {
      return apiRequest('/api/site-config/contactAndSocial', 'PUT', {
        value: {
          footer: {
            ...config?.footer, // Keep existing footer values
            ...(contactAndSocial.footer || {}), // Overwrite with new footer values
          },
          social: {
            ...config?.social, // Keep existing social values
            ...(contactAndSocial.social || {}), // Overwrite with new social values
          },
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Contact info saved',
        description: 'Contact and social information has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    },
    onError: (error) => {
      toast({
        title: 'Error saving contact info',
        description: 'Failed to update contact and social information',
        variant: 'destructive',
      });
      console.error('Error updating contact and social info:', error);
    },
  });
  
  return {
    config: config || defaultConfig,
    isLoading,
    error,
    updateSiteSettings,
    updateExamInfo,
    updateContactAndSocial,
  };
}

// Hook for fetching promotional banners
export function usePromoBanners() {
  const queryClient = useQueryClient();
  
  // Fetch active promotional banners
  const { data: banners = [], isLoading, error } = useQuery({
    queryKey: ['/api/promo-banners'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch all banners (admin only)
  const { data: allBanners = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['/api/admin/promo-banners'],
    refetchOnWindowFocus: false,
    enabled: false, // Only fetch when explicitly called
  });
  
  // Create new banner
  const createBanner = useMutation({
    mutationFn: async (banner: { text: string; url?: string; isActive?: boolean; order?: number }) => {
      return apiRequest('/api/admin/promo-banners', 'POST', banner);
    },
    onSuccess: () => {
      toast({
        title: 'Banner created',
        description: 'New promotional banner has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/promo-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-banners'] });
    },
    onError: (error) => {
      toast({
        title: 'Error creating banner',
        description: 'Failed to create promotional banner',
        variant: 'destructive',
      });
      console.error('Error creating banner:', error);
    },
  });
  
  // Update banner
  const updateBanner = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; text?: string; url?: string; isActive?: boolean; order?: number }) => {
      return apiRequest(`/api/admin/promo-banners/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: 'Banner updated',
        description: 'Promotional banner has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/promo-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-banners'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating banner',
        description: 'Failed to update promotional banner',
        variant: 'destructive',
      });
      console.error('Error updating banner:', error);
    },
  });
  
  // Delete banner
  const deleteBanner = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/promo-banners/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Banner deleted',
        description: 'Promotional banner has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/promo-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-banners'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting banner',
        description: 'Failed to delete promotional banner',
        variant: 'destructive',
      });
      console.error('Error deleting banner:', error);
    },
  });
  
  return {
    banners,
    allBanners,
    isLoading,
    isLoadingAll,
    error,
    createBanner,
    updateBanner,
    deleteBanner,
  };
}