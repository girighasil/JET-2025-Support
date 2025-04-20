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
 * Handles API errors from various sources and returns user-friendly error messages
 * Optionally shows toast notifications
 */
export function handleApiError(error: any, showToast = true) {
  console.error("API Error:", error);
  
  let errorMessage = "Something went wrong. Please try again.";
  
  // Handle ZodError directly (client-side validation)
  if (error instanceof z.ZodError) {
    errorMessage = formatZodError(error);
  }
  // Handle HTML responses - common source of the "<!DOCTYPE is not valid JSON" error
  else if (error.isHtmlResponse || 
          (error.message && (
            error.message.includes('<!DOCTYPE') || 
            error.message.includes('<html') || 
            error.message.includes('Received HTML instead of JSON')
          ))) {
    // Map status codes to user-friendly messages
    if (error.status === 404) {
      errorMessage = "The requested resource or API endpoint was not found.";
    } else if (error.status === 401) {
      errorMessage = "Your session might have expired. Please log in again.";
    } else if (error.status === 403) {
      errorMessage = "You don't have permission to access this feature.";
    } else if (error.status === 500) {
      errorMessage = "A server error occurred. Please try again later.";
    } else {
      errorMessage = "The server returned an unexpected response. Please try again later.";
    }
  }
  // Handle server responses with error data
  else if (error.response) {
    try {
      const data = error.response.data;
      
      // Handle string error messages
      if (data.message && typeof data.message === 'string') {
        errorMessage = data.message;
      } 
      // Handle array of error messages
      else if (data.message && Array.isArray(data.message)) {
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
      // Handle error object with error property
      else if (data.error) {
        errorMessage = data.error;
      }
      // Handle specific HTTP status codes
      else {
        switch (error.response.status) {
          case 400:
            errorMessage = "Invalid request. Please check your input.";
            break;
          case 401:
            errorMessage = "You need to log in to perform this action.";
            break;
          case 403:
            errorMessage = "You don't have permission to perform this action.";
            break;
          case 404:
            errorMessage = "The requested resource was not found.";
            break;
          case 409:
            errorMessage = "This action conflicts with the current state.";
            break;
          case 422:
            errorMessage = "The data you provided couldn't be processed.";
            break;
          case 429:
            errorMessage = "Too many requests. Please try again later.";
            break;
          case 500:
            errorMessage = "A server error occurred. Please try again later.";
            break;
        }
      }
    } catch (parseError) {
      errorMessage = "Error processing the server response.";
    }
  } 
  // Handle error with message property
  else if (error.message) {
    // Handle network errors
    if (error.message === 'Network Error') {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } 
    // Handle URL validation errors from fetch API
    else if (error.message.includes('Invalid URL')) {
      errorMessage = 'The provided URL is invalid.';
    }
    // Handle common JSON parsing errors
    else if (error.message.includes('Unexpected token') || 
             error.message.includes('is not valid JSON') ||
             error.message.includes('JSON.parse')) {
      errorMessage = 'The server returned a response in an unexpected format.';
    }
    // Check for JSON-formatted error messages (from our custom API errors)
    else if (error.message.startsWith('{') && error.message.endsWith('}')) {
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.message) {
          errorMessage = parsedError.message;
        }
      } catch (parseError) {
        // If JSON parsing fails, fall back to the original message
        errorMessage = error.message;
      }
    }
    // Use the error message directly
    else {
      errorMessage = error.message;
    }
  }
  
  // Show the error toast if requested
  if (showToast) {
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }
  
  return errorMessage;
}
