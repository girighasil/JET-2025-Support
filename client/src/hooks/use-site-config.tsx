import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Define the site configuration data structure
export type SiteConfigData = {
  siteTitle?: string;
  tagline?: string;
  instituteName?: string;
  logoUrl?: string;
  
  // Exam information
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
  
  // Contact information
  footer?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  
  // Social links
  social?: {
    whatsapp?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
};

// Hook to fetch site configurations
export function useSiteConfig() {
  const { data, isLoading, isError } = useQuery<SiteConfigData>({
    queryKey: ['/api/site-config'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    config: data || {},
    isLoading,
    isError,
  };
}

// Hook to update site configurations
export function useUpdateSiteConfig() {
  const queryClient = useQueryClient();
  
  const { mutate, isPending } = useMutation<any, Error, { key: string; value: any }>({
    mutationFn: async ({ key, value }) => {
      return apiRequest('PUT', `/api/site-config/${key}`, { value });
    },
    onSuccess: () => {
      // Invalidate the site config cache
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    },
  });

  return {
    updateConfig: mutate,
    isUpdating: isPending,
  };
}

// Helper hook to get specific config value
export function useSiteConfigValue<T>(key: string, defaultValue: T): T {
  const { config } = useSiteConfig();
  
  // Handle nested keys like 'examInfo.name'
  if (key.includes('.')) {
    const keys = key.split('.');
    let value: any = config;
    
    for (const k of keys) {
      if (!value || typeof value !== 'object') return defaultValue;
      value = value[k];
    }
    
    return (value as T) || defaultValue;
  }
  
  return (config[key as keyof SiteConfigData] as unknown as T) || defaultValue;
}