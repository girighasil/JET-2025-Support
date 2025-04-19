import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { handleApiError } from "./utils";

// Flag to track if user is in process of logging out
let isLoggingOut = false;

// Function to set the logging out state
export function setLoggingOut(value: boolean) {
  isLoggingOut = value;
  console.log(`Logout state set to: ${value}`);
}

// Parse API error responses into a user-friendly format
async function parseApiError(res: Response): Promise<Error> {
  try {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
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
    } else {
      const text = await res.text();
      return new Error(text || res.statusText);
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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { isFormData?: boolean },
): Promise<Response> {
  try {
    // Convert PATCH requests to PUT
    const useMethod = method === "PATCH" ? "PUT" : method;

    // Determine if we should handle as form data
    const isFormData = options?.isFormData || false;

    // Set up headers based on content type
    const headers: HeadersInit = {};
    if (data && !isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method: useMethod,
      headers,
      body: isFormData
        ? (data as FormData)
        : data
          ? JSON.stringify(data)
          : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Skip error handling for 401s during logout
    if (!(isLoggingOut && error.status === 401)) {
      // Handle API errors with user-friendly messages
      handleApiError(error);
    } else {
      console.log("Suppressing 401 error during logout:", error.message);
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
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Skip error handling during logout or for expected 401s
      if (!(isLoggingOut && error.status === 401) && 
          !(error instanceof Error && error.message.includes("401"))) {
        handleApiError(error);
      } else if (isLoggingOut && error.status === 401) {
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
      onError: (error) => {
        // Don't show errors for 401 Unauthorized - likely after logout
        if (!(error instanceof Error && error.message.includes("401"))) {
          handleApiError(error);
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error) => {
        handleApiError(error);
      },
    },
  },
});