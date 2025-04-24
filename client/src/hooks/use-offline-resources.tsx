import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { OfflineResource } from "@shared/schema";

// Hook for managing offline resources
export function useOfflineResources() {
  const queryClient = useQueryClient();

  // Query to get all offline resources for the current user
  const {
    data: resources,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/offline-resources"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/offline-resources");
      if (!response.ok) {
        throw new Error("Failed to fetch offline resources");
      }
      return await response.json();
    },
  });

  // Mutation to download a resource for offline use
  const downloadResourceMutation = useMutation({
    mutationFn: async (resourceData: {
      resourceUrl: string;
      resourceType: string;
      resourceTitle: string;
      courseId?: number;
      moduleId?: number;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/offline-resources/download",
        resourceData
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download resource");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offline-resources"] });
      toast({
        title: "Resource downloaded",
        description: "The resource is now available for offline use.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete an offline resource
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/offline-resources/${resourceId}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete resource");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offline-resources"] });
      toast({
        title: "Resource deleted",
        description: "The offline resource has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to stream a resource from the server
  const streamResource = async (resourceId: string) => {
    try {
      const response = await apiRequest(
        "GET",
        `/api/offline-resources/stream/${resourceId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to access resource");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error streaming resource:", error);
      toast({
        title: "Streaming failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Function to get resource content
  const getResourceContent = async (resourceId: string) => {
    try {
      const resourceInfo = await streamResource(resourceId);
      
      // Fetch the encrypted content
      const contentResponse = await fetch(`/api/offline-resources/content/${resourceId}`);
      
      if (!contentResponse.ok) {
        throw new Error("Failed to fetch resource content");
      }
      
      // Get content as ArrayBuffer
      const encryptedContent = await contentResponse.arrayBuffer();
      
      return {
        resourceInfo,
        encryptedContent
      };
    } catch (error) {
      console.error("Error getting resource content:", error);
      toast({
        title: "Content access failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Function to decrypt content client-side
  const decryptContent = async (
    encryptedData: ArrayBuffer,
    accessKey: string
  ) => {
    try {
      // Extract IV from the beginning of the encrypted data (first 16 bytes)
      const iv = new Uint8Array(encryptedData.slice(0, 16));
      const data = new Uint8Array(encryptedData.slice(16));
      
      // Derive key from the accessKey
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(accessKey),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
      
      // Derive the actual encryption key using PBKDF2
      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: encoder.encode("salt"), // Same salt used on server
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-CBC", length: 256 },
        false,
        ["decrypt"]
      );
      
      // Decrypt the data
      const decryptedContent = await window.crypto.subtle.decrypt(
        {
          name: "AES-CBC",
          iv,
        },
        key,
        data
      );
      
      return decryptedContent;
    } catch (error) {
      console.error("Decryption error:", error);
      toast({
        title: "Decryption failed",
        description: "Could not decrypt the content. The key might be invalid.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Function to play a decrypted video
  const playDecryptedVideo = async (
    resourceId: string,
    videoElementId: string
  ) => {
    try {
      // Get resource info and encrypted content
      const { resourceInfo, encryptedContent } = await getResourceContent(resourceId);
      
      // Decrypt the content
      const decryptedContent = await decryptContent(
        encryptedContent,
        resourceInfo.accessKey
      );
      
      // Create a blob URL from the decrypted content
      const blob = new Blob([decryptedContent], {
        type: "video/mp4", // Assuming it's an MP4 video
      });
      const url = URL.createObjectURL(blob);
      
      // Set the video element source
      const videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
      if (videoElement) {
        videoElement.src = url;
        videoElement.load();
        
        // Clean up the blob URL when the video is unloaded
        videoElement.onunload = () => {
          URL.revokeObjectURL(url);
        };
      }
      
      return url;
    } catch (error) {
      console.error("Error playing decrypted video:", error);
      toast({
        title: "Playback failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    resources,
    isLoading,
    error,
    downloadResource: downloadResourceMutation.mutate,
    isDownloading: downloadResourceMutation.isPending,
    deleteResource: deleteResourceMutation.mutate,
    isDeleting: deleteResourceMutation.isPending,
    streamResource,
    getResourceContent,
    decryptContent,
    playDecryptedVideo,
  };
}