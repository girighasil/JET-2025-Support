import express, { Request, Response } from 'express';
import fs from 'fs';
import { uploadSingle, handleMulterError } from '../middlewares/upload';
import { db } from '../db';
import { questions } from '../../shared/schema';
import { parseQuestionsFromFile, ParsedQuestion } from '../utils/question-import';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Middleware to check if user is authenticated and authorized
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

// Route to import questions from a file
router.post('/tests/:testId/questions/import', isAuthorized, uploadSingle('file'), handleMulterError, async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const testId = parseInt(req.params.testId);
  if (isNaN(testId)) {
    // Remove the file and return error
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid test ID' });
  }
  
  try {
    // Parse the questions from the file
    const { questions: parsedQuestions, errors: parseErrors } = await parseQuestionsFromFile(req.file.path);
    
    // Remove the file after parsing
    fs.unlinkSync(req.file.path);
    
    if (parsedQuestions.length === 0) {
      return res.status(400).json({
        error: 'No valid questions found in the file',
        details: { created: 0, errors: parseErrors }
      });
    }
    
    // Insert the questions into the database
    const results = {
      created: 0,
      errors: [...parseErrors] // Start with parse errors
    };
    
    // Get the maximum sort order for existing questions
    const existingQuestions = await db.select({ sortOrder: questions.sortOrder })
      .from(questions)
      .where(eq(questions.testId, testId))
      .orderBy(desc(questions.sortOrder))
      .limit(1);
    
    let startSortOrder = existingQuestions.length > 0 ? existingQuestions[0].sortOrder + 1 : 0;
    
    // Insert each question
    for (const parsedQuestion of parsedQuestions) {
      try {
        const { type, question: questionText, options, correctAnswer, points, negativePoints, explanation } = parsedQuestion;
        
        const jsonOptions = options ? JSON.stringify(options) : null;
        const jsonCorrectAnswer = JSON.stringify(correctAnswer);
        
        // Default values
        const pointsValue = points || 1;
        const negativePointsValue = negativePoints || 0;
        
        // Check if points or negative points have decimal values
        const hasDecimalPoints = pointsValue % 1 !== 0;
        const hasDecimalNegativePoints = negativePointsValue % 1 !== 0;
        
        // Insert the question
        await db.insert(questions).values({
          testId,
          type,
          question: questionText,
          options: jsonOptions,
          correctAnswer: jsonCorrectAnswer,
          // For integer columns, we store rounded values
          points: Math.round(pointsValue),
          negativePoints: Math.round(negativePointsValue),
          // Store original decimal values in the float columns
          pointsFloat: hasDecimalPoints ? pointsValue.toString() : null,
          negativePointsFloat: hasDecimalNegativePoints ? negativePointsValue.toString() : null,
          explanation,
          sortOrder: startSortOrder++
        });
        
        results.created++;
      } catch (error: any) {
        results.errors.push(`Error inserting question: ${error.message}`);
      }
    }
    
    // Success response
    res.status(201).json({
      message: `Successfully imported ${results.created} questions`,
      results
    });
  } catch (error: any) {
    // Error handling
    console.error('Import error:', error);
    return res.status(500).json({ 
      error: `Failed to import questions: ${error.message}`,
      details: { created: 0, errors: [error.message] }
    });
  }
});

export default router;