import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  message?: string;
  className?: string;
}

/**
 * FormError component displays validation errors in a visually distinctive way
 * 
 * Usage:
 * <FormError message="Please enter a valid email" />
 */
const FormError: React.FC<FormErrorProps> = ({ message, className }) => {
  if (!message) return null;

  return (
    <div className={cn(
      "flex items-center gap-x-2 text-sm text-destructive font-medium p-3 border border-destructive/30 rounded-md bg-destructive/10 mt-2",
      className
    )}>
      <AlertCircle className="h-4 w-4" />
      <p>{message}</p>
    </div>
  );
};

export default FormError;