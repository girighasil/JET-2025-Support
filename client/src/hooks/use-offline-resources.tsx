import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Types
interface OfflineResource {
  id: number;
  resourceId: string;
  resourceUrl: string;
  resourceType: string;
  resourceTitle: string;
  status: 'active' | 'expired';
  fileSize: number;
  createdAt: string;
  expiresAt: string;
  lastAccessed: string;
}

interface DownloadResourceParams {
  resourceUrl: string;
  resourceType: string;
  resourceTitle: string;
  courseId?: number;
  moduleId?: number;
}

export function useOfflineResources() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  // Fetch user's offline resources
  const { data: resources, isLoading, error, refetch } = useQuery<OfflineResource[]>({
    queryKey: ['/api/offline-resources'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/offline-resources');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch offline resources');
      }
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to load offline resources",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Download a resource for offline use
  const downloadResource = async (params: DownloadResourceParams) => {
    try {
      setIsDownloading(true);
      
      // Step 1: Request a token for the resource
      const requestResponse = await apiRequest('POST', '/api/offline-resources/request', params);
      
      if (!requestResponse.ok) {
        const errorData = await requestResponse.json();
        throw new Error(errorData.message || 'Failed to request offline access');
      }
      
      const { token, resourceId } = await requestResponse.json();
      
      // Step 2: Download the resource using the token
      const downloadResponse = await apiRequest('GET', `/api/offline-resources/download/${token}`, null, {
        headers: { 'Content-Type': 'application/octet-stream' },
        responseType: 'arraybuffer'
      });
      
      if (!downloadResponse.ok) {
        throw new Error('Failed to download resource');
      }
      
      // Step 3: Get the encrypted data
      const encryptedData = await downloadResponse.arrayBuffer();
      
      // Step 4: Store the encrypted data in IndexedDB
      await storeEncryptedResource(resourceId, encryptedData);
      
      // Step 5: Refresh the resources list
      await refetch();
      
      toast({
        title: "Resource downloaded",
        description: "The resource is now available offline",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download the resource",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Delete an offline resource
  const { mutate: deleteResource, isPending: isDeleting } = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await apiRequest('DELETE', `/api/offline-resources/${resourceId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete resource');
      }
      
      // Also remove from IndexedDB
      try {
        const db = await openDatabase();
        const tx = db.transaction('resources', 'readwrite');
        const store = tx.objectStore('resources');
        await store.delete(resourceId.toString());
      } catch (e) {
        console.error('Error removing from IndexedDB:', e);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offline-resources'] });
      toast({
        title: "Resource deleted",
        description: "The offline resource has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Play a decrypted video
  const playDecryptedVideo = async (resourceId: string, videoElementId: string) => {
    try {
      // Step 1: Get the encrypted data from IndexedDB
      const encryptedData = await getEncryptedResource(resourceId);
      if (!encryptedData) {
        throw new Error('Resource not found. Please download it again.');
      }
      
      // Step 2: Get a temporary decryption token from the server
      const tokenResponse = await apiRequest('GET', `/api/offline-resources/token/${resourceId}`);
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.message || 'Failed to get decryption token');
      }
      
      const { token } = await tokenResponse.json();
      
      // Step 3: Request decryption
      const decryptResponse = await apiRequest('POST', '/api/offline-resources/decrypt', {
        token,
        resourceId
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!decryptResponse.ok) {
        const errorData = await decryptResponse.json();
        throw new Error(errorData.message || 'Failed to decrypt resource');
      }
      
      const { decryptionKey } = await decryptResponse.json();
      
      // Step 4: Decrypt the data
      const decryptedData = await decryptData(encryptedData, decryptionKey);
      
      // Step 5: Create a blob URL and set it to the video element
      const videoBlob = new Blob([decryptedData], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      const videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
      if (videoElement) {
        videoElement.src = videoUrl;
        videoElement.onunload = () => URL.revokeObjectURL(videoUrl);
        
        // Begin playback
        try {
          await videoElement.play();
        } catch (e) {
          console.error('Error playing video:', e);
          throw new Error('Failed to play video. Please try again.');
        }
      } else {
        throw new Error('Video player not found.');
      }
      
      // Update the last accessed timestamp
      await apiRequest('POST', `/api/offline-resources/access/${resourceId}`);
      
      return true;
    } catch (error) {
      console.error('Error playing video:', error);
      throw error;
    }
  };

  // IndexedDB functions for storing and retrieving encrypted resources
  
  const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OfflineResourcesDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('resources')) {
          db.createObjectStore('resources');
        }
      };
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      
      request.onerror = (event) => {
        reject('Error opening database');
      };
    });
  };
  
  const storeEncryptedResource = async (resourceId: string, data: ArrayBuffer): Promise<void> => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('resources', 'readwrite');
      const store = tx.objectStore('resources');
      const request = store.put(data, resourceId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error storing resource');
    });
  };
  
  const getEncryptedResource = async (resourceId: string): Promise<ArrayBuffer | null> => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('resources', 'readonly');
      const store = tx.objectStore('resources');
      const request = store.get(resourceId);
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result || null);
      };
      
      request.onerror = () => {
        reject('Error retrieving resource');
      };
    });
  };
  
  // Decrypt the data using the decryption key from the server
  const decryptData = async (encryptedData: ArrayBuffer, decryptionKey: string): Promise<ArrayBuffer> => {
    // This is a placeholder for the actual decryption logic
    // In a real implementation, you would use the Web Crypto API to decrypt the data
    // using the decryptionKey provided by the server
    
    // For demonstration purposes, we're returning the encrypted data as-is
    // assuming the server didn't actually encrypt it or that decryption happens server-side
    return encryptedData;
  };

  return {
    resources,
    isLoading,
    error,
    downloadResource,
    isDownloading,
    deleteResource,
    isDeleting,
    playDecryptedVideo
  };
}