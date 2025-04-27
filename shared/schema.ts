import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"), // "admin", "teacher", "student"
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Course model
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "Algebra", "Geometry", "Calculus", etc.
  thumbnail: text("thumbnail"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id), // Reference to users.id
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  richContent: text("rich_content"), // Rich text content with HTML formatting
  videoUrls: jsonb("video_urls"), // Array of external video URLs (YouTube, Vimeo, etc.)
  resourceLinks: jsonb("resource_links"), // Array of resource links with type and metadata
  attachments: jsonb("attachments"), // Array of file attachments with metadata
});

export const insertCourseSchema = createInsertSchema(courses)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    // Make these fields optional with appropriate validation
    richContent: z.string().optional(),
    videoUrls: z.array(z.string().url()).optional(),
    resourceLinks: z
      .array(
        z.object({
          url: z.string().url(),
          type: z.string(),
          label: z.string(),
        }),
      )
      .optional(),
    attachments: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          url: z.string(),
          size: z.number().optional(),
        }),
      )
      .optional(),
  });

// Module model (for course sections)
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(), // Reference to courses.id
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

// Test model
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  courseId: integer("course_id"), // Optional reference to courses.id
  duration: integer("duration").notNull(), // in minutes
  passingScore: integer("passing_score").notNull(), // percentage
  createdBy: integer("created_by").notNull(), // Reference to users.id
  isActive: boolean("is_active").notNull().default(true),
  scheduledFor: timestamp("scheduled_for"), // Optional scheduled time
  hasNegativeMarking: boolean("has_negative_marking").notNull().default(false), // Whether test has negative marking
  defaultNegativeMarking: text("default_negative_marking").default("0"), // Default points to deduct for wrong answers (as text to support decimals)
  defaultPoints: text("default_points").default("1"), // Default points for correct answers (as text to support decimals)
  createdAt: timestamp("created_at").defaultNow(),
});

// Create base test schema
export const baseTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
});

// Extended schema with custom validation for decimal points
export const insertTestSchema = baseTestSchema.extend({
  // Allow decimal input for default negative marking (stored as string)
  defaultNegativeMarking: z
    .string()
    .regex(/^\d*\.?\d*$/)
    .optional(),
  // Allow decimal input for default points (stored as string)
  defaultPoints: z
    .string()
    .regex(/^\d*\.?\d*$/)
    .optional(),
});

// Question model
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(), // Reference to tests.id
  type: text("type").notNull(), // "mcq", "truefalse", "fillblank", "subjective"
  question: text("question").notNull(),
  options: jsonb("options"), // For MCQs: [{"id": "a", "text": "Option A"}, ...]
  correctAnswer: jsonb("correct_answer"), // Depends on type (string or array)
  points: integer("points").notNull().default(1),
  negativePoints: integer("negative_points").default(0), // Points deducted for wrong answers
  pointsFloat: text("points_float"), // For decimal points (new)
  negativePointsFloat: text("negative_points_float"), // For decimal negative points (new)
  explanation: text("explanation"),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create base question schema
export const baseQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

// Extended schema with custom validation for decimal points
export const insertQuestionSchema = baseQuestionSchema.extend({
  // Allow string input for points (to support decimals)
  points: z
    .number()
    .or(
      z
        .string()
        .regex(/^\d*\.?\d*$/)
        .transform((val) => Number(val)),
    )
    .optional(),
  // Allow string input for negative points (to support decimals)
  negativePoints: z
    .number()
    .or(
      z
        .string()
        .regex(/^\d*\.?\d*$/)
        .transform((val) => Number(val)),
    )
    .optional(),
  // Store decimal values as strings
  pointsFloat: z
    .string()
    .regex(/^\d*\.?\d*$/)
    .optional(),
  negativePointsFloat: z
    .string()
    .regex(/^\d*\.?\d*$/)
    .optional(),
});

// Test Attempt model
export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(), // Reference to tests.id
  userId: integer("user_id").notNull(), // Reference to users.id
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  score: integer("score"), // Calculated score
  status: text("status").notNull().default("in_progress"), // "in_progress", "completed", "abandoned"
  totalPoints: integer("total_points"), // Total points earned (including negative)
  correctPoints: integer("correct_points"), // Points earned from correct answers
  negativePoints: integer("negative_points"), // Points deducted for incorrect answers
  totalPointsFloat: text("total_points_float"), // For decimal values (new)
  correctPointsFloat: text("correct_points_float"), // For decimal values (new)
  negativePointsFloat: text("negative_points_float"), // For decimal values (new)
  answers: jsonb("answers").default({}), // {questionId: answer}
  results: jsonb("results").default({}), // Detailed results: {questionId: {correct: true/false, points: +/-, etc.}}
});

// Create base test attempt schema
export const baseTestAttemptSchema = createInsertSchema(testAttempts).omit({
  id: true,
  startedAt: true,
});

// Extended schema with custom validation for decimal points
export const insertTestAttemptSchema = baseTestAttemptSchema.extend({
  // Accept decimal values for points (stored as strings)
  totalPointsFloat: z
    .string()
    .regex(/^-?\d*\.?\d*$/)
    .optional(),
  correctPointsFloat: z
    .string()
    .regex(/^-?\d*\.?\d*$/)
    .optional(),
  negativePointsFloat: z
    .string()
    .regex(/^-?\d*\.?\d*$/)
    .optional(),
});

// Course Enrollment model
export const enrollments = pgTable(
  "enrollments",
  {
    userId: integer("user_id").notNull(), // Reference to users.id
    courseId: integer("course_id").notNull(), // Reference to courses.id
    enrolledAt: timestamp("enrolled_at").defaultNow(),
    progress: integer("progress").notNull().default(0), // Percentage
    isCompleted: boolean("is_completed").notNull().default(false),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.courseId] }),
    };
  },
);

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  enrolledAt: true,
});

// Doubt Session model
export const doubtSessions = pgTable("doubt_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Reference to users.id (student)
  teacherId: integer("teacher_id"), // Reference to users.id (teacher)
  topic: text("topic").notNull(),
  description: text("description"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "confirmed", "completed", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDoubtSessionSchema = createInsertSchema(doubtSessions).omit({
  id: true,
  createdAt: true,
});

// Study Time tracking model
export const studyTimes = pgTable("study_times", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Reference to users.id
  courseId: integer("course_id"), // Optional reference to courses.id
  moduleId: integer("module_id"), // Optional reference to modules.id
  testId: integer("test_id"), // Optional reference to tests.id
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // in seconds, calculated upon endedAt
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudyTimeSchema = createInsertSchema(studyTimes).omit({
  id: true,
  createdAt: true,
});

// Types for the models
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type DoubtSession = typeof doubtSessions.$inferSelect;
export type InsertDoubtSession = z.infer<typeof insertDoubtSessionSchema>;

export type StudyTime = typeof studyTimes.$inferSelect;
export type InsertStudyTime = z.infer<typeof insertStudyTimeSchema>;

// Notification model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Reference to users.id (recipient)
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "course_update", "test_scheduled", "enrollment", "system", etc.
  resourceId: integer("resource_id"), // Optional reference to a course, test, etc.
  resourceType: text("resource_type"), // "course", "test", "module", etc.
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Site Configuration model
export const siteConfig = pgTable("site_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteConfigSchema = createInsertSchema(siteConfig).omit({
  id: true,
  updatedAt: true,
});

export type NavLink = {
  title: string;
  path: string;
  className?: string;
};

export type SiteConfig = typeof siteConfig.$inferSelect & {
  navLinks?: NavLink[];
  logoUrl?: string;
  useCustomLogo?: boolean;
  siteTitle?: string;
  tagline?: string;
  instituteName?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontMain?: string;
    fontHeadings?: string;
    useCustomLogo?: boolean;
  };
};
export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;

// Promotional Banner model
export const promoBanners = pgTable("promo_banners", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  url: text("url"),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(1),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPromoBannerSchema = createInsertSchema(promoBanners).omit({
  id: true,
  createdAt: true,
});

export type PromoBanner = typeof promoBanners.$inferSelect;
export type InsertPromoBanner = z.infer<typeof insertPromoBannerSchema>;
