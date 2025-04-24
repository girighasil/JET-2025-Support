import { Router, Request, Response } from "express";
import { storage } from "../storage-impl";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { insertOfflineResourceSchema } from "@shared/schema";

const router = Router();

// Create download directory if it doesn't exist
const DOWNLOADS_DIR = path.join(process.cwd(), "protected-downloads");
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Helper function to encrypt a file
const encryptFile = async (sourceFilePath: string, destinationFilePath: string, encryptionKey: string): Promise<void> => {
  const readFile = promisify(fs.readFile);
  const writeFile = promisify(fs.writeFile);
  
  const iv = crypto.randomBytes(16); // Generate initialization vector
  const key = crypto.scryptSync(encryptionKey, 'salt', 32); // Derive key from passphrase
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  const data = await readFile(sourceFilePath);
  const encryptedData = Buffer.concat([iv, cipher.update(data), cipher.final()]);
  
  await writeFile(destinationFilePath, encryptedData);
};

// Helper function to generate a secure random key
const generateSecureKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to download and store a file
const downloadAndEncryptFile = async (
  url: string, 
  userId: number, 
  resourceId: string, 
  resourceType: string,
  encryptionKey: string
): Promise<{filePath: string, fileSize: number}> => {
  // Create a unique filename
  const fileExt = path.extname(url) || '.bin';
  const fileName = `${resourceId}${fileExt}`;
  const filePath = path.join(DOWNLOADS_DIR, fileName);
  
  // Download the file
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download resource: ${response.statusText}`);
  }
  
  // Create a temp file to store the downloaded content
  const tempPath = path.join(DOWNLOADS_DIR, `temp_${fileName}`);
  const fileStream = fs.createWriteStream(tempPath);
  
  // If we have a readable stream from fetch
  if (response.body) {
    await new Promise<void>((resolve, reject) => {
      // @ts-ignore - Stream issue with node-fetch typings
      response.body.pipe(fileStream);
      // @ts-ignore
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });
  } else {
    // If we have the response as text/buffer
    const buffer = await response.buffer();
    await promisify(fs.writeFile)(tempPath, buffer);
  }
  
  // Get file size before encryption
  const stats = fs.statSync(tempPath);
  const fileSize = stats.size;
  
  // Encrypt the file
  await encryptFile(tempPath, filePath, encryptionKey);
  
  // Delete the temp file
  fs.unlinkSync(tempPath);
  
  return { filePath, fileSize };
};

// Route to initiate a download
router.post("/download", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const schema = z.object({
      resourceUrl: z.string().url(),
      resourceType: z.string(),
      resourceTitle: z.string(),
      courseId: z.number().optional(),
      moduleId: z.number().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request data", details: result.error });
    }
    
    const { resourceUrl, resourceType, resourceTitle, courseId, moduleId } = result.data;
    const userId = req.user!.id;
    
    // Generate a unique resource ID
    const resourceId = uuidv4();
    
    // Generate encryption key
    const accessKey = generateSecureKey();
    
    try {
      // Check if this resource is already downloaded by the user
      const existingResource = await storage.getOfflineResourceByResourceId(userId, resourceId);
      if (existingResource) {
        return res.status(200).json({ 
          message: "Resource already downloaded",
          resource: existingResource
        });
      }
      
      // Download and encrypt the file
      const { fileSize } = await downloadAndEncryptFile(
        resourceUrl, 
        userId, 
        resourceId, 
        resourceType,
        accessKey
      );
      
      // Set expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create a record in the database
      const offlineResource = await storage.createOfflineResource({
        userId,
        resourceType,
        resourceUrl,
        resourceTitle,
        resourceId,
        courseId,
        moduleId,
        expiresAt,
        fileSize,
        accessKey,
        status: "active"
      });
      
      res.status(201).json({
        message: "Resource downloaded successfully",
        resource: offlineResource
      });
    } catch (error) {
      console.error("Error downloading resource:", error);
      res.status(500).json({ error: "Failed to download resource" });
    }
  } catch (error) {
    console.error("Error in download endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get a user's offline resources
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userId = req.user!.id;
    const resources = await storage.listOfflineResourcesByUser(userId);
    
    // Filter out sensitive information like accessKey
    const safeResources = resources.map(resource => {
      const { accessKey, ...safeResource } = resource;
      return safeResource;
    });
    
    res.json(safeResources);
  } catch (error) {
    console.error("Error fetching offline resources:", error);
    res.status(500).json({ error: "Failed to fetch offline resources" });
  }
});

// Route to stream a protected resource
router.get("/stream/:resourceId", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { resourceId } = req.params;
    const userId = req.user!.id;
    
    // Get resource information
    const resource = await storage.getOfflineResourceByResourceId(userId, resourceId);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    
    // Check if resource is expired or revoked
    if (resource.status !== "active") {
      return res.status(403).json({ error: "Resource access revoked or expired" });
    }
    
    if (resource.expiresAt && new Date() > resource.expiresAt) {
      // Update status to expired
      await storage.updateOfflineResourceStatus(resource.id, "expired");
      return res.status(403).json({ error: "Resource has expired" });
    }
    
    // Update last accessed timestamp
    await storage.updateOfflineResourceLastAccessed(resource.id);
    
    // Prepare path to the encrypted file
    const fileExt = path.extname(resource.resourceUrl) || '.bin';
    const fileName = `${resourceId}${fileExt}`;
    const filePath = path.join(DOWNLOADS_DIR, fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Resource file not found" });
    }
    
    // Return the decryption key and file info
    res.json({
      resourceId,
      accessKey: resource.accessKey,
      fileName,
      fileSize: resource.fileSize,
      resourceType: resource.resourceType,
      resourceTitle: resource.resourceTitle
    });
  } catch (error) {
    console.error("Error streaming resource:", error);
    res.status(500).json({ error: "Failed to stream resource" });
  }
});

// Route to get encrypted file content
router.get("/content/:resourceId", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { resourceId } = req.params;
    const userId = req.user!.id;
    
    // Get resource information
    const resource = await storage.getOfflineResourceByResourceId(userId, resourceId);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    
    // Check if resource is expired or revoked
    if (resource.status !== "active") {
      return res.status(403).json({ error: "Resource access revoked or expired" });
    }
    
    if (resource.expiresAt && new Date() > resource.expiresAt) {
      // Update status to expired
      await storage.updateOfflineResourceStatus(resource.id, "expired");
      return res.status(403).json({ error: "Resource has expired" });
    }
    
    // Prepare path to the encrypted file
    const fileExt = path.extname(resource.resourceUrl) || '.bin';
    const fileName = `${resourceId}${fileExt}`;
    const filePath = path.join(DOWNLOADS_DIR, fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Resource file not found" });
    }
    
    // Stream the encrypted file
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving resource content:", error);
    res.status(500).json({ error: "Failed to serve resource content" });
  }
});

// Route to delete an offline resource
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const resourceId = parseInt(req.params.id);
    if (isNaN(resourceId)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }
    
    const userId = req.user!.id;
    
    // Get resource information
    const resource = await storage.getOfflineResource(resourceId);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    
    // Ensure the user owns this resource
    if (resource.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this resource" });
    }
    
    // Delete the file
    const fileExt = path.extname(resource.resourceUrl) || '.bin';
    const fileName = `${resource.resourceId}${fileExt}`;
    const filePath = path.join(DOWNLOADS_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    const deleted = await storage.deleteOfflineResource(resourceId);
    
    if (deleted) {
      res.json({ message: "Resource deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete resource from database" });
    }
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;