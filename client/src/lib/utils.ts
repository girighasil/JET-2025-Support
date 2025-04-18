import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * User-friendly error messages for common validation errors
 */
export const userFriendlyErrors: Record<string, string> = {
  // URL validation errors
  "invalid_string": "Please enter a valid URL (e.g., https://example.com)",
  "invalid_url": "Please enter a valid URL including http:// or https://",
  
  // Required field errors
  "required_error": "This field is required",
  
  // String errors
  "too_small": "This input is too short",
  "too_big": "This input is too long",
  
  // Number errors
  "not_finite": "Please enter a valid number",
  "invalid_type": "Please enter a valid number",
  
  // Date errors
  "invalid_date": "Please enter a valid date",
  
  // Email errors
  "invalid_email": "Please enter a valid email address",
  
  // Generic errors
  "custom": "This input is invalid",
  "invalid_literal": "This input is not valid",
  "server_error": "Something went wrong. Please try again.",
  "unauthorized": "You are not authorized to perform this action",
  "not_found": "The requested resource was not found"
}

/**
 * Formats Zod validation errors into user-friendly messages
 */
export function formatZodError(error: z.ZodError): string {
  const firstError = error.errors[0];
  const errorCode = firstError.code;
  const path = firstError.path.join('.');
  
  // Get user-friendly message or use the default zod message
  const message = userFriendlyErrors[errorCode] || firstError.message;
  
  // Format the field name for better readability
  const fieldName = path ? formatFieldName(path) : 'Input';
  
  return `${fieldName}: ${message}`;
}

/**
 * Formats a field name from camelCase to Title Case with spaces
 */
function formatFieldName(fieldName: string): string {
  // Convert camelCase to space-separated words
  const formatted = fieldName
    .replace(/([A-Z])/g, ' $1')  // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase());  // Capitalize first letter
  
  return formatted;
}

/**
 * Handles API errors from various sources and shows user-friendly toast notifications
 */
export function handleApiError(error: any) {
  console.error("API Error:", error);
  
  let errorMessage = "Something went wrong. Please try again.";
  
  if (error.response) {
    // Server responded with an error
    const data = error.response.data;
    
    if (data.message && typeof data.message === 'string') {
      errorMessage = data.message;
    } else if (data.message && Array.isArray(data.message)) {
      // Handle Zod validation errors from server
      if (data.message[0]?.validation && data.message[0]?.path) {
        const field = data.message[0].path[0] || 'Input';
        const fieldName = formatFieldName(field);
        const errorCode = data.message[0].validation;
        errorMessage = `${fieldName}: ${userFriendlyErrors[errorCode] || data.message[0].message || 'is invalid'}`;
      } else {
        errorMessage = data.message[0]?.message || errorMessage;
      }
    }
  } else if (error.message) {
    // Client-side error with message property
    errorMessage = error.message;
    
    // Handle network errors
    if (errorMessage === 'Network Error') {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    }
  }
  
  // Show the error toast
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
  
  return errorMessage;
}
