import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
const FormSubmitError: React.FC<FormSubmitErrorProps> = ({ 
  error, 
  className,
  title = "Error"
}) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={cn("my-4", className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

export default FormSubmitError;