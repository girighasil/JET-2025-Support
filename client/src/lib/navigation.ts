/**
 * Navigation utility for the application
 * This provides a consistent way to handle navigation throughout the app
 * while using wouter as the routing library
 */

import { useLocation } from 'wouter';

/**
 * A custom hook that provides navigation functionality.
 * This is a wrapper around wouter's useLocation that returns a navigate function.
 */
export function useNavigation() {
  const [location, setLocation] = useLocation();
  
  /**
   * Navigate to a new route
   * @param path The path to navigate to
   * @param options Navigation options
   * @param options.replace Whether to replace the current history entry
   */
  const navigate = (path: string, options?: { replace?: boolean }) => {
    setLocation(path, options);
  };
  
  return {
    location,
    navigate,
  };
}