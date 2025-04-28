import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { z } from "zod";
import { storage } from "./storage-impl";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import fetch from "node-fetch";
import {
  insertUserSchema,
  insertCourseSchema,
  insertModuleSchema,
  insertTestSchema,
  insertQuestionSchema,
  insertTestAttemptSchema,
  insertEnrollmentSchema,
  insertEnrollmentRequestSchema,
  insertDoubtSessionSchema,
  insertStudyTimeSchema,
  insertSiteConfigSchema,
  insertPromoBannerSchema,
  siteConfig,
  promoBanners,
  enrollments as enrollmentsTable,
  enrollmentRequests,
} from "@shared/schema";

// Import route modules
import filesRoutes from "./routes/files";
import importExportRoutes from "./routes/import-export";
import questionImportRoutes from "./routes/question-import";
import templateRoutes from "./routes/templates";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerSiteConfigRoutes } from "./routes/site-config";
import { registerPromoBannerRoutes } from "./routes/promo-banners";

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
  app.get(
    "/api/users",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const role = req.query.role as string | undefined;
        const users = await storage.listUsers(role);

        // Get enrollment counts for all users
        const usersWithEnrollmentCounts = await Promise.all(
          users.map(async (user) => {
            const { password: _, ...userWithoutPassword } = user;

            // For students, get enrollment count
            if (user.role === "student") {
              // Get enrollments for this user
              const userEnrollments = await storage.listEnrollmentsByUser(
                user.id,
              );

              return {
                ...userWithoutPassword,
                enrollmentCount: userEnrollments.length,
              };
            }

            return userWithoutPassword;
          }),
        );

        res.json(usersWithEnrollmentCounts);
      } catch (error) {
        console.error("Error fetching users with enrollment counts:", error);
        res.status(500).json({ message: "Server error" });
      }
    },
  );

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
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const isActive =
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined;

      let courses;
      // Using the negation pattern that avoids TypeScript errors
      if (req.user.role === "teacher") {
        // Teachers see only courses they created
        courses = await storage.listCourses(isActive, req.user.id);
      } else {
        // Admin or other roles see all courses
        courses = await storage.listCourses(isActive);
      }
      // Enrich courses with creator information
      const coursesWithCreatorInfo = await Promise.all(
        courses.map(async (course) => {
          const creator = await storage.getUser(course.createdBy);
          console.log("Course creator data:", {
            courseId: course.id,
            createdBy: course.createdBy,
            creator,
          });
          return {
            ...course,
            creatorName: creator
              ? creator.fullName || creator.username
              : "Unknown",
          };
        }),
      );
      // Log the first few courses to verify data
      console.log(
        "First few enriched courses:",
        coursesWithCreatorInfo.slice(0, 3).map((c) => ({
          id: c.id,
          title: c.title,
          creatorName: c.creatorName,
          createdBy: c.createdBy,
        })),
      );
      res.json(coursesWithCreatorInfo);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app.get("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Create a safe copy we can modify
      const safeResponse = { ...course };

      // Handle backward compatibility for old videoUrl data format
      // This is for legacy support where some courses might have videoUrl instead of videoUrls
      if ("videoUrl" in safeResponse) {
        const videoUrl = (safeResponse as any).videoUrl;
        if (
          videoUrl &&
          (!safeResponse.videoUrls ||
            (typeof safeResponse.videoUrls === "object" &&
              Object.keys(safeResponse.videoUrls).length === 0))
        ) {
          console.log(
            "Converting legacy videoUrl to videoUrls array for course:",
            courseId,
          );
          safeResponse.videoUrls = [videoUrl];
        }
      }

      // Ensure resourceLinks is always a valid array
      if (
        !safeResponse.resourceLinks ||
        (typeof safeResponse.resourceLinks === "object" &&
          Object.keys(safeResponse.resourceLinks).length === 0)
      ) {
        safeResponse.resourceLinks = [];
      }

      // Add debug logging to see what's in the response
      console.log("Course data sent to client:", {
        id: safeResponse.id,
        title: safeResponse.title,
        videoUrls: safeResponse.videoUrls,
        resourceLinks: safeResponse.resourceLinks,
      });

      res.json(safeResponse);
    } catch (error) {
      console.error("Error getting course:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post(
    "/api/courses",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
      try {
        const courseData = insertCourseSchema.parse({
          ...req.body,
          createdBy: req.user.id,
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
    },
  );

  app.put(
    "/api/courses/:id",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
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

        if (
          existingCourse.createdBy !== req.user.id &&
          req.user.role !== "admin"
        ) {
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
        } else if (courseData.videoUrls && courseData.videoUrls.length > 0) {
          message = "New video content has been added to the course.";
        } else if (
          courseData.resourceLinks &&
          courseData.resourceLinks.length > 0
        ) {
          message = "New resource links have been added to the course.";
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
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
      }
    },
  );

  app.delete(
    "/api/courses/:id",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
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
    },
  );

  // Module Routes
  app.get(
    "/api/courses/:courseId/modules",
    isAuthenticated,
    async (req, res) => {
      try {
        const courseId = parseInt(req.params.courseId);
        const modules = await storage.listModules(courseId);
        res.json(modules);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  app.get("/api/modules/:id", isAuthenticated, async (req, res) => {
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

  app.post(
    "/api/modules",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
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
    },
  );

  app.put(
    "/api/modules/:id",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
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
        await storage.notifyCourseUpdate(
          updatedModule.courseId,
          updateType,
          message,
        );

        res.json(updatedModule);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: error.errors });
        } else {
          res.status(500).json({ message: "Server error" });
        }
      }
    },
  );

  app.delete(
    "/api/modules/:id",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
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
    },
  );

  // Test Routes
  app.get("/api/tests", isAuthenticated, async (req, res) => {
    try {
      // Get query parameters
      const courseId = req.query.courseId
        ? parseInt(req.query.courseId as string)
        : undefined;
      const isActive =
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined;
      const visibility = req.query.visibility as 'public' | 'private' | undefined;
      const testType = req.query.testType as 'formal' | 'practice' | undefined;

      // Filter tests based on criteria
      const tests = await storage.listTests({
        courseId,
        isActive,
        visibility,
        testType
      });

      // Add creator information to each test
      const testsWithCreatorInfo = await Promise.all(
        tests.map(async (test) => {
          const creator = await storage.getUser(test.createdBy);
          return {
            ...test,
            creatorName: creator
              ? creator.fullName || creator.username
              : "Unknown",
          };
        }),
      );

      res.json(testsWithCreatorInfo);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // List available tests for students (including public practice tests)
  app.get("/api/available-tests", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Get enrollments to determine which courses the student is enrolled in
      const enrollments = await storage.listEnrollmentsByUser(req.user.id);
      const enrolledCourseIds = enrollments.map(
        (enrollment) => enrollment.courseId,
      );

      // Get tests that are active
      const activeTests = await storage.listTests({
        isActive: true
      });

      // Filter tests based on visibility and test type
      const availableTests = activeTests.filter((test) => {
        // Case 1: Public tests (both practice and formal) are always available
        if (test.visibility === "public") {
          // But for formal tests, still require course enrollment
          if (test.testType === "formal" && test.courseId) {
            return enrolledCourseIds.includes(test.courseId);
          }
          return true; // Public practice tests available to all
        }
        
        // Case 2: Private tests require course enrollment
        if (test.visibility === "private" && test.courseId) {
          return enrolledCourseIds.includes(test.courseId);
        }
        
        // Case 3: Tests not associated with any course (standalone)
        // These are available if public, or if private and the user is admin/teacher
        if (!test.courseId) {
          return test.visibility === "public";
        }
        
        return false;
      });

      // Get test attempts for this user to check which tests have been taken
      const userAttempts = await storage.getTestAttemptsByUser(req.user.id);

      // Add metadata to each test
      const testsWithMetadata = await Promise.all(
        availableTests.map(async (test) => {
          // Find attempts for this test
          const attempts = userAttempts.filter(
            (attempt) => attempt.testId === test.id,
          );
          const latestAttempt = attempts.length
            ? attempts.reduce((latest, attempt) =>
                new Date(attempt.startedAt) > new Date(latest.startedAt)
                  ? attempt
                  : latest,
              )
            : null;

          // Add creator name
          const creator = await storage.getUser(test.createdBy);

          return {
            ...test,
            creatorName: creator
              ? creator.fullName || creator.username
              : "Unknown",
            attempts: attempts.length,
            latestAttempt: latestAttempt
              ? {
                  id: latestAttempt.id,
                  status: latestAttempt.status,
                  score: latestAttempt.score,
                  startedAt: latestAttempt.startedAt,
                  completedAt: latestAttempt.completedAt,
                }
              : null,
          };
        }),
      );

      res.json(testsWithMetadata);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/tests/:id", isAuthenticated, async (req, res) => {
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
        creatorName: creator ? creator.fullName || creator.username : "Unknown",
      };

      res.json(testWithCreatorInfo);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post(
    "/api/tests",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
      try {
        const testData = insertTestSchema.parse({
          ...req.body,
          createdBy: req.user.id,
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
    },
  );

  app.put(
    "/api/tests/:id",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.id);
        const testData = insertTestSchema.partial().parse(req.body);

        // Check if test exists and user is authorized to update it
        const existingTest = await storage.getTest(testId);
        if (!existingTest) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (
          existingTest.createdBy !== req.user.id &&
          req.user.role !== "admin"
        ) {
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
            const date = new Date(
              updatedTest.scheduledFor,
            ).toLocaleDateString();
            message = `Test "${updatedTest.title}" has been scheduled for ${date}.`;
          }

          // Notify enrolled students about the test update
          await storage.notifyCourseUpdate(
            updatedTest.courseId,
            updateType,
            message,
          );
        }

        res.json(updatedTest);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: error.errors });
        } else {
          res.status(500).json({ message: "Server error" });
        }
      }
    },
  );

  app.delete(
    "/api/tests/:id",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.id);

        // Check if test exists and user is authorized to delete it
        const existingTest = await storage.getTest(testId);
        if (!existingTest) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (
          existingTest.createdBy !== req.user.id &&
          req.user.role !== "admin"
        ) {
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
    },
  );

  // Question Routes
  app.get("/api/tests/:testId/questions", isAuthenticated, async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const questions = await storage.listQuestions(testId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post(
    "/api/tests/:testId/questions",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.testId);
        const questionData = insertQuestionSchema.parse({
          ...req.body,
          testId,
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
        if (typeof formattedQuestionData.points === "number") {
          formattedQuestionData.points = Math.floor(
            formattedQuestionData.points,
          );
        }

        if (typeof formattedQuestionData.negativePoints === "number") {
          formattedQuestionData.negativePoints = Math.floor(
            formattedQuestionData.negativePoints,
          );
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
    },
  );

  app.get("/api/questions/:id", isAuthenticated, async (req, res) => {
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

  app.post(
    "/api/questions",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
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
        if (typeof formattedQuestionData.points === "number") {
          formattedQuestionData.points = Math.floor(
            formattedQuestionData.points,
          );
        }

        if (typeof formattedQuestionData.negativePoints === "number") {
          formattedQuestionData.negativePoints = Math.floor(
            formattedQuestionData.negativePoints,
          );
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
    },
  );

  app.put(
    "/api/questions/:id",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
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
          ...questionData,
        };

        // Update point float values if points are provided
        if (questionData.points !== undefined) {
          formattedQuestionData.pointsFloat = questionData.points.toString();

          // For safety, ensure the integer field is an integer (floor the value)
          if (typeof formattedQuestionData.points === "number") {
            formattedQuestionData.points = Math.floor(
              formattedQuestionData.points,
            );
          }
        }

        // Update negative point float values if negative points are provided
        if (questionData.negativePoints !== undefined) {
          formattedQuestionData.negativePointsFloat =
            questionData.negativePoints.toString();

          // For safety, ensure the integer field is an integer (floor the value)
          if (typeof formattedQuestionData.negativePoints === "number") {
            formattedQuestionData.negativePoints = Math.floor(
              formattedQuestionData.negativePoints,
            );
          }
        }

        const updatedQuestion = await storage.updateQuestion(
          questionId,
          formattedQuestionData,
        );
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
    },
  );

  app.delete(
    "/api/questions/:id",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
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
    },
  );

  // Test Attempt Routes
  app.get("/api/test-attempts", isAuthenticated, async (req, res) => {
    try {
      let attempts;

      if (req.user.role === "student") {
        // Students can only see their own attempts
        attempts = await storage.getTestAttemptsByUser(req.user.id);
      } else {
        // Admins and teachers can see attempts by test
        const testId = req.query.testId
          ? parseInt(req.query.testId as string)
          : undefined;

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
            req.query.userId
              ? parseInt(req.query.userId as string)
              : req.user.id,
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
        userId: req.user.id,
      });

      // Check if test exists and is active
      const test = await storage.getTest(attemptData.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      if (!test.isActive) {
        return res.status(400).json({ message: "Test is not active" });
      }
      
      // Check user's access to the test based on visibility and test type
      if (req.user.role === "student") {
        // For private tests, verify course enrollment
        if (test.visibility === "private" && test.courseId) {
          const enrollment = await storage.getEnrollment(req.user.id, test.courseId);
          if (!enrollment) {
            return res.status(403).json({ 
              message: "You must be enrolled in this course to take this test" 
            });
          }
        }
        
        // For formal tests, always verify course enrollment regardless of visibility
        if (test.testType === "formal" && test.courseId) {
          const enrollment = await storage.getEnrollment(req.user.id, test.courseId);
          if (!enrollment) {
            return res.status(403).json({ 
              message: "You must be enrolled in this course to take this formal test" 
            });
          }
        }
      }

      // Check if user already has an in-progress attempt for this test
      const existingAttempts = await storage.getTestAttemptsByUser(req.user.id);
      const inProgressAttempt = existingAttempts.find(
        (a) => a.testId === attemptData.testId && a.status === "in_progress",
      );

      if (inProgressAttempt) {
        return res.status(400).json({
          message: "You already have an in-progress attempt for this test",
          attemptId: inProgressAttempt.id,
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
      if (
        existingAttempt.userId !== req.user.id &&
        req.user.role === "student"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Calculate score if attempt is being completed
      if (
        attemptData.status === "completed" &&
        existingAttempt.status !== "completed"
      ) {
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
          const pointsValue = question.pointsFloat
            ? parseFloat(question.pointsFloat)
            : question.points;
          const negPointsValue = question.negativePointsFloat
            ? parseFloat(question.negativePointsFloat)
            : question.negativePoints || 0;

          totalPoints += pointsValue;

          // Skip if question wasn't answered
          if (!answers[question.id]) {
            results[question.id] = {
              correct: false,
              answered: false,
              points: 0,
              possiblePoints: pointsValue,
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
                  isCorrect =
                    question.correctAnswer.length ===
                      answers[question.id].length &&
                    question.correctAnswer.every((opt) =>
                      answers[question.id].includes(opt),
                    );
                } else {
                  isCorrect = question.correctAnswer.includes(
                    answers[question.id],
                  );
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
                  (opt) =>
                    String(opt).toLowerCase() ===
                    String(answers[question.id]).toLowerCase(),
                );
              } else {
                isCorrect =
                  String(question.correctAnswer).toLowerCase() ===
                  String(answers[question.id]).toLowerCase();
              }
              break;

            case "subjective":
              // For subjective questions, grading may require manual review
              // Here we auto-grade based on keywords if available
              if (
                Array.isArray(question.correctAnswer) &&
                typeof answers[question.id] === "string"
              ) {
                isCorrect = question.correctAnswer.some((keyword) =>
                  answers[question.id]
                    .toLowerCase()
                    .includes(String(keyword).toLowerCase()),
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
            possiblePoints: pointsValue,
          };
        }

        // Calculate final score (can be negative)
        const finalPoints = earnedPoints - totalNegativePoints;

        // Calculate percentage score (always as a percentage of total available points)
        // Allow negative percentages if the student earned negative points overall
        attemptData.score =
          totalPoints > 0 ? Math.round((finalPoints / totalPoints) * 100) : 0;

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

      const updatedAttempt = await storage.updateTestAttempt(
        attemptId,
        attemptData,
      );
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

        console.log(
          `Looking for enrollment with userId=${userId} and courseId=${courseId}`,
        );

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
        console.log(
          `No filters provided, returning enrollments for current user ${req.user.id}`,
        );
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
        userId,
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
      console.log(
        `Checking if user ${enrollmentData.userId} is already enrolled in course ${enrollmentData.courseId}`,
      );

      const existingEnrollment = await storage.getEnrollment(
        enrollmentData.userId,
        enrollmentData.courseId,
      );

      if (existingEnrollment) {
        console.log(
          `User ${enrollmentData.userId} is already enrolled in course ${enrollmentData.courseId}`,
          existingEnrollment,
        );
        return res.status(400).json({
          message: "User is already enrolled in this course",
          enrollment: existingEnrollment,
        });
      }

      console.log(
        `User ${enrollmentData.userId} is NOT enrolled in course ${enrollmentData.courseId}, proceeding with enrollment`,
      );

      // Create the enrollment with a timestamp
      console.log(
        `Creating enrollment for user ${enrollmentData.userId} in course ${enrollmentData.courseId}`,
      );
      const enrollmentWithDate = {
        ...enrollmentData,
        enrolledAt: new Date(),
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
          createdAt: new Date(),
        });

        console.log(
          `Created enrollment notification for user ${enrollmentData.userId} in course ${course.title}`,
        );
      } catch (notificationError) {
        // Log error but don't fail the enrollment request
        console.error(
          "Error creating enrollment notification:",
          notificationError,
        );
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

  app.put(
    "/api/enrollments/:userId/:courseId",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const courseId = parseInt(req.params.courseId);

        // Students can only update their own enrollments
        if (req.user.role === "student" && userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const enrollmentData = insertEnrollmentSchema.partial().parse(req.body);

        // Check if enrollment exists
        const existingEnrollment = await storage.getEnrollment(
          userId,
          courseId,
        );
        if (!existingEnrollment) {
          return res.status(404).json({ message: "Enrollment not found" });
        }

        const updatedEnrollment = await storage.updateEnrollment(
          userId,
          courseId,
          enrollmentData,
        );
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
    },
  );

  app.delete(
    "/api/enrollments/:userId/:courseId",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const courseId = parseInt(req.params.courseId);

        console.log(
          `API: Deleting enrollment for userId=${userId}, courseId=${courseId}`,
        );

        // Check if enrollment exists
        const existingEnrollment = await storage.getEnrollment(
          userId,
          courseId,
        );
        if (!existingEnrollment) {
          console.log(
            `API: Enrollment not found for userId=${userId}, courseId=${courseId}`,
          );
          return res.status(404).json({ message: "Enrollment not found" });
        }

        // Delete the enrollment - we already know it exists, so we just need to delete it
        await storage.deleteEnrollment(userId, courseId);

        // Always return success with 200 status code if we get here
        console.log(
          `API: Successfully deleted enrollment for userId=${userId}, courseId=${courseId}`,
        );
        return res
          .status(200)
          .json({ message: "Enrollment deleted successfully" });
      } catch (error) {
        console.error("Error deleting enrollment:", error);
        return res
          .status(500)
          .json({ message: "Server error", error: String(error) });
      }
    },
  );
  
  // Enrollment Request Routes (for self-enrollment with admin approval)
  app.get("/api/enrollment-requests", isAuthenticated, async (req, res) => {
    try {
      console.log("GET /api/enrollment-requests with query:", req.query);
      let requests = [];
      
      // Admin and Teachers can see all requests or filtered requests
      if (req.user.role === "admin" || req.user.role === "teacher") {
        if (req.query.status) {
          // Filter by status
          const status = req.query.status as string;
          console.log(`Fetching enrollment requests with status: ${status}`);
          requests = await storage.listEnrollmentRequestsByStatus(status);
        } else if (req.query.courseId) {
          // Filter by courseId
          const courseId = parseInt(req.query.courseId as string);
          console.log(`Fetching enrollment requests for course: ${courseId}`);
          requests = await storage.listEnrollmentRequestsByCourse(courseId);
        } else if (req.query.userId) {
          // Filter by userId
          const userId = parseInt(req.query.userId as string);
          console.log(`Fetching enrollment requests for user: ${userId}`);
          requests = await storage.listEnrollmentRequestsByUser(userId);
        } else {
          // No filters, return all requests
          console.log("Fetching all enrollment requests");
          requests = await storage.listAllEnrollmentRequests();
        }
      } else {
        // Students can only see their own requests
        console.log(`Fetching enrollment requests for student: ${req.user.id}`);
        requests = await storage.listEnrollmentRequestsByUser(req.user.id);
      }
      
      // Enrich the data with course and user information
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const course = await storage.getCourse(request.courseId);
          const user = await storage.getUser(request.userId);
          
          return {
            ...request,
            courseTitle: course ? course.title : "Unknown Course",
            courseCategory: course ? course.category : "Unknown",
            userName: user ? user.fullName || user.username : "Unknown User",
          };
        })
      );
      
      console.log(`Returning ${enrichedRequests.length} enrollment requests`);
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error in GET /api/enrollment-requests:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/enrollment-requests", isAuthenticated, async (req, res) => {
    try {
      console.log("Processing enrollment request creation:", req.body);
      
      // Students can only request enrollment for themselves
      const userId = req.user.id;
      
      // Validate request data
      const requestData = insertEnrollmentRequestSchema.parse({
        ...req.body,
        userId,
      });
      
      console.log("Validated enrollment request data:", requestData);
      
      // Check if user exists
      const user = await storage.getUser(requestData.userId);
      if (!user) {
        console.log(`User with ID ${requestData.userId} not found`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if course exists and is active
      const course = await storage.getCourse(requestData.courseId);
      if (!course) {
        console.log(`Course with ID ${requestData.courseId} not found`);
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (!course.isActive) {
        console.log(`Course ${course.id} is not active, student cannot request enrollment`);
        return res.status(400).json({ message: "Course is not active" });
      }
      
      // Check if user is already enrolled
      const existingEnrollment = await storage.getEnrollment(userId, requestData.courseId);
      if (existingEnrollment) {
        console.log(`User ${userId} is already enrolled in course ${requestData.courseId}`);
        return res.status(400).json({ 
          message: "You are already enrolled in this course", 
          enrollment: existingEnrollment 
        });
      }
      
      // Check if a pending request already exists
      const existingRequest = await storage.getEnrollmentRequest(userId, requestData.courseId);
      if (existingRequest && existingRequest.status === "pending") {
        console.log(`User ${userId} already has a pending request for course ${requestData.courseId}`);
        return res.status(400).json({ 
          message: "You already have a pending enrollment request for this course", 
          request: existingRequest 
        });
      }
      
      // Create the enrollment request
      console.log(`Creating enrollment request for user ${userId} in course ${requestData.courseId}`);
      const request = await storage.createEnrollmentRequest(requestData);
      console.log(`Successfully created enrollment request:`, request);
      
      // Notify administrators about the new enrollment request
      try {
        // Get all admin users
        const admins = await storage.listUsers("admin");
        
        // Send notifications to all admins
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.id,
            title: "New Enrollment Request",
            message: `${user.fullName || user.username} has requested to enroll in "${course.title}".`,
            type: "enrollment_request",
            resourceId: course.id,
            resourceType: "course",
          });
        }
        
        console.log(`Sent enrollment request notifications to ${admins.length} admins`);
      } catch (notificationError) {
        console.error("Failed to create admin notifications:", notificationError);
        // Don't fail the request if notification creation fails
      }
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error in POST /api/enrollment-requests:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  app.patch(
    "/api/enrollment-requests/:userId/:courseId", 
    isAuthenticated, 
    hasRole(["admin", "teacher"]), 
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const courseId = parseInt(req.params.courseId);
        const { status, notes } = req.body;
        
        console.log(`Processing enrollment request update: userId=${userId}, courseId=${courseId}, status=${status}`);
        
        // Validate status
        if (!["approved", "rejected"].includes(status)) {
          return res.status(400).json({ message: "Status must be either 'approved' or 'rejected'" });
        }
        
        // Check if request exists
        const request = await storage.getEnrollmentRequest(userId, courseId);
        if (!request) {
          return res.status(404).json({ message: "Enrollment request not found" });
        }
        
        // Update request status
        const updatedRequest = await storage.updateEnrollmentRequestStatus(
          userId, 
          courseId, 
          status,
          req.user.id
        );
        
        console.log(`Updated enrollment request status to ${status}`);
        
        // If approved, create the actual enrollment
        if (status === "approved") {
          console.log(`Status is approved, creating enrollment for user ${userId} in course ${courseId}`);
          
          // Check if the course exists
          const course = await storage.getCourse(courseId);
          if (!course) {
            return res.status(404).json({ message: "Course not found" });
          }
          
          // Create the enrollment
          const enrollment = await storage.createEnrollment({
            userId,
            courseId,
            progress: 0,
            isCompleted: false
          });
          
          console.log(`Successfully created enrollment after approval`);
          
          // Notify the student about the approval
          try {
            await storage.createNotification({
              userId,
              title: "Enrollment Request Approved",
              message: `Your request to enroll in "${course.title}" has been approved.`,
              type: "enrollment_approved",
              resourceId: courseId,
              resourceType: "course",
            });
            
            console.log(`Sent enrollment approval notification to user ${userId}`);
          } catch (notificationError) {
            console.error("Failed to create approval notification:", notificationError);
            // Don't fail the enrollment if notification creation fails
          }
        } else if (status === "rejected") {
          // Notify the student about the rejection
          try {
            const course = await storage.getCourse(courseId);
            if (course) {
              await storage.createNotification({
                userId,
                title: "Enrollment Request Rejected",
                message: `Your request to enroll in "${course.title}" has been rejected.${notes ? ` Reason: ${notes}` : ''}`,
                type: "enrollment_rejected",
                resourceId: courseId,
                resourceType: "course",
              });
              
              console.log(`Sent enrollment rejection notification to user ${userId}`);
            }
          } catch (notificationError) {
            console.error("Failed to create rejection notification:", notificationError);
            // Don't fail if notification creation fails
          }
        }
        
        res.json(updatedRequest);
      } catch (error) {
        console.error(`Error in PATCH /api/enrollment-requests/:userId/:courseId:`, error);
        res.status(500).json({ message: "Server error" });
      }
    }
  );

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
          sessions = await storage.listDoubtSessionsByUser(
            parseInt(req.query.userId as string),
          );
        } else if (req.query.teacherId) {
          sessions = await storage.listDoubtSessionsByTeacher(
            parseInt(req.query.teacherId as string),
          );
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
      // Log the original incoming data for debugging
      console.log("Doubt session request body:", JSON.stringify(req.body));
      console.log("scheduledFor type:", typeof req.body.scheduledFor);
      
      // Pre-process the scheduledFor field - convert string to Date object
      let requestBody = { ...req.body };
      
      if (requestBody.scheduledFor && typeof requestBody.scheduledFor === 'string') {
        try {
          console.log("Converting scheduledFor string to Date:", requestBody.scheduledFor);
          requestBody.scheduledFor = new Date(requestBody.scheduledFor);
          console.log("Converted scheduledFor result:", requestBody.scheduledFor);
          console.log("scheduledFor type after conversion:", typeof requestBody.scheduledFor);
          console.log("Is Date instance:", requestBody.scheduledFor instanceof Date);
        } catch (e) {
          console.error("Failed to convert scheduledFor to Date:", e);
          return res.status(400).json({ message: "Invalid date format for scheduledFor" });
        }
      }
      
      // Create a custom validator to handle the date conversion directly
      const customValidator = insertDoubtSessionSchema.transform((data) => {
        // Force the scheduledFor to be a Date type if it's a string
        if (data.scheduledFor && typeof data.scheduledFor === 'string') {
          return {
            ...data,
            scheduledFor: new Date(data.scheduledFor)
          };
        }
        return data;
      });
      
      // Students can only create sessions for themselves
      const sessionData = customValidator.parse({
        ...requestBody,
        userId: req.user.role === "student" ? req.user.id : requestBody.userId,
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
      
      // Log the original incoming data for debugging
      console.log("Doubt session PUT request body:", JSON.stringify(req.body));
      
      // Pre-process the scheduledFor field - convert string to Date object
      let requestBody = { ...req.body };
      
      if (requestBody.scheduledFor && typeof requestBody.scheduledFor === 'string') {
        try {
          requestBody.scheduledFor = new Date(requestBody.scheduledFor);
          console.log("Converted scheduledFor from string to Date in PUT request:", requestBody.scheduledFor);
        } catch (e) {
          console.error("Failed to convert scheduledFor to Date:", e);
          return res.status(400).json({ message: "Invalid date format for scheduledFor" });
        }
      }
      
      // Create a custom validator to handle the date conversion directly
      const customValidator = insertDoubtSessionSchema.partial().transform((data) => {
        // Force the scheduledFor to be a Date type if it's a string
        if (data.scheduledFor && typeof data.scheduledFor === 'string') {
          return {
            ...data,
            scheduledFor: new Date(data.scheduledFor)
          };
        }
        return data;
      });
      
      const sessionData = customValidator.parse(requestBody);

      // Check if session exists
      const existingSession = await storage.getDoubtSession(sessionId);
      if (!existingSession) {
        return res.status(404).json({ message: "Doubt session not found" });
      }

      // Check if user is authorized to update this session
      if (
        req.user.role === "student" &&
        existingSession.userId !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Teachers can only update sessions assigned to them
      if (
        req.user.role === "teacher" &&
        existingSession.teacherId !== req.user.id
      ) {
        // Exception: teachers can accept unassigned sessions
        if (
          !(
            existingSession.teacherId === null &&
            sessionData.teacherId === req.user.id
          )
        ) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const updatedSession = await storage.updateDoubtSession(
        sessionId,
        sessionData,
      );
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
        studyTimes = await storage.listStudyTimesByUser(
          parseInt(req.query.userId as string),
        );
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
      // Log the original incoming data for debugging
      console.log("Study time POST request body:", JSON.stringify(req.body));
      
      // Pre-process date fields - convert string to Date object
      let requestBody = { ...req.body };
      
      if (requestBody.startedAt && typeof requestBody.startedAt === 'string') {
        try {
          console.log("Converting startedAt string to Date:", requestBody.startedAt);
          requestBody.startedAt = new Date(requestBody.startedAt);
          console.log("Converted startedAt result:", requestBody.startedAt);
        } catch (e) {
          console.error("Failed to convert startedAt to Date:", e);
          return res.status(400).json({ message: "Invalid date format for startedAt" });
        }
      }
      
      if (requestBody.endedAt && typeof requestBody.endedAt === 'string') {
        try {
          console.log("Converting endedAt string to Date:", requestBody.endedAt);
          requestBody.endedAt = new Date(requestBody.endedAt);
          console.log("Converted endedAt result:", requestBody.endedAt);
        } catch (e) {
          console.error("Failed to convert endedAt to Date:", e);
          return res.status(400).json({ message: "Invalid date format for endedAt" });
        }
      }
      
      // Create a custom validator to handle the date conversion directly
      const customValidator = insertStudyTimeSchema.transform((data) => {
        // Force date conversions if needed
        let transformed = { ...data };
        
        if (transformed.startedAt && typeof transformed.startedAt === 'string') {
          transformed.startedAt = new Date(transformed.startedAt);
        }
        
        if (transformed.endedAt && typeof transformed.endedAt === 'string') {
          transformed.endedAt = new Date(transformed.endedAt);
        }
        
        return transformed;
      });
      
      // Students can only create study times for themselves
      const studyTimeData = customValidator.parse({
        ...requestBody,
        userId: req.user.role === "student" ? req.user.id : requestBody.userId,
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
      
      // Log the original incoming data for debugging
      console.log("Study time PUT request body:", JSON.stringify(req.body));
      
      // Pre-process date fields - convert string to Date object
      let requestBody = { ...req.body };
      
      if (requestBody.startedAt && typeof requestBody.startedAt === 'string') {
        try {
          console.log("Converting startedAt string to Date:", requestBody.startedAt);
          requestBody.startedAt = new Date(requestBody.startedAt);
          console.log("Converted startedAt result:", requestBody.startedAt);
        } catch (e) {
          console.error("Failed to convert startedAt to Date:", e);
          return res.status(400).json({ message: "Invalid date format for startedAt" });
        }
      }
      
      if (requestBody.endedAt && typeof requestBody.endedAt === 'string') {
        try {
          console.log("Converting endedAt string to Date:", requestBody.endedAt);
          requestBody.endedAt = new Date(requestBody.endedAt);
          console.log("Converted endedAt result:", requestBody.endedAt);
        } catch (e) {
          console.error("Failed to convert endedAt to Date:", e);
          return res.status(400).json({ message: "Invalid date format for endedAt" });
        }
      }
      
      // Create a custom validator to handle the date conversion directly
      const customValidator = insertStudyTimeSchema.partial().transform((data) => {
        // Force date conversions if needed
        let transformed = { ...data };
        
        if (transformed.startedAt && typeof transformed.startedAt === 'string') {
          transformed.startedAt = new Date(transformed.startedAt);
        }
        
        if (transformed.endedAt && typeof transformed.endedAt === 'string') {
          transformed.endedAt = new Date(transformed.endedAt);
        }
        
        return transformed;
      });
      
      const studyTimeData = customValidator.parse(requestBody);

      // Check if study time exists
      const existingStudyTime = await storage.getStudyTime(studyTimeId);
      if (!existingStudyTime) {
        return res.status(404).json({ message: "Study time not found" });
      }

      // Students can only update their own study times
      if (
        req.user.role === "student" &&
        existingStudyTime.userId !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedStudyTime = await storage.updateStudyTime(
        studyTimeId,
        studyTimeData,
      );
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
  app.get(
    "/api/analytics/student-progress",
    isAuthenticated,
    async (req, res) => {
      try {
        // Use the query parameter or default to current user
        const userId = req.query.userId
          ? parseInt(req.query.userId as string)
          : req.user.id;

        // Students can only see their own progress
        if (req.user.role === "student" && userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const progress = await storage.getStudentProgress(userId);
        res.json(progress);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  // Overall Platform Analytics (Admin only)
  app.get(
    "/api/analytics/overall",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const analytics = await storage.getOverallAnalytics();
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    },
  );

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
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Register routes for file handling
  app.use("/api/files", isAuthenticated, filesRoutes);

  // Register routes for import/export
  app.use(
    "/api/import-export",
    isAuthenticated,
    hasRole(["admin", "teacher"]),
    importExportRoutes,
  );
  
  // Register routes for question import
  app.use("/api", questionImportRoutes);

  // Register routes for notifications
  registerNotificationRoutes(app);
  registerSiteConfigRoutes(app);
  registerPromoBannerRoutes(app);
  
  // Register routes for template files
  app.use("/api/templates", templateRoutes);

  // Enhanced proxy endpoint for resource links (to hide URLs and embed content)
  app.get(
    "/api/resource-proxy/:resourceId",
    isAuthenticated,
    async (req, res) => {
      try {
        const resourceId = req.params.resourceId;
        const { courseId } = req.query;
        const { accept } = req.headers; // Get Accept header to determine preferred format

        if (!courseId) {
          return res.status(400).json({ message: "Course ID is required" });
        }

        // Fetch the course to get the resource links
        const course = await storage.getCourse(parseInt(courseId as string));

        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }

        // Ensure resource links exist
        if (!course.resourceLinks || !Array.isArray(course.resourceLinks)) {
          return res.status(404).json({ message: "Resource not found" });
        }

        // Find the resource by its index
        const resourceIndex = parseInt(resourceId);
        if (
          isNaN(resourceIndex) ||
          resourceIndex < 0 ||
          resourceIndex >= course.resourceLinks.length
        ) {
          return res.status(404).json({ message: "Resource not found" });
        }

        const resource = course.resourceLinks[resourceIndex];

        if (!resource || !resource.url) {
          return res
            .status(404)
            .json({ message: "Resource not found or invalid" });
        }

        console.log(
          `Proxying resource: ${resource.label} (${resource.type}) - ${resource.url}`,
        );

        // Special case for YouTube/Vimeo videos - return HTML with embedded player
        if (
          (resource.type === "video" ||
            resource.url.includes("youtube.com") ||
            resource.url.includes("youtu.be") ||
            resource.url.includes("vimeo.com")) &&
          !accept?.includes("application/json")
        ) {
          console.log("Creating embed URL for video");

          // Transform YouTube URLs to embed format
          let embedUrl = resource.url;

          // YouTube URL handling
          if (
            resource.url.includes("youtube.com") ||
            resource.url.includes("youtu.be")
          ) {
            let videoId = "";

            // Extract video ID from different YouTube URL formats
            if (resource.url.includes("youtube.com/watch?v=")) {
              videoId = resource.url.split("watch?v=")[1].split("&")[0];
            } else if (resource.url.includes("youtu.be/")) {
              videoId = resource.url.split("youtu.be/")[1].split("?")[0];
            } else if (resource.url.includes("youtube.com/embed/")) {
              videoId = resource.url
                .split("youtube.com/embed/")[1]
                .split("?")[0];
            }

            if (videoId) {
              // Create safe embed URL with additional parameters for better embedding
              embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&showinfo=0&modestbranding=1`;
              console.log(`Transformed YouTube URL to: ${embedUrl}`);
            }
          }
          
          // Vimeo URL handling
          if (resource.url.includes("vimeo.com")) {
            const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
            const match = resource.url.match(vimeoRegex);
            
            if (match && match[1]) {
              embedUrl = `https://player.vimeo.com/video/${match[1]}?autoplay=0&portrait=0`;
              console.log(`Transformed Vimeo URL to: ${embedUrl}`);
            }
          }
          
          // Provide a direct HTML page with the embedded video
          const videoHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${resource.label || "Video Resource"}</title>
            <style>
              body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #000; }
              .video-container { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
              iframe { width: 100%; height: 100%; border: 0; }
              .error-message { display: none; color: white; text-align: center; padding: 20px; }
              .loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; }
              .loading div { position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #fff; animation: loading 1.2s linear infinite; }
              .loading div:nth-child(1) { top: 8px; left: 8px; animation-delay: 0s; }
              .loading div:nth-child(2) { top: 8px; left: 32px; animation-delay: -0.4s; }
              .loading div:nth-child(3) { top: 8px; left: 56px; animation-delay: -0.8s; }
              .loading div:nth-child(4) { top: 32px; left: 8px; animation-delay: -0.4s; }
              .loading div:nth-child(5) { top: 32px; left: 32px; animation-delay: -0.8s; }
              .loading div:nth-child(6) { top: 32px; left: 56px; animation-delay: -1.2s; }
              .loading div:nth-child(7) { top: 56px; left: 8px; animation-delay: -0.8s; }
              .loading div:nth-child(8) { top: 56px; left: 32px; animation-delay: -1.2s; }
              .loading div:nth-child(9) { top: 56px; left: 56px; animation-delay: -1.6s; }
              @keyframes loading { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
              .controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; display: flex; gap: 10px; }
              .controls a { color: white; text-decoration: none; display: flex; align-items: center; padding: 5px 10px; border-radius: 4px; background: rgba(255,255,255,0.2); }
              .controls a:hover { background: rgba(255,255,255,0.3); }
            </style>
          </head>
          <body>
            <div class="video-container">
              <div id="loading" class="loading">
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
              </div>
              <div id="error-message" class="error-message">
                Unable to load the video. Please try the external link.
              </div>
              <iframe 
                id="video-frame"
                src="${embedUrl}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                onload="document.getElementById('loading').style.display = 'none';"
                onerror="handleError()"
              ></iframe>
              <div class="controls">
                <a href="${resource.url}" target="_blank">Open original source</a>
              </div>
            </div>
            <script>
              function handleError() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error-message').style.display = 'block';
                document.getElementById('video-frame').style.display = 'none';
              }
              
              // Handle iframe loading errors
              window.addEventListener('error', function(e) {
                if (e.target.tagName === 'IFRAME') {
                  handleError();
                }
              }, true);
              
              // Set a timeout to check if video loads
              setTimeout(function() {
                if (document.getElementById('loading').style.display !== 'none') {
                  handleError();
                }
              }, 10000);
            </script>
          </body>
          </html>
          `;
          
          // Set proper headers
          res.set({
            "Content-Type": "text/html",
            "Content-Security-Policy": "frame-ancestors 'self'",
            "X-Frame-Options": "SAMEORIGIN",
          });
          
          return res.send(videoHtml);
        }

        // For HTML content request (coming from iframe), handle webpage embedding
        if ((accept?.includes("text/html") && resource.type === "webpage") || resource.type === "webpage") {
          try {
            // A more robust way to handle webpage embedding with fallback options
            const viewerHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>${resource.label || "Resource"}</title>
              <style>
                body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                iframe { width: 100%; height: 100%; border: 0; }
                .error-container { 
                  display: none;
                  flex-direction: column; 
                  align-items: center; 
                  justify-content: center; 
                  height: 100%; 
                  padding: 20px; 
                  text-align: center; 
                  font-family: system-ui, sans-serif;
                }
                .error-container h1 { margin-bottom: 10px; font-size: 1.5rem; }
                .error-container p { margin-bottom: 20px; color: #666; }
                .error-container a { 
                  display: inline-block; 
                  padding: 10px 20px; 
                  background: #0070f3; 
                  color: white;
                  text-decoration: none; 
                  border-radius: 5px; 
                  font-weight: 500;
                  margin: 5px;
                }
                .loading-container {
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  flex-direction: column;
                  background-color: #f9f9f9;
                }
                .spinner {
                  width: 40px;
                  height: 40px;
                  border: 4px solid rgba(0, 0, 0, 0.1);
                  border-left-color: #0070f3;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                  margin-bottom: 20px;
                }
                .loading-text {
                  color: #666;
                  font-family: system-ui, sans-serif;
                }
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              </style>
            </head>
            <body>
              <div id="loading-container" class="loading-container">
                <div class="spinner"></div>
                <div class="loading-text">Loading resource...</div>
              </div>
              
              <div id="error-container" class="error-container">
                <h1>Unable to Display Content</h1>
                <p>This website cannot be embedded due to security restrictions or cross-origin policies.</p>
                <div>
                  <a href="${resource.url}" target="_blank" rel="noopener noreferrer">Open in New Tab</a>
                  <a href="#" onclick="tryAlternateEmbed(); return false;">Try Alternate View</a>
                </div>
              </div>
              
              <iframe 
                id="content-frame"
                style="display:none;"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                referrerpolicy="no-referrer"
              ></iframe>
              
              <script>
                // Track loading state
                let isLoading = true;
                let embedAttempt = 0;
                const maxAttempts = 2;
                
                // Error handling function
                function showError() {
                  document.getElementById('loading-container').style.display = 'none';
                  document.getElementById('content-frame').style.display = 'none';
                  document.getElementById('error-container').style.display = 'flex';
                  isLoading = false;
                }
                
                // Try embedding with different techniques
                function tryEmbed() {
                  const frame = document.getElementById('content-frame');
                  
                  if (embedAttempt === 0) {
                    // First attempt - direct embed
                    console.log('Trying direct embed');
                    frame.src = "${resource.url}";
                  } else if (embedAttempt === 1) {
                    // Second attempt - use srcdoc with a simplified iframe 
                    console.log('Trying srcdoc embed');
                    frame.removeAttribute('src');
                    frame.srcdoc = '<html><head><meta http-equiv="refresh" content="0;url=${resource.url}"></head><body></body></html>';
                  } else {
                    // Give up
                    showError();
                    return;
                  }
                  
                  embedAttempt++;
                  frame.style.display = 'block';
                }
                
                // Function to try alternate embedding method
                function tryAlternateEmbed() {
                  if (embedAttempt < maxAttempts) {
                    document.getElementById('error-container').style.display = 'none';
                    document.getElementById('loading-container').style.display = 'flex';
                    tryEmbed();
                  } else {
                    alert('Unable to display this content in the embedded viewer. Please use the "Open in New Tab" option.');
                  }
                }
                
                // Handle iframe load success
                document.getElementById('content-frame').addEventListener('load', function() {
                  try {
                    // Check if we can access the iframe content (will throw error if cross-origin)
                    const iframeDoc = this.contentDocument || this.contentWindow.document;
                    
                    // If we get here, the iframe loaded successfully
                    document.getElementById('loading-container').style.display = 'none';
                    isLoading = false;
                  } catch (e) {
                    // Cross-origin error or other issue
                    if (embedAttempt < maxAttempts) {
                      // Try next embedding method
                      tryEmbed();
                    } else {
                      showError();
                    }
                  }
                });
                
                // Handle iframe load errors
                document.getElementById('content-frame').addEventListener('error', function() {
                  if (embedAttempt < maxAttempts) {
                    // Try next embedding method
                    tryEmbed();
                  } else {
                    showError();
                  }
                });
                
                // Set timeout for loading
                setTimeout(function() {
                  if (isLoading) {
                    if (embedAttempt < maxAttempts) {
                      // Try next embedding method
                      tryEmbed();
                    } else {
                      showError();
                    }
                  }
                }, 8000);
                
                // Initial embed attempt
                tryEmbed();
              </script>
            </body>
            </html>
          `;

            // Set appropriate headers
            res.set({
              "Content-Type": "text/html",
              "Content-Security-Policy": "frame-ancestors 'self'",
              "X-Frame-Options": "SAMEORIGIN",
              "Cache-Control": "no-cache, no-store, must-revalidate", // Prevent caching of error states
              "Pragma": "no-cache",
              "Expires": "0"
            });

            return res.send(viewerHtml);
          } catch (error) {
            console.error("Error creating HTML viewer:", error);
            // Return a simple error page instead of redirecting
            const errorHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Error Loading Resource</title>
              <style>
                body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
                .container { max-width: 500px; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                h1 { color: #e53e3e; margin-top: 0; }
                p { color: #4a5568; margin-bottom: 25px; }
                a { display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Error Loading Resource</h1>
                <p>There was a problem loading this content in the embedded viewer.</p>
                <a href="${resource.url}" target="_blank" rel="noopener noreferrer">Open in New Tab</a>
              </div>
            </body>
            </html>
            `;
            res.set("Content-Type", "text/html");
            return res.send(errorHtml);
          }
        }

        // Handle resources that need to be fetched and proxied
        if (
          resource.type === "pdf" ||
          resource.type === "document" ||
          resource.url.endsWith(".pdf")
        ) {
          try {
            const response = await fetch(resource.url);

            if (!response.ok) {
              throw new Error(
                `Failed to fetch resource: ${response.statusText}`,
              );
            }

            // Get content type from response or guess based on URL
            let contentType = response.headers.get("Content-Type");
            if (!contentType) {
              if (resource.url.endsWith(".pdf"))
                contentType = "application/pdf";
              else if (
                resource.url.endsWith(".doc") ||
                resource.url.endsWith(".docx")
              )
                contentType = "application/msword";
              else contentType = "application/octet-stream";
            }

            // Forward the content type and other relevant headers
            res.set("Content-Type", contentType);
            res.set(
              "Content-Disposition",
              `inline; filename="${resource.label || "resource"}"`,
            );

            // Add cache headers to improve performance
            res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

            // Send the file data
            const buffer = await response.buffer();
            return res.send(buffer);
          } catch (error) {
            console.error("Error proxying resource:", error);
            // If proxy fails, redirect to the original resource
            return res.redirect(resource.url);
          }
        }

        // For all other content types, proxy the content through server with better error handling
        try {
          console.log(`Proxying content directly for: ${resource.label} at URL: ${resource.url}`);
          
          // Enhanced fetch with timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
          
          try {
            // Fetch the resource content with timeout
            const response = await fetch(resource.url, { 
              signal: controller.signal,
              headers: {
                // Add user-agent to avoid bot detection blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                // Add referer to avoid referer-based blocks
                'Referer': 'https://mathsmagic.com/',
                // Accept multiple content types
                'Accept': 'text/html,application/xhtml+xml,application/xml,application/pdf,image/*,video/*,*/*'
              }
            });
            
            // Clear timeout
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              console.error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
              
              // Create a more user-friendly error response
              const errorHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>Resource Error</title>
                <style>
                  body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
                  .container { max-width: 500px; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                  h1 { color: #e53e3e; margin-top: 0; }
                  p { color: #4a5568; margin-bottom: 25px; }
                  .status { font-family: monospace; background: #f7f7f7; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
                  .url { font-family: monospace; word-break: break-all; background: #f7f7f7; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-size: 12px; }
                  .actions { display: flex; gap: 10px; justify-content: center; }
                  .actions a { display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Resource Unavailable</h1>
                  <p>The external resource could not be loaded.</p>
                  <div class="status">Error: ${response.status} ${response.statusText}</div>
                  <div class="url">${resource.url}</div>
                  <div class="actions">
                    <a href="${resource.url}" target="_blank" rel="noopener noreferrer">Open in New Tab</a>
                  </div>
                </div>
              </body>
              </html>
              `;
              res.set("Content-Type", "text/html");
              return res.send(errorHtml);
            }
            
            // Get content type from response or infer from URL
            let contentType = response.headers.get("content-type") || "application/octet-stream";
            
            // Auto-detect content type based on URL if not specified
            if (contentType === "application/octet-stream" || contentType === "binary/octet-stream") {
              const url = resource.url.toLowerCase();
              if (url.endsWith('.jpg') || url.endsWith('.jpeg')) contentType = 'image/jpeg';
              else if (url.endsWith('.png')) contentType = 'image/png';
              else if (url.endsWith('.gif')) contentType = 'image/gif';
              else if (url.endsWith('.svg')) contentType = 'image/svg+xml';
              else if (url.endsWith('.mp4')) contentType = 'video/mp4';
              else if (url.endsWith('.webm')) contentType = 'video/webm';
              else if (url.endsWith('.mp3')) contentType = 'audio/mpeg';
              else if (url.endsWith('.wav')) contentType = 'audio/wav';
              else if (url.endsWith('.pdf')) contentType = 'application/pdf';
              else if (url.endsWith('.doc') || url.endsWith('.docx')) contentType = 'application/msword';
              else if (url.endsWith('.xls') || url.endsWith('.xlsx')) contentType = 'application/vnd.ms-excel';
              else if (url.endsWith('.ppt') || url.endsWith('.pptx')) contentType = 'application/vnd.ms-powerpoint';
              else if (url.endsWith('.html') || url.endsWith('.htm')) contentType = 'text/html';
              else if (url.endsWith('.txt')) contentType = 'text/plain';
            }
            
            // For image content, provide a better viewer
            if (contentType.startsWith('image/')) {
              const imageHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>${resource.label || "Image Viewer"}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #0e0e0e; color: white; font-family: system-ui, sans-serif; }
                  .viewer { display: flex; flex-direction: column; height: 100vh; width: 100vw; }
                  .image-container { flex: 1; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
                  img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.3s; }
                  .controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; display: flex; gap: 10px; z-index: 10; }
                  .controls button, .controls a { color: white; text-decoration: none; display: flex; align-items: center; padding: 5px 10px; border-radius: 4px; background: rgba(255,255,255,0.2); border: none; cursor: pointer; font-size: 14px; }
                  .controls button:hover, .controls a:hover { background: rgba(255,255,255,0.3); }
                  .loader { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite; }
                  @keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg) } }
                  .error { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
                </style>
              </head>
              <body>
                <div class="viewer">
                  <div class="image-container">
                    <div id="loader" class="loader"></div>
                    <div id="error" class="error" style="display: none;">Unable to load image</div>
                    <img 
                      id="image" 
                      src="${resource.url}" 
                      alt="${resource.label || "Image"}" 
                      style="display: none;"
                      onload="onImageLoad()"
                      onerror="onImageError()"
                    />
                  </div>
                  <div class="controls">
                    <button id="zoomIn">Zoom In</button>
                    <button id="zoomOut">Zoom Out</button>
                    <button id="resetZoom">Reset</button>
                    <a href="${resource.url}" download="${resource.label || "image"}">Download</a>
                  </div>
                </div>
                <script>
                  let scale = 1;
                  const image = document.getElementById('image');
                  const loader = document.getElementById('loader');
                  const error = document.getElementById('error');
                  
                  function onImageLoad() {
                    loader.style.display = 'none';
                    image.style.display = 'block';
                  }
                  
                  function onImageError() {
                    loader.style.display = 'none';
                    error.style.display = 'block';
                  }
                  
                  document.getElementById('zoomIn').addEventListener('click', () => {
                    scale *= 1.2;
                    image.style.transform = \`scale(\${scale})\`;
                  });
                  
                  document.getElementById('zoomOut').addEventListener('click', () => {
                    scale /= 1.2;
                    image.style.transform = \`scale(\${scale})\`;
                  });
                  
                  document.getElementById('resetZoom').addEventListener('click', () => {
                    scale = 1;
                    image.style.transform = 'scale(1)';
                  });
                  
                  // Set a timeout to check if image loads
                  setTimeout(() => {
                    if (loader.style.display !== 'none') {
                      onImageError();
                    }
                  }, 10000);
                </script>
              </body>
              </html>
              `;
              
              res.set("Content-Type", "text/html");
              return res.send(imageHtml);
            }
            
            // Set appropriate content type header
            res.set("Content-Type", contentType);
            res.set("Content-Disposition", `inline; filename="${resource.label || "resource"}"`);
            
            // Add security headers but allow framing from same origin
            res.set("X-Frame-Options", "SAMEORIGIN");
            res.set("Content-Security-Policy", "frame-ancestors 'self'");
            
            // Set CORS headers to allow embedding
            res.set("Access-Control-Allow-Origin", "*");
            res.set("Access-Control-Allow-Methods", "GET");
            res.set("Access-Control-Allow-Headers", "Content-Type");
            
            // Cache for better performance
            res.set("Cache-Control", "public, max-age=3600"); // 1 hour
            
            // Stream the response directly to the client
            try {
              // First try using the buffer method
              const buffer = await response.buffer();
              return res.send(buffer);
            } catch (bufferError) {
              // If buffer() is not available, use arrayBuffer instead
              console.log("Falling back to arrayBuffer method");
              const arrayBuffer = await response.arrayBuffer();
              return res.send(Buffer.from(arrayBuffer));
            }
          } finally {
            // Ensure timeout is cleared even if error occurs
            clearTimeout(timeoutId);
          }
        } catch (error) {
          console.error("Error proxying resource:", error);
          
          // Create a user-friendly error page
          const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Error Loading Resource</title>
            <style>
              body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
              .container { max-width: 500px; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
              h1 { color: #e53e3e; margin-top: 0; }
              p { color: #4a5568; margin-bottom: 25px; }
              .error-details { font-family: monospace; font-size: 12px; background: #f7f7f7; padding: 10px; border-radius: 5px; text-align: left; margin-bottom: 20px; white-space: pre-wrap; word-break: break-all; max-height: 100px; overflow-y: auto; }
              a { display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Error Loading Resource</h1>
              <p>There was a problem loading this content. The resource might be unavailable or the server might be blocking our access.</p>
              <div class="error-details">${String(error).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              <a href="${resource.url}" target="_blank" rel="noopener noreferrer">Open in New Tab</a>
            </div>
          </body>
          </html>
          `;
          
          res.set("Content-Type", "text/html");
          return res.send(errorHtml);
        }
      } catch (error) {
        console.error("Error accessing resource:", error);
        res.status(500).json({ message: "Server error" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
