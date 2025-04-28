import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { handleApiError } from "./utils";

// Flag to track if user is in process of logging out
let isLoggingOut = false;

// Function to set the logging out state
export function setLoggingOut(value: boolean) {
  isLoggingOut = value;
  console.log(`Logout state set to: ${value}`);
}

// Helper function to check if a response might be HTML
function isLikelyHtmlResponse(text: string): boolean {
  const htmlIndicators = ['<!DOCTYPE', '<html', '<head', '<body', '<!doctype'];
  const lowerText = text.toLowerCase().trim();
  return htmlIndicators.some(indicator => lowerText.includes(indicator.toLowerCase()));
}

// Parse API error responses into a user-friendly format
async function parseApiError(res: Response): Promise<Error> {
  try {
    const contentType = res.headers.get("content-type");
    
    // Handle JSON responses
    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await res.json();
        
        // Create a custom error object with a user-friendly message
        let errorMessage = "An error occurred";
        
        // Extract error message from various API response formats
        if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (Array.isArray(data.message) && data.message.length > 0) {
          errorMessage = typeof data.message[0] === 'string' 
            ? data.message[0] 
            : data.message[0]?.message || "Invalid input";
        } else if (data.error && typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
        
        const error = new Error(errorMessage);
        // Store original response data for debugging
        (error as any).originalData = data;
        (error as any).status = res.status;
        return error;
      } catch (jsonError) {
        // If JSON parsing fails despite content-type being application/json
        console.error("Failed to parse JSON despite content-type:", jsonError);
        return new Error(`Failed to parse response: ${res.status} ${res.statusText}`);
      }
    } 
    // Handle HTML responses (common source of the <!DOCTYPE error)
    else if (contentType && contentType.includes("text/html")) {
      // For HTML responses, don't try to include the entire HTML in the error message
      const error = new Error(`Received HTML instead of JSON (status ${res.status})`);
      (error as any).status = res.status;
      (error as any).isHtmlResponse = true;
      
      // Add specific messages for common status codes
      if (res.status === 404) {
        error.message = "API endpoint not found (404)";
      } else if (res.status === 401) {
        error.message = "Authentication required (401)";
      } else if (res.status === 403) {
        error.message = "Not authorized to access this resource (403)";
      } else if (res.status === 500) {
        error.message = "Server error occurred (500)";
      }
      
      return error;
    } 
    // Handle other response types
    else {
      try {
        // Get the response text
        const text = await res.text();
        
        // Check if the response is HTML despite content-type not being text/html
        if (isLikelyHtmlResponse(text)) {
          const error = new Error(`Received HTML instead of JSON (status ${res.status})`);
          (error as any).status = res.status;
          (error as any).isHtmlResponse = true;
          return error;
        }
        
        // For other text responses, truncate to a reasonable size
        const truncatedText = text.length > 100 ? text.substring(0, 100) + "..." : text;
        return new Error(truncatedText || res.statusText);
      } catch (textError) {
        return new Error(`${res.status}: ${res.statusText}`);
      }
    }
  } catch (e) {
    return new Error(`${res.status}: ${res.statusText}`);
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    throw await parseApiError(res);
  }
}

// Safe JSON parsing that handles HTML responses
async function safeJsonParse(res: Response): Promise<any> {
  try {
    // Check content type header first
    const contentType = res.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      // If not JSON content type, try to read as text to check for HTML
      const text = await res.text();
      
      if (isLikelyHtmlResponse(text)) {
        throw new Error(`Received HTML instead of JSON (status ${res.status})`);
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
    // If it's already our error from above, rethrow
    if (e instanceof Error && e.message.includes("Received HTML")) {
      throw e;
    }
    
    throw new Error(`Failed to parse response: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Makes an API request with consistent parameter handling
 * @param methodOrUrl - The HTTP method (GET, POST, etc.) or URL (for backward compatibility)
 * @param urlOrData - The URL or data payload (for backward compatibility)
 * @param dataOrOptions - The data payload or options (for backward compatibility)
 * @param optionsOrUndefined - The options (for backward compatibility)
 * @returns Promise with the response
 */
export async function apiRequest(
  methodOrUrl: string,
  urlOrData?: string | unknown,
  dataOrOptions?: unknown | { isFormData?: boolean },
  optionsOrUndefined?: { isFormData?: boolean },
): Promise<Response> {
  // Declare variables at function scope to be accessible in both try and catch blocks
  let url: string;
  let method: string;
  let data: unknown | undefined;
  let options: { isFormData?: boolean } | undefined;
  let useMethod: string;
  
  try {
    // Determine parameter order by analyzing the first parameter
    // If it starts with '/', it's a URL, so we use the old order (url, method, data, options)
    // Otherwise, use the new order (method, url, data, options)
    const isLegacyFormat = methodOrUrl.startsWith('/');
    
    // Set the parameters based on the detected format
    if (isLegacyFormat) {
      // Legacy format: apiRequest(url, method, data, options)
      url = methodOrUrl;
      method = urlOrData as string || 'GET';
      data = dataOrOptions;
      options = optionsOrUndefined;
      console.debug('Using legacy parameter order: (url, method, data, options)');
    } else {
      // New format: apiRequest(method, url, data, options)
      method = methodOrUrl;
      url = urlOrData as string;
      data = dataOrOptions;
      options = optionsOrUndefined;
    }
    
    // Validate method and URL
    if (!url || typeof url !== 'string') {
      throw new Error(`Invalid URL: ${url}. Please provide a valid URL string.`);
    }
    
    if (!method || typeof method !== 'string') {
      throw new Error(`Invalid HTTP method: ${method}. Please provide a valid HTTP method.`);
    }
    
    // Validate HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(method.toUpperCase())) {
      throw new Error(`Invalid HTTP method: ${method}. Must be one of: ${validMethods.join(', ')}`);
    }
    
    // Normalize the method
    useMethod = method.toUpperCase() === "PATCH" ? "PUT" : method.toUpperCase();

    // Determine if we should handle as form data
    const isFormData = options?.isFormData || false;

    // Set up headers based on content type
    const headers: HeadersInit = {};
    if (data && !isFormData) {
      headers["Content-Type"] = "application/json";
    }

    // Log request details for debugging
    console.debug(`API Request: ${useMethod} ${url}`, 
      isFormData ? "With FormData" : (data ? "With data payload" : "No data"));
    
    const res = await fetch(url, {
      method: useMethod,
      headers,
      body: isFormData
        ? (data as FormData)
        : data
          ? JSON.stringify(data)
          : undefined,
      credentials: "include", // Always include credentials
    });

    // Log response status for debugging
    console.debug(`API Response: ${useMethod} ${url} - Status: ${res.status}`);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    // Skip error handling for 401s during logout
    if (!(isLoggingOut && error?.status === 401)) {
      // Log detailed error information
      console.error(`API Error in ${useMethod} ${url}:`, error);
      
      // Handle API errors with user-friendly messages
      handleApiError(error);
    } else {
      console.log("Suppressing 401 error during logout:", error?.message || "Unknown error");
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Log the request for debugging
      console.debug(`Fetching data from ${queryKey[0]} with credentials included`);
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include", // Always include credentials
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.debug(`401 Unauthorized from ${queryKey[0]}, returning null as configured`);
        return null;
      }

      await throwIfResNotOk(res);
      
      // Use our safe JSON parsing to avoid HTML parsing errors
      const data = await safeJsonParse(res);
      
      // Debug log successful data fetch
      console.debug(`Successfully fetched data from ${queryKey[0]}`);
      
      return data;
    } catch (error: any) {
      // Skip error handling during logout or for expected 401s
      if (!(isLoggingOut && error?.status === 401) && 
          !(error instanceof Error && error.message?.includes("401"))) {
        console.error(`Error fetching ${queryKey[0]}:`, error);
        handleApiError(error);
      } else if (isLoggingOut && error?.status === 401) {
        console.log("Suppressing 401 error in query during logout");
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      onError: (error: any) => {
        // Don't show errors for 401 Unauthorized - likely after logout
        if (!(error instanceof Error && error.message?.includes("401"))) {
          handleApiError(error);
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        // Skip error handling for 401s during logout
        if (!(isLoggingOut && error?.status === 401)) {
          handleApiError(error);
        } else {
          console.log("Suppressing 401 error in mutation during logout");
        }
      },
    },
  },
});