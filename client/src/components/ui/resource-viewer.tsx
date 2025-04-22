import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, X, AlertTriangle, FileText, Globe, Video } from 'lucide-react';

interface ResourceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  resourceUrl: string;
  resourceType: string;
  resourceTitle: string;
  courseId: number;
  resourceIndex: number;
}

export function ResourceViewer({
  isOpen,
  onClose,
  resourceUrl,
  resourceType,
  resourceTitle,
  courseId,
  resourceIndex
}: ResourceViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'viewer' | 'external'>('viewer');
  
  // Resource proxy URL for secure viewing
  const proxyUrl = `/api/resource-proxy/${resourceIndex}?courseId=${courseId}`;
  
  // Reset states when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setActiveTab('viewer');
    }
  }, [isOpen]);
  
  // Handle load complete
  const handleLoadComplete = () => {
    setLoading(false);
  };
  
  // Handle load error
  const handleLoadError = () => {
    setLoading(false);
    setError('Failed to load the resource. Try opening it externally.');
  };

  // Get appropriate icon based on resource type
  const getResourceIcon = () => {
    switch(resourceType) {
      case 'webpage':
        return <Globe className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Render appropriate content based on resource type
  const renderResourceContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-10">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Resource Loading Error</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button 
            onClick={() => window.open(proxyUrl, '_blank')}
            variant="outline"
          >
            Try Opening Externally <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    }

    // Content renderers based on resource type
    switch(resourceType) {
      case 'webpage':
        return (
          <iframe
            src={proxyUrl}
            className="w-full h-[70vh] border-0"
            title={resourceTitle}
            onLoad={handleLoadComplete}
            onError={handleLoadError}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        );
      
      case 'pdf':
        return (
          <iframe
            src={proxyUrl}
            className="w-full h-[70vh] border-0"
            title={resourceTitle}
            onLoad={handleLoadComplete}
            onError={handleLoadError}
          />
        );
      
      case 'video':
        // For YouTube/Vimeo
        if (resourceUrl.includes('youtube.com') || resourceUrl.includes('youtu.be')) {
          const embedUrl = resourceUrl
            .replace('watch?v=', 'embed/')
            .replace('youtu.be/', 'youtube.com/embed/');
          
          return (
            <iframe
              src={embedUrl}
              className="w-full h-[70vh] border-0"
              title={resourceTitle}
              onLoad={handleLoadComplete}
              onError={handleLoadError}
              allowFullScreen
            />
          );
        }
        
        // For direct video files
        return (
          <video
            src={proxyUrl}
            className="w-full h-[70vh]"
            controls
            onLoadedData={handleLoadComplete}
            onError={handleLoadError}
          >
            Your browser does not support the video tag.
          </video>
        );
      
      // Default or document types
      default:
        return (
          <iframe
            src={proxyUrl}
            className="w-full h-[70vh] border-0"
            title={resourceTitle}
            onLoad={handleLoadComplete}
            onError={handleLoadError}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getResourceIcon()}
              <DialogTitle className="text-xl">{resourceTitle}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'viewer' | 'external')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="viewer">In-App Viewer</TabsTrigger>
            <TabsTrigger value="external">External Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="viewer" className="pt-4">
            <div className="border rounded-md overflow-hidden bg-gray-50">
              {renderResourceContent()}
            </div>
          </TabsContent>
          
          <TabsContent value="external" className="pt-4">
            <div className="p-8 text-center border rounded-md">
              <ExternalLink className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">External Resource</h3>
              <p className="text-gray-500 mb-6">
                This will open the resource in a new browser tab.
              </p>
              <Button
                onClick={() => window.open(proxyUrl, '_blank')}
              >
                Open External Link <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              Resource #{resourceIndex + 1}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}