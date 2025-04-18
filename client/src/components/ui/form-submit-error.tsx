import React from "react";
import { AlertCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface FormSubmitErrorProps {
  error?: string | null;
  className?: string;
  title?: string;
}

/**
 * FormSubmitError displays submission errors at the form level
 * 
 * Usage:
 * <FormSubmitError error={error} />
 */
export function FormSubmitError({ 
  error, 
  className, 
  title = "Error" 
}: FormSubmitErrorProps) {
  if (!error) return null;

  return (
    <Alert 
      variant="destructive" 
      className={cn("animate-shake", className)}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {title}
      </AlertTitle>
      <AlertDescription>
        {error}
      </AlertDescription>
    </Alert>
  );
}

export default FormSubmitError;