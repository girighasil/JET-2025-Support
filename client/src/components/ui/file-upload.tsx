import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import {
  X,
  FileText,
  Image,
  Video,
  Headphones,
  File,
  Upload as UploadIcon,
  Loader2
} from 'lucide-react';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
}

interface FileUploadProps {
  onUpload: (files: FileItem[]) => void;
  onRemove?: (file: FileItem) => void;
  existingFiles?: FileItem[];
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  onRemove,
  existingFiles = [],
  accept,
  maxFiles = 5,
  maxSize = 50 * 1024 * 1024, // 50MB
  className
}) => {
  const [files, setFiles] = useState<FileItem[]>(existingFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      
      // Use array field name if multiple files
      if (acceptedFiles.length > 1) {
        acceptedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        // Upload files
        const simulateProgress = () => {
          setUploadProgress(prev => {
            if (prev >= 95) return prev;
            return prev + 5;
          });
        };
        
        // Simulate progress during upload
        const progressInterval = setInterval(simulateProgress, 100);
        
        const response = await apiRequest('POST', '/api/files/uploads', formData, { isFormData: true });
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        const uploadedFiles = await response.json();
        setFiles(prev => [...prev, ...uploadedFiles]);
        onUpload(uploadedFiles);
      } else {
        // Single file upload
        formData.append('file', acceptedFiles[0]);
        
        // Simulate progress during upload
        const simulateProgress = () => {
          setUploadProgress(prev => {
            if (prev >= 95) return prev;
            return prev + 5;
          });
        };
        
        const progressInterval = setInterval(simulateProgress, 100);
        
        // Use isFormData option for FormData handling
        const response = await apiRequest('POST', '/api/files/upload', formData, { isFormData: true });
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        const uploadedFile = await response.json();
        setFiles(prev => [...prev, uploadedFile]);
        onUpload([uploadedFile]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [onUpload]);

  const handleRemove = async (file: FileItem) => {
    try {
      // Only call API if we have a URL (skip for newly added files that might not be saved yet)
      if (file.url) {
        await apiRequest('DELETE', `/api/files/${file.id}`, { path: file.url });
      }
      
      setFiles(files.filter(f => f.id !== file.id));
      
      if (onRemove) {
        onRemove(file);
      }
    } catch (err) {
      console.error('Error removing file:', err);
      setError('Failed to remove file. Please try again.');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    maxSize,
    disabled: isUploading || files.length >= maxFiles
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-6 w-6 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-6 w-6 text-purple-500" />;
    if (type.startsWith('audio/')) return <Headphones className="h-6 w-6 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
          (isUploading || files.length >= maxFiles) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center gap-1">
          <UploadIcon className="h-8 w-8 text-muted-foreground mb-2" />
          
          {isUploading ? (
            <div className="text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
              Uploading...
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the files here" : "Drag & drop files here"}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
            </>
          )}
          
          {files.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {files.length} of {maxFiles} files added
            </p>
          )}
        </div>
      </div>

      {uploadProgress > 0 && (
        <div className="w-full space-y-1">
          <Progress value={uploadProgress} className="h-2 w-full" />
          <p className="text-xs text-right text-muted-foreground">
            {uploadProgress >= 100 ? 'Complete!' : `${uploadProgress}%`}
          </p>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map(file => (
            <li key={file.id} className="flex items-center justify-between bg-muted/40 rounded-md p-2">
              <div className="flex items-center gap-2 overflow-hidden">
                {getFileIcon(file.type)}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(file)}
                className="text-muted-foreground hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUpload;