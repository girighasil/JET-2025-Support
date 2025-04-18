import React from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  File, 
  FileText, 
  Film, 
  Image as ImageIcon, 
  Music,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
}

interface MediaPreviewProps {
  file: FileItem;
  onRemove?: () => void;
  className?: string;
}

// Helper to format file size
const formatFileSize = (bytes?: number) => {
  if (bytes === undefined) return 'Unknown size';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Component to display an appropriate icon based on file type
const FileTypeIcon = ({ type }: { type: string }) => {
  if (type.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  } else if (type.startsWith('video/')) {
    return <Film className="h-5 w-5 text-purple-500" />;
  } else if (type.startsWith('audio/')) {
    return <Music className="h-5 w-5 text-green-500" />;
  } else if (type.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  } else if (
    type.includes('spreadsheet') || 
    type.includes('excel') ||
    type.includes('word') ||
    type.includes('document') ||
    type.includes('presentation')
  ) {
    return <FileText className="h-5 w-5 text-orange-500" />;
  } else {
    return <File className="h-5 w-5 text-gray-500" />;
  }
};

const MediaPreview: React.FC<MediaPreviewProps> = ({
  file,
  onRemove,
  className
}) => {
  const renderPreview = () => {
    // Image preview
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          <img 
            src={file.url} 
            alt={file.name}
            className="h-full w-full object-cover transition-all hover:scale-105"
          />
        </div>
      );
    }
    
    // Video preview
    if (file.type.startsWith('video/')) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-md">
          <video 
            src={file.url} 
            controls 
            className="h-full w-full"
            poster="/placeholder-video.jpg"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Audio preview
    if (file.type.startsWith('audio/')) {
      return (
        <div className="w-full rounded-md p-4 bg-muted flex items-center justify-center">
          <audio controls src={file.url} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }
    
    // PDF and other documents - just show icon
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-md">
        <div className="flex flex-col items-center gap-2 p-4">
          <FileTypeIcon type={file.type} />
          <span className="text-sm text-muted-foreground">{file.name}</span>
        </div>
      </div>
    );
  };
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileTypeIcon type={file.type} />
            <CardTitle className="text-sm font-medium truncate max-w-[200px]">
              {file.name}
            </CardTitle>
          </div>
          {onRemove && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {renderPreview()}
      </CardContent>
      <CardFooter className="p-3 flex justify-between items-center text-xs text-muted-foreground">
        <span>{file.type.split('/')[1]?.toUpperCase()}</span>
        <span>{formatFileSize(file.size)}</span>
      </CardFooter>
    </Card>
  );
};

export default MediaPreview;