import { useState, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { handleApiError } from '@/lib/utils';

type FormErrorState = string | null;

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
  const [formError, setFormError] = useState<FormErrorState>(null);

  const clearFormError = useCallback(() => setFormError(null), []);

  /**
   * Handles different error types consistently
   */
  const handleError = useCallback((error: any) => {
    // Convert the error to a user-friendly message using the utility
    const errorMessage = handleApiError(error, false);
    setFormError(errorMessage);
    return errorMessage;
  }, []);

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
    showSuccess
  };
}