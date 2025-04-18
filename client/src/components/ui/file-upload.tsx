import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  X, 
  File as FileIcon, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  PlusCircle,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import MediaPreview from './media-preview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
}

interface FileUploadProps {
  existingFiles?: FileItem[];
  onUpload: (files: FileItem[]) => void;
  onRemove: (file: FileItem) => void;
  maxFiles?: number;
  maxSize?: number; // In bytes
  accept?: Record<string, string[]>;
  label?: string;
  className?: string;
}

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
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  }
};

// Helper to format file size
const formatFileSize = (bytes?: number) => {
  if (bytes === undefined) return 'Unknown size';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  existingFiles = [],
  onUpload,
  onRemove,
  maxFiles = 5,
  maxSize = 50 * 1024 * 1024, // 50MB default
  accept,
  label = 'Drop files here or click to upload',
  className
}) => {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const totalFiles = existingFiles.length + uploadingFiles.length;
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (totalFiles + acceptedFiles.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only upload a maximum of ${maxFiles} files.`,
        variant: 'destructive'
      });
      return;
    }
    
    // Prepare files for upload tracking
    const filesToUpload: UploadingFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0
    }));
    
    setUploadingFiles(prev => [...prev, ...filesToUpload]);
    
    // Process each file
    const uploadedFiles: FileItem[] = [];
    
    for (const uploadingFile of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', uploadingFile.file);
        
        // Use XHR for progress tracking
        const xhr = new XMLHttpRequest();
        
        // Create a promise to await the XHR response
        const uploadPromise = new Promise<FileItem>((resolve, reject) => {
          xhr.open('POST', '/api/files/upload');
          
          // Track upload progress
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadingFiles(files => 
                files.map(f => 
                  f.id === uploadingFile.id ? { ...f, progress } : f
                )
              );
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            reject(new Error('Network error occurred during upload'));
          };
          
          xhr.send(formData);
        });
        
        // Wait for upload to complete
        const uploadedFile = await uploadPromise;
        uploadedFiles.push(uploadedFile);
        
        // Remove from uploading list
        setUploadingFiles(files => 
          files.filter(f => f.id !== uploadingFile.id)
        );
      } catch (error: any) {
        console.error('File upload error:', error);
        
        // Update the file with error state
        setUploadingFiles(files => 
          files.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, error: error.message || 'Upload failed' } 
              : f
          )
        );
        
        toast({
          title: 'Upload Failed',
          description: error.message || 'Failed to upload file. Please try again.',
          variant: 'destructive'
        });
      }
    }
    
    // Notify parent of successful uploads
    if (uploadedFiles.length > 0) {
      onUpload(uploadedFiles);
    }
  }, [totalFiles, maxFiles, toast, onUpload]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxSize,
    maxFiles: maxFiles - existingFiles.length,
    accept,
    disabled: totalFiles >= maxFiles
  });
  
  const handleRemoveExisting = async (file: FileItem) => {
    try {
      // Call API to delete the file
      await apiRequest('DELETE', `/api/files/${file.id}`, { path: file.url });
      
      // Notify parent to update state
      onRemove(file);
      
      toast({
        title: 'File Removed',
        description: `${file.name} has been removed.`
      });
    } catch (error: any) {
      console.error('Error removing file:', error);
      toast({
        title: 'Error',
        description: `Failed to remove file: ${error.message}`,
        variant: 'destructive'
      });
    }
  };
  
  const handleCancelUpload = (id: string) => {
    setUploadingFiles(files => files.filter(f => f.id !== id));
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={cn(
          'border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50',
          totalFiles >= maxFiles ? 'opacity-50 cursor-not-allowed' : '',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{label}</p>
          {totalFiles >= maxFiles ? (
            <p className="text-xs text-red-500">Maximum file limit reached</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          )}
        </div>
      </div>
      
      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          <ul className="space-y-2">
            {existingFiles.map((file) => (
              <li 
                key={file.id} 
                className="flex items-center justify-between p-2 rounded-md border bg-background"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileTypeIcon type={file.type} />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary h-7 px-2"
                    onClick={() => {
                      setPreviewFile(file);
                      setShowPreviewDialog(true);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveExisting(file)}
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Files in progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading</h4>
          <ul className="space-y-2">
            {uploadingFiles.map((file) => (
              <li 
                key={file.id} 
                className={cn(
                  "flex items-center justify-between p-2 rounded-md border",
                  file.error ? "border-destructive bg-destructive/5" : "bg-background"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  {file.error ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <FileTypeIcon type={file.file.type} />
                  )}
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    {file.error ? (
                      <p className="text-xs text-destructive">{file.error}</p>
                    ) : (
                      <div className="w-full pt-1">
                        <Progress value={file.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {file.error ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelUpload(file.id)}
                      className="h-7 w-7 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : file.progress < 100 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelUpload(file.id)}
                      className="h-7 w-7 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Add more button */}
      {totalFiles > 0 && totalFiles < maxFiles && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add More Files
        </Button>
      )}
      
      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
          </DialogHeader>
          
          {previewFile && (
            <div className="mt-4">
              <MediaPreview 
                file={previewFile} 
                className="w-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileUpload;