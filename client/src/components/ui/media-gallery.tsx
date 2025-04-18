import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import MediaPreview, { FileItem } from './media-preview';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './dialog';
import {
  Card,
  CardContent
} from './card';
import { Button } from './button';
import { X } from 'lucide-react';

interface MediaGalleryProps {
  files: FileItem[];
  onRemove?: (file: FileItem) => void;
  className?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ 
  files, 
  onRemove,
  className 
}) => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  // Preview a file
  const handlePreview = (file: FileItem) => {
    setSelectedFile(file);
    setShowPreviewDialog(true);
  };

  // Handle removing a file
  const handleRemove = (file: FileItem) => {
    if (onRemove) {
      onRemove(file);
    }
  };
  
  if (files.length === 0) {
    return null;
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-medium">Media & Attachments</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <Card 
            key={file.id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handlePreview(file)}
          >
            <CardContent className="p-0 relative group">
              {/* File thumbnail/preview */}
              <div className="aspect-square w-full bg-muted relative flex items-center justify-center overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={file.url} 
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : file.type.startsWith('video/') ? (
                  <div className="flex flex-col items-center justify-center p-4 h-full w-full">
                    <video
                      src={file.url}
                      className="max-h-full max-w-full object-contain"
                      muted
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 h-full">
                    <div className="text-2xl mb-2">
                      {file.type.includes('pdf') ? '📄' : 
                       file.type.includes('audio') ? '🎵' :
                       file.type.includes('word') || file.type.includes('document') ? '📝' :
                       file.type.includes('excel') || file.type.includes('spreadsheet') ? '📊' :
                       file.type.includes('presentation') ? '📽️' : '📁'}
                    </div>
                    <p className="text-xs text-center font-medium truncate w-full">
                      {file.name}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Remove button overlay */}
              {onRemove && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(file);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
          </DialogHeader>
          
          {selectedFile && (
            <div className="mt-4">
              <MediaPreview 
                file={selectedFile} 
                className="w-full"
                onRemove={onRemove ? () => {
                  handleRemove(selectedFile);
                  setShowPreviewDialog(false);
                } : undefined}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaGallery;