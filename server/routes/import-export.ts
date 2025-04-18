import { Router, Request, Response } from 'express';
import { z } from 'zod';
import upload from '../middlewares/upload';
import { insertCourseSchema } from '../../shared/schema';
import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const router = Router();

// Import courses from CSV/Excel
router.post('/import/courses', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get file extension to determine type
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const filePath = req.file.path;
    
    let coursesData: any[] = [];
    
    // Parse file based on type
    if (fileExt === '.csv') {
      // Parse CSV file
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const result = Papa.parse(csvContent, { header: true });
      coursesData = result.data as any[];
    } else if (['.xlsx', '.xls'].includes(fileExt)) {
      // Parse Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      coursesData = XLSX.utils.sheet_to_json(worksheet);
    } else {
      // Clean up the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ message: 'Unsupported file format. Use CSV or Excel (.xlsx/.xls)' });
    }
    
    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Validate and process course data
    const createdCourses = [];
    const errors = [];
    
    for (let i = 0; i < coursesData.length; i++) {
      const courseData = coursesData[i];
      
      try {
        // Add required properties and normalize data
        const course = {
          title: courseData.title,
          description: courseData.description || '',
          category: courseData.category || 'General',
          isActive: courseData.isActive === 'true' || courseData.isActive === true,
          createdBy: req.user?.id || 1, // Default to admin if not authenticated
          thumbnail: courseData.thumbnail || '',
          richContent: courseData.richContent || '',
          videoUrl: courseData.videoUrl || '',
          attachments: []
        };
        
        // Validate course data
        const validCourse = insertCourseSchema.parse(course);
        
        // Store course in database
        const createdCourse = await storage.createCourse(validCourse);
        createdCourses.push(createdCourse);
      } catch (error) {
        // Track errors for reporting
        if (error instanceof z.ZodError) {
          errors.push({ row: i + 1, error: error.errors });
        } else {
          errors.push({ row: i + 1, error: 'Invalid course data' });
        }
      }
    }
    
    // Return results
    res.status(201).json({
      imported: createdCourses.length,
      total: coursesData.length,
      courses: createdCourses,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed' });
  }
});

// Export courses to CSV
router.get('/export/courses', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format || 'csv').toString().toLowerCase();
    
    // Get all courses
    const courses = await storage.listCourses();
    
    // Prepare the courses for export (remove sensitive or complex fields)
    const exportData = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      isActive: course.isActive,
      createdAt: course.createdAt,
      thumbnail: course.thumbnail || '',
      richContent: course.richContent || '',
      videoUrl: course.videoUrl || ''
      // Exclude attachments which are complex objects
    }));
    
    if (format === 'json') {
      // Send as JSON
      res.json(exportData);
    } else if (format === 'excel' || format === 'xlsx') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses');
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers
      res.setHeader('Content-Disposition', 'attachment; filename=courses.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Send file
      res.send(buffer);
    } else {
      // Default to CSV
      const csv = Papa.unparse(exportData);
      
      // Set headers
      res.setHeader('Content-Disposition', 'attachment; filename=courses.csv');
      res.setHeader('Content-Type', 'text/csv');
      
      // Send CSV data
      res.send(csv);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

export default router;