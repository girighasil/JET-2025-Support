import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationMessageProps {
  message: string | null | undefined;
  type?: "error" | "warning" | "success" | "info";
  className?: string;
  showIcon?: boolean;
}

/**
 * ValidationMessage displays form validation messages with a consistent style
 * and color-coded indicators based on the message type.
 * 
 * Usage:
 * <ValidationMessage 
 *   message="Password must be at least 8 characters" 
 *   type="warning" 
 * />
 */
export function ValidationMessage({ 
  message, 
  type = "error", 
  className,
  showIcon = true
}: ValidationMessageProps) {
  if (!message) return null;

  const typeStyles = {
    error: "text-destructive",
    warning: "text-amber-500 dark:text-amber-400",
    success: "text-green-600 dark:text-green-400",
    info: "text-blue-600 dark:text-blue-400"
  };

  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div className={cn(
      "flex items-start gap-1.5 text-sm mt-1.5",
      typeStyles[type],
      className
    )}>
      {showIcon && (
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

export default ValidationMessage;