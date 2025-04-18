import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSubmitErrorProps {
  title?: string;
  message: string | null | undefined;
  className?: string;
}

/**
 * FormSubmitError displays a prominent error at the top of a form
 * This is used for API errors, submission failures, or other critical errors
 * that prevent successful form submission.
 * 
 * Usage:
 * <FormSubmitError 
 *   title="Login Failed" 
 *   message="Invalid username or password" 
 * />
 */
export function FormSubmitError({ title, message, className }: FormSubmitErrorProps) {
  if (!message) return null;

  return (
    <Alert 
      variant="destructive" 
      className={cn("mb-6 animate-shake", className)}
    >
      <AlertCircle className="h-4 w-4" />
      {title && <AlertTitle className="ml-2">{title}</AlertTitle>}
      <AlertDescription className="ml-2">
        {message}
      </AlertDescription>
    </Alert>
  );
}

export default FormSubmitError;