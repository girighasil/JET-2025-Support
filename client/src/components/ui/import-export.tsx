import React, { useState } from 'react';
import { 
  DownloadCloud, 
  UploadCloud, 
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Label } from './label';
import { Alert, AlertDescription, AlertTitle } from './alert';

interface ImportExportProps {
  resourceType: string;
  onImportSuccess?: () => void;
  className?: string;
}

const ImportExport: React.FC<ImportExportProps> = ({ 
  resourceType, 
  onImportSuccess,
  className 
}) => {
  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message?: string;
    errors?: string[];
  } | null>(null);
  
  const handleExport = async () => {
    try {
      // Create hidden link to trigger download
      const link = document.createElement('a');
      link.href = `/api/import-export/${resourceType.toLowerCase()}s/export?format=${exportFormat}`;
      link.download = `${resourceType.toLowerCase()}s_export.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Started',
        description: `Your ${resourceType.toLowerCase()}s are being exported as ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your data. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleImportSubmit = async () => {
    if (!importFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to import.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch(`/api/import-export/${resourceType.toLowerCase()}s/import`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setUploadResult({
          success: true,
          message: result.message,
          errors: result.results?.errors,
        });
        
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        setUploadResult({
          success: false,
          message: result.error || 'Import failed',
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setUploadResult({
        success: false,
        message: error.message || 'Import failed unexpectedly',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    // Reset state when dialog closes
    setTimeout(() => {
      setImportFile(null);
      setUploadResult(null);
    }, 300);
  };
  
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={() => setImportDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <UploadCloud className="h-4 w-4" />
          Import
        </Button>
        
        <div className="flex gap-2">
          <Select
            defaultValue={exportFormat}
            onValueChange={setExportFormat}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import {resourceType}s</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import {resourceType.toLowerCase()}s. 
              The file should have the correct columns as in the exported format.
            </DialogDescription>
          </DialogHeader>
          
          {!uploadResult ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="import-file" className="w-24">File</Label>
                <div className="flex-1">
                  <input
                    id="import-file"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('import-file')?.click()}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      {importFile ? 'Change File' : 'Select File'}
                    </Button>
                    {importFile && (
                      <span className="text-sm text-muted-foreground truncate max-w-[220px]">
                        {importFile.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <Alert variant={uploadResult.success ? "default" : "destructive"}>
                <div className="flex items-start gap-3">
                  {uploadResult.success ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <AlertTitle>
                      {uploadResult.success ? 'Import Successful' : 'Import Failed'}
                    </AlertTitle>
                    <AlertDescription>
                      {uploadResult.message}
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Warnings/Errors:</p>
                          <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                            {uploadResult.errors.slice(0, 5).map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                            {uploadResult.errors.length > 5 && (
                              <li>...and {uploadResult.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            {!uploadResult ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCloseImportDialog}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleImportSubmit}
                  disabled={!importFile || isUploading}
                >
                  {isUploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isUploading ? 'Importing...' : 'Import'}
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseImportDialog}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExport;