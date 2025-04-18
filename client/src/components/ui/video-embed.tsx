import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Youtube, Video as VideoIcon } from 'lucide-react';

interface VideoEmbedProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export const VideoEmbed: React.FC<VideoEmbedProps> = ({ value, onChange, className }) => {
  const [inputUrl, setInputUrl] = useState(value || '');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Parse video ID from different formats of YouTube URLs
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Parse video ID from Vimeo URLs
  const getVimeoVideoId = (url: string): string | null => {
    const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[5] : null;
  };

  // Check if URL is a valid video URL
  const validateUrl = (url: string): { isValid: boolean; type?: 'youtube' | 'vimeo' | 'direct'; id?: string } => {
    // Check if YouTube
    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      return { isValid: true, type: 'youtube', id: youtubeId };
    }

    // Check if Vimeo
    const vimeoId = getVimeoVideoId(url);
    if (vimeoId) {
      return { isValid: true, type: 'vimeo', id: vimeoId };
    }

    // Check if direct video URL
    if (/\.(mp4|webm|ogg)$/i.test(url)) {
      return { isValid: true, type: 'direct' };
    }

    return { isValid: false };
  };

  const handleApply = () => {
    setIsValidating(true);
    
    try {
      const result = validateUrl(inputUrl);
      
      if (result.isValid) {
        let finalUrl = inputUrl;
        
        // Convert to embed URL if needed
        if (result.type === 'youtube' && result.id) {
          finalUrl = `https://www.youtube.com/embed/${result.id}`;
        } else if (result.type === 'vimeo' && result.id) {
          finalUrl = `https://player.vimeo.com/video/${result.id}`;
        }
        
        onChange(finalUrl);
        toast({
          title: 'Video URL saved',
          description: 'The video will now be embedded in the course.'
        });
      } else {
        toast({
          title: 'Invalid video URL',
          description: 'Please enter a valid YouTube, Vimeo, or direct video URL.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error processing video URL:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while processing the video URL.',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setInputUrl('');
    onChange('');
  };

  const renderVideoPreview = () => {
    if (!value) return null;
    
    const result = validateUrl(value);
    
    if (result.isValid) {
      if (result.type === 'youtube' || result.type === 'vimeo' || value.includes('embed')) {
        return (
          <div className="relative aspect-video w-full rounded-md overflow-hidden border">
            <iframe
              src={value}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      } else if (result.type === 'direct') {
        return (
          <div className="relative aspect-video w-full rounded-md overflow-hidden border">
            <video
              src={value}
              controls
              className="absolute inset-0 w-full h-full"
            />
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <Input
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter YouTube, Vimeo, or direct video URL"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={isValidating || !inputUrl}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <VideoIcon className="h-4 w-4 mr-1" />
          )}
          Apply
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {renderVideoPreview()}
      
      {!value && (
        <div className="p-8 border border-dashed rounded-md flex items-center justify-center flex-col text-muted-foreground">
          <Youtube className="h-8 w-8 mb-2" />
          <p className="text-sm text-center">Add a video to enhance your course</p>
          <p className="text-xs text-center mt-1">YouTube, Vimeo, or direct video URLs supported</p>
        </div>
      )}
    </div>
  );
};

export default VideoEmbed;