import { handleApiError } from "./utils";

// Helper function to check if a response might be HTML
function isLikelyHtmlResponse(text: string): boolean {
  const htmlIndicators = ['<!DOCTYPE', '<html', '<head', '<body', '<!doctype'];
  const lowerText = text.toLowerCase().trim();
  return htmlIndicators.some(indicator => lowerText.includes(indicator.toLowerCase()));
}

/**
 * Safely parses JSON from a response, handling cases where HTML is returned instead
 * @param res The Response object to parse
 * @returns Parsed JSON data
 * @throws Error with user-friendly message if parsing fails
 */
export async function safeJsonParse(res: Response): Promise<any> {
  try {
    // Check content type header first
    const contentType = res.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      // If not JSON content type, try to read as text to check for HTML
      const text = await res.text();
      
      if (isLikelyHtmlResponse(text)) {
        const error = new Error(`Received HTML instead of JSON (status ${res.status})`);
        (error as any).status = res.status;
        (error as any).isHtmlResponse = true;
        
        // Add specific error messages for common status codes
        if (res.status === 404) {
          error.message = "API endpoint not found (404)";
        } else if (res.status === 401) {
          error.message = "Authentication required (401)";
        } else if (res.status === 403) {
          error.message = "Not authorized to access this resource (403)";
        } else if (res.status === 500) {
          error.message = "Server error occurred (500)";
        }
        
        throw error;
      }
      
      // Try to parse as JSON anyway, in case the content-type was misreported
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(`Response is not valid JSON: ${res.status} ${res.statusText}`);
      }
    }
    
    // Regular JSON parsing
    return await res.json();
  } catch (e) {
    // If it's already our custom error from above, rethrow
    if (e instanceof Error && e.message.includes("Received HTML")) {
      throw e;
    }
    
    throw new Error(`Failed to parse response: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * A wrapper around fetch that provides safe error handling for HTML responses
 * @param url The URL to fetch
 * @param options The fetch options
 * @returns The fetched data, safely parsed from JSON
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options
    });
    
    if (!response.ok) {
      // Handle error responses
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      
      // Try to get a more specific error message from the response
      try {
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          // If JSON, try to extract error message
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else {
          // For HTML or other responses, create a more user-friendly message
          // based on status code
          switch (response.status) {
            case 400:
              errorMessage = "Bad request - please check your input";
              break;
            case 401:
              errorMessage = "Authentication required";
              break;
            case 403:
              errorMessage = "You don't have permission to access this resource";
              break;
            case 404:
              errorMessage = "Resource not found";
              break;
            case 500:
              errorMessage = "Server error occurred";
              break;
          }
        }
      } catch (parseError) {
        // If parsing fails, use the status text
        console.error("Error parsing error response:", parseError);
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }
    
    // Parse the response safely
    return await safeJsonParse(response);
  } catch (error) {
    // Log and handle the error
    handleApiError(error);
    throw error;
  }
}