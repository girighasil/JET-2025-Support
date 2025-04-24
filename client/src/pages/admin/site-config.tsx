import { useState, useEffect } from 'react';
import { useSiteConfig } from '@/hooks/use-site-config';
import { RoleBasedLayout } from '@/components/shared/RoleBasedLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash } from 'lucide-react';


export default function SiteConfigManagement() {
  const { config, isLoading } = useSiteConfig();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // General site settings
  const [siteTitle, setSiteTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [useCustomLogo, setUseCustomLogo] = useState(false);
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);
  const [uploadedLogoPreview, setUploadedLogoPreview] = useState('');
  
  // Hero section content
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroPrimaryBtn, setHeroPrimaryBtn] = useState('');
  const [heroPrimaryBtnUrl, setHeroPrimaryBtnUrl] = useState('');
  const [heroSecondaryBtn, setHeroSecondaryBtn] = useState('');
  const [heroSecondaryBtnUrl, setHeroSecondaryBtnUrl] = useState('');
  const [heroImage, setHeroImage] = useState('');
  
  // Navigation links
  const [navLinks, setNavLinks] = useState<Array<{ title: string; path: string }>>([]);
  
  // Footer settings
  const [footerText, setFooterText] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerLinks, setFooterLinks] = useState<Array<{ title: string; url: string }>>([]);
  
  // Contact page settings
  const [contactTitle, setContactTitle] = useState('');
  const [contactSubtitle, setContactSubtitle] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMapUrl, setContactMapUrl] = useState('');
  
  // Social media settings
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  // SEO settings
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  
  // Theme settings
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#10B981');
  const [fontMain, setFontMain] = useState('');
  const [fontHeadings, setFontHeadings] = useState('');
  
  useEffect(() => {
    if (config) {
      // Initialize site settings
      setSiteTitle(config.siteTitle || 'Maths Magic Town');
      setTagline(config.tagline || 'Your Path to Success in Competitive Exams');
      setInstituteName(config.instituteName || 'Maths Magic Town');
      
      // Initialize hero section
      const hero = config.hero || {};
      setHeroTitle(hero.title || 'Ace Your Math Competitive Exams');
      setHeroSubtitle(hero.subtitle || 'Personalized coaching, expert doubt resolution, and comprehensive practice tests for JEE, NEET, NDA, and more.');
      setHeroPrimaryBtn(hero.primaryButtonText || 'Explore Courses');
      setHeroPrimaryBtnUrl(hero.primaryButtonUrl || '#courses');
      setHeroSecondaryBtn(hero.secondaryButtonText || 'Try Free Demo');
      setHeroSecondaryBtnUrl(hero.secondaryButtonUrl || '#');
      setHeroImage(hero.backgroundImage || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80');
      
      // Initialize navigation links
      setNavLinks(config.navLinks || [
        { title: 'Home', path: '#home' },
        { title: 'Courses', path: '#courses' },
        { title: 'Doubt Classes', path: '#doubt-classes' },
        { title: 'Practice Tests', path: '#practice-tests' },
        { title: 'Success Stories', path: '#testimonials' },
        { title: 'Contact', path: '#contact' }
      ]);
      
      // Initialize footer settings
      const footer = config.footer || {};
      setFooterText(footer.text || '© 2025 Maths Magic Town. All rights reserved.');
      setFooterAddress(footer.address || '123 Learning Street, Education City, IN 110001');
      setFooterPhone(footer.phone || '+91 98765 43210');
      setFooterEmail(footer.email || 'contact@mathsmagictown.com');
      setFooterLinks(footer.links || [
        { title: 'Terms of Service', url: '/terms' },
        { title: 'Privacy Policy', url: '/privacy' },
        { title: 'Refund Policy', url: '/refund' }
      ]);
      
      // Initialize contact page settings
      const contact = config.contact || {};
      setContactTitle(contact.title || 'Get In Touch');
      setContactSubtitle(contact.subtitle || 'Have questions? Fill out the form below and we\'ll get back to you as soon as possible.');
      setContactAddress(contact.address || '123 Learning Street, Education City, IN 110001');
      setContactPhone(contact.phone || '+91 98765 43210');
      setContactEmail(contact.email || 'contact@mathsmagictown.com');
      setContactMapUrl(contact.mapUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.2536925461087!2d77.20659841507996!3d28.557120582445535!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce26f903969d7%3A0x8367180c6de2ecc2!2sAIIMS%20Delhi!5e0!3m2!1sen!2sin!4v1643448804843!5m2!1sen!2sin');
      
      // Initialize social media settings
      const social = config.social || {};
      setFacebookUrl(social.facebook || 'https://facebook.com/');
      setTwitterUrl(social.twitter || 'https://twitter.com/');
      setInstagramUrl(social.instagram || 'https://instagram.com/');
      setLinkedinUrl(social.linkedin || 'https://linkedin.com/');
      setYoutubeUrl(social.youtube || 'https://youtube.com/');
      
      // Initialize SEO settings
      const seo = config.seo || {};
      setSeoTitle(seo.title || 'Maths Magic Town - Competitive Exam Coaching');
      setSeoDescription(seo.description || 'Expert coaching for JEE, NEET, NDA and other competitive exams. Get personalized doubt resolutions and comprehensive practice tests.');
      setSeoKeywords(seo.keywords || 'math coaching, JEE preparation, competitive exam, doubt resolution, online math classes');
      setOgImage(seo.ogImage || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80');
      
      // Initialize theme settings
      const theme = config.theme || {};
      setPrimaryColor(theme.primaryColor || '#3B82F6');
      setSecondaryColor(theme.secondaryColor || '#10B981');
      setFontMain(theme.fontMain || 'Inter, system-ui, sans-serif');
      setFontHeadings(theme.fontHeadings || 'Poppins, system-ui, sans-serif');
      setLogoUrl(theme.logoUrl || '');
      setUseCustomLogo(theme.useCustomLogo || false);
      

    }
  }, [config]);
  
  const addNavLink = () => {
    setNavLinks([...navLinks, { title: '', path: '' }]);
  };
  
  const updateNavLink = (index: number, field: 'title' | 'path', value: string) => {
    const updatedLinks = [...navLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setNavLinks(updatedLinks);
  };
  
  const removeNavLink = (index: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== index));
  };
  
  // Footer link operations
  const addFooterLink = () => {
    setFooterLinks([...footerLinks, { title: '', url: '' }]);
  };
  
  const updateFooterLink = (index: number, field: 'title' | 'url', value: string) => {
    const updatedLinks = [...footerLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setFooterLinks(updatedLinks);
  };
  
  const removeFooterLink = (index: number) => {
    setFooterLinks(footerLinks.filter((_, i) => i !== index));
  };
  

  
  // Function to resize image and limit size
  const resizeAndCompressImage = (file: File, maxWidth: number = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions maintaining aspect ratio
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Get the data URL (base64) with reduced quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  // Logo upload handler
  const handleLogoUpload = async (): Promise<string | null> => {
    if (!uploadedLogo) return null;
    
    try {
      // Check file size first
      if (uploadedLogo.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image file is too large. Maximum size is 5MB.');
      }
      
      // Resize and compress the image
      const resizedImage = await resizeAndCompressImage(uploadedLogo);
      return resizedImage;
    } catch (error) {
      console.error('Error processing logo:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to process logo image. Please try a smaller image or use an image URL instead.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const saveGeneralSettings = async () => {
    setSaving(true);
    try {
      // Handle logo upload if there is one
      let finalLogoUrl = logoUrl;
      if (uploadedLogo) {
        const uploadedUrl = await handleLogoUpload();
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl;
          setLogoUrl(uploadedUrl);
        }
      }
      
      // Save general settings - site title
      await apiRequest('PUT', `/api/admin/site-config/siteTitle`, {
        value: siteTitle
      });
      
      // Save tagline
      await apiRequest('PUT', `/api/admin/site-config/tagline`, {
        value: tagline
      });
      
      // Save institute name
      await apiRequest('PUT', `/api/admin/site-config/instituteName`, {
        value: instituteName
      });
      
      // Save logo URL
      await apiRequest('PUT', `/api/admin/site-config/logoUrl`, {
        value: finalLogoUrl
      });
      
      // Save logo display preference
      await apiRequest('PUT', `/api/admin/site-config/useCustomLogo`, {
        value: useCustomLogo
      });
      
      toast({
        title: 'Settings saved',
        description: 'General settings have been updated successfully.',
      });
      
      // Clear uploaded logo state after successful save
      if (uploadedLogo) {
        setUploadedLogo(null);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'An error occurred while saving general settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveHeroSettings = async () => {
    setSaving(true);
    try {
      const heroData = {
        title: heroTitle,
        subtitle: heroSubtitle,
        primaryButtonText: heroPrimaryBtn,
        primaryButtonUrl: heroPrimaryBtnUrl,
        secondaryButtonText: heroSecondaryBtn,
        secondaryButtonUrl: heroSecondaryBtnUrl,
        backgroundImage: heroImage
      };
      
      await apiRequest('PUT', `/api/admin/site-config/hero`, {
        value: heroData
      });
      
      toast({
        title: 'Hero settings saved',
        description: 'Hero section has been updated successfully.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving hero settings',
        description: 'An error occurred while saving hero settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveNavLinks = async () => {
    setSaving(true);
    try {
      await apiRequest('PUT', `/api/admin/site-config/navLinks`, {
        value: navLinks
      });
      
      toast({
        title: 'Navigation links saved',
        description: 'Navigation menu has been updated successfully.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving navigation links',
        description: 'An error occurred while saving navigation links.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveFooterSettings = async () => {
    setSaving(true);
    try {
      const footerData = {
        text: footerText,
        address: footerAddress,
        phone: footerPhone,
        email: footerEmail,
        links: footerLinks
      };
      
      await apiRequest('PUT', `/api/admin/site-config/footer`, {
        value: footerData
      });
      
      toast({
        title: 'Footer settings saved',
        description: 'Footer content has been updated successfully.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving footer settings',
        description: 'An error occurred while saving footer settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveContactSettings = async () => {
    setSaving(true);
    try {
      const contactData = {
        title: contactTitle,
        subtitle: contactSubtitle,
        address: contactAddress,
        phone: contactPhone,
        email: contactEmail,
        mapUrl: contactMapUrl
      };
      
      await apiRequest('PUT', `/api/admin/site-config/contact`, {
        value: contactData
      });
      
      toast({
        title: 'Contact settings saved',
        description: 'Contact page settings have been updated successfully.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving contact settings',
        description: 'An error occurred while saving contact settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveSocialSettings = async () => {
    setSaving(true);
    try {
      const socialData = {
        facebook: facebookUrl,
        twitter: twitterUrl,
        instagram: instagramUrl,
        linkedin: linkedinUrl,
        youtube: youtubeUrl
      };
      
      await apiRequest('PUT', `/api/admin/site-config/social`, {
        value: socialData
      });
      
      toast({
        title: 'Social media settings saved',
        description: 'Social media links have been updated successfully.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving social media settings',
        description: 'An error occurred while saving social media settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveSeoSettings = async () => {
    setSaving(true);
    try {
      const seoData = {
        title: seoTitle,
        description: seoDescription,
        keywords: seoKeywords,
        ogImage: ogImage
      };
      
      await apiRequest('PUT', `/api/admin/site-config/seo`, {
        value: seoData
      });
      
      toast({
        title: 'SEO settings saved',
        description: 'SEO settings have been updated successfully.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving SEO settings',
        description: 'An error occurred while saving SEO settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveThemeSettings = async () => {
    setSaving(true);
    try {
      const themeData = {
        primaryColor,
        secondaryColor,
        fontMain,
        fontHeadings,
        logoUrl,
        useCustomLogo
      };
      
      await apiRequest('PUT', `/api/admin/site-config/theme`, {
        value: themeData
      });
      
      toast({
        title: 'Theme settings saved',
        description: 'Theme settings have been updated successfully.',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving theme settings',
        description: 'An error occurred while saving theme settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  

  
  return (
    <RoleBasedLayout title="Site Configuration">
      <Tabs defaultValue="general">
        <TabsList className="mb-6 flex flex-wrap gap-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="navigation">Navigation Menu</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="contact">Contact Page</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          <TabsTrigger value="theme">Theme Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site settings like name and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-title">Site Title</Label>
                <Input 
                  id="site-title" 
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  placeholder="Site Title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="institute-name">Institute Name</Label>
                <Input 
                  id="institute-name" 
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="Institute Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input 
                  id="tagline" 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Your catchy tagline"
                />
              </div>
              
              <div className="flex items-center space-x-2 my-4">
                <Switch
                  id="use-custom-logo"
                  checked={useCustomLogo}
                  onCheckedChange={setUseCustomLogo}
                />
                <Label htmlFor="use-custom-logo">Use custom logo (instead of default icon)</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input 
                  id="logo-url" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="URL for your logo image"
                  disabled={!useCustomLogo}
                />
                {logoUrl && useCustomLogo && (
                  <div className="mt-2 rounded-md overflow-hidden w-full max-w-md h-20">
                    <img src={logoUrl} alt="Logo preview" className="h-full w-auto object-contain" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Or Upload Logo</Label>
                <Input 
                  id="logo-upload" 
                  type="file"
                  accept="image/*"
                  disabled={!useCustomLogo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check file size first
                      if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        toast({
                          title: 'File too large',
                          description: 'Image file is too large. Maximum size is 5MB.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      
                      setUploadedLogo(file);
                      
                      try {
                        // Process and preview the image immediately
                        const processedImage = await resizeAndCompressImage(file);
                        setUploadedLogoPreview(processedImage);
                      } catch (error) {
                        // If processing fails, still show the original
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setUploadedLogoPreview(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                />
                {uploadedLogoPreview && (
                  <div className="mt-2 rounded-md overflow-hidden w-full max-w-md h-20">
                    <img src={uploadedLogoPreview} alt="Uploaded logo preview" className="h-full w-auto object-contain" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveGeneralSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Main banner content and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Title</Label>
                <Input 
                  id="hero-title" 
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Hero Title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Subtitle</Label>
                <Textarea 
                  id="hero-subtitle" 
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Hero Subtitle"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-btn-text">Primary Button Text</Label>
                  <Input 
                    id="primary-btn-text" 
                    value={heroPrimaryBtn}
                    onChange={(e) => setHeroPrimaryBtn(e.target.value)}
                    placeholder="Primary Button Text"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primary-btn-url">Primary Button URL</Label>
                  <Input 
                    id="primary-btn-url" 
                    value={heroPrimaryBtnUrl}
                    onChange={(e) => setHeroPrimaryBtnUrl(e.target.value)}
                    placeholder="URL or anchor link"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="secondary-btn-text">Secondary Button Text</Label>
                  <Input 
                    id="secondary-btn-text" 
                    value={heroSecondaryBtn}
                    onChange={(e) => setHeroSecondaryBtn(e.target.value)}
                    placeholder="Secondary Button Text"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondary-btn-url">Secondary Button URL</Label>
                  <Input 
                    id="secondary-btn-url" 
                    value={heroSecondaryBtnUrl}
                    onChange={(e) => setHeroSecondaryBtnUrl(e.target.value)}
                    placeholder="URL or anchor link"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-image">Background Image URL</Label>
                <Input 
                  id="hero-image" 
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  placeholder="Image URL"
                />
                {heroImage && (
                  <div className="mt-2 rounded-md overflow-hidden w-full max-w-md">
                    <img src={heroImage} alt="Hero background preview" className="w-full h-auto" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveHeroSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Hero Section
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="navigation">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Menu</CardTitle>
              <CardDescription>Customize the site's main navigation links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {navLinks.map((link, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <Input
                      value={link.title}
                      onChange={(e) => updateNavLink(index, 'title', e.target.value)}
                      placeholder="Link Text"
                    />
                    <Input
                      value={link.path}
                      onChange={(e) => updateNavLink(index, 'path', e.target.value)}
                      placeholder="URL or Anchor (e.g. #courses)"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeNavLink(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" size="sm" className="mt-2" onClick={addNavLink}>
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </CardContent>
            <CardFooter>
              <Button onClick={saveNavLinks} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Navigation Menu
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>Customize the website footer content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="footer-text">Copyright Text</Label>
                <Input 
                  id="footer-text" 
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Copyright text"
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer-address">Address</Label>
                    <Textarea 
                      id="footer-address" 
                      value={footerAddress}
                      onChange={(e) => setFooterAddress(e.target.value)}
                      placeholder="Company address"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="footer-email">Email</Label>
                    <Input 
                      id="footer-email" 
                      value={footerEmail}
                      onChange={(e) => setFooterEmail(e.target.value)}
                      placeholder="Contact email"
                      type="email"
                    />
                    
                    <Label htmlFor="footer-phone" className="mt-4 block">Phone</Label>
                    <Input 
                      id="footer-phone" 
                      value={footerPhone}
                      onChange={(e) => setFooterPhone(e.target.value)}
                      placeholder="Contact phone"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Footer Links</h3>
                {footerLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <Input
                        value={link.title}
                        onChange={(e) => updateFooterLink(index, 'title', e.target.value)}
                        placeholder="Link Text"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateFooterLink(index, 'url', e.target.value)}
                        placeholder="URL (e.g. /terms)"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFooterLink(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" onClick={addFooterLink}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Footer Link
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveFooterSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Footer Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Page Settings</CardTitle>
              <CardDescription>Configure the contact page information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-title">Page Title</Label>
                  <Input 
                    id="contact-title" 
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    placeholder="Contact page title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-subtitle">Page Subtitle/Description</Label>
                  <Textarea 
                    id="contact-subtitle" 
                    value={contactSubtitle}
                    onChange={(e) => setContactSubtitle(e.target.value)}
                    placeholder="Contact page description"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-address">Address</Label>
                    <Textarea 
                      id="contact-address" 
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      placeholder="Physical address"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input 
                      id="contact-email" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Contact email"
                      type="email"
                    />
                    
                    <Label htmlFor="contact-phone" className="mt-4 block">Phone</Label>
                    <Input 
                      id="contact-phone" 
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Contact phone"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-map">Google Maps Embed URL</Label>
                <Input 
                  id="contact-map" 
                  value={contactMapUrl}
                  onChange={(e) => setContactMapUrl(e.target.value)}
                  placeholder="Google Maps embed URL"
                />
                {contactMapUrl && (
                  <div className="mt-2 rounded-md overflow-hidden w-full h-[200px]">
                    <iframe 
                      src={contactMapUrl} 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen={false} 
                      loading="lazy"
                      title="Location map" 
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveContactSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Contact Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Settings</CardTitle>
              <CardDescription>Add your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook-url">Facebook</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">https://facebook.com/</span>
                  <Input 
                    id="facebook-url" 
                    value={facebookUrl.replace('https://facebook.com/', '')}
                    onChange={(e) => setFacebookUrl(`https://facebook.com/${e.target.value}`)}
                    placeholder="yourusername"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter-url">Twitter</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">https://twitter.com/</span>
                  <Input 
                    id="twitter-url" 
                    value={twitterUrl.replace('https://twitter.com/', '')}
                    onChange={(e) => setTwitterUrl(`https://twitter.com/${e.target.value}`)}
                    placeholder="yourusername"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instagram-url">Instagram</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">https://instagram.com/</span>
                  <Input 
                    id="instagram-url" 
                    value={instagramUrl.replace('https://instagram.com/', '')}
                    onChange={(e) => setInstagramUrl(`https://instagram.com/${e.target.value}`)}
                    placeholder="yourusername"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin-url">LinkedIn</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">https://linkedin.com/in/</span>
                  <Input 
                    id="linkedin-url" 
                    value={linkedinUrl.replace('https://linkedin.com/in/', '')}
                    onChange={(e) => setLinkedinUrl(`https://linkedin.com/in/${e.target.value}`)}
                    placeholder="yourusername"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">https://youtube.com/</span>
                  <Input 
                    id="youtube-url" 
                    value={youtubeUrl.replace('https://youtube.com/', '')}
                    onChange={(e) => setYoutubeUrl(`https://youtube.com/${e.target.value}`)}
                    placeholder="channel/your-channel-id"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSocialSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Social Media Links
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your site for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Meta Title</Label>
                <Input 
                  id="seo-title" 
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Meta title (shown in search results)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea 
                  id="seo-description" 
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description (shown in search results)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 150-160 characters. Current length: {seoDescription.length} characters.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seo-keywords">Meta Keywords</Label>
                <Textarea 
                  id="seo-keywords" 
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="Comma-separated keywords"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="og-image">Open Graph Image URL</Label>
                <Input 
                  id="og-image" 
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="Image URL for social sharing"
                />
                {ogImage && (
                  <div className="mt-2 rounded-md overflow-hidden w-full max-w-md">
                    <img src={ogImage} alt="OG image preview" className="w-full h-auto" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSeoSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save SEO Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Customize the look and feel of your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-md border" 
                        style={{ backgroundColor: primaryColor }}
                      />
                      <Input 
                        id="primary-color" 
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                      />
                      <Input 
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#color"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-md border" 
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <Input 
                        id="secondary-color" 
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                      />
                      <Input 
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#color"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Typography</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="font-main">Main Font</Label>
                    <Input 
                      id="font-main" 
                      value={fontMain}
                      onChange={(e) => setFontMain(e.target.value)}
                      placeholder="Font family for body text"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: Inter, system-ui, sans-serif
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="font-headings">Headings Font</Label>
                    <Input 
                      id="font-headings" 
                      value={fontHeadings}
                      onChange={(e) => setFontHeadings(e.target.value)}
                      placeholder="Font family for headings"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: Poppins, system-ui, sans-serif
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input 
                  id="logo-url" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="URL to your logo image"
                />
                {logoUrl && (
                  <div className="mt-2 flex justify-start">
                    <div className="rounded-md overflow-hidden h-12">
                      <img src={logoUrl} alt="Logo preview" className="h-full w-auto" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveThemeSettings} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Theme Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </RoleBasedLayout>
  );
}