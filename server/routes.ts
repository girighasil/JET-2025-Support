import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  insertUserSchema,
  insertCourseSchema,
  insertModuleSchema,
  insertTestSchema,
  insertQuestionSchema,
  insertTestAttemptSchema,
  insertEnrollmentSchema,
  insertDoubtSessionSchema,
  insertStudyTimeSchema
} from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      fullName: string;
      role: string;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Middleware to check authentication
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };
  
  // Middleware to check role
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      next();
    };
  };
  
  // Auth routes are set up in setupAuth
  
  // User routes
  app.get("/api/users", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const users = await storage.listUsers(role);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Allow users to access their own data, or admins to access any user
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Course Routes
  app.get("/api/courses", async (req, res) => {
    try {
      const isActive = req.query.isActive === "true" ? true : 
                       req.query.isActive === "false" ? false : 
                       undefined;
      
      const courses = await storage.listCourses(isActive);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/courses", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.put("/api/courses/:id", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const courseData = insertCourseSchema.partial().parse(req.body);
      
      // Check if course exists and user is authorized to update it
      const existingCourse = await storage.getCourse(courseId);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (existingCourse.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(updatedCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.delete("/api/courses/:id", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const deleted = await storage.deleteCourse(courseId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Module Routes
  app.get("/api/courses/:courseId/modules", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const modules = await storage.listModules(courseId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(module);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/modules", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const moduleData = insertModuleSchema.parse(req.body);
      
      // Check if course exists
      const course = await storage.getCourse(moduleData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is authorized to add modules to this course
      if (course.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const module = await storage.createModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.put("/api/modules/:id", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const moduleData = insertModuleSchema.partial().parse(req.body);
      
      // Check if module exists
      const existingModule = await storage.getModule(moduleId);
      if (!existingModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Check if user is authorized to update modules for this course
      const course = await storage.getCourse(existingModule.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedModule = await storage.updateModule(moduleId, moduleData);
      if (!updatedModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(updatedModule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.delete("/api/modules/:id", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      
      // Check if module exists
      const existingModule = await storage.getModule(moduleId);
      if (!existingModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Check if user is authorized to delete modules for this course
      const course = await storage.getCourse(existingModule.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const deleted = await storage.deleteModule(moduleId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Test Routes
  app.get("/api/tests", async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const isActive = req.query.isActive === "true" ? true : 
                       req.query.isActive === "false" ? false : 
                       undefined;
      
      const tests = await storage.listTests(courseId, isActive);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/tests/:id", async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const test = await storage.getTest(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/tests", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const testData = insertTestSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      // If test is associated with a course, check if course exists
      if (testData.courseId) {
        const course = await storage.getCourse(testData.courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
      }
      
      const test = await storage.createTest(testData);
      res.status(201).json(test);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.put("/api/tests/:id", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const testData = insertTestSchema.partial().parse(req.body);
      
      // Check if test exists and user is authorized to update it
      const existingTest = await storage.getTest(testId);
      if (!existingTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      if (existingTest.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedTest = await storage.updateTest(testId, testData);
      if (!updatedTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(updatedTest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.delete("/api/tests/:id", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      
      // Check if test exists and user is authorized to delete it
      const existingTest = await storage.getTest(testId);
      if (!existingTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      if (existingTest.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const deleted = await storage.deleteTest(testId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json({ message: "Test deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Question Routes
  app.get("/api/tests/:testId/questions", async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const questions = await storage.listQuestions(testId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/questions/:id", async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.getQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/questions", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      
      // Check if test exists
      const test = await storage.getTest(questionData.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Check if user is authorized to add questions to this test
      if (test.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.put("/api/questions/:id", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const questionData = insertQuestionSchema.partial().parse(req.body);
      
      // Check if question exists
      const existingQuestion = await storage.getQuestion(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Check if user is authorized to update questions for this test
      const test = await storage.getTest(existingQuestion.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      if (test.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedQuestion = await storage.updateQuestion(questionId, questionData);
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.delete("/api/questions/:id", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      
      // Check if question exists
      const existingQuestion = await storage.getQuestion(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Check if user is authorized to delete questions for this test
      const test = await storage.getTest(existingQuestion.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      if (test.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const deleted = await storage.deleteQuestion(questionId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Reorder questions endpoint
  app.put("/api/questions/reorder", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Invalid updates format" });
      }
      
      // Check if all questions exist and user is authorized
      let testId: number | null = null;
      
      for (const update of updates) {
        if (!update.id || typeof update.sortOrder !== 'number') {
          return res.status(400).json({ message: "Each update must include id and sortOrder" });
        }
        
        const question = await storage.getQuestion(update.id);
        if (!question) {
          return res.status(404).json({ message: `Question with ID ${update.id} not found` });
        }
        
        // Store testId for authorization check
        if (testId === null) {
          testId = question.testId;
        } else if (testId !== question.testId) {
          return res.status(400).json({ message: "All questions must belong to the same test" });
        }
      }
      
      // Check if user is authorized to update questions for this test
      if (testId !== null) {
        const test = await storage.getTest(testId);
        if (!test || (req.user.role === "teacher" && test.createdBy !== req.user.id)) {
          return res.status(403).json({ message: "Unauthorized to update questions for this test" });
        }
      }
      
      // Update each question's sort order
      for (const update of updates) {
        await storage.updateQuestion(update.id, { sortOrder: update.sortOrder });
      }
      
      res.json({ message: "Questions reordered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error reordering questions", error: (error as Error).message });
    }
  });
  
  // Test Attempt Routes
  app.get("/api/test-attempts", isAuthenticated, async (req, res) => {
    try {
      let attempts;
      
      if (req.user.role === "student") {
        // Students can only see their own attempts
        attempts = await storage.getTestAttemptsByUser(req.user.id);
      } else {
        // Admins and teachers can see attempts by test
        const testId = req.query.testId ? parseInt(req.query.testId as string) : undefined;
        
        if (testId) {
          // Check if test exists and user is authorized to see attempts
          const test = await storage.getTest(testId);
          if (!test) {
            return res.status(404).json({ message: "Test not found" });
          }
          
          if (req.user.role === "teacher" && test.createdBy !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
          }
          
          attempts = await storage.getTestAttemptsByTest(testId);
        } else if (req.user.role === "admin") {
          // Only admins can see all attempts
          attempts = await storage.getTestAttemptsByUser(
            req.query.userId ? parseInt(req.query.userId as string) : req.user.id
          );
        } else {
          // Teachers can only see attempts for their tests
          return res.status(400).json({ message: "Test ID is required" });
        }
      }
      
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/test-attempts/:id", isAuthenticated, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const attempt = await storage.getTestAttempt(attemptId);
      
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }
      
      // Check if user is authorized to view this attempt
      if (req.user.role === "student" && attempt.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      if (req.user.role === "teacher") {
        // Teachers can only view attempts for tests they created
        const test = await storage.getTest(attempt.testId);
        if (!test || test.createdBy !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      res.json(attempt);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/test-attempts", isAuthenticated, async (req, res) => {
    try {
      // Students can only create attempts for themselves
      const attemptData = insertTestAttemptSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if test exists and is active
      const test = await storage.getTest(attemptData.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      if (!test.isActive) {
        return res.status(400).json({ message: "Test is not active" });
      }
      
      // Check if user already has an in-progress attempt for this test
      const existingAttempts = await storage.getTestAttemptsByUser(req.user.id);
      const inProgressAttempt = existingAttempts.find(
        a => a.testId === attemptData.testId && a.status === "in_progress"
      );
      
      if (inProgressAttempt) {
        return res.status(400).json({ 
          message: "You already have an in-progress attempt for this test",
          attemptId: inProgressAttempt.id
        });
      }
      
      const attempt = await storage.createTestAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.put("/api/test-attempts/:id", isAuthenticated, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const attemptData = insertTestAttemptSchema.partial().parse(req.body);
      
      // Check if attempt exists
      const existingAttempt = await storage.getTestAttempt(attemptId);
      if (!existingAttempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }
      
      // Students can only update their own attempts
      if (existingAttempt.userId !== req.user.id && req.user.role === "student") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Calculate score if attempt is being completed
      if (attemptData.status === "completed" && existingAttempt.status !== "completed") {
        const test = await storage.getTest(existingAttempt.testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }
        
        const questions = await storage.listQuestions(existingAttempt.testId);
        
        // Get answers from request or existing attempt
        const answers = attemptData.answers || existingAttempt.answers || {};
        
        // Calculate score
        let totalPoints = 0;
        let earnedPoints = 0;
        
        for (const question of questions) {
          totalPoints += question.points;
          
          // Skip if question wasn't answered
          if (!answers[question.id]) continue;
          
          // Check if answer is correct
          let isCorrect = false;
          
          switch (question.type) {
            case "mcq":
              // For MCQs, correctAnswer is an array of option IDs
              if (Array.isArray(question.correctAnswer)) {
                if (Array.isArray(answers[question.id])) {
                  isCorrect = question.correctAnswer.length === answers[question.id].length && 
                             question.correctAnswer.every(opt => answers[question.id].includes(opt));
                } else {
                  isCorrect = question.correctAnswer.includes(answers[question.id]);
                }
              } else {
                isCorrect = question.correctAnswer === answers[question.id];
              }
              break;
              
            case "truefalse":
              isCorrect = question.correctAnswer === answers[question.id];
              break;
              
            case "fillblank":
              if (Array.isArray(question.correctAnswer)) {
                isCorrect = question.correctAnswer.some(
                  opt => String(opt).toLowerCase() === String(answers[question.id]).toLowerCase()
                );
              } else {
                isCorrect = String(question.correctAnswer).toLowerCase() === String(answers[question.id]).toLowerCase();
              }
              break;
              
            case "subjective":
              // For subjective questions, grading may require manual review
              // Here we auto-grade based on keywords if available
              if (Array.isArray(question.correctAnswer) && typeof answers[question.id] === 'string') {
                isCorrect = question.correctAnswer.some(
                  keyword => answers[question.id].toLowerCase().includes(String(keyword).toLowerCase())
                );
              }
              break;
          }
          
          if (isCorrect) {
            earnedPoints += question.points;
          }
        }
        
        // Calculate percentage score
        attemptData.score = totalPoints > 0 
          ? Math.round((earnedPoints / totalPoints) * 100) 
          : 0;
        
        // Set completedAt if not provided
        if (!attemptData.completedAt) {
          attemptData.completedAt = new Date();
        }
      }
      
      const updatedAttempt = await storage.updateTestAttempt(attemptId, attemptData);
      if (!updatedAttempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }
      
      res.json(updatedAttempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Enrollment Routes
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      let enrollments;
      
      if (req.query.courseId) {
        // Get enrollments for a specific course
        const courseId = parseInt(req.query.courseId as string);
        
        // Check if course exists
        const course = await storage.getCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        // Students can only see their own enrollments
        if (req.user.role === "student") {
          const enrollment = await storage.getEnrollment(req.user.id, courseId);
          enrollments = enrollment ? [enrollment] : [];
        } else {
          enrollments = await storage.listEnrollmentsByCourse(courseId);
        }
      } else if (req.query.userId) {
        // Get enrollments for a specific user
        const userId = parseInt(req.query.userId as string);
        
        // Students can only see their own enrollments
        if (req.user.role === "student" && userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        enrollments = await storage.listEnrollmentsByUser(userId);
      } else {
        // Default to current user if no filters provided
        enrollments = await storage.listEnrollmentsByUser(req.user.id);
      }
      
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      // Students can only enroll themselves, admins/teachers can enroll others
      let userId = req.user.id;
      
      if (req.body.userId && req.user.role !== "student") {
        userId = req.body.userId;
      }
      
      const enrollmentData = insertEnrollmentSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if course exists and is active
      const course = await storage.getCourse(enrollmentData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (!course.isActive && req.user.role === "student") {
        return res.status(400).json({ message: "Course is not active" });
      }
      
      // Check if enrollment already exists
      const existingEnrollment = await storage.getEnrollment(enrollmentData.userId, enrollmentData.courseId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "User is already enrolled in this course" });
      }
      
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.put("/api/enrollments/:userId/:courseId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      
      // Students can only update their own enrollments
      if (req.user.role === "student" && userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const enrollmentData = insertEnrollmentSchema.partial().parse(req.body);
      
      // Check if enrollment exists
      const existingEnrollment = await storage.getEnrollment(userId, courseId);
      if (!existingEnrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      const updatedEnrollment = await storage.updateEnrollment(userId, courseId, enrollmentData);
      if (!updatedEnrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json(updatedEnrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.delete("/api/enrollments/:userId/:courseId", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      
      // Check if enrollment exists
      const existingEnrollment = await storage.getEnrollment(userId, courseId);
      if (!existingEnrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      const deleted = await storage.deleteEnrollment(userId, courseId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Doubt Session Routes
  app.get("/api/doubt-sessions", isAuthenticated, async (req, res) => {
    try {
      let sessions;
      
      if (req.user.role === "student") {
        // Students can only see their own sessions
        sessions = await storage.listDoubtSessionsByUser(req.user.id);
      } else if (req.user.role === "teacher") {
        // Teachers can see sessions assigned to them
        sessions = await storage.listDoubtSessionsByTeacher(req.user.id);
      } else {
        // Admins can see all sessions
        if (req.query.userId) {
          sessions = await storage.listDoubtSessionsByUser(parseInt(req.query.userId as string));
        } else if (req.query.teacherId) {
          sessions = await storage.listDoubtSessionsByTeacher(parseInt(req.query.teacherId as string));
        } else {
          // No filter provided, return empty array
          sessions = [];
        }
      }
      
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/doubt-sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getDoubtSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Doubt session not found" });
      }
      
      // Check if user is authorized to view this session
      if (req.user.role === "student" && session.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      if (req.user.role === "teacher" && session.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/doubt-sessions", isAuthenticated, async (req, res) => {
    try {
      // Students can only create sessions for themselves
      const sessionData = insertDoubtSessionSchema.parse({
        ...req.body,
        userId: req.user.role === "student" ? req.user.id : req.body.userId
      });
      
      // Check if user exists if not a student creating for themselves
      if (req.user.role !== "student" && sessionData.userId !== req.user.id) {
        const user = await storage.getUser(sessionData.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }
      
      // Check if teacher exists if provided
      if (sessionData.teacherId) {
        const teacher = await storage.getUser(sessionData.teacherId);
        if (!teacher || !["admin", "teacher"].includes(teacher.role)) {
          return res.status(404).json({ message: "Teacher not found" });
        }
      }
      
      const session = await storage.createDoubtSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.put("/api/doubt-sessions/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const sessionData = insertDoubtSessionSchema.partial().parse(req.body);
      
      // Check if session exists
      const existingSession = await storage.getDoubtSession(sessionId);
      if (!existingSession) {
        return res.status(404).json({ message: "Doubt session not found" });
      }
      
      // Check if user is authorized to update this session
      if (req.user.role === "student" && existingSession.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Teachers can only update sessions assigned to them
      if (req.user.role === "teacher" && existingSession.teacherId !== req.user.id) {
        // Exception: teachers can accept unassigned sessions
        if (!(existingSession.teacherId === null && sessionData.teacherId === req.user.id)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const updatedSession = await storage.updateDoubtSession(sessionId, sessionData);
      if (!updatedSession) {
        return res.status(404).json({ message: "Doubt session not found" });
      }
      
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Study Time Routes
  app.get("/api/study-times", isAuthenticated, async (req, res) => {
    try {
      let studyTimes;
      
      if (req.user.role === "student") {
        // Students can only see their own study times
        studyTimes = await storage.listStudyTimesByUser(req.user.id);
      } else if (req.query.userId) {
        // Admins/teachers can see study times for any user
        studyTimes = await storage.listStudyTimesByUser(parseInt(req.query.userId as string));
      } else {
        // No filter provided, default to current user
        studyTimes = await storage.listStudyTimesByUser(req.user.id);
      }
      
      res.json(studyTimes);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/study-times", isAuthenticated, async (req, res) => {
    try {
      // Students can only create study times for themselves
      const studyTimeData = insertStudyTimeSchema.parse({
        ...req.body,
        userId: req.user.role === "student" ? req.user.id : req.body.userId
      });
      
      // Validate references if provided
      if (studyTimeData.courseId) {
        const course = await storage.getCourse(studyTimeData.courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
      }
      
      if (studyTimeData.moduleId) {
        const module = await storage.getModule(studyTimeData.moduleId);
        if (!module) {
          return res.status(404).json({ message: "Module not found" });
        }
      }
      
      if (studyTimeData.testId) {
        const test = await storage.getTest(studyTimeData.testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }
      }
      
      const studyTime = await storage.createStudyTime(studyTimeData);
      res.status(201).json(studyTime);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.put("/api/study-times/:id", isAuthenticated, async (req, res) => {
    try {
      const studyTimeId = parseInt(req.params.id);
      const studyTimeData = insertStudyTimeSchema.partial().parse(req.body);
      
      // Check if study time exists
      const existingStudyTime = await storage.getStudyTime(studyTimeId);
      if (!existingStudyTime) {
        return res.status(404).json({ message: "Study time not found" });
      }
      
      // Students can only update their own study times
      if (req.user.role === "student" && existingStudyTime.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedStudyTime = await storage.updateStudyTime(studyTimeId, studyTimeData);
      if (!updatedStudyTime) {
        return res.status(404).json({ message: "Study time not found" });
      }
      
      res.json(updatedStudyTime);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Student Progress Analytics
  app.get("/api/analytics/student-progress", isAuthenticated, async (req, res) => {
    try {
      // Use the query parameter or default to current user
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user.id;
      
      // Students can only see their own progress
      if (req.user.role === "student" && userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const progress = await storage.getStudentProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Overall Platform Analytics (Admin only)
  app.get("/api/analytics/overall", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const analytics = await storage.getOverallAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Test Performance Analytics
  app.get("/api/analytics/test/:id", isAuthenticated, async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      
      // Check if test exists
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Students can't access detailed test analytics
      if (req.user.role === "student") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Teachers can only view analytics for tests they created
      if (req.user.role === "teacher" && test.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const analytics = await storage.getTestAnalytics(testId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
