import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, FileText, Loader2, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface ImportQuestionsProps {
  testId: number;
  onImportComplete?: () => void;
}

export default function ImportQuestions({ testId, onImportComplete }: ImportQuestionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: { created: number; errors: string[] };
  } | null>(null);

  // Reset state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setImportFile(null);
      setUploadProgress(0);
      setUploadResult(null);
    }
  };

  // Import questions mutation
  const importQuestionsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Create a promise that will handle upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              reject(JSON.parse(xhr.responseText));
            } catch (e) {
              reject({ error: 'Unknown error occurred' });
            }
          }
        });
        
        xhr.addEventListener('error', () => {
          reject({ error: 'Network error occurred' });
        });
        
        xhr.open('POST', `/api/tests/${testId}/questions/import`);
        xhr.send(formData);
      });
    },
    onSuccess: (data: any) => {
      setUploadResult({
        success: true,
        message: data.message,
        details: data.results
      });
      
      // Invalidate queries to refresh question list
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/questions`] });
      
      // Notify
      toast({
        title: 'Import Successful',
        description: `${data.results.created} questions were imported successfully.`,
      });
      
      // Call the callback if provided
      if (onImportComplete) {
        onImportComplete();
      }
    },
    onError: (error: any) => {
      setUploadResult({
        success: false,
        message: error.error || 'Failed to import questions',
        details: error.details
      });
      
      toast({
        title: 'Import Failed',
        description: error.error || 'There was an error importing the questions.',
        variant: 'destructive',
      });
    }
  });

  // Handle file import
  const handleImport = () => {
    if (!importFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to import.',
        variant: 'destructive',
      });
      return;
    }

    // Start the import process
    importQuestionsMutation.mutate(importFile);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Questions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Questions</DialogTitle>
          <DialogDescription>
            Upload a file with questions to import them into this test. 
            We support Excel (.xlsx), CSV (.csv), and Word (.docx) files.
          </DialogDescription>
        </DialogHeader>

        {!uploadResult ? (
          <Tabs defaultValue="excel" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="excel">Excel Format</TabsTrigger>
              <TabsTrigger value="word">Word Format</TabsTrigger>
            </TabsList>
            
            <TabsContent value="excel" className="space-y-4 mt-4">
              <div className="space-y-2">
                <p className="text-sm">
                  Use Excel format for structured data. Your Excel file should have the following columns:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>type - 'mcq', 'truefalse', 'fillblank', or 'subjective'</li>
                  <li>question - The question text</li>
                  <li>options - For MCQs, comma-separated options like "A:Option text,B:Another option"</li>
                  <li>correctAnswer - The correct answer(s), comma-separated for MCQs with multiple answers</li>
                  <li>points - Points value for the question (optional, defaults to 1)</li>
                  <li>negativePoints - Points deducted for wrong answers (optional, defaults to 0)</li>
                  <li>explanation - Explanation for the correct answer (optional)</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="word" className="space-y-4 mt-4">
              <div className="space-y-2">
                <p className="text-sm">
                  Use Word format for less structured content. Format your document as follows:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Each question should start with "Q:" or "Question:"</li>
                  <li>For MCQs, list options with A), B), C), etc.</li>
                  <li>Mark correct answers with "*" (e.g., "*A) Option text")</li>
                  <li>Add "Explanation:" followed by text to include explanations</li>
                  <li>Add "Points:" followed by a number for custom point values</li>
                  <li>Use "Type: [type]" to specify question type (defaults to mcq)</li>
                </ul>
              </div>
            </TabsContent>

            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="import-file">Upload File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv,.docx,.doc"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: Excel (.xlsx, .xls), CSV (.csv), Word (.docx, .doc)
                </p>
              </div>
              
              {importQuestionsMutation.isPending && (
                <div className="space-y-2">
                  <Label>Uploading...</Label>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
                </div>
              )}
            </div>
          </Tabs>
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
                  <AlertTitle>{uploadResult.success ? "Import Successful" : "Import Failed"}</AlertTitle>
                  <AlertDescription>
                    {uploadResult.message}
                    
                    {uploadResult.details && (
                      <div className="mt-2">
                        {uploadResult.details.created > 0 && (
                          <p>Successfully imported {uploadResult.details.created} questions.</p>
                        )}
                        
                        {uploadResult.details.errors && uploadResult.details.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-sm">Errors:</p>
                            <ul className="list-disc pl-5 text-sm mt-1 space-y-1 max-h-[200px] overflow-y-auto">
                              {uploadResult.details.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!importFile || importQuestionsMutation.isPending}
              >
                {importQuestionsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Import
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}