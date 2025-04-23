import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {
  ExternalLink,
  X,
  AlertTriangle,
  FileText,
  Globe,
  Video,
  Download,
  RefreshCw,
  Youtube,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedVideoPlayer } from "@/components/ui/enhanced-video-player";

interface DirectResourceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  resourceUrl: string;
  resourceType: string;
  resourceTitle: string;
  courseId: number;
  resourceIndex: number;
}

// Type guard to check if a URL is from YouTube
function isYouTubeUrl(url: string): boolean {
  // More comprehensive check for YouTube URLs with proper domain boundaries
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

// Type guard to check if a URL is from Vimeo
function isVimeoUrl(url: string): boolean {
  // More comprehensive check for Vimeo URLs with proper domain boundaries
  return /^(https?:\/\/)?(www\.)?vimeo\.com\//i.test(url);
}

// Convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string {
  try {
    // Parameters to keep only play/pause, playback speed, and fullscreen buttons
    const params = `origin=${window.location.origin}&controls=1&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&fs=1&disablekb=1&loop=0&color=white&cc_load_policy=0&playsinline=1&channel=0`;
    
    if (url.includes("youtu.be/")) {
      // Short youtu.be links
      const videoId = url.split("youtu.be/")[1].split("?")[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?${params}`;
      }
    } else if (url.includes("youtube.com/watch")) {
      // Regular youtube.com links
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?${params}`;
      }
    } else if (url.includes("youtube.com/embed/")) {
      // Already an embed URL, but let's ensure it has our additional parameters
      const videoId = url.split("youtube.com/embed/")[1].split("?")[0];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?${params}`;
      }
    }
  } catch (e) {
    console.error("Error parsing YouTube URL:", e);
  }
  return url;
}

// Convert Vimeo URL to embed URL
function getVimeoEmbedUrl(url: string): string {
  try {
    // Extract Vimeo ID using regex for more reliable parsing
    const vimeoRegex =
      /vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(vimeoRegex);

    if (match && match[1]) {
      // Create a well-formed embed URL with appropriate parameters
      return `https://player.vimeo.com/video/${match[1]}?autoplay=0&portrait=0&dnt=1&title=0&byline=0`;
    }
  } catch (e) {
    console.error("Error parsing Vimeo URL:", e);
  }
  return url;
}

// Determine if a URL is a direct media file
function isDirectMediaFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mp3|wav|jpg|jpeg|png|gif|pdf)$/i.test(url);
}

// Get file extension from URL
function getFileExtension(url: string): string {
  return url.split(".").pop()?.toLowerCase() || "";
}

// Get media type from URL
function getMediaType(
  url: string,
): "video" | "audio" | "image" | "pdf" | "webpage" | "unknown" {
  const extension = getFileExtension(url);
  if (["mp4", "webm", "ogg", "mov"].includes(extension)) return "video";
  if (["mp3", "wav", "ogg"].includes(extension)) return "audio";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension))
    return "image";
  if (extension === "pdf") return "pdf";
  if (isYouTubeUrl(url) || isVimeoUrl(url)) return "video";
  return "webpage";
}

export function DirectResourceViewer({
  isOpen,
  onClose,
  resourceUrl,
  resourceType,
  resourceTitle,
  courseId,
  resourceIndex,
}: DirectResourceViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Determine the correct media type based on URL analysis, not just the provided resourceType
  const [mediaType, setMediaType] = useState<
    "video" | "audio" | "image" | "pdf" | "webpage" | "unknown"
  >("unknown");

  // Setup initial state and type detection
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);

      // Determine the media type based on URL
      const detectedType = getMediaType(resourceUrl);
      setMediaType(detectedType);

      // For websites and PDFs, don't even try to load them in the iframe
      // Just show the appropriate info screens immediately
      if (detectedType === "webpage") {
        // Websites generally can't be embedded due to CORS, so skip loading
        setLoading(false);
      } else if (
        resourceType === "other" &&
        !isYouTubeUrl(resourceUrl) &&
        !isVimeoUrl(resourceUrl)
      ) {
        // For "other" type that's not a video, also skip the loading process
        setLoading(false);
      }
    }
  }, [isOpen, resourceUrl, resourceType]);

  // Set a separate short timeout for any resource still loading
  useEffect(() => {
    if (isOpen && loading) {
      const timeout = setTimeout(() => {
        console.log("Resource loading timeout");
        setLoading(false);

        // Don't show error for YouTube/Vimeo - they might still be loading but visible
        if (
          !(
            mediaType === "video" &&
            (isYouTubeUrl(resourceUrl) || isVimeoUrl(resourceUrl))
          )
        ) {
          setError(
            "Resource loading timed out. The content might be blocked or unavailable.",
          );
        }
      }, 5000); // Shorter timeout of 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [isOpen, loading, mediaType, resourceUrl]);

  // Handle load complete
  const handleLoadComplete = () => {
    console.log("Resource loaded successfully");
    setLoading(false);
  };

  // Handle load error
  const handleLoadError = () => {
    console.log("Resource load error");
    setLoading(false);
    setError("Failed to load the resource. Try opening it externally.");
  };

  // Handle direct download
  const handleDownload = () => {
    window.open(resourceUrl, "_blank");
    toast({
      title: "Download Started",
      description: "Your download should begin in a new tab.",
    });
  };

  // Get appropriate icon based on resource type
  const getResourceIcon = () => {
    switch (mediaType) {
      case "webpage":
        return <Globe className="h-5 w-5" />;
      case "video":
        return isYouTubeUrl(resourceUrl) ? (
          <Youtube className="h-5 w-5" />
        ) : (
          <Video className="h-5 w-5" />
        );
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "pdf":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Video embed auto-detection
  useEffect(() => {
    if (
      isOpen &&
      mediaType === "video" &&
      (isYouTubeUrl(resourceUrl) || isVimeoUrl(resourceUrl))
    ) {
      // Mark as loaded after a short delay for video embeds
      const timer = setTimeout(() => {
        handleLoadComplete();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, resourceUrl, mediaType]);

  // Render YouTube or Vimeo embed
  const renderVideoEmbed = () => {
    let embedUrl = resourceUrl;

    if (isYouTubeUrl(resourceUrl)) {
      embedUrl = getYouTubeEmbedUrl(resourceUrl);
    } else if (isVimeoUrl(resourceUrl)) {
      embedUrl = getVimeoEmbedUrl(resourceUrl);
    }

    // For YouTube and Vimeo, we'll use a custom container with error handling
    return (
      <div className="w-full h-[70vh] bg-black relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        <div className="relative w-full h-full">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={resourceTitle}
            allowFullScreen
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {isYouTubeUrl(resourceUrl) && (
            <>
              {/* Black overlay to hide YouTube logo/branding in the bottom right corner */}
              <div className="absolute bottom-0 right-0 w-[90px] h-[40px] bg-black z-10"></div>
              {/* Additional overlay to hide top-right YouTube UI elements if they appear */}
              <div className="absolute top-0 right-0 w-[120px] h-[40px] bg-black z-10"></div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render direct video file
  const renderDirectVideo = () => {
    return (
      <EnhancedVideoPlayer
        src={resourceUrl}
        title={resourceTitle}
        onLoadComplete={handleLoadComplete}
        onError={handleLoadError}
        onDownload={handleDownload}
        className="rounded-md overflow-hidden"
      />
    );
  };

  // Render direct image
  const renderImage = () => {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-black h-[70vh]">
        <img
          src={resourceUrl}
          alt={resourceTitle}
          className="max-w-full max-h-[calc(70vh-40px)] object-contain"
          onLoad={handleLoadComplete}
          onError={handleLoadError}
        />
      </div>
    );
  };

  // Render PDF
  const renderPDF = () => {
    return (
      <div className="relative h-[70vh]">
        <iframe
          src={resourceUrl}
          className="w-full h-full border-0"
          title={resourceTitle}
          onLoad={handleLoadComplete}
          onError={handleLoadError}
        />
        <div className="absolute top-2 right-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="bg-white/80 backdrop-blur-sm"
          >
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>
    );
  };

  // Render website - with special handling for websites that might block embedding
  const renderWebsite = () => {
    // For external websites that might block embedding, just show an info screen
    return (
      <div className="flex flex-col items-center justify-center p-10 h-[70vh] text-center bg-gray-50">
        <Globe className="h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">External Website</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          Due to security restrictions, many websites cannot be displayed
          directly in the app viewer.
        </p>
        <Button
          onClick={() => window.open(resourceUrl, "_blank")}
          variant="default"
        >
          Open Website <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => {
    return (
      <div className="flex items-center justify-center p-10 h-[70vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  };

  // Render error state
  const renderError = () => {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center h-[70vh]">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Resource Loading Error</h3>
        <p className="text-gray-500 mb-4">{error}</p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            onClick={() => {
              setLoading(true);
              setError(null);
              // Simple reload mechanism
              setTimeout(() => setLoading(false), 100);
            }}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Open in New Tab
          </Button>
        </div>

        <p className="text-gray-400 text-xs mt-6 max-w-md">
          Some external resources may have restrictions that prevent embedding.
          Try opening the resource in a new tab, or contact your instructor if
          the problem persists.
        </p>
      </div>
    );
  };

  // Render the main content based on state and media type
  const renderContent = () => {
    if (loading) {
      return renderLoading();
    }

    if (error) {
      return renderError();
    }

    // Render based on media type
    switch (mediaType) {
      case "video":
        if (isYouTubeUrl(resourceUrl) || isVimeoUrl(resourceUrl)) {
          return renderVideoEmbed();
        } else {
          return renderDirectVideo();
        }
      case "image":
        return renderImage();
      case "pdf":
        return renderPDF();
      case "webpage":
      default:
        return renderWebsite();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getResourceIcon()}
            <DialogTitle className="text-xl">{resourceTitle}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {mediaType === "video" && isYouTubeUrl(resourceUrl)
              ? "YouTube video player"
              : `Viewing a ${mediaType} resource`}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          <div className="border rounded-md overflow-hidden bg-gray-50">
            {renderContent()}
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-end w-full">
            <div className="text-sm text-gray-500">
              Resource #{resourceIndex + 1}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
