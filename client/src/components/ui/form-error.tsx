import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  message: string;
  className?: string;
}

/**
 * FormError displays validation or submission errors in a subtle format
 * This is primarily used for field-level errors that need distinct visual styling
 * from full form submission errors.
 * 
 * Usage:
 * <FormError message="Please enter a valid email address" />
 */
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "py-2 px-3 mt-1 bg-destructive/10 border-destructive/20 text-destructive animate-shake", 
        className
      )}
    >
      <div className="flex gap-2 items-start">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <AlertDescription className="text-sm">
          {message}
        </AlertDescription>
      </div>
    </Alert>
  );
}

export default FormError;