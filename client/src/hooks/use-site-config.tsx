import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export type SiteConfigData = {
  siteTitle?: string;
  tagline?: string;
  instituteName?: string;
  logoUrl?: string;
  useCustomLogo?: boolean;
  
  // Hero section
  hero?: {
    title?: string;
    subtitle?: string;
    primaryButtonText?: string;
    primaryButtonUrl?: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
    backgroundImage?: string;
  };
  
  // Navigation
  navLinks?: Array<{ title: string; path: string }>;
  
  // Footer
  footer?: {
    text?: string;
    address?: string;
    phone?: string;
    email?: string;
    links?: Array<{ title: string; url: string }>;
  };
  
  // Contact page
  contact?: {
    title?: string;
    subtitle?: string;
    address?: string;
    phone?: string;
    email?: string;
    mapUrl?: string;
  };
  
  // Social media
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    whatsapp?: string;
  };
  
  // SEO
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  };
  
  // Theme
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontMain?: string;
    fontHeadings?: string;
    logoUrl?: string;
    useCustomLogo?: boolean;
  };

  // JET Exam specific
  examInfo?: {
    name?: string;
    fullName?: string;
    year?: string;
    applicationStartDate?: string;
    applicationEndDate?: string;
    examDate?: string;
    universityName?: string;
    universityLogo?: string;
  };
};

export function useSiteConfig() {
  const { data: config, isLoading, error } = useQuery<SiteConfigData>({
    queryKey: ['/api/site-config'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    config,
    isLoading,
    error,
  };
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient();

  const { mutate: updateConfig, isPending } = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return apiRequest('PUT', `/api/admin/site-config/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    },
  });

  return {
    updateConfig,
    isUpdating: isPending,
  };
}