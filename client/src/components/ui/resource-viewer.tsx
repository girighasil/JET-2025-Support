import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  X,
  AlertTriangle,
  FileText,
  Globe,
  Video,
  Download,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedVideoPlayer } from "@/components/ui/enhanced-video-player";

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
  resourceIndex,
}: ResourceViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"viewer" | "external">("viewer");
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resource proxy URL for secure viewing
  const proxyUrl = `/api/resource-proxy/${resourceIndex}?courseId=${courseId}`;

  // Reset states when dialog opens and set a timeout to detect failed loads
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setActiveTab("viewer");
      
      // Set a timeout to detect if loading takes too long
      // This handles cases where the iframe doesn't trigger onLoad/onError events
      loadTimeoutRef.current = setTimeout(() => {
        if (loading) {
          console.log("Resource loading timeout - might be blocked or unavailable");
          setLoading(false);
          setError("Resource loading timed out. The content might be blocked by the provider or unavailable.");
        }
      }, 10000); // 10-second timeout
    }

    // Clean up timeout on component unmount or dialog close
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isOpen, loading]);

  // Handle load complete
  const handleLoadComplete = () => {
    console.log("Resource loaded successfully");
    
    // Clear the timeout since content loaded successfully
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    
    setLoading(false);
  };

  // Handle load error
  const handleLoadError = () => {
    console.log("Resource load error");
    
    // Clear the timeout since we already know there's an error
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    
    setLoading(false);
    setError("Failed to load the resource. Try opening it externally.");
  };

  // Try reloading the resource
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Force reload by updating the iframe src
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
    
    toast({
      title: "Retrying...",
      description: "Attempting to load the resource again.",
    });
  };

  // Handle direct download
  const handleDownload = () => {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = resourceTitle || 'resource';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Download Started",
      description: "Your download should begin shortly. If not, try the external link option.",
    });
  };

  // Get appropriate icon based on resource type
  const getResourceIcon = () => {
    switch (resourceType) {
      case "webpage":
        return <Globe className="h-5 w-5" />;
      case "video":
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
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={handleRetry}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button
              onClick={() => window.open(proxyUrl, "_blank")}
              variant="outline"
            >
              Open Externally <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    // Common iframe props
    const commonIframeProps = {
      ref: iframeRef,
      src: proxyUrl,
      className: "w-full h-[70vh] border-0",
      title: resourceTitle,
      onLoad: handleLoadComplete,
      onError: handleLoadError,
    };

    // Content renderers based on resource type
    switch (resourceType) {
      case "webpage":
        return (
          <iframe
            {...commonIframeProps}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        );

      case "pdf":
        return (
          <div className="relative">
            <iframe {...commonIframeProps} />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-background/80 backdrop-blur-sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" /> Download PDF
              </Button>
            </div>
          </div>
        );

      case "video":
        // For YouTube/Vimeo or any video content
        if (resourceUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
          // Direct video file with enhanced player
          return (
            <EnhancedVideoPlayer 
              src={proxyUrl}
              title={resourceTitle}
              onLoadComplete={handleLoadComplete}
              onError={handleLoadError}
              onDownload={handleDownload}
              className="rounded-md overflow-hidden"
            />
          );
        }
        
        // Embedded videos (YouTube, Vimeo etc.)
        return (
          <iframe
            {...commonIframeProps}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        );

      // Default or document types
      default:
        return <iframe {...commonIframeProps} />;
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

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "viewer" | "external")
          }
        >
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
              <Button onClick={() => window.open(proxyUrl, "_blank")}>
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
