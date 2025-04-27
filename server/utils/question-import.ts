import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { z } from 'zod';

// Define the question structure
export interface ParsedQuestion {
  type: 'mcq' | 'truefalse' | 'fillblank' | 'subjective';
  question: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer: any; // String, array of strings, or boolean
  points?: number;
  negativePoints?: number;
  explanation?: string;
}

/**
 * Parse questions from an Excel file
 */
export async function parseExcelQuestions(filePath: string): Promise<{ 
  questions: ParsedQuestion[], 
  errors: string[] 
}> {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    const questions: ParsedQuestion[] = [];
    const errors: string[] = [];
    
    // Process each row in the Excel file
    rawData.forEach((row: any, index: number) => {
      try {
        if (!row.type || !row.question) {
          errors.push(`Row ${index + 1}: Missing required fields (type or question)`);
          return;
        }
        
        // Validate question type
        const type = row.type.toLowerCase();
        if (!['mcq', 'truefalse', 'fillblank', 'subjective'].includes(type)) {
          errors.push(`Row ${index + 1}: Invalid question type "${type}"`);
          return;
        }
        
        const question: ParsedQuestion = {
          type: type as any,
          question: row.question,
          correctAnswer: null
        };
        
        // Parse points if provided
        if (row.points) {
          const points = parseFloat(row.points);
          if (!isNaN(points)) {
            question.points = points;
          }
        }
        
        // Parse negative points if provided
        if (row.negativePoints) {
          const negativePoints = parseFloat(row.negativePoints);
          if (!isNaN(negativePoints)) {
            question.negativePoints = negativePoints;
          }
        }
        
        // Parse explanation if provided
        if (row.explanation) {
          question.explanation = row.explanation;
        }
        
        // Process type-specific fields
        switch (type) {
          case 'mcq':
            if (!row.options) {
              errors.push(`Row ${index + 1}: MCQ questions require options`);
              return;
            }
            
            // Parse options - expected format: "A:Option text,B:Another option"
            const optionPairs = row.options.split(',');
            const parsedOptions: Array<{ id: string; text: string }> = [];
            
            optionPairs.forEach((pair: string) => {
              const parts = pair.split(':');
              if (parts.length === 2) {
                const id = parts[0].trim().toLowerCase();
                const text = parts[1].trim();
                parsedOptions.push({ id, text });
              }
            });
            
            if (parsedOptions.length < 2) {
              errors.push(`Row ${index + 1}: MCQ questions require at least 2 options`);
              return;
            }
            
            question.options = parsedOptions;
            
            // Parse correct answers - expected format: "a,b" for multiple correct answers
            if (!row.correctAnswer) {
              errors.push(`Row ${index + 1}: MCQ questions require a correct answer`);
              return;
            }
            
            const correctAnswers = row.correctAnswer.split(',')
              .map((ans: string) => ans.trim().toLowerCase());
            
            // Validate that correct answers exist in options
            const optionIds = parsedOptions.map(o => o.id);
            const invalidAnswers = correctAnswers.filter(
              (ans: string) => !optionIds.includes(ans)
            );
            
            if (invalidAnswers.length > 0) {
              errors.push(`Row ${index + 1}: Correct answers ${invalidAnswers.join(',')} do not exist in options`);
              return;
            }
            
            question.correctAnswer = correctAnswers;
            break;
            
          case 'truefalse':
            // Parse correct answer as boolean
            const tfAnswer = row.correctAnswer?.toString().toLowerCase();
            if (tfAnswer !== 'true' && tfAnswer !== 'false') {
              errors.push(`Row ${index + 1}: True/False questions require 'true' or 'false' as correct answer`);
              return;
            }
            
            question.correctAnswer = tfAnswer === 'true';
            break;
            
          case 'fillblank':
            // Simple string answer
            if (!row.correctAnswer) {
              errors.push(`Row ${index + 1}: Fill in the blank questions require a correct answer`);
              return;
            }
            
            question.correctAnswer = row.correctAnswer.toString();
            break;
            
          case 'subjective':
            // Array of keywords
            if (!row.correctAnswer) {
              // Keywords are optional for subjective questions
              question.correctAnswer = [];
            } else {
              // Parse comma-separated keywords
              question.correctAnswer = row.correctAnswer.split(',')
                .map((keyword: string) => keyword.trim())
                .filter((keyword: string) => keyword.length > 0);
            }
            break;
        }
        
        questions.push(question);
      } catch (err: any) {
        errors.push(`Row ${index + 1}: ${err.message}`);
      }
    });
    
    return { questions, errors };
  } catch (err: any) {
    return { 
      questions: [], 
      errors: [`Failed to parse Excel file: ${err.message}`] 
    };
  }
}

/**
 * Parse questions from a Word document
 */
export async function parseWordQuestions(filePath: string): Promise<{ 
  questions: ParsedQuestion[], 
  errors: string[] 
}> {
  try {
    // Extract text from the Word document
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    const warnings = result.messages;
    
    const questions: ParsedQuestion[] = [];
    const errors: string[] = [];
    
    if (warnings.length > 0) {
      errors.push(`Document conversion warnings: ${warnings.map(w => w.message).join('; ')}`);
    }
    
    // Split text into question blocks
    // Each question should start with "Q:" or "Question:"
    const questionRegex = /(?:^|\n)(?:Q:|Question:)\s*(.*?)(?=(?:\n(?:Q:|Question:))|$)/g;
    let questionMatch;
    let questionIndex = 0;
    
    while ((questionMatch = questionRegex.exec(text))) {
      questionIndex++;
      try {
        const questionBlock = questionMatch[1].trim();
        if (!questionBlock) {
          errors.push(`Question ${questionIndex}: Empty question text`);
          continue;
        }
        
        // Default question type is MCQ unless specified
        let type: 'mcq' | 'truefalse' | 'fillblank' | 'subjective' = 'mcq';
        let questionText = '';
        let options: Array<{ id: string; text: string }> = [];
        let correctAnswer: any = null;
        let points: number | undefined;
        let negativePoints: number | undefined;
        let explanation: string | undefined;
        
        // Extract question type if specified
        const typeRegex = /Type:\s*(\w+)/i;
        const typeMatch = questionBlock.match(typeRegex);
        if (typeMatch) {
          const specifiedType = typeMatch[1].toLowerCase();
          if (['mcq', 'truefalse', 'fillblank', 'subjective'].includes(specifiedType)) {
            type = specifiedType as any;
          } else {
            errors.push(`Question ${questionIndex}: Invalid type "${specifiedType}"`);
          }
        }
        
        // Extract points if specified
        const pointsRegex = /Points:\s*([\d.]+)/i;
        const pointsMatch = questionBlock.match(pointsRegex);
        if (pointsMatch) {
          points = parseFloat(pointsMatch[1]);
        }
        
        // Extract negative points if specified
        const negPointsRegex = /Negative Points:\s*([\d.]+)/i;
        const negPointsMatch = questionBlock.match(negPointsRegex);
        if (negPointsMatch) {
          negativePoints = parseFloat(negPointsMatch[1]);
        }
        
        // Extract explanation if provided
        const explanationLines = questionBlock.split('\n')
          .filter(line => line.match(/^Explanation:/i))
          .map(line => line.replace(/^Explanation:/i, '').trim());
          
        if (explanationLines.length > 0) {
          explanation = explanationLines[0];
        }
        
        // Extract question text (everything before the first option)
        const lines = questionBlock.split('\n');
        let questionEndIndex = lines.findIndex(line => 
          /^[A-D]\)/.test(line.trim()) || // MCQ option format: A) Option text
          /^(True|False)[:.]/i.test(line.trim()) || // True/False format
          /^Answer[:.]/i.test(line.trim()) // Fill in blank format
        );
        
        if (questionEndIndex === -1) {
          // No options found, treat the entire block as the question
          // (minus any metadata like Type, Points, etc.)
          questionText = questionBlock
            .replace(typeRegex, '')
            .replace(pointsRegex, '')
            .replace(negPointsRegex, '')
            .replace(/^Explanation:.*$/im, '')
            .trim();
        } else {
          // Extract question text as everything before options
          questionText = lines.slice(0, questionEndIndex).join('\n')
            .replace(typeRegex, '')
            .replace(pointsRegex, '')
            .replace(negPointsRegex, '')
            .replace(/^Explanation:.*$/im, '')
            .trim();
        }
        
        // Process based on question type
        switch (type) {
          case 'mcq': {
            // Extract MCQ options and correct answer
            const optionRegex = /^([A-D])\)\s*(.*?)$/gm;
            let optionMatch;
            const optionMap = new Map<string, string>();
            const correctAnswers: string[] = [];
            
            while ((optionMatch = optionRegex.exec(questionBlock))) {
              const optionId = optionMatch[1].toLowerCase();
              let optionText = optionMatch[2].trim();
              
              // Check if this option is marked as correct with an asterisk
              if (optionText.startsWith('*')) {
                optionText = optionText.substring(1).trim();
                correctAnswers.push(optionId);
              }
              
              optionMap.set(optionId, optionText);
            }
            
            if (optionMap.size < 2) {
              errors.push(`Question ${questionIndex}: MCQ questions require at least 2 options`);
              continue;
            }
            
            // Create options array
            options = Array.from(optionMap.entries()).map(([id, text]) => ({ id, text }));
            
            // If no options were marked with asterisks, look for explicit correct answer
            if (correctAnswers.length === 0) {
              const answersRegex = /Correct(?:\s+Answer)?[s:]?\s*([A-D,\s]+)/i;
              const answersMatch = questionBlock.match(answersRegex);
              if (answersMatch) {
                const answerText = answersMatch[1].trim();
                answerText.split(/\s*,\s*/).forEach(ans => {
                  const cleanAns = ans.trim().toLowerCase();
                  if (/^[a-d]$/.test(cleanAns)) {
                    correctAnswers.push(cleanAns);
                  }
                });
              }
            }
            
            if (correctAnswers.length === 0) {
              errors.push(`Question ${questionIndex}: No correct answer specified for MCQ question`);
              continue;
            }
            
            correctAnswer = correctAnswers;
            break;
          }
          
          case 'truefalse': {
            // Look for True/False options and which one is marked correct
            const trueRegex = /^True[:.]\s*(\*?)(.*?)$/mi;
            const falseRegex = /^False[:.]\s*(\*?)(.*?)$/mi;
            
            const trueMatch = questionBlock.match(trueRegex);
            const falseMatch = questionBlock.match(falseRegex);
            
            if (trueMatch && trueMatch[1] === '*') {
              correctAnswer = true;
            } else if (falseMatch && falseMatch[1] === '*') {
              correctAnswer = false;
            } else {
              // Look for explicit correct answer
              const answerRegex = /Correct(?:\s+Answer)?[s:]?\s*(True|False)/i;
              const answerMatch = questionBlock.match(answerRegex);
              if (answerMatch) {
                correctAnswer = answerMatch[1].toLowerCase() === 'true';
              } else {
                errors.push(`Question ${questionIndex}: No correct answer specified for True/False question`);
                continue;
              }
            }
            break;
          }
          
          case 'fillblank': {
            // Look for explicit answer 
            const answerRegex = /Answer[:.]\s*(.*?)(?=\n|$)/i;
            const answerMatch = questionBlock.match(answerRegex);
            if (answerMatch) {
              correctAnswer = answerMatch[1].trim();
            } else {
              errors.push(`Question ${questionIndex}: No answer specified for Fill in the Blank question`);
              continue;
            }
            break;
          }
          
          case 'subjective': {
            // Look for keywords
            const keywordsRegex = /(?:Keywords|Key\s+Words)[:.]\s*(.*?)(?=\n|$)/i;
            const keywordsMatch = questionBlock.match(keywordsRegex);
            if (keywordsMatch) {
              correctAnswer = keywordsMatch[1]
                .split(',')
                .map((k: string) => k.trim())
                .filter((k: string) => k.length > 0);
            } else {
              correctAnswer = []; // Keywords are optional for subjective questions
            }
            break;
          }
        }
        
        if (!questionText) {
          errors.push(`Question ${questionIndex}: Empty question text after parsing`);
          continue;
        }
        
        const parsedQuestion: ParsedQuestion = {
          type,
          question: questionText,
          correctAnswer
        };
        
        if (options.length > 0) {
          parsedQuestion.options = options;
        }
        
        if (points !== undefined) {
          parsedQuestion.points = points;
        }
        
        if (negativePoints !== undefined) {
          parsedQuestion.negativePoints = negativePoints;
        }
        
        if (explanation) {
          parsedQuestion.explanation = explanation;
        }
        
        questions.push(parsedQuestion);
      } catch (err: any) {
        errors.push(`Question ${questionIndex}: ${err.message}`);
      }
    }
    
    if (questions.length === 0 && errors.length === 0) {
      errors.push('No questions found in the document. Make sure each question starts with "Q:" or "Question:"');
    }
    
    return { questions, errors };
  } catch (err: any) {
    return { 
      questions: [], 
      errors: [`Failed to parse Word document: ${err.message}`] 
    };
  }
}

/**
 * Parse questions from a file based on its extension
 */
export async function parseQuestionsFromFile(filePath: string): Promise<{ 
  questions: ParsedQuestion[], 
  errors: string[] 
}> {
  const extension = path.extname(filePath).toLowerCase();
  
  if (['.xlsx', '.xls'].includes(extension)) {
    return parseExcelQuestions(filePath);
  } else if (['.docx', '.doc'].includes(extension)) {
    return parseWordQuestions(filePath);
  } else {
    return {
      questions: [],
      errors: [`Unsupported file format: ${extension}. Please upload an Excel or Word document.`]
    };
  }
}