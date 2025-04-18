import { Router, Request, Response } from 'express';
import upload from '../middlewares/upload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Upload a single file
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const file = req.file;
    const fileType = file.mimetype.split('/')[0];
    
    // Create response with file metadata
    const fileData = {
      id: uuidv4(),
      name: file.originalname,
      type: file.mimetype,
      url: `/uploads/${getFileType(file.mimetype)}/${file.filename}`,
      size: file.size
    };
    
    res.status(201).json(fileData);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

// Upload multiple files
router.post('/uploads', upload.array('files', 10), (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const files = req.files;
    const fileData = files.map(file => ({
      id: uuidv4(),
      name: file.originalname,
      type: file.mimetype,
      url: `/uploads/${getFileType(file.mimetype)}/${file.filename}`,
      size: file.size
    }));
    
    res.status(201).json(fileData);
  } catch (error) {
    console.error('Files upload error:', error);
    res.status(500).json({ message: 'Files upload failed' });
  }
});

// Delete a file
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({ message: 'File path is required' });
    }
    
    // Ensure path is safe (prevent directory traversal attacks)
    const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
    const relativePath = path.relative(process.cwd(), fullPath);
    
    if (relativePath.startsWith('..')) {
      return res.status(403).json({ message: 'Invalid file path' });
    }
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete the file
    fs.unlinkSync(fullPath);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'File deletion failed' });
  }
});

// Helper function to categorize file types
function getFileType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'images';
  if (mimetype.startsWith('video/')) return 'videos';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('application/pdf')) return 'documents';
  if (mimetype.startsWith('application/') || mimetype.startsWith('text/')) return 'documents';
  return 'others';
}

export default router;