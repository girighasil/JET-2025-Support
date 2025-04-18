import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  FileSpreadsheet, 
  Download, 
  Upload,
  FileUp,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportExportProps {
  resourceType: string;
  onImportSuccess?: (data: any) => void;
  className?: string;
}

export const ImportExport: React.FC<ImportExportProps> = ({
  resourceType,
  onImportSuccess,
  className
}) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importState, setImportState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setImportState('uploading');
    setUploadProgress(0);
    
    try {
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);
      
      // File upload complete - now processing
      setUploadProgress(100);
      setImportState('processing');
      
      // Import the data
      const response = await apiRequest(
        'POST',
        `/api/import-export/import/${resourceType.toLowerCase()}s`,
        formData,
        { isFormData: true }
      );
      
      clearInterval(progressInterval);
      
      const result = await response.json();
      setImportResult(result);
      setImportState('success');
      
      if (onImportSuccess) {
        onImportSuccess(result);
      }
      
      toast({
        title: 'Import Successful',
        description: `Imported ${result.imported} of ${result.total} ${resourceType.toLowerCase()}s.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportState('error');
      setImportResult(error);
      
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: importState === 'uploading' || importState === 'processing'
  });
  
  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const response = await apiRequest(
        'GET',
        `/api/import-export/export/${resourceType.toLowerCase()}s?format=${format}`,
        undefined
      );
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${resourceType.toLowerCase()}s.${format === 'excel' ? 'xlsx' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Handle different export formats
      if (format === 'json') {
        const data = await response.json();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // For CSV and Excel, get blob from response
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: 'Export Successful',
        description: `${resourceType} data has been exported to ${format.toUpperCase()} format.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };
  
  const resetImport = () => {
    setImportState('idle');
    setUploadProgress(0);
    setImportResult(null);
  };
  
  const closeImportDialog = () => {
    setIsImportDialogOpen(false);
    setTimeout(resetImport, 300); // Reset after animation completes
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => handleExport('csv')}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
        
        <Button
          onClick={() => handleExport('excel')}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          Export Excel
        </Button>
        
        <Button
          onClick={() => handleExport('json')}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4 mr-1" />
          Export JSON
        </Button>
        
        <Button
          onClick={() => setIsImportDialogOpen(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4 mr-1" />
          Import
        </Button>
      </div>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={closeImportDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Import {resourceType}</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import {resourceType.toLowerCase()} data.
              Make sure the file has the correct format with required fields.
            </DialogDescription>
          </DialogHeader>
          
          {importState === 'idle' && (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-md p-10 text-center cursor-pointer mt-4",
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-1">
                {isDragActive ? "Drop the file here" : "Drag & drop a file here"}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          )}
          
          {(importState === 'uploading' || importState === 'processing') && (
            <div className="py-8">
              <div className="text-center mb-6">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">
                  {importState === 'uploading' ? 'Uploading...' : 'Processing file...'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {importState === 'uploading' 
                    ? 'Please wait while we upload your file' 
                    : 'Importing data into the system'}
                </p>
              </div>
              <Progress value={uploadProgress} className="h-2 w-full" />
            </div>
          )}
          
          {importState === 'success' && importResult && (
            <div className="py-8">
              <div className="text-center mb-6">
                <div className="bg-green-100 p-3 rounded-full inline-block mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-1">Import Successful</h3>
                <p className="text-sm">
                  Successfully imported {importResult.imported} of {importResult.total} {resourceType.toLowerCase()}s
                </p>
              </div>
              
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {importResult.errors.length} errors encountered
                      </p>
                      <ul className="list-disc pl-5 mt-2 text-xs text-yellow-700">
                        {importResult.errors.slice(0, 3).map((error: any, i: number) => (
                          <li key={i}>
                            Row {error.row}: {
                              typeof error.error === 'string' 
                                ? error.error 
                                : 'Validation error'
                            }
                          </li>
                        ))}
                        {importResult.errors.length > 3 && (
                          <li>...and {importResult.errors.length - 3} more errors</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {importState === 'error' && (
            <div className="py-8 text-center">
              <div className="bg-red-100 p-3 rounded-full inline-block mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium mb-1">Import Failed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {importResult instanceof Error 
                  ? importResult.message 
                  : 'An error occurred during import. Please try again.'}
              </p>
              <Button onClick={resetImport}>Try Again</Button>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            {importState === 'idle' && (
              <Button variant="outline" onClick={closeImportDialog}>Cancel</Button>
            )}
            {importState === 'success' && (
              <Button onClick={closeImportDialog}>Done</Button>
            )}
            {importState === 'error' && (
              <Button variant="outline" onClick={closeImportDialog}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExport;