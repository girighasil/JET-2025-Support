import { useState, useCallback } from 'react';
import { userFriendlyErrors } from '@/lib/utils';

/**
 * Hook for managing form error states
 * Provides functions to set and clear error messages
 * and helpful utilities for error handling
 * 
 * @returns Object with error state and helper functions
 */
export const useFormError = () => {
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear the current error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set the error message with automatic formatting for user-friendly display
   * 
   * @param message Error message to display
   */
  const setFormError = useCallback((message: string) => {
    // Check if we have a user-friendly version of this error
    const friendlyMessage = userFriendlyErrors[message] || message;
    setError(friendlyMessage);
  }, []);

  /**
   * Utility function to handle API errors and set the form error message
   * 
   * @param error Error object from API call or other source
   */
  const handleApiError = useCallback((error: any) => {
    if (error?.message) {
      setFormError(error.message);
    } else if (typeof error === 'string') {
      setFormError(error);
    } else {
      setFormError('An unexpected error occurred. Please try again later.');
    }
  }, [setFormError]);

  return {
    error,
    setError: setFormError,
    clearError,
    handleApiError
  };
};

export default useFormError;