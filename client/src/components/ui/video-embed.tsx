import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { XCircle, Video, PlayCircle, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface VideoEmbedProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  showPreview?: boolean;
}

// Helper functions to handle different video URLs
const getYoutubeEmbedUrl = (url: string): string | null => {
  // Match YouTube URLs
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const getVimeoEmbedUrl = (url: string): string | null => {
  // Match Vimeo URLs
  const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|)(\d+)(?:|\/\?)/;
  const match = url.match(regExp);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
};

const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Try to determine the video platform
  const youtubeUrl = getYoutubeEmbedUrl(url);
  if (youtubeUrl) return youtubeUrl;
  
  const vimeoUrl = getVimeoEmbedUrl(url);
  if (vimeoUrl) return vimeoUrl;
  
  // If it already looks like an embed URL, return it as is
  if (url.includes('/embed/') || url.includes('player.')) {
    return url;
  }
  
  // If URL ends with common video extensions, it might be a direct video file
  if (/\.(mp4|webm|ogv)$/.test(url)) {
    return url;
  }
  
  return null;
};

const VideoEmbed: React.FC<VideoEmbedProps> = ({ value, onChange, className }) => {
  const [inputValue, setInputValue] = useState(value);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  
  const embedUrl = getEmbedUrl(value);
  const hasVideo = !!embedUrl;
  
  const handleAdd = () => {
    setIsValidating(true);
    
    const newEmbedUrl = getEmbedUrl(inputValue);
    
    if (newEmbedUrl) {
      onChange(inputValue);
      toast({
        title: 'Video Added',
        description: 'The video has been successfully added.',
      });
    } else {
      toast({
        title: 'Invalid Video URL',
        description: 'Please enter a valid YouTube, Vimeo, or direct video file URL.',
        variant: 'destructive',
      });
    }
    
    setIsValidating(false);
  };
  
  const handleRemove = () => {
    onChange('');
    setInputValue('');
    toast({
      title: 'Video Removed',
      description: 'The video has been removed.',
    });
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {!hasVideo ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter YouTube, Vimeo, or direct video URL"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <Button 
              onClick={handleAdd}
              disabled={isValidating || !inputValue}
              type="button"
            >
              Add Video
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://vimeo.com/123456789
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md overflow-hidden border">
            {embedUrl && embedUrl.endsWith('.mp4') ? (
              // Direct video file
              <video 
                src={embedUrl} 
                controls 
                className="w-full aspect-video"
                poster="/placeholder-video.jpg"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              // Embed iframe
              <div className="relative aspect-video w-full">
                <iframe
                  src={embedUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Embedded video"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm truncate flex-1 overflow-hidden">{value}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRemove}
              className="gap-1 text-destructive hover:text-destructive hover:border-destructive"
              type="button"
            >
              <XCircle className="h-4 w-4" />
              Remove Video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoEmbed;