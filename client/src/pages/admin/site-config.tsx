import { useState, useEffect } from 'react';
import { useSiteConfig } from '@/hooks/use-site-config';
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
import { Layout } from '@/components/ui/layout';

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
  
  // Exam information
  const [examName, setExamName] = useState('');
  const [examFullName, setExamFullName] = useState('');
  const [examYear, setExamYear] = useState('');
  const [applicationStartDate, setApplicationStartDate] = useState('');
  const [applicationEndDate, setApplicationEndDate] = useState('');
  const [examDate, setExamDate] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [universityLogo, setUniversityLogo] = useState('');
  
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
  const [whatsappLink, setWhatsappLink] = useState('');
  
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
      setSiteTitle(config.siteTitle || 'JET 2025 Support');
      setTagline(config.tagline || 'Learn, Practic, Suceed');
      setInstituteName(config.instituteName || 'JET 2025 Support');
      setLogoUrl(config.logoUrl || '');
      
      // Initialize exam information
      setExamName(config.examInfo?.name || 'JET');
      setExamFullName(config.examInfo?.fullName || 'Joint Entrance Test');
      setExamYear(config.examInfo?.year || '2025');
      setApplicationStartDate(config.examInfo?.applicationStartDate || 'February 20, 2025');
      setApplicationEndDate(config.examInfo?.applicationEndDate || 'March 30, 2025');
      setExamDate(config.examInfo?.examDate || 'May 14, 2025');
      setUniversityName(config.examInfo?.universityName || 'Swami Keshwanand Rajasthan Agricultural University, Bikaner');
      setUniversityLogo(config.examInfo?.universityLogo || '');
      
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
      setFooterText(footer.text || '© 2025 JET 2025 Support. All rights reserved.');
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
      setYoutubeUrl(social.youtube || 'https://www.youtube.com/@JET2025Support');
      setWhatsappLink(social.whatsapp || 'https://whatsapp.com/channel/0029VbAudzTHbFV5ppcj0b07');
      
      // Initialize SEO settings
      const seo = config.seo || {};
      setSeoTitle(seo.title || 'JET 2025 Support - skrau, bikaner Rajasthan agriculture university entrance exam preparation');
      setSeoDescription(seo.description || 'jet online application form, agriculture, university. online coaching, test series jet 2025.');
      setSeoKeywords(seo.keywords || 'jet 2025, application, form, coaching, skrau, bikaner, agriculture, university, online coaching, test series jet 2025.');
      setOgImage(seo.ogImage || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80');
      
      // Initialize theme settings
      const theme = config.theme || {};
      setPrimaryColor(theme.primaryColor || '#3B82F6');
      setSecondaryColor(theme.secondaryColor || '#10B981');
      setFontMain(theme.fontMain || 'Inter, system-ui, sans-serif');
      setFontHeadings(theme.fontHeadings || 'Poppins, system-ui, sans-serif');
      setUseCustomLogo(theme.useCustomLogo || false);
    }
  }, [config]);
  
  // Navigation link operations
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
  
  // Logo upload handler
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedLogo(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  // Logo upload processing
  const processLogoUpload = async (): Promise<string | null> => {
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
        const uploadedUrl = await processLogoUpload();
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl;
          setLogoUrl(uploadedUrl);
        }
      }
      
      // Update general site settings
      await apiRequest('/api/site-config/siteSettings', 'PUT', {
        value: {
          siteTitle,
          tagline,
          instituteName,
          logoUrl: finalLogoUrl
        },
      });
      
      // Update theme settings
      await apiRequest('/api/site-config/theme', 'PUT', {
        value: {
          primaryColor,
          secondaryColor,
          fontMain,
          fontHeadings,
          useCustomLogo
        },
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
      console.error('Error saving general settings:', error);
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
      
      await apiRequest('/api/site-config/hero', 'PUT', {
        value: heroData,
      });
      
      // Update navigation links
      await apiRequest('/api/site-config/navLinks', 'PUT', {
        value: navLinks,
      });
      
      toast({
        title: 'Hero settings saved',
        description: 'Hero section and navigation links have been updated successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving hero settings',
        description: 'An error occurred while saving hero section settings.',
        variant: 'destructive',
      });
      console.error('Error saving hero settings:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const saveExamInfo = async () => {
    setSaving(true);
    try {
      const examData = {
        name: examName,
        fullName: examFullName,
        year: examYear,
        applicationStartDate,
        applicationEndDate,
        examDate,
        universityName,
        universityLogo
      };
      
      await apiRequest('/api/site-config/examInfo', 'PUT', {
        value: examData,
      });
      
      toast({
        title: 'Exam info saved',
        description: 'Exam information has been updated successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving exam info',
        description: 'An error occurred while saving exam information.',
        variant: 'destructive',
      });
      console.error('Error saving exam info:', error);
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
      
      await apiRequest('/api/site-config/footer', 'PUT', {
        value: footerData,
      });
      
      toast({
        title: 'Footer settings saved',
        description: 'Footer settings have been updated successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving footer settings',
        description: 'An error occurred while saving footer settings.',
        variant: 'destructive',
      });
      console.error('Error saving footer settings:', error);
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
      
      await apiRequest('/api/site-config/contact', 'PUT', {
        value: contactData,
      });
      
      const socialData = {
        whatsapp: whatsappLink,
        facebook: facebookUrl,
        twitter: twitterUrl,
        instagram: instagramUrl,
        linkedin: linkedinUrl,
        youtube: youtubeUrl
      };
      
      await apiRequest('/api/site-config/social', 'PUT', {
        value: socialData,
      });
      
      toast({
        title: 'Contact settings saved',
        description: 'Contact and social media settings have been updated successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving contact settings',
        description: 'An error occurred while saving contact and social media settings.',
        variant: 'destructive',
      });
      console.error('Error saving contact settings:', error);
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
        ogImage
      };
      
      await apiRequest('/api/site-config/seo', 'PUT', {
        value: seoData,
      });
      
      toast({
        title: 'SEO settings saved',
        description: 'SEO settings have been updated successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      toast({
        title: 'Error saving SEO settings',
        description: 'An error occurred while saving SEO settings.',
        variant: 'destructive',
      });
      console.error('Error saving SEO settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateContactSocial = async () => {
    setSaving(true);
    try {
      // Update contact & social info
      await apiRequest('/api/site-config/contactAndSocial', 'PUT', {
        value: {
          footer: {
            phone: footerPhone,
            email: footerEmail,
            address: footerAddress,
          },
          social: {
            whatsapp: whatsappLink,
            facebook: facebookUrl,
            twitter: twitterUrl,
            instagram: instagramUrl,
            linkedin: linkedinUrl,
            youtube: youtubeUrl
          },
        },
      });

      toast({
        title: 'Success',
        description: 'Contact and social information has been updated successfully.',
        variant: 'default',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/site-config'] });
    } catch (error) {
      console.error('Error updating contact and social info:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact and social information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
    <Layout title="Site Configuration" description="Manage all website settings from a central location">
      <div className="mx-auto">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="w-full md:w-auto justify-start flex-wrap">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="hero">Hero & Navigation</TabsTrigger>
            <TabsTrigger value="exam">Exam Information</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="contact">Contact & Social</TabsTrigger>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Site Settings</CardTitle>
                <CardDescription>Basic information about your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteTitle">Site Title</Label>
                    <Input 
                      id="siteTitle"
                      value={siteTitle}
                      onChange={e => setSiteTitle(e.target.value)}
                      placeholder="Maths Magic Town" 
                    />
                    <p className="text-sm text-muted-foreground">The title of your website</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instituteName">Institute Name</Label>
                    <Input 
                      id="instituteName"
                      value={instituteName}
                      onChange={e => setInstituteName(e.target.value)}
                      placeholder="Your Institute Name" 
                    />
                    <p className="text-sm text-muted-foreground">Your institution or organization name</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input 
                    id="tagline"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="Your path to success in competitive exams" 
                  />
                  <p className="text-sm text-muted-foreground">A short description of your website</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="useCustomLogo" 
                        checked={useCustomLogo}
                        onCheckedChange={setUseCustomLogo}
                      />
                      <Label htmlFor="useCustomLogo">Use custom logo</Label>
                    </div>
                  </div>
                  
                  {useCustomLogo ? (
                    <div className="space-y-4">
                      <Input 
                        id="logoUrl"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png" 
                      />
                      <p className="text-sm text-muted-foreground mb-2">Or upload a logo image (max 5MB)</p>
                      
                      <Input 
                        id="logoUpload" 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      
                      {uploadedLogoPreview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Preview:</p>
                          <div className="w-32 h-32 relative border rounded">
                            <img
                              src={uploadedLogoPreview}
                              alt="Logo preview"
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Using default logo. Enable "Use custom logo" to upload your own.</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button onClick={saveGeneralSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save General Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Hero & Navigation Tab */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Configure the hero section on your homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Hero Title</Label>
                  <Input 
                    id="heroTitle"
                    value={heroTitle}
                    onChange={e => setHeroTitle(e.target.value)}
                    placeholder="Ace Your Math Competitive Exams" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                  <Textarea 
                    id="heroSubtitle"
                    value={heroSubtitle}
                    onChange={e => setHeroSubtitle(e.target.value)}
                    placeholder="Personalized coaching and comprehensive practice tests" 
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="heroPrimaryBtn">Primary Button Text</Label>
                    <Input 
                      id="heroPrimaryBtn"
                      value={heroPrimaryBtn}
                      onChange={e => setHeroPrimaryBtn(e.target.value)}
                      placeholder="Explore Courses" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="heroPrimaryBtnUrl">Primary Button URL</Label>
                    <Input 
                      id="heroPrimaryBtnUrl"
                      value={heroPrimaryBtnUrl}
                      onChange={e => setHeroPrimaryBtnUrl(e.target.value)}
                      placeholder="#courses" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="heroSecondaryBtn">Secondary Button Text</Label>
                    <Input 
                      id="heroSecondaryBtn"
                      value={heroSecondaryBtn}
                      onChange={e => setHeroSecondaryBtn(e.target.value)}
                      placeholder="Try Free Demo" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="heroSecondaryBtnUrl">Secondary Button URL</Label>
                    <Input 
                      id="heroSecondaryBtnUrl"
                      value={heroSecondaryBtnUrl}
                      onChange={e => setHeroSecondaryBtnUrl(e.target.value)}
                      placeholder="#" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heroImage">Hero Background Image URL</Label>
                  <Input 
                    id="heroImage"
                    value={heroImage}
                    onChange={e => setHeroImage(e.target.value)}
                    placeholder="https://example.com/background.jpg" 
                  />
                  <p className="text-sm text-muted-foreground">URL to the background image (recommended size: 1920x1080px)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Navigation Links</CardTitle>
                <CardDescription>Configure navigation menu items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {navLinks.map((link, index) => (
                  <div key={index} className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                      <Label>Link Text</Label>
                      <Input 
                        value={link.title}
                        onChange={e => updateNavLink(index, 'title', e.target.value)}
                        placeholder="Link Text" 
                      />
                    </div>
                    
                    <div className="space-y-2 flex-1">
                      <Label>Link URL</Label>
                      <Input 
                        value={link.path}
                        onChange={e => updateNavLink(index, 'path', e.target.value)}
                        placeholder="#section or /page" 
                      />
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => removeNavLink(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={addNavLink}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Navigation Link
                </Button>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button onClick={saveHeroSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Hero & Navigation'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Exam Information Tab */}
          <TabsContent value="exam" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exam Information</CardTitle>
                <CardDescription>Details about the entrance exam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="examName">Exam Name</Label>
                    <Input 
                      id="examName"
                      value={examName}
                      onChange={e => setExamName(e.target.value)}
                      placeholder="JET" 
                    />
                    <p className="text-sm text-muted-foreground">Short name of the exam (e.g., JET)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="examFullName">Full Exam Name</Label>
                    <Input 
                      id="examFullName"
                      value={examFullName}
                      onChange={e => setExamFullName(e.target.value)}
                      placeholder="Joint Entrance Test" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="examYear">Exam Year</Label>
                  <Input 
                    id="examYear"
                    value={examYear}
                    onChange={e => setExamYear(e.target.value)}
                    placeholder="2025" 
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="applicationStartDate">Application Start Date</Label>
                    <Input 
                      id="applicationStartDate"
                      value={applicationStartDate}
                      onChange={e => setApplicationStartDate(e.target.value)}
                      placeholder="February 20, 2025" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="applicationEndDate">Application End Date</Label>
                    <Input 
                      id="applicationEndDate"
                      value={applicationEndDate}
                      onChange={e => setApplicationEndDate(e.target.value)}
                      placeholder="March 30, 2025" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="examDate">Exam Date</Label>
                  <Input 
                    id="examDate"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    placeholder="May 14, 2025" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="universityName">University Name</Label>
                  <Input 
                    id="universityName"
                    value={universityName}
                    onChange={e => setUniversityName(e.target.value)}
                    placeholder="Swami Keshwanand Rajasthan Agricultural University, Bikaner" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="universityLogo">University Logo URL</Label>
                  <Input 
                    id="universityLogo"
                    value={universityLogo}
                    onChange={e => setUniversityLogo(e.target.value)}
                    placeholder="https://example.com/university-logo.png" 
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button onClick={saveExamInfo} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Exam Information'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Footer Tab */}
          <TabsContent value="footer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>Configure footer content and links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Input 
                    id="footerText"
                    value={footerText}
                    onChange={e => setFooterText(e.target.value)}
                    placeholder="© 2025 Maths Magic Town. All rights reserved." 
                  />
                  <p className="text-sm text-muted-foreground">Copyright text or disclaimer</p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="footerAddress">Address</Label>
                    <Textarea 
                      id="footerAddress"
                      value={footerAddress}
                      onChange={e => setFooterAddress(e.target.value)}
                      placeholder="123 Learning Street, Education City, IN 110001" 
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="footerPhone">Phone</Label>
                      <Input 
                        id="footerPhone"
                        value={footerPhone}
                        onChange={e => setFooterPhone(e.target.value)}
                        placeholder="+91 98765 43210" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="footerEmail">Email</Label>
                      <Input 
                        id="footerEmail"
                        value={footerEmail}
                        onChange={e => setFooterEmail(e.target.value)}
                        placeholder="contact@mathsmagictown.com" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label>Footer Links</Label>
                  {footerLinks.map((link, index) => (
                    <div key={index} className="flex items-end gap-4">
                      <div className="space-y-2 flex-1">
                        <Label>Link Text</Label>
                        <Input 
                          value={link.title}
                          onChange={e => updateFooterLink(index, 'title', e.target.value)}
                          placeholder="Terms of Service" 
                        />
                      </div>
                      
                      <div className="space-y-2 flex-1">
                        <Label>Link URL</Label>
                        <Input 
                          value={link.url}
                          onChange={e => updateFooterLink(index, 'url', e.target.value)}
                          placeholder="/terms" 
                        />
                      </div>
                      
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => removeFooterLink(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    onClick={addFooterLink}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Footer Link
                  </Button>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button onClick={saveFooterSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Footer Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Contact & Social Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Page Settings</CardTitle>
                <CardDescription>Configure the contact page content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactTitle">Contact Page Title</Label>
                    <Input 
                      id="contactTitle"
                      value={contactTitle}
                      onChange={e => setContactTitle(e.target.value)}
                      placeholder="Get In Touch" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input 
                      id="contactPhone"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactSubtitle">Contact Page Subtitle</Label>
                  <Textarea 
                    id="contactSubtitle"
                    value={contactSubtitle}
                    onChange={e => setContactSubtitle(e.target.value)}
                    placeholder="Have questions? Fill out the form below and we'll get back to you as soon as possible." 
                    rows={2}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactAddress">Contact Address</Label>
                    <Textarea 
                      id="contactAddress"
                      value={contactAddress}
                      onChange={e => setContactAddress(e.target.value)}
                      placeholder="123 Learning Street, Education City, IN 110001" 
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input 
                      id="contactEmail"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="contact@mathsmagictown.com" 
                    />
                    
                    <div className="pt-2">
                      <Label htmlFor="contactMapUrl">Google Maps Embed URL</Label>
                      <Input 
                        id="contactMapUrl"
                        value={contactMapUrl}
                        onChange={e => setContactMapUrl(e.target.value)}
                        placeholder="https://www.google.com/maps/embed?..." 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Configure social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="whatsappLink">WhatsApp Group Link</Label>
                    <Input 
                      id="whatsappLink"
                      value={whatsappLink}
                      onChange={e => setWhatsappLink(e.target.value)}
                      placeholder="https://whatsapp.com/channel/0029VbAudzTHbFV5ppcj0b07" 
                    />
                    <p className="text-sm text-muted-foreground">Link to your WhatsApp group or channel</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook</Label>
                    <Input 
                      id="facebookUrl"
                      value={facebookUrl}
                      onChange={e => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/youraccount" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">Twitter</Label>
                    <Input 
                      id="twitterUrl"
                      value={twitterUrl}
                      onChange={e => setTwitterUrl(e.target.value)}
                      placeholder="https://twitter.com/youraccount" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram</Label>
                    <Input 
                      id="instagramUrl"
                      value={instagramUrl}
                      onChange={e => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/youraccount" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn</Label>
                    <Input 
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={e => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/company/youraccount" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube</Label>
                    <Input 
                      id="youtubeUrl"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/@JET2025Support" 
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button onClick={updateContactSocial} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Contact & Social Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* SEO Settings Tab */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize your website for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Meta Title</Label>
                  <Input 
                    id="seoTitle"
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    placeholder="Maths Magic Town - Competitive Exam Coaching" 
                  />
                  <p className="text-sm text-muted-foreground">The title shown in search engine results (recommended length: 50-60 characters)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">Meta Description</Label>
                  <Textarea 
                    id="seoDescription"
                    value={seoDescription}
                    onChange={e => setSeoDescription(e.target.value)}
                    placeholder="Expert coaching for competitive exams. Get personalized doubt resolutions and practice tests." 
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">A brief description of your website (recommended length: 150-160 characters)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seoKeywords">Meta Keywords</Label>
                  <Input 
                    id="seoKeywords"
                    value={seoKeywords}
                    onChange={e => setSeoKeywords(e.target.value)}
                    placeholder="math coaching, JEE preparation, competitive exam, doubt resolution" 
                  />
                  <p className="text-sm text-muted-foreground">Comma-separated keywords related to your website</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ogImage">Social Sharing Image URL</Label>
                  <Input 
                    id="ogImage"
                    value={ogImage}
                    onChange={e => setOgImage(e.target.value)}
                    placeholder="https://example.com/og-image.jpg" 
                  />
                  <p className="text-sm text-muted-foreground">Image shown when your website is shared on social media (recommended size: 1200x630px)</p>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button onClick={saveSeoSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save SEO Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>Customize the look and feel of your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-4">
                      <Input 
                        id="primaryColor"
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input 
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        placeholder="#3B82F6" 
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">Main color used for buttons, links, and highlighting</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-4">
                      <Input 
                        id="secondaryColor"
                        type="color"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input 
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        placeholder="#10B981" 
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">Accent color used for secondary elements</p>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fontMain">Main Font</Label>
                    <Input 
                      id="fontMain"
                      value={fontMain}
                      onChange={e => setFontMain(e.target.value)}
                      placeholder="Inter, system-ui, sans-serif" 
                    />
                    <p className="text-sm text-muted-foreground">Font used for body text and general content</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fontHeadings">Headings Font</Label>
                    <Input 
                      id="fontHeadings"
                      value={fontHeadings}
                      onChange={e => setFontHeadings(e.target.value)}
                      placeholder="Poppins, system-ui, sans-serif" 
                    />
                    <p className="text-sm text-muted-foreground">Font used for headings and titles</p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button onClick={saveGeneralSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Theme Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}