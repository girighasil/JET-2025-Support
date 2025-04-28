import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

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
    console.log('Parsing Excel file:', filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${rawData.length} rows in the Excel file`);
    
    const questions: ParsedQuestion[] = [];
    const errors: string[] = [];
    
    // Process each row in the Excel file
    rawData.forEach((row: any, index: number) => {
      try {
        // Be more flexible with column names - try different variations
        const typeOptions = ['type', 'Type', 'TYPE', 'questionType', 'QuestionType'];
        const questionOptions = ['question', 'Question', 'QUESTION', 'questionText', 'QuestionText'];
        const optionsOptions = ['options', 'Options', 'OPTIONS', 'choices', 'Choices'];
        const answerOptions = ['correctAnswer', 'CorrectAnswer', 'answer', 'Answer', 'ANSWER'];
        const pointsOptions = ['points', 'Points', 'POINTS', 'mark', 'Mark'];
        const negativePointsOptions = ['negativePoints', 'NegativePoints', 'negative', 'Negative'];
        const explanationOptions = ['explanation', 'Explanation', 'EXPLANATION', 'solution', 'Solution'];
        
        // Try to find the values using different possible column names
        const findValue = (options: string[]) => {
          for (const option of options) {
            if (row[option] !== undefined) {
              return row[option];
            }
          }
          return undefined;
        };
        
        const typeValue = findValue(typeOptions);
        const questionValue = findValue(questionOptions);
        const optionsValue = findValue(optionsOptions);
        const answerValue = findValue(answerOptions);
        const pointsValue = findValue(pointsOptions);
        const negativePointsValue = findValue(negativePointsOptions);
        const explanationValue = findValue(explanationOptions);
        
        // Skip completely empty rows
        if (!typeValue && !questionValue) {
          // Only log a warning if there seems to be some data in the row
          if (Object.keys(row).length > 0) {
            errors.push(`Row ${index + 1}: Missing required fields (type and question)`);
          }
          return;
        }
        
        // If question is missing but we have some data, try to extract it
        if (!questionValue) {
          errors.push(`Row ${index + 1}: Missing question text`);
          return;
        }
        
        // Default to MCQ if no type specified
        let type = 'mcq';
        if (typeValue) {
          const normalizedType = String(typeValue).toLowerCase().trim();
          
          // Map common variations to our standard types
          const typeMap: Record<string, 'mcq' | 'truefalse' | 'fillblank' | 'subjective'> = {
            'mcq': 'mcq',
            'multiple choice': 'mcq',
            'multiple-choice': 'mcq',
            'multiplechoice': 'mcq',
            'multiple': 'mcq',
            'truefalse': 'truefalse',
            'true-false': 'truefalse',
            'true/false': 'truefalse',
            'true false': 'truefalse',
            'tf': 'truefalse',
            'fillblank': 'fillblank',
            'fill-blank': 'fillblank',
            'fill blank': 'fillblank',
            'fill in the blank': 'fillblank',
            'fill-in-the-blank': 'fillblank',
            'fillintheblanks': 'fillblank',
            'short answer': 'fillblank',
            'shortanswer': 'fillblank',
            'subjective': 'subjective',
            'essay': 'subjective',
            'long answer': 'subjective',
            'longanswer': 'subjective',
            'open ended': 'subjective',
            'openended': 'subjective'
          };
          
          type = typeMap[normalizedType] || 'mcq';
        }
        
        // Create the base question
        const question: ParsedQuestion = {
          type: type as any,
          question: String(questionValue),
          correctAnswer: null
        };
        
        // Parse points if provided
        if (pointsValue) {
          const points = parseFloat(String(pointsValue));
          if (!isNaN(points)) {
            question.points = points;
          }
        }
        
        // Parse negative points if provided
        if (negativePointsValue) {
          const negativePoints = parseFloat(String(negativePointsValue));
          if (!isNaN(negativePoints)) {
            question.negativePoints = negativePoints;
          }
        }
        
        // Parse explanation if provided
        if (explanationValue) {
          question.explanation = String(explanationValue);
        }
        
        // Process type-specific fields
        switch (type) {
          case 'mcq':
            if (!optionsValue && !answerValue) {
              errors.push(`Row ${index + 1}: MCQ questions require options and a correct answer`);
              return;
            }
            
            let options: Array<{ id: string; text: string }> = [];
            
            // Try to parse options in various formats
            if (optionsValue) {
              const optionText = String(optionsValue);
              
              // Format: "A:Option text,B:Another option"
              if (optionText.includes(':')) {
                const optionPairs = optionText.split(',');
                
                optionPairs.forEach((pair: string) => {
                  const parts = pair.split(':');
                  if (parts.length === 2) {
                    const id = parts[0].trim().toLowerCase();
                    const text = parts[1].trim();
                    options.push({ id, text });
                  }
                });
              }
              // Format: "Option text, Another option" (implicit A, B, C...)
              else {
                const optionTexts = optionText.split(',');
                const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
                
                optionTexts.forEach((text: string, i: number) => {
                  if (i < letters.length) {
                    options.push({ id: letters[i], text: text.trim() });
                  }
                });
              }
            }
            
            // Try to extract options from separate columns like optionA, optionB, etc.
            if (options.length === 0) {
              const optionKeys = Object.keys(row).filter(key => 
                /^option[a-z]$/i.test(key) || 
                /^choice[a-z]$/i.test(key) ||
                /^opt[a-z]$/i.test(key)
              );
              
              optionKeys.forEach(key => {
                const match = key.match(/[A-Za-z]$/);
                if (match) {
                  const id = match[0].toLowerCase();
                  const text = String(row[key]).trim();
                  options.push({ id, text });
                }
              });
            }
            
            if (options.length < 2) {
              errors.push(`Row ${index + 1}: MCQ questions require at least 2 options`);
              return;
            }
            
            question.options = options;
            
            // Parse correct answers
            if (answerValue) {
              const answerText = String(answerValue);
              
              // Multiple answers separated by commas
              if (answerText.includes(',')) {
                const correctAnswers = answerText
                  .split(',')
                  .map((ans: string) => ans.trim().toLowerCase())
                  .filter(ans => ans.length === 1); // Only single letters
                  
                question.correctAnswer = correctAnswers;
              }
              // Single letter answer
              else if (/^[a-z]$/i.test(answerText.trim())) {
                question.correctAnswer = [answerText.trim().toLowerCase()];
              }
              // Handle answer by full text match
              else {
                const matchingOption = options.find(opt => 
                  opt.text.toLowerCase() === answerText.toLowerCase()
                );
                if (matchingOption) {
                  question.correctAnswer = [matchingOption.id];
                } else {
                  errors.push(`Row ${index + 1}: Correct answer '${answerText}' does not match any option`);
                  return;
                }
              }
            } else {
              errors.push(`Row ${index + 1}: MCQ questions require a correct answer`);
              return;
            }
            break;
            
          case 'truefalse':
            // Parse correct answer as boolean
            if (answerValue) {
              const tfAnswer = String(answerValue).toLowerCase().trim();
              
              if (['true', 't', 'yes', 'y', '1'].includes(tfAnswer)) {
                question.correctAnswer = true;
              } else if (['false', 'f', 'no', 'n', '0'].includes(tfAnswer)) {
                question.correctAnswer = false;
              } else {
                errors.push(`Row ${index + 1}: True/False questions require 'true' or 'false' as correct answer`);
                return;
              }
            } else {
              errors.push(`Row ${index + 1}: True/False questions require a correct answer`);
              return;
            }
            break;
            
          case 'fillblank':
            // Simple string answer
            if (answerValue) {
              question.correctAnswer = String(answerValue);
            } else {
              errors.push(`Row ${index + 1}: Fill in the blank questions require a correct answer`);
              return;
            }
            break;
            
          case 'subjective':
            // Array of keywords
            if (answerValue) {
              // Parse comma-separated keywords
              question.correctAnswer = String(answerValue)
                .split(',')
                .map((keyword: string) => keyword.trim())
                .filter((keyword: string) => keyword.length > 0);
            } else {
              // Keywords are optional for subjective questions
              question.correctAnswer = [];
            }
            break;
        }
        
        questions.push(question);
      } catch (err: any) {
        errors.push(`Row ${index + 1}: ${err.message}`);
      }
    });
    
    // Log the result
    console.log(`Parsed ${questions.length} questions from Excel file`);
    if (errors.length > 0) {
      console.log(`Found ${errors.length} errors while parsing Excel file`);
    }
    
    return { questions, errors };
  } catch (err: any) {
    console.error('Failed to parse Excel file:', err);
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
    console.log('Parsing Word document:', filePath);
    
    // Extract text from the Word document
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    const warnings = result.messages;
    
    const questions: ParsedQuestion[] = [];
    const errors: string[] = [];
    
    if (warnings.length > 0) {
      errors.push(`Document conversion warnings: ${warnings.map(w => w.message).join('; ')}`);
    }
    
    // Try several patterns for question identification
    const questionPatterns = [
      // Standard "Q:" or "Question:" format
      /(?:^|\n)(?:Q:|Question:|Question\s+\d+:)\s*(.*?)(?=(?:\n(?:Q:|Question:|Question\s+\d+:))|$)/gs,
      // Numbered questions like "1." or "1)"
      /(?:^|\n)(?:\d+[\.\)]\s+)\s*(.*?)(?=(?:\n(?:\d+[\.\)]\s+))|$)/gs,
      // Bracketed numbers like "[1]"
      /(?:^|\n)(?:\[\d+\])\s*(.*?)(?=(?:\n(?:\[\d+\]))|$)/gs
    ];
    
    let foundQuestions = false;
    let totalQuestions = 0;
    
    // Try each pattern until we find questions
    for (const pattern of questionPatterns) {
      console.log(`Trying pattern: ${pattern}`);
      
      const questionsForThisPattern: ParsedQuestion[] = [];
      const errorsForThisPattern: string[] = [];
      let questionIndex = 0;
      
      // Reset the pattern for each attempt
      pattern.lastIndex = 0;
      
      let questionMatch;
      while ((questionMatch = pattern.exec(text))) {
        foundQuestions = true;
        questionIndex++;
        
        try {
          const questionBlock = questionMatch[1].trim();
          if (!questionBlock) {
            errorsForThisPattern.push(`Question ${questionIndex}: Empty question text`);
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
            
            const typeMap: Record<string, 'mcq' | 'truefalse' | 'fillblank' | 'subjective'> = {
              'mcq': 'mcq',
              'multiple': 'mcq',
              'multiplechoice': 'mcq',
              'truefalse': 'truefalse',
              'tf': 'truefalse',
              'fillblank': 'fillblank',
              'fillintheblanks': 'fillblank',
              'subjective': 'subjective',
              'essay': 'subjective'
            };
            
            if (typeMap[specifiedType]) {
              type = typeMap[specifiedType];
            } else {
              errorsForThisPattern.push(`Question ${questionIndex}: Invalid type "${specifiedType}"`);
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
          const explanationRegex = /Explanation:\s*(.*?)(?=\n|$)/i;
          const explanationMatch = questionBlock.match(explanationRegex);
          if (explanationMatch) {
            explanation = explanationMatch[1].trim();
          }
          
          // Extract question text (everything before the first option)
          const lines = questionBlock.split('\n');
          
          // Identify the line where options start
          let questionEndIndex = -1;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Detect various option formats
            if (
              /^[A-D][\.\)]/.test(line) || // A. or A)
              /^Option\s+[A-D]:/i.test(line) || // Option A:
              /^(True|False)[:.]/i.test(line) || // True/False format
              /^Answer[:.]/i.test(line) || // Answer: format
              line.match(typeRegex) || 
              line.match(pointsRegex) ||
              line.match(negPointsRegex) ||
              line.match(explanationRegex)
            ) {
              if (questionEndIndex === -1) {
                questionEndIndex = i;
              }
            }
          }
          
          if (questionEndIndex === -1) {
            // No options/metadata found, use entire block as question
            questionText = questionBlock;
          } else {
            // Extract question text as everything before options/metadata
            questionText = lines.slice(0, questionEndIndex).join('\n').trim();
          }
          
          // Clean up the question text by removing metadata
          questionText = questionText
            .replace(typeRegex, '')
            .replace(pointsRegex, '')
            .replace(negPointsRegex, '')
            .replace(explanationRegex, '')
            .trim();
          
          // Process based on question type
          switch (type) {
            case 'mcq': {
              // Try different formats for options
              const optionPatterns = [
                /([A-D])\)\s*(.*?)(?=(?:[A-D]\))|$)/gs,  // A) Option text
                /([A-D])[\.\)]\s*(.*?)(?=(?:[A-D][\.\)])|$)/gs, // A. Option text or A) Option text
                /Option\s+([A-D]):\s*(.*?)(?=(?:Option\s+[A-D]:)|$)/gis // Option A: Option text
              ];
              
              let foundOptions = false;
              const optionMap = new Map<string, string>();
              const correctAnswers: string[] = [];
              
              // Try each pattern
              for (const optPattern of optionPatterns) {
                optPattern.lastIndex = 0;
                let optionMatch;
                
                while ((optionMatch = optPattern.exec(questionBlock))) {
                  foundOptions = true;
                  const optionId = optionMatch[1].toLowerCase();
                  let optionText = optionMatch[2].trim();
                  
                  // Check if this option is marked as correct with an asterisk
                  if (optionText.startsWith('*')) {
                    optionText = optionText.substring(1).trim();
                    correctAnswers.push(optionId);
                  }
                  
                  optionMap.set(optionId, optionText);
                }
                
                if (foundOptions) break;
              }
              
              if (!foundOptions) {
                // If still no options found, try a more flexible approach
                // Look for lines starting with letters
                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i].trim();
                  const match = line.match(/^([A-D])[\.\)\s-]+(.*)/);
                  
                  if (match) {
                    foundOptions = true;
                    const optionId = match[1].toLowerCase();
                    let optionText = match[2].trim();
                    
                    if (optionText.startsWith('*')) {
                      optionText = optionText.substring(1).trim();
                      correctAnswers.push(optionId);
                    }
                    
                    optionMap.set(optionId, optionText);
                  }
                }
              }
              
              if (optionMap.size < 2) {
                errorsForThisPattern.push(`Question ${questionIndex}: MCQ questions require at least 2 options`);
                continue;
              }
              
              // Create options array
              options = Array.from(optionMap.entries()).map(([id, text]) => ({ id, text }));
              
              // If no options were marked with asterisks, look for explicit correct answer
              if (correctAnswers.length === 0) {
                // Try multiple formats for correct answer specification
                const answerPatterns = [
                  /Correct(?:\s+Answer)?[s:]?\s*([A-D,\s]+)/i,
                  /Answer[s:]?\s*([A-D,\s]+)/i,
                  /Ans(?:wer)?[s:]?\s*([A-D,\s]+)/i
                ];
                
                for (const ansPattern of answerPatterns) {
                  const answersMatch = questionBlock.match(ansPattern);
                  if (answersMatch) {
                    const answerText = answersMatch[1].trim();
                    answerText.split(/\s*[,;]\s*/).forEach(ans => {
                      const cleanAns = ans.trim().toLowerCase();
                      if (/^[a-d]$/.test(cleanAns)) {
                        correctAnswers.push(cleanAns);
                      }
                    });
                    
                    if (correctAnswers.length > 0) break;
                  }
                }
              }
              
              if (correctAnswers.length === 0) {
                errorsForThisPattern.push(`Question ${questionIndex}: No correct answer specified for MCQ question`);
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
                  errorsForThisPattern.push(`Question ${questionIndex}: No correct answer specified for True/False question`);
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
                errorsForThisPattern.push(`Question ${questionIndex}: No answer specified for Fill in the Blank question`);
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
            errorsForThisPattern.push(`Question ${questionIndex}: Empty question text after parsing`);
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
          
          questionsForThisPattern.push(parsedQuestion);
        } catch (err: any) {
          errorsForThisPattern.push(`Question ${questionIndex}: ${err.message}`);
        }
      }
      
      // If we found questions with this pattern, use them
      if (questionsForThisPattern.length > 0) {
        questions.push(...questionsForThisPattern);
        errors.push(...errorsForThisPattern);
        totalQuestions += questionsForThisPattern.length;
        break; // Stop trying other patterns
      }
    }
    
    // Provide helpful error messages if no questions were found
    if (totalQuestions === 0) {
      if (!foundQuestions) {
        errors.push('No questions found in the document. Try these formats:');
        errors.push('1. Start each question with "Q:" or "Question:"');
        errors.push('2. Number your questions (e.g., "1." or "1)")');
        errors.push('3. Use bracketed numbers (e.g., "[1]")');
      } else {
        errors.push('Questions were found but could not be parsed correctly. Check the format.');
      }
    }
    
    // Log the result
    console.log(`Parsed ${questions.length} questions from Word document`);
    if (errors.length > 0) {
      console.log(`Found ${errors.length} errors while parsing Word document`);
    }
    
    return { questions, errors };
  } catch (err: any) {
    console.error('Failed to parse Word document:', err);
    return { 
      questions: [], 
      errors: [`Failed to parse Word document: ${err.message}`] 
    };
  }
}

/**
 * Parse questions from a PDF file
 */
export async function parsePdfQuestions(filePath: string): Promise<{ 
  questions: ParsedQuestion[], 
  errors: string[] 
}> {
  try {
    console.log('Parsing PDF file:', filePath);
    
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Extract text from the PDF
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;
    
    console.log(`Extracted ${text.length} characters from PDF`);
    
    // Use the same approach as Word document parsing
    const questions: ParsedQuestion[] = [];
    const errors: string[] = [];
    
    // Try several patterns for question identification
    const questionPatterns = [
      // Standard "Q:" or "Question:" format
      /(?:^|\n)(?:Q:|Question:|Question\s+\d+:)\s*(.*?)(?=(?:\n(?:Q:|Question:|Question\s+\d+:))|$)/gs,
      // Numbered questions like "1." or "1)"
      /(?:^|\n)(?:\d+[\.\)]\s+)\s*(.*?)(?=(?:\n(?:\d+[\.\)]\s+))|$)/gs,
      // Bracketed numbers like "[1]"
      /(?:^|\n)(?:\[\d+\])\s*(.*?)(?=(?:\n(?:\[\d+\]))|$)/gs
    ];
    
    let foundQuestions = false;
    let totalQuestions = 0;
    
    // Try each pattern until we find questions
    for (const pattern of questionPatterns) {
      console.log(`Trying pattern: ${pattern}`);
      
      const questionsForThisPattern: ParsedQuestion[] = [];
      const errorsForThisPattern: string[] = [];
      let questionIndex = 0;
      
      // Reset the pattern for each attempt
      pattern.lastIndex = 0;
      
      let questionMatch;
      while ((questionMatch = pattern.exec(text))) {
        foundQuestions = true;
        questionIndex++;
        
        try {
          const questionBlock = questionMatch[1].trim();
          if (!questionBlock) {
            errorsForThisPattern.push(`Question ${questionIndex}: Empty question text`);
            continue;
          }
          
          // Default to MCQ type unless specified
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
            
            const typeMap: Record<string, 'mcq' | 'truefalse' | 'fillblank' | 'subjective'> = {
              'mcq': 'mcq',
              'multiple': 'mcq',
              'multiplechoice': 'mcq',
              'truefalse': 'truefalse',
              'tf': 'truefalse',
              'fillblank': 'fillblank',
              'fillintheblanks': 'fillblank',
              'subjective': 'subjective',
              'essay': 'subjective'
            };
            
            if (typeMap[specifiedType]) {
              type = typeMap[specifiedType];
            } else {
              errorsForThisPattern.push(`Question ${questionIndex}: Invalid type "${specifiedType}"`);
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
          const explanationRegex = /Explanation:\s*(.*?)(?=\n|$)/i;
          const explanationMatch = questionBlock.match(explanationRegex);
          if (explanationMatch) {
            explanation = explanationMatch[1].trim();
          }
          
          // Extract question text (everything before the first option)
          const lines = questionBlock.split('\n');
          
          // Identify the line where options start
          let questionEndIndex = -1;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Detect various option formats
            if (
              /^[A-D][\.\)]/.test(line) || // A. or A)
              /^Option\s+[A-D]:/i.test(line) || // Option A:
              /^(True|False)[:.]/i.test(line) || // True/False format
              /^Answer[:.]/i.test(line) || // Answer: format
              line.match(typeRegex) || 
              line.match(pointsRegex) ||
              line.match(negPointsRegex) ||
              line.match(explanationRegex)
            ) {
              if (questionEndIndex === -1) {
                questionEndIndex = i;
              }
            }
          }
          
          if (questionEndIndex === -1) {
            // No options/metadata found, use entire block as question
            questionText = questionBlock;
          } else {
            // Extract question text as everything before options/metadata
            questionText = lines.slice(0, questionEndIndex).join('\n').trim();
          }
          
          // Clean up the question text by removing metadata
          questionText = questionText
            .replace(typeRegex, '')
            .replace(pointsRegex, '')
            .replace(negPointsRegex, '')
            .replace(explanationRegex, '')
            .trim();
          
          // PDF format can be more varied, so we'll try different option formats
          if (type === 'mcq') {
            const optionPatterns = [
              /([A-D])\)\s*(.*?)(?=(?:[A-D]\))|$)/gs,  // A) Option text
              /([A-D])[\.\)]\s*(.*?)(?=(?:[A-D][\.\)])|$)/gs, // A. Option text or A) Option text
              /Option\s+([A-D]):\s*(.*?)(?=(?:Option\s+[A-D]:)|$)/gis // Option A: Option text
            ];
            
            let foundOptions = false;
            const optionMap = new Map<string, string>();
            const correctAnswers: string[] = [];
            
            // Try each pattern
            for (const optPattern of optionPatterns) {
              optPattern.lastIndex = 0;
              let optionMatch;
              
              while ((optionMatch = optPattern.exec(questionBlock))) {
                foundOptions = true;
                const optionId = optionMatch[1].toLowerCase();
                let optionText = optionMatch[2].trim();
                
                // Check if this option is marked as correct with an asterisk
                if (optionText.startsWith('*')) {
                  optionText = optionText.substring(1).trim();
                  correctAnswers.push(optionId);
                }
                
                optionMap.set(optionId, optionText);
              }
              
              if (foundOptions) break;
            }
            
            if (!foundOptions) {
              // If still no options found, try a more flexible approach
              // Look for lines starting with letters
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const match = line.match(/^([A-D])[\.\)\s-]+(.*)/);
                
                if (match) {
                  foundOptions = true;
                  const optionId = match[1].toLowerCase();
                  let optionText = match[2].trim();
                  
                  if (optionText.startsWith('*')) {
                    optionText = optionText.substring(1).trim();
                    correctAnswers.push(optionId);
                  }
                  
                  optionMap.set(optionId, optionText);
                }
              }
            }
            
            if (optionMap.size < 2) {
              // Be super flexible - try to find any text that might be options
              const flexibleOptionRegex = /([A-D])(?:[\.\)]|\s*-)\s*([^A-D\n].+?)(?=(?:\n[A-D](?:[\.\)]|\s*-))|$)/gs;
              flexibleOptionRegex.lastIndex = 0;
              let optionMatch;
              
              while ((optionMatch = flexibleOptionRegex.exec(questionBlock))) {
                foundOptions = true;
                const optionId = optionMatch[1].toLowerCase();
                let optionText = optionMatch[2].trim();
                
                if (optionText.startsWith('*')) {
                  optionText = optionText.substring(1).trim();
                  correctAnswers.push(optionId);
                }
                
                optionMap.set(optionId, optionText);
              }
            }
            
            if (optionMap.size < 2) {
              errorsForThisPattern.push(`Question ${questionIndex}: Could not find valid MCQ options`);
              continue;
            }
            
            // Create options array
            options = Array.from(optionMap.entries()).map(([id, text]) => ({ id, text }));
            
            // If no options were marked with asterisks, look for explicit correct answer
            if (correctAnswers.length === 0) {
              // Try multiple formats for correct answer specification
              const answerPatterns = [
                /Correct(?:\s+Answer)?[s:]?\s*([A-D,\s]+)/i,
                /Answer[s:]?\s*([A-D,\s]+)/i,
                /Ans(?:wer)?[s:]?\s*([A-D,\s]+)/i,
                /(?:The\s+)?correct\s+(?:answer|option)\s+is\s*([A-D,\s]+)/i
              ];
              
              for (const ansPattern of answerPatterns) {
                const answersMatch = questionBlock.match(ansPattern);
                if (answersMatch) {
                  const answerText = answersMatch[1].trim();
                  answerText.split(/\s*[,;]\s*/).forEach(ans => {
                    const cleanAns = ans.trim().toLowerCase();
                    if (/^[a-d]$/.test(cleanAns)) {
                      correctAnswers.push(cleanAns);
                    }
                  });
                  
                  if (correctAnswers.length > 0) break;
                }
              }
            }
            
            if (correctAnswers.length === 0) {
              // If still no correct answers, check if any option text contains phrases indicating the correct answer
              for (const [id, text] of optionMap.entries()) {
                const lowerText = text.toLowerCase();
                if (lowerText.includes('correct') || 
                    lowerText.includes('right answer') || 
                    lowerText.includes('this is the answer')) {
                  correctAnswers.push(id);
                }
              }
            }
            
            if (correctAnswers.length === 0) {
              errorsForThisPattern.push(`Question ${questionIndex}: No correct answer specified for MCQ question`);
              continue;
            }
            
            correctAnswer = correctAnswers;
          } else if (type === 'truefalse') {
            // Look for True/False indicators
            const trueRegex = /^True[:.]/im;
            const falseRegex = /^False[:.]/im;
            const answerRegex = /(?:Correct\s+Answer|Answer)[s:]?\s*(True|False)/i;
            
            if (questionBlock.match(trueRegex) && questionBlock.indexOf('*True') !== -1) {
              correctAnswer = true;
            } else if (questionBlock.match(falseRegex) && questionBlock.indexOf('*False') !== -1) {
              correctAnswer = false;
            } else {
              const answerMatch = questionBlock.match(answerRegex);
              if (answerMatch) {
                correctAnswer = answerMatch[1].toLowerCase() === 'true';
              } else {
                // Try to detect "true" or "false" in the question block
                if (questionBlock.toLowerCase().includes('answer: true') || 
                    questionBlock.toLowerCase().includes('answer:true')) {
                  correctAnswer = true;
                } else if (questionBlock.toLowerCase().includes('answer: false') || 
                           questionBlock.toLowerCase().includes('answer:false')) {
                  correctAnswer = false;
                } else {
                  errorsForThisPattern.push(`Question ${questionIndex}: No correct answer specified for True/False question`);
                  continue;
                }
              }
            }
          } else if (type === 'fillblank') {
            // Look for answer indicators
            const answerRegex = /(?:Correct\s+)?Answer[s:]?\s*(.*?)(?=\n|$)/i;
            const answerMatch = questionBlock.match(answerRegex);
            
            if (answerMatch) {
              correctAnswer = answerMatch[1].trim();
            } else {
              errorsForThisPattern.push(`Question ${questionIndex}: No answer specified for Fill in the Blank question`);
              continue;
            }
          } else if (type === 'subjective') {
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
          }
          
          if (!questionText) {
            errorsForThisPattern.push(`Question ${questionIndex}: Empty question text after parsing`);
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
          
          questionsForThisPattern.push(parsedQuestion);
        } catch (err: any) {
          errorsForThisPattern.push(`Question ${questionIndex}: ${err.message}`);
        }
      }
      
      // If we found questions with this pattern, use them
      if (questionsForThisPattern.length > 0) {
        questions.push(...questionsForThisPattern);
        errors.push(...errorsForThisPattern);
        totalQuestions += questionsForThisPattern.length;
        break; // Stop trying other patterns
      }
    }
    
    // Provide helpful error messages if no questions were found
    if (totalQuestions === 0) {
      if (!foundQuestions) {
        errors.push('No questions found in the PDF. Try these formats:');
        errors.push('1. Start each question with "Q:" or "Question:"');
        errors.push('2. Number your questions (e.g., "1." or "1)")');
        errors.push('3. Use bracketed numbers (e.g., "[1]")');
      } else {
        errors.push('Questions were found but could not be parsed correctly. Check the format.');
      }
    }
    
    // Log the result
    console.log(`Parsed ${questions.length} questions from PDF file`);
    if (errors.length > 0) {
      console.log(`Found ${errors.length} errors while parsing PDF file`);
    }
    
    return { questions, errors };
  } catch (err: any) {
    console.error('Failed to parse PDF file:', err);
    return { 
      questions: [], 
      errors: [`Failed to parse PDF file: ${err.message}`] 
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
  try {
    const extension = path.extname(filePath).toLowerCase();
    console.log(`Parsing file with extension: ${extension}`);
    
    if (['.xlsx', '.xls'].includes(extension)) {
      console.log('Using Excel parser');
      return parseExcelQuestions(filePath);
    } else if (['.docx', '.doc'].includes(extension)) {
      console.log('Using Word parser');
      return parseWordQuestions(filePath);
    } else if (['.csv'].includes(extension)) {
      console.log('Using CSV parser (via Excel)');
      // For CSV files, we'll treat them like Excel files
      // XLSX can read CSV files as well
      return parseExcelQuestions(filePath);
    } else if (['.pdf'].includes(extension)) {
      console.log('Using PDF parser');
      return parsePdfQuestions(filePath);
    } else {
      console.log(`Unsupported file format: ${extension}`);
      return {
        questions: [],
        errors: [`Unsupported file format: ${extension}. Please upload an Excel, CSV, Word, or PDF document.`]
      };
    }
  } catch (err: any) {
    console.error('Error in parseQuestionsFromFile:', err);
    return {
      questions: [],
      errors: [`Failed to parse file: ${err.message}`]
    };
  }
}