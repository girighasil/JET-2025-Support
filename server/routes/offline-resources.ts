import { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { v4 as uuidv4 } from "uuid";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import fetch from "node-fetch";

// Constants
const TOKEN_EXPIRY_MINUTES = 30;
const RESOURCE_EXPIRY_DAYS = 7;

// In-memory token store (in a production app, you'd use Redis or similar)
const tokens: Record<string, { resourceId: string; expiresAt: Date }> = {};

// Validate user is authenticated and return userId
function getUserId(req: Request): number {
  if (!req.isAuthenticated() || !req.user) {
    throw new Error("Not authenticated");
  }
  return req.user.id;
}

// Validate resourceId parameter
const resourceIdSchema = z.object({
  resourceId: z.string().min(1),
});

// Validate request token parameter
const tokenSchema = z.object({
  token: z.string().uuid(),
});

// Validate resource request body
const resourceRequestSchema = z.object({
  resourceUrl: z.string().url(),
  resourceType: z.string(),
  resourceTitle: z.string(),
  courseId: z.number().optional(),
  moduleId: z.number().optional(),
});

// Generate a secure token for resource access
function generateToken(resourceId: string): string {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRY_MINUTES);
  
  tokens[token] = {
    resourceId,
    expiresAt
  };
  
  return token;
}

// Validate a token and return the associated resourceId
function validateToken(token: string): string | null {
  const tokenData = tokens[token];
  if (!tokenData) return null;
  
  // Check if token has expired
  if (new Date() > tokenData.expiresAt) {
    delete tokens[token]; // Clean up expired token
    return null;
  }
  
  return tokenData.resourceId;
}

// Generate encryption key for resource
function generateEncryptionKey(): { key: Buffer, iv: Buffer } {
  const key = randomBytes(32); // 256-bit key for AES-256
  const iv = randomBytes(16);  // 16 bytes for AES
  return { key, iv };
}

// Download and encrypt a resource
async function downloadAndEncryptResource(url: string): Promise<{ 
  data: Buffer, 
  encryptionKey: string,
  size: number
}> {
  // Download the resource
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download resource: ${response.statusText}`);
  }
  
  const data = await response.buffer();
  const size = data.length;
  
  // Generate encryption key and IV
  const { key, iv } = generateEncryptionKey();
  
  // Encrypt the data
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encryptedData = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);
  
  // Return the encrypted data and encryption key (encoded for storage)
  return {
    data: encryptedData,
    encryptionKey: `${key.toString('hex')}:${iv.toString('hex')}`,
    size
  };
}

// Register offline resources routes
export function registerOfflineResourcesRoutes(app: Express) {
  // Request a token to download a resource
  app.post("/api/offline-resources/request", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      
      // Validate request body
      const result = resourceRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request", errors: result.error.errors });
      }
      
      const { resourceUrl, resourceType, resourceTitle, courseId, moduleId } = result.data;
      
      // Check if the resource already exists
      const existingResource = await storage.getOfflineResourceByResourceId(userId, resourceUrl);
      if (existingResource) {
        // If resource exists but has expired, update its status to active and generate a new token
        if (existingResource.status === "expired") {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + RESOURCE_EXPIRY_DAYS);
          
          await storage.updateOfflineResourceStatus(existingResource.id, "active");
          
          const token = generateToken(existingResource.resourceId);
          return res.status(200).json({ 
            token, 
            resourceId: existingResource.resourceId,
            message: "Resource reactivated" 
          });
        }
        
        // Otherwise return a token for the existing resource
        const token = generateToken(existingResource.resourceId);
        return res.status(200).json({ 
          token, 
          resourceId: existingResource.resourceId,
          message: "Resource already exists" 
        });
      }
      
      // Generate a unique resourceId
      const resourceId = uuidv4();
      
      // Create a token for this download
      const token = generateToken(resourceId);
      
      // Set expiry date for the resource
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + RESOURCE_EXPIRY_DAYS);
      
      // Create a placeholder record in the database
      await storage.createOfflineResource({
        userId,
        resourceType,
        resourceUrl,
        resourceTitle,
        resourceId,
        courseId,
        moduleId,
        expiresAt,
        status: "active",
        accessKey: "", // Will be updated after download
        fileSize: 0    // Will be updated after download
      });
      
      res.status(201).json({ token, resourceId });
    } catch (error) {
      console.error("Error requesting offline resource:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Download and encrypt a resource
  app.get("/api/offline-resources/download/:token", async (req: Request, res: Response) => {
    try {
      // Validate token
      const tokenParam = tokenSchema.safeParse({ token: req.params.token });
      if (!tokenParam.success) {
        return res.status(400).json({ message: "Invalid token format" });
      }
      
      const { token } = tokenParam.data;
      const resourceId = validateToken(token);
      
      if (!resourceId) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      
      const userId = getUserId(req);
      
      // Get the resource from database
      const resource = await storage.getOfflineResourceByResourceId(userId, resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      try {
        // Download and encrypt the resource
        const { data, encryptionKey, size } = await downloadAndEncryptResource(resource.resourceUrl);
        
        // Update the resource with encryption key and file size
        await storage.updateOfflineResource(resource.id, {
          accessKey: encryptionKey,
          fileSize: size,
          lastAccessedAt: new Date()
        });
        
        // Send the encrypted data to the client
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Length", data.length);
        res.send(data);
        
        // Clean up the token after successful download
        delete tokens[token];
      } catch (downloadError) {
        console.error("Error downloading resource:", downloadError);
        return res.status(500).json({ message: "Failed to download or encrypt resource" });
      }
    } catch (error) {
      console.error("Error processing download:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // List user's offline resources
  app.get("/api/offline-resources", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      
      const resources = await storage.listOfflineResourcesByUser(userId);
      
      // Map to a client-friendly format
      const mappedResources = resources.map(resource => ({
        id: resource.id,
        resourceId: resource.resourceId,
        resourceUrl: resource.resourceUrl,
        resourceType: resource.resourceType,
        resourceTitle: resource.resourceTitle,
        status: resource.status,
        fileSize: resource.fileSize,
        createdAt: resource.downloadedAt,
        expiresAt: resource.expiresAt,
        lastAccessed: resource.lastAccessedAt
      }));
      
      res.status(200).json(mappedResources);
    } catch (error) {
      console.error("Error listing offline resources:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a decryption token for a specific resource
  app.get("/api/offline-resources/token/:resourceId", async (req: Request, res: Response) => {
    try {
      const { resourceId } = resourceIdSchema.parse(req.params);
      const userId = getUserId(req);
      
      // Get the resource from database
      const resource = await storage.getOfflineResourceByResourceId(userId, resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Check if resource has expired
      if (resource.status === "expired" || (resource.expiresAt && new Date() > resource.expiresAt)) {
        await storage.updateOfflineResourceStatus(resource.id, "expired");
        return res.status(403).json({ message: "Resource has expired" });
      }
      
      // Generate a token for decryption
      const token = generateToken(resourceId);
      
      res.status(200).json({ token });
    } catch (error) {
      console.error("Error generating decryption token:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Request decryption of a resource
  app.post("/api/offline-resources/decrypt", async (req: Request, res: Response) => {
    try {
      const { token, resourceId } = z.object({
        token: z.string(),
        resourceId: z.string()
      }).parse(req.body);
      
      // Validate token
      const validResourceId = validateToken(token);
      if (!validResourceId || validResourceId !== resourceId) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      
      const userId = getUserId(req);
      
      // Get the resource from database
      const resource = await storage.getOfflineResourceByResourceId(userId, resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Check if resource has expired
      if (resource.status === "expired" || (resource.expiresAt && new Date() > resource.expiresAt)) {
        await storage.updateOfflineResourceStatus(resource.id, "expired");
        return res.status(403).json({ message: "Resource has expired" });
      }
      
      // Return the decryption key
      res.status(200).json({ decryptionKey: resource.accessKey });
      
      // Update the last accessed date
      await storage.updateOfflineResourceLastAccessed(resource.id);
      
      // Clean up the token after successful use
      delete tokens[token];
    } catch (error) {
      console.error("Error processing decryption request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Record resource access
  app.post("/api/offline-resources/access/:resourceId", async (req: Request, res: Response) => {
    try {
      const { resourceId } = resourceIdSchema.parse(req.params);
      const userId = getUserId(req);
      
      // Get the resource from database
      const resource = await storage.getOfflineResource(resourceId);
      if (!resource || resource.userId !== userId) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Update the last accessed date
      await storage.updateOfflineResourceLastAccessed(resource.id);
      
      res.status(200).json({ message: "Access recorded" });
    } catch (error) {
      console.error("Error recording resource access:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete an offline resource
  app.delete("/api/offline-resources/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const userId = getUserId(req);
      
      // Get the resource to check ownership
      const resource = await storage.getOfflineResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Check if the user owns this resource
      if (resource.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the resource
      const deleted = await storage.deleteOfflineResource(id);
      
      if (deleted) {
        res.status(200).json({ message: "Resource deleted" });
      } else {
        res.status(500).json({ message: "Failed to delete resource" });
      }
    } catch (error) {
      console.error("Error deleting offline resource:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}