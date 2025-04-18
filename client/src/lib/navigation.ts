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

/**
 * Navigate to a course detail page
 * @param courseId The ID of the course
 * @param options Navigation options
 */
export function navigateToCourse(courseId: number, setLocation: (path: string, options?: { replace?: boolean }) => void) {
  setLocation(`/student/courses/${courseId}`);
}

/**
 * Navigate to a test detail page
 * @param testId The ID of the test
 * @param options Navigation options
 */
export function navigateToTest(testId: number, setLocation: (path: string, options?: { replace?: boolean }) => void) {
  setLocation(`/student/tests/${testId}`);
}

/**
 * Navigate based on a notification's resource type and ID
 * @param resourceType The type of resource ("course", "test", etc.)
 * @param resourceId The ID of the resource
 * @param setLocation Function to set the location
 */
export function navigateToResource(
  resourceType: string | null, 
  resourceId: number | null, 
  setLocation: (path: string, options?: { replace?: boolean }) => void
) {
  if (!resourceType || !resourceId) return;
  
  switch (resourceType) {
    case 'course':
      navigateToCourse(resourceId, setLocation);
      break;
    case 'test':
      navigateToTest(resourceId, setLocation);
      break;
    case 'module':
      // Navigate to the module within its course
      setLocation(`/student/courses/${resourceId}#modules`);
      break;
    case 'doubt_session':
      setLocation(`/student/doubt-sessions/${resourceId}`);
      break;
    default:
      // If the resource type is not recognized, navigate to the dashboard
      setLocation('/student/dashboard');
  }
}