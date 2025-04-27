import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectories based on content type
    let subDir = 'misc';
    
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir = 'audio';
    } else if (file.mimetype.includes('pdf')) {
      subDir = 'documents';
    } else if (
      file.mimetype.includes('spreadsheet') || 
      file.mimetype.includes('excel') ||
      file.mimetype.includes('csv')
    ) {
      subDir = 'imports';
    }
    
    const targetDir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with original extension
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter to only accept certain types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Default allowed types
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text files
    'text/plain', 'text/csv',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    // Video
    'video/mp4', 'video/webm', 'video/ogg'
  ];
  
  // Check if this is a question import request
  if (req.path.includes('/questions/import') || req.path.includes('/import-export')) {
    const importAllowedTypes = [
      'text/csv', 
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!importAllowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only CSV, Excel, and Word files are allowed for import.'));
    }
  } else if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type.'));
  }
  
  cb(null, true);
};

// Create multer instance with options
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

// Error handling middleware for multer
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // Other errors
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Export middleware for different scenarios
export const uploadSingle = (fieldName: string = 'file') => upload.single(fieldName);
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => 
  upload.array(fieldName, maxCount);

// Helper to get file URL for client
export const getFileUrl = (file: Express.Multer.File) => {
  const relativePath = path.relative(uploadsDir, file.path).replace(/\\/g, '/');
  return `/uploads/${relativePath}`;
};

// Helper to get a full file object for the client
export const getFileObject = (file: Express.Multer.File) => {
  return {
    id: path.basename(file.path, path.extname(file.path)), // Use filename without extension as ID
    name: file.originalname,
    type: file.mimetype,
    url: getFileUrl(file),
    size: file.size
  };
};

export default upload;