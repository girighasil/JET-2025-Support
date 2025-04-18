import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { handleApiError } from "./utils";

// Parse API error responses into a user-friendly format
async function parseApiError(res: Response): Promise<Error> {
  try {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      return new Error(JSON.stringify(data));
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
    // Handle API errors with user-friendly messages
    handleApiError(error);
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
      // Only handle errors if they're not 401 unauthorized (those are expected in some cases)
      if (!(error instanceof Error && error.message.includes("401"))) {
        handleApiError(error);
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
