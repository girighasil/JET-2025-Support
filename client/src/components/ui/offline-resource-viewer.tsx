import { useState, useEffect, useRef } from "react";
import { useOfflineResources } from "@/hooks/use-offline-resources";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Play, Clock, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OfflineResourceProps {
  resourceUrl: string;
  resourceType: string;
  resourceTitle: string;
  courseId?: number;
  moduleId?: number;
  allowDownload?: boolean;
}

export function OfflineResourceManager() {
  const { resources, isLoading, deleteResource, isDeleting } = useOfflineResources();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Offline Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Offline Resources</h2>
        <Card className="p-8 text-center">
          <CardTitle className="mb-2">No offline resources available</CardTitle>
          <CardDescription>
            Download course videos for offline viewing to access them when you don't have an internet connection.
          </CardDescription>
        </Card>
      </div>
    );
  }

  // Format file size to human-readable format
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Offline Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <Card key={resource.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="line-clamp-1">{resource.resourceTitle}</CardTitle>
                <Badge variant={resource.status === 'active' ? 'default' : 'destructive'}>
                  {resource.status === 'active' ? 'Active' : 'Expired'}
                </Badge>
              </div>
              <CardDescription className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>Expires: {formatDate(resource.expiresAt)}</span>
              </CardDescription>
              <div className="text-xs text-muted-foreground mt-1">
                {formatFileSize(resource.fileSize)}
              </div>
            </CardHeader>
            
            <CardFooter className="flex justify-between">
              <OfflineResourcePlayer 
                resourceId={resource.resourceId} 
                resourceTitle={resource.resourceTitle}
              />
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteResource(resource.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface OfflineResourcePlayerProps {
  resourceId: string;
  resourceTitle: string;
}

function OfflineResourcePlayer({ resourceId, resourceTitle }: OfflineResourcePlayerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { playDecryptedVideo } = useOfflineResources();

  const handlePlay = async () => {
    try {
      setLoading(true);
      await playDecryptedVideo(resourceId, `offline-video-${resourceId}`);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Playback Error",
        description: error instanceof Error ? error.message : "Failed to play video",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Clean up when dialog closes
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Play className="h-4 w-4 mr-1" />
          Play Offline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{resourceTitle}</DialogTitle>
          <DialogDescription>
            Offline playback - secure, encrypted video
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative min-h-[300px] bg-muted rounded-md overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          <video
            id={`offline-video-${resourceId}`}
            ref={videoRef}
            className="w-full h-auto max-h-[50vh]"
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handlePlay} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OfflineResourceButton({ 
  resourceUrl,
  resourceType,
  resourceTitle,
  courseId,
  moduleId,
  allowDownload = true 
}: OfflineResourceProps) {
  const { downloadResource, isDownloading } = useOfflineResources();
  
  const handleDownload = () => {
    downloadResource({
      resourceUrl,
      resourceType,
      resourceTitle,
      courseId,
      moduleId
    });
  };
  
  if (!allowDownload) return null;
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDownload} 
      disabled={isDownloading}
      className="ml-auto"
    >
      {isDownloading ? (
        <>
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-1" />
          Save Offline
        </>
      )}
    </Button>
  );
}