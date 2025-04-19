import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { z } from "zod";
import { storage } from "./storage-impl";
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

// Import route modules
import filesRoutes from "./routes/files";
import importExportRoutes from "./routes/import-export";
import { registerNotificationRoutes } from "./routes/notifications";

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
      console.log("Updating course ID:", courseId);
      console.log("Request body:", req.body);
      
      const courseData = insertCourseSchema.partial().parse(req.body);
      console.log("Parsed course data:", courseData);
      
      // Check if course exists and user is authorized to update it
      const existingCourse = await storage.getCourse(courseId);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      console.log("Existing course:", existingCourse);
      
      if (existingCourse.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      console.log("About to update course");
      const updatedCourse = await storage.updateCourse(courseId, courseData);
      console.log("Updated course result:", updatedCourse);
      
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Send notifications to enrolled students about course update
      const updateType = "course_update";
      let message = "Course information has been updated.";
      
      // Add more specific messaging based on what was updated
      if (courseData.richContent) {
        message = "Course content has been updated with new materials.";
      } else if (courseData.videoUrl) {
        message = "New video content has been added to the course.";
      } else if (courseData.attachments) {
        message = "New course resources have been attached to the course.";
      }
      
      console.log("About to notify enrolled students");
      // Notify enrolled students about the update
      await storage.notifyCourseUpdate(courseId, updateType, message);
      
      res.json(updatedCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        console.error("Error updating course:", error);
        res.status(500).json({ message: "Server error", error: error.message });
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
      
      // Send notifications to enrolled students about module update
      const updateType = "course_update";
      let message = `Module "${updatedModule.title}" has been updated.`;
      
      if (moduleData.content) {
        message = `Module "${updatedModule.title}" content has been updated with new information.`;
      }
      
      // Notify enrolled students about the module update
      await storage.notifyCourseUpdate(updatedModule.courseId, updateType, message);
      
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
      
      // Add creator information to each test
      const testsWithCreatorInfo = await Promise.all(tests.map(async (test) => {
        const creator = await storage.getUser(test.createdBy);
        return {
          ...test,
          creatorName: creator ? creator.fullName || creator.username : "Unknown"
        };
      }));
      
      res.json(testsWithCreatorInfo);
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
      
      // Add creator information to the test
      const creator = await storage.getUser(test.createdBy);
      const testWithCreatorInfo = {
        ...test,
        creatorName: creator ? creator.fullName || creator.username : "Unknown"
      };
      
      res.json(testWithCreatorInfo);
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
      
      // If the test is associated with a course, send notifications
      if (updatedTest.courseId) {
        // Send notifications to enrolled students about test update
        const updateType = "test_update";
        let message = `Test "${updatedTest.title}" has been updated.`;
        
        if (testData.description) {
          message = `Test "${updatedTest.title}" has been updated with new information.`;
        } else if (testData.isActive === true) {
          message = `Test "${updatedTest.title}" is now available.`;
        } else if (testData.scheduledFor) {
          const date = new Date(updatedTest.scheduledFor).toLocaleDateString();
          message = `Test "${updatedTest.title}" has been scheduled for ${date}.`;
        }
        
        // Notify enrolled students about the test update
        await storage.notifyCourseUpdate(updatedTest.courseId, updateType, message);
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
  
  app.post("/api/tests/:testId/questions", isAuthenticated, hasRole(["admin", "teacher"]), async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        testId
      });
      
      // Check if test exists
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      // Check if user is authorized to add questions to this test
      // Only the test creator or admin can add questions
      if (test.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Handle decimal values for points and negative points
      const formattedQuestionData = {
        ...questionData,
        // Store original decimal values as strings in separate fields
        pointsFloat: questionData.points?.toString(),
        negativePointsFloat: questionData.negativePoints?.toString(),
      };
      
      // For safety, ensure the integer fields are integers (floor the values)
      if (typeof formattedQuestionData.points === 'number') {
        formattedQuestionData.points = Math.floor(formattedQuestionData.points);
      }
      
      if (typeof formattedQuestionData.negativePoints === 'number') {
        formattedQuestionData.negativePoints = Math.floor(formattedQuestionData.negativePoints);
      }
      
      const question = await storage.createQuestion(formattedQuestionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        console.error("Error creating question:", error);
        res.status(500).json({ message: "Server error" });
      }
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
      // Only the test creator or admin can add questions
      if (test.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Handle decimal values for points and negative points
      const formattedQuestionData = {
        ...questionData,
        // Store original decimal values as strings in separate fields
        pointsFloat: questionData.points?.toString(),
        negativePointsFloat: questionData.negativePoints?.toString(),
      };
      
      // For safety, ensure the integer fields are integers (floor the values)
      if (typeof formattedQuestionData.points === 'number') {
        formattedQuestionData.points = Math.floor(formattedQuestionData.points);
      }
      
      if (typeof formattedQuestionData.negativePoints === 'number') {
        formattedQuestionData.negativePoints = Math.floor(formattedQuestionData.negativePoints);
      }
      
      const question = await storage.createQuestion(formattedQuestionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        console.error("Error creating question:", error);
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
      
      // Only the test creator or admin can update questions
      if (test.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Handle decimal values for points and negative points
      const formattedQuestionData = {
        ...questionData
      };
      
      // Update point float values if points are provided
      if (questionData.points !== undefined) {
        formattedQuestionData.pointsFloat = questionData.points.toString();
        
        // For safety, ensure the integer field is an integer (floor the value)
        if (typeof formattedQuestionData.points === 'number') {
          formattedQuestionData.points = Math.floor(formattedQuestionData.points);
        }
      }
      
      // Update negative point float values if negative points are provided
      if (questionData.negativePoints !== undefined) {
        formattedQuestionData.negativePointsFloat = questionData.negativePoints.toString();
        
        // For safety, ensure the integer field is an integer (floor the value)
        if (typeof formattedQuestionData.negativePoints === 'number') {
          formattedQuestionData.negativePoints = Math.floor(formattedQuestionData.negativePoints);
        }
      }
      
      const updatedQuestion = await storage.updateQuestion(questionId, formattedQuestionData);
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        console.error("Error updating question:", error);
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
      
      // Only the test creator or admin can delete questions
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
        let totalNegativePoints = 0;
        
        // Detailed results object to store per-question results
        const results = {};
        
        for (const question of questions) {
          // Use decimal points if available, otherwise use integer points
          const pointsValue = question.pointsFloat ? parseFloat(question.pointsFloat) : question.points;
          const negPointsValue = question.negativePointsFloat ? parseFloat(question.negativePointsFloat) : question.negativePoints || 0;
          
          totalPoints += pointsValue;
          
          // Skip if question wasn't answered
          if (!answers[question.id]) {
            results[question.id] = {
              correct: false,
              answered: false,
              points: 0,
              possiblePoints: pointsValue
            };
            continue;
          }
          
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
          
          let pointsForQuestion = 0;
          
          if (isCorrect) {
            // For correct answers, award full points (no negative marking)
            pointsForQuestion = pointsValue;
            earnedPoints += pointsValue;
          } else if (negPointsValue > 0 && answers[question.id] !== undefined) {
            // Apply negative marking ONLY if the question was answered incorrectly
            // Skip unanswered questions (no penalty)
            pointsForQuestion = -negPointsValue;
            totalNegativePoints += negPointsValue;
          }
          
          // Store detailed results for this question
          results[question.id] = {
            correct: isCorrect,
            answered: answers[question.id] !== undefined,
            points: pointsForQuestion,
            possiblePoints: pointsValue
          };
        }
        
        // Calculate final score (can be negative)
        const finalPoints = earnedPoints - totalNegativePoints;
        
        // Calculate percentage score (always as a percentage of total available points)
        // Allow negative percentages if the student earned negative points overall
        attemptData.score = totalPoints > 0 
          ? Math.round((finalPoints / totalPoints) * 100)
          : 0;
        
        // Store detailed information about points
        attemptData.totalPoints = Math.round(finalPoints);
        attemptData.correctPoints = Math.round(earnedPoints);
        attemptData.negativePoints = Math.round(totalNegativePoints);
        
        // Store decimal values
        attemptData.totalPointsFloat = finalPoints.toFixed(2);
        attemptData.correctPointsFloat = earnedPoints.toFixed(2);
        attemptData.negativePointsFloat = totalNegativePoints.toFixed(2);
        
        // Store detailed results
        attemptData.results = results;
        
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
      console.log("GET /api/enrollments request with query:", req.query);
      let enrollments = [];
      
      // Check for combined courseId and userId filters
      if (req.query.courseId && req.query.userId) {
        const userId = parseInt(req.query.userId as string);
        const courseId = parseInt(req.query.courseId as string);
        
        console.log(`Looking for enrollment with userId=${userId} and courseId=${courseId}`);
        
        // Students can only see their own enrollments
        if (req.user.role === "student" && userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        // Check if course exists
        const course = await storage.getCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        // Get specific enrollment
        const enrollment = await storage.getEnrollment(userId, courseId);
        enrollments = enrollment ? [enrollment] : [];
        console.log(`Enrollment found:`, enrollment ? true : false);
      }
      // Check for courseId filter only
      else if (req.query.courseId) {
        const courseId = parseInt(req.query.courseId as string);
        console.log(`Looking for enrollments with courseId=${courseId}`);
        
        // Check if course exists
        const course = await storage.getCourse(courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        // Students can only see their own enrollments
        if (req.user.role === "student") {
          const enrollment = await storage.getEnrollment(req.user.id, courseId);
          enrollments = enrollment ? [enrollment] : [];
          console.log(`Student enrollment found:`, enrollment ? true : false);
        } else {
          enrollments = await storage.listEnrollmentsByCourse(courseId);
          console.log(`Found ${enrollments.length} enrollments for course`);
        }
      } 
      // Check for userId filter only
      else if (req.query.userId) {
        const userId = parseInt(req.query.userId as string);
        console.log(`Looking for enrollments with userId=${userId}`);
        
        // Students can only see their own enrollments
        if (req.user.role === "student" && userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        enrollments = await storage.listEnrollmentsByUser(userId);
        console.log(`Found ${enrollments.length} enrollments for user`);
      } 
      // Default to current user if no filters provided
      else {
        console.log(`No filters provided, returning enrollments for current user ${req.user.id}`);
        enrollments = await storage.listEnrollmentsByUser(req.user.id);
        console.log(`Found ${enrollments.length} enrollments for current user`);
      }
      
      console.log(`Returning ${enrollments.length} enrollments`);
      res.json(enrollments);
    } catch (error) {
      console.error("Error in GET /api/enrollments:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      console.log("Processing enrollment request:", req.body);
      
      // Students can only enroll themselves, admins/teachers can enroll others
      let userId = req.user.id;
      
      if (req.body.userId && req.user.role !== "student") {
        userId = req.body.userId;
        console.log(`Admin/Teacher is enrolling user ${userId}`);
      } else {
        console.log(`Student is self-enrolling with ID ${userId}`);
      }
      
      // Validate enrollment data
      const enrollmentData = insertEnrollmentSchema.parse({
        ...req.body,
        userId
      });
      
      console.log("Validated enrollment data:", enrollmentData);
      
      // Check if user exists
      const user = await storage.getUser(enrollmentData.userId);
      if (!user) {
        console.log(`User with ID ${enrollmentData.userId} not found`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if course exists and is active
      const course = await storage.getCourse(enrollmentData.courseId);
      if (!course) {
        console.log(`Course with ID ${enrollmentData.courseId} not found`);
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (!course.isActive && req.user.role === "student") {
        console.log(`Course ${course.id} is not active, student cannot enroll`);
        return res.status(400).json({ message: "Course is not active" });
      }
      
      // Double check if enrollment already exists to prevent race conditions
      console.log(`Checking if user ${enrollmentData.userId} is already enrolled in course ${enrollmentData.courseId}`);
      const existingEnrollment = await storage.getEnrollment(enrollmentData.userId, enrollmentData.courseId);
      
      if (existingEnrollment) {
        console.log(`User ${enrollmentData.userId} is already enrolled in course ${enrollmentData.courseId}`);
        return res.status(400).json({ 
          message: "User is already enrolled in this course",
          enrollment: existingEnrollment
        });
      }
      
      // Create the enrollment with a timestamp
      console.log(`Creating enrollment for user ${enrollmentData.userId} in course ${enrollmentData.courseId}`);
      const enrollmentWithDate = {
        ...enrollmentData,
        enrolledAt: new Date()
      };
      
      const enrollment = await storage.createEnrollment(enrollmentWithDate);
      console.log(`Successfully created enrollment:`, enrollment);
      
      // Create enrollment notification for the user
      try {
        // Create notification for course enrollment
        await storage.createNotification({
          userId: enrollmentData.userId,
          title: `Enrolled in "${course.title}"`,
          message: `You have been successfully enrolled in the course "${course.title}".`,
          type: "enrollment",
          resourceId: course.id,
          resourceType: "course",
          isRead: false,
          createdAt: new Date()
        });
        
        console.log(`Created enrollment notification for user ${enrollmentData.userId} in course ${course.title}`);
      } catch (notificationError) {
        // Log error but don't fail the enrollment request
        console.error("Error creating enrollment notification:", notificationError);
      }
      
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error in enrollment creation:", error.errors);
        res.status(400).json({ message: error.errors });
      } else {
        console.error("Unexpected error in enrollment creation:", error);
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

  // File uploads route
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Register routes for file handling
  app.use('/api/files', isAuthenticated, filesRoutes);
  
  // Register routes for import/export
  app.use('/api/import-export', isAuthenticated, hasRole(["admin", "teacher"]), importExportRoutes);
  
  // Register routes for notifications
  registerNotificationRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
