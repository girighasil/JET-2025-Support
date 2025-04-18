import { useState, useCallback } from 'react';
import { handleApiError } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

/**
 * A hook to handle form errors consistently across the application
 * 
 * Returns:
 * - formError: The current form error state
 * - setFormError: Function to set a form error
 * - clearFormError: Function to clear the form error
 * - handleError: Function to handle various error types consistently
 */
export function useFormError() {
  const [formError, setFormError] = useState<string | null>(null);

  const clearFormError = useCallback(() => {
    setFormError(null);
  }, []);

  /**
   * Handles different error types consistently
   */
  const handleError = useCallback((error: unknown) => {
    // Clear any existing errors
    clearFormError();
    
    // Handle the error and get a user-friendly message
    const errorMessage = handleApiError(error);
    
    // Set the form error
    setFormError(errorMessage);
    
    // Scroll to the form error if it exists
    setTimeout(() => {
      const errorElement = document.querySelector('[data-form-error]');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    return errorMessage;
  }, [clearFormError]);

  /**
   * Show success toast message
   */
  const showSuccess = useCallback((message: string) => {
    toast({
      title: "Success",
      description: message,
      variant: "default",
    });
  }, []);

  return {
    formError,
    setFormError,
    clearFormError,
    handleError,
    showSuccess,
  };
}