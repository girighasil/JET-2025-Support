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
      "flex items-center gap-2 text-destructive text-sm mt-1",
      className
    )}>
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
};

export default FormError;