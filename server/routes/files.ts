import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { 
  uploadSingle, 
  uploadMultiple, 
  getFileObject, 
  handleMulterError 
} from '../middlewares/upload';

const router = express.Router();
const uploadsDir = path.join(process.cwd(), 'uploads');

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'You must be logged in to access this resource' });
  }
  next();
};

// Upload a single file
router.post('/upload', isAuthenticated, uploadSingle(), handleMulterError, (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const fileObject = getFileObject(req.file);
    res.status(201).json(fileObject);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
});

// Upload multiple files
router.post('/uploads', isAuthenticated, uploadMultiple('files', 10), handleMulterError, (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  try {
    const fileObjects = req.files.map(file => getFileObject(file));
    res.status(201).json(fileObjects);
  } catch (error) {
    console.error('Files upload error:', error);
    res.status(500).json({ error: 'Failed to process uploaded files' });
  }
});

// Delete a file
router.delete('/:id', isAuthenticated, (req: Request, res: Response) => {
  const fileId = req.params.id;
  const filePath = req.body.path;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }
  
  // Make sure the path is within our uploads directory
  const absolutePath = path.join(process.cwd(), filePath.startsWith('/') ? filePath.slice(1) : filePath);
  const relativePath = path.relative(uploadsDir, absolutePath);
  
  if (relativePath.startsWith('..')) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return res.status(200).json({ success: true, message: 'File deleted successfully' });
    } else {
      // File doesn't exist but we'll consider it a success since it's gone
      return res.status(200).json({ success: true, message: 'File not found but marked as deleted' });
    }
  } catch (error) {
    console.error('File deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get all uploaded files (admin only)
router.get('/', isAuthenticated, (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    // Get all files recursively (this is a simplified version)
    const files: any[] = [];
    
    // This is a simplified approach - in a real app you might want to use a database
    // to track uploads rather than scanning the directory
    const scanDir = (dir: string) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          scanDir(itemPath);
        } else {
          const relativePath = path.relative(uploadsDir, itemPath).replace(/\\/g, '/');
          files.push({
            id: path.basename(itemPath, path.extname(itemPath)),
            name: item,
            url: `/uploads/${relativePath}`,
            size: stats.size,
            // Mime type isn't easily available without additional libraries
            type: path.extname(itemPath).toLowerCase()
          });
        }
      });
    };
    
    scanDir(uploadsDir);
    res.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to retrieve files list' });
  }
});

export default router;