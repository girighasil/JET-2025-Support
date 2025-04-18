import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { uploadSingle, handleMulterError } from '../middlewares/upload';
import * as XLSX from 'xlsx';
import papaparse from 'papaparse';
import { db } from '../db';
import { courses, users, tests, modules } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Middleware to check if user is authenticated and admin/teacher
const isAuthorized = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'You must be logged in to access this resource' });
  }
  
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'teacher') {
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  }
  
  next();
};

// Helper to convert file to JSON data
const fileToJson = async (filePath: string): Promise<any[]> => {
  const extension = path.extname(filePath).toLowerCase();
  
  if (extension === '.csv') {
    // Parse CSV
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const results = papaparse.parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });
    
    const data = results.data;
    const errors = results.errors;
    
    if (errors.length > 0) {
      throw new Error(`CSV parsing error: ${errors[0].message}`);
    }
    
    return data as any[];
  } else if (['.xlsx', '.xls'].includes(extension)) {
    // Parse Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  } else {
    throw new Error('Unsupported file format');
  }
};

// Route to import courses
router.post('/courses/import', isAuthorized, uploadSingle('file'), handleMulterError, async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const data = await fileToJson(req.file.path);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'No data found in the imported file' });
    }
    
    const results = {
      created: 0,
      errors: [] as string[]
    };
    
    // Process each course in the data
    for (const item of data) {
      try {
        // Validate required fields
        if (!item.title || !item.category || !item.description) {
          results.errors.push(`Skipped row with missing required fields: ${JSON.stringify(item)}`);
          continue;
        }
        
        // Create the course
        await db.insert(courses).values({
          title: item.title,
          description: item.description,
          category: item.category,
          thumbnail: item.thumbnail || null,
          richContent: item.richContent || null,
          videoUrl: item.videoUrl || null,
          isActive: item.isActive === 'true' || item.isActive === true || false,
          createdBy: req.user!.id, // The authenticated user is the creator
          attachments: item.attachments ? JSON.parse(item.attachments) : null
        });
        
        results.created++;
      } catch (error: any) {
        results.errors.push(`Error importing row: ${error.message}`);
      }
    }
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
    res.status(201).json({
      message: `Successfully imported ${results.created} courses`,
      results
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ error: `Failed to import courses: ${error.message}` });
  }
});

// Route to export courses
router.get('/courses/export', isAuthorized, async (req: Request, res: Response) => {
  const format = req.query.format as string || 'csv';
  
  if (!['csv', 'xlsx'].includes(format)) {
    return res.status(400).json({ error: 'Unsupported export format. Use csv or xlsx.' });
  }
  
  try {
    // Get all courses
    const allCourses = await db.select().from(courses).orderBy(courses.title);
    
    // Transform data for export
    const exportData = allCourses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail || '',
      isActive: course.isActive ? 'true' : 'false',
      createdBy: course.createdBy,
      createdAt: course.createdAt ? new Date(course.createdAt).toISOString() : '',
      // Convert complex fields to JSON strings
      richContent: course.richContent || '',
      videoUrl: course.videoUrl || '',
      attachments: course.attachments ? JSON.stringify(course.attachments) : ''
    }));
    
    const fileName = `courses_export_${Date.now()}`;
    
    if (format === 'csv') {
      // Create CSV content
      const csvData = papaparse.unparse(exportData);
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}.csv`);
      
      return res.send(csvData);
    } else {
      // Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses');
      
      // Create a buffer for the Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for Excel download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);
      
      return res.send(excelBuffer);
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return res.status(500).json({ error: `Failed to export courses: ${error.message}` });
  }
});

// Add similar routes for tests, modules, etc.
// Tests import/export
router.post('/tests/import', isAuthorized, uploadSingle('file'), handleMulterError, async (req: Request, res: Response) => {
  // Similar implementation as courses import
  res.status(501).json({ message: 'Tests import not implemented yet' });
});

router.get('/tests/export', isAuthorized, async (req: Request, res: Response) => {
  // Similar implementation as courses export
  res.status(501).json({ message: 'Tests export not implemented yet' });
});

export default router;