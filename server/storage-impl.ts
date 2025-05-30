import {
  users,
  User,
  InsertUser,
  courses,
  Course,
  InsertCourse,
  modules,
  Module,
  InsertModule,
  tests,
  Test,
  InsertTest,
  questions,
  Question,
  InsertQuestion,
  testAttempts,
  TestAttempt,
  InsertTestAttempt,
  enrollments,
  Enrollment,
  InsertEnrollment,
  enrollmentRequests,
  EnrollmentRequest,
  InsertEnrollmentRequest,
  testEnrollmentRequests,
  TestEnrollmentRequest,
  InsertTestEnrollmentRequest,
  doubtSessions,
  DoubtSession,
  InsertDoubtSession,
  studyTimes,
  StudyTime,
  InsertStudyTime,
  notifications,
  Notification,
  InsertNotification,
} from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, desc, count, sql, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

export async function hash(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const [hashed, salt] = hashedPassword.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export interface IStorage {
  // User Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(role?: string): Promise<User[]>;

  // Course Methods
  getCourse(id: number): Promise<Course | undefined>;
  // Add an overloaded method allowing createdBy filtering
  listCourses(isActive?: boolean, createdBy?: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(
    id: number,
    course: Partial<InsertCourse>,
  ): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Module Methods
  getModule(id: number): Promise<Module | undefined>;
  listModules(courseId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(
    id: number,
    module: Partial<InsertModule>,
  ): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;

  // Test Methods
  getTest(id: number): Promise<Test | undefined>;
  listTests(courseId?: number, isActive?: boolean): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<boolean>;

  // Question Methods
  getQuestion(id: number): Promise<Question | undefined>;
  listQuestions(testId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(
    id: number,
    question: Partial<InsertQuestion>,
  ): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;

  // Test Attempt Methods
  getTestAttempt(id: number): Promise<TestAttempt | undefined>;
  getTestAttemptsByUser(userId: number): Promise<TestAttempt[]>;
  getTestAttemptsByTest(testId: number): Promise<TestAttempt[]>;
  createTestAttempt(testAttempt: InsertTestAttempt): Promise<TestAttempt>;
  updateTestAttempt(
    id: number,
    testAttempt: Partial<InsertTestAttempt>,
  ): Promise<TestAttempt | undefined>;

  // Enrollment Methods
  getEnrollment(
    userId: number,
    courseId: number,
  ): Promise<Enrollment | undefined>;
  listEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(
    userId: number,
    courseId: number,
    enrollment: Partial<InsertEnrollment>,
  ): Promise<Enrollment | undefined>;
  deleteEnrollment(userId: number, courseId: number): Promise<boolean>;

  // Doubt Session Methods
  getDoubtSession(id: number): Promise<DoubtSession | undefined>;
  listDoubtSessionsByUser(userId: number): Promise<DoubtSession[]>;
  listDoubtSessionsByTeacher(teacherId: number): Promise<DoubtSession[]>;
  createDoubtSession(doubtSession: InsertDoubtSession): Promise<DoubtSession>;
  updateDoubtSession(
    id: number,
    doubtSession: Partial<InsertDoubtSession>,
  ): Promise<DoubtSession | undefined>;

  // Study Time Methods
  getStudyTime(id: number): Promise<StudyTime | undefined>;
  listStudyTimesByUser(userId: number): Promise<StudyTime[]>;
  createStudyTime(studyTime: InsertStudyTime): Promise<StudyTime>;
  updateStudyTime(
    id: number,
    studyTime: Partial<InsertStudyTime>,
  ): Promise<StudyTime | undefined>;

  // Analytics Methods
  getStudentProgress(userId: number): Promise<{
    courseProgress: number;
    testPerformance: number;
    studyTimeThisWeek: number;
  }>;
  getOverallAnalytics(): Promise<any>;
  getTestAnalytics(testId: number): Promise<any>;

  // Notification Methods
  getNotification(id: number): Promise<Notification | undefined>;
  listNotificationsByUser(userId: number): Promise<Notification[]>;
  listUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;

  // Course Update Notification Methods
  notifyCourseUpdate(
    courseId: number,
    updateType: string,
    message: string,
  ): Promise<void>;

  // Session store for auth
  sessionStore: session.Store;
}

// Implementation using PostgreSQL Database
export class DatabaseStorage implements IStorage {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;
  readonly sessionStore: session.Store;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined in environment variables");
    }

    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(this.pool, { schema });

    // Set up the session store
    const PgSessionStore = connectPgSimple(session);
    this.sessionStore = new PgSessionStore({
      pool: this.pool,
      createTableIfMissing: true,
    });
  }

  // Notification Methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async listNotificationsByUser(userId: number): Promise<Notification[]> {
    const userNotifications = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return userNotifications;
  }

  async listUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    const unreadNotifications = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .where(eq(notifications.isRead, false))
      .orderBy(desc(notifications.createdAt));

    return unreadNotifications;
  }

  async createNotification(
    notification: InsertNotification,
  ): Promise<Notification> {
    const [created] = await this.db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updated] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();

    return updated;
  }

  async markAllNotificationsAsRead(userId: number): Promise<number> {
    const result = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId))
      .where(eq(notifications.isRead, false));

    return result.rowCount || 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await this.db
      .delete(notifications)
      .where(eq(notifications.id, id));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  async notifyCourseUpdate(
    courseId: number,
    updateType: string,
    message: string,
  ): Promise<void> {
    try {
      console.log("Starting notifyCourseUpdate for courseId:", courseId);

      // Get all users enrolled in this course
      const enrolledUsers = await this.listEnrollmentsByCourse(courseId);
      console.log("Found enrolled users:", enrolledUsers.length);

      // Get the course details
      const course = await this.getCourse(courseId);
      if (!course) {
        console.log("Course not found, cannot send notifications");
        return;
      }

      console.log("Generating notification for course:", course.title);

      const title =
        updateType === "course_update"
          ? `Course "${course.title}" Updated`
          : updateType === "test_update"
            ? `Test Updated for "${course.title}"`
            : `Update for "${course.title}"`;

      // Create a notification for each enrolled user
      for (const enrollment of enrolledUsers) {
        console.log("Creating notification for user:", enrollment.userId);

        // Insert directly using db
        const [created] = await this.db
          .insert(notifications)
          .values({
            userId: enrollment.userId,
            title,
            message,
            type: updateType,
            resourceId: courseId,
            resourceType: "course",
            isRead: false,
            createdAt: new Date(),
          })
          .returning();

        console.log("Created notification:", created.id);
      }

      console.log("All notifications created successfully");
    } catch (error) {
      console.error("Error in notifyCourseUpdate:", error);
    }
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Convert username to lowercase for case-insensitive comparison
    const lowercaseUsername = username.toLowerCase();
    
    // Select all users and filter case-insensitively
    const allUsers = await this.db
      .select()
      .from(users);
    
    // Find the user with a case-insensitive comparison
    const user = allUsers.find(user => 
      user.username.toLowerCase() === lowercaseUsername
    );
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // If email is null or empty, return undefined
    if (!email) {
      return undefined;
    }
    
    // Convert email to lowercase for case-insensitive comparison
    const lowercaseEmail = email.toLowerCase();
    
    // Select all users and filter case-insensitively
    const allUsers = await this.db
      .select()
      .from(users);
    
    // Find the user with a case-insensitive comparison
    const user = allUsers.find(user => 
      user.email && user.email.toLowerCase() === lowercaseEmail
    );
    
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hash(insertUser.password);
    
    // Store username and email in lowercase for consistency
    const userData = { 
      ...insertUser, 
      username: insertUser.username.toLowerCase(),
      email: insertUser.email ? insertUser.email.toLowerCase() : null,
      password: hashedPassword 
    };
    
    const [user] = await this.db.insert(users).values(userData).returning();
    return user;
  }

  async listUsers(role?: string): Promise<User[]> {
    if (role) {
      return await this.db.select().from(users).where(eq(users.role, role));
    }
    return await this.db.select().from(users);
  }

  // Course Methods
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await this.db
      .select()
      .from(courses)
      .where(eq(courses.id, id));
    return course;
  }

  async listCourses(isActive?: boolean, createdBy?: number): Promise<Course[]> {
    let query = this.db.select().from(courses);

    if (isActive !== undefined) {
      query = query.where(eq(courses.isActive, isActive));
    }

    if (createdBy !== undefined) {
      query = query.where(eq(courses.createdBy, createdBy));
    }
    query = query.orderBy(desc(courses.createdAt));
    return await query;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await this.db.insert(courses).values(course).returning();
    return created;
  }

  async updateCourse(
    id: number,
    courseUpdate: Partial<InsertCourse>,
  ): Promise<Course | undefined> {
    const [updated] = await this.db
      .update(courses)
      .set(courseUpdate)
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await this.db.delete(courses).where(eq(courses.id, id));
    return true; // If no error was thrown, consider it successful
  }

  // Module Methods
  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await this.db
      .select()
      .from(modules)
      .where(eq(modules.id, id));
    return module;
  }

  async listModules(courseId: number): Promise<Module[]> {
    return await this.db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.sortOrder);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [created] = await this.db.insert(modules).values(module).returning();
    return created;
  }

  async updateModule(
    id: number,
    moduleUpdate: Partial<InsertModule>,
  ): Promise<Module | undefined> {
    const [updated] = await this.db
      .update(modules)
      .set(moduleUpdate)
      .where(eq(modules.id, id))
      .returning();
    return updated;
  }

  async deleteModule(id: number): Promise<boolean> {
    await this.db.delete(modules).where(eq(modules.id, id));
    return true;
  }

  // Test Methods
  async getTest(id: number): Promise<Test | undefined> {
    const [test] = await this.db.select().from(tests).where(eq(tests.id, id));
    return test;
  }

  async listTests(opts?: {
    courseId?: number;
    isActive?: boolean;
    visibility?: 'public' | 'private';
    testType?: 'formal' | 'practice';
  }): Promise<Test[]> {
    const { courseId, isActive, visibility, testType } = opts || {};
    let query = this.db.select().from(tests);
    
    if (courseId !== undefined) {
      query = query.where(eq(tests.courseId, courseId));
    }

    if (isActive !== undefined) {
      query = query.where(eq(tests.isActive, isActive));
    }
    
    if (visibility !== undefined) {
      query = query.where(eq(tests.visibility, visibility));
    }
    
    if (testType !== undefined) {
      query = query.where(eq(tests.testType, testType));
    }

    return await query;
  }

  async createTest(test: InsertTest): Promise<Test> {
    const [created] = await this.db.insert(tests).values(test).returning();
    return created;
  }

  async updateTest(
    id: number,
    testUpdate: Partial<InsertTest>,
  ): Promise<Test | undefined> {
    const [updated] = await this.db
      .update(tests)
      .set(testUpdate)
      .where(eq(tests.id, id))
      .returning();
    return updated;
  }

  async deleteTest(id: number): Promise<boolean> {
    await this.db.delete(tests).where(eq(tests.id, id));
    return true;
  }

  // Question Methods
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await this.db
      .select()
      .from(questions)
      .where(eq(questions.id, id));
    return question;
  }

  async listQuestions(testId: number): Promise<Question[]> {
    return await this.db
      .select()
      .from(questions)
      .where(eq(questions.testId, testId))
      .orderBy(questions.sortOrder);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [created] = await this.db
      .insert(questions)
      .values(question)
      .returning();
    return created;
  }

  async updateQuestion(
    id: number,
    questionUpdate: Partial<InsertQuestion>,
  ): Promise<Question | undefined> {
    const [updated] = await this.db
      .update(questions)
      .set(questionUpdate)
      .where(eq(questions.id, id))
      .returning();
    return updated;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    await this.db.delete(questions).where(eq(questions.id, id));
    return true;
  }

  // Test Attempt Methods
  async getTestAttempt(id: number): Promise<TestAttempt | undefined> {
    const [attempt] = await this.db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, id));
    return attempt;
  }

  async getTestAttemptsByUser(userId: number): Promise<TestAttempt[]> {
    return await this.db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.userId, userId));
  }

  async getTestAttemptsByTest(testId: number): Promise<TestAttempt[]> {
    return await this.db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.testId, testId));
  }

  async createTestAttempt(
    testAttempt: InsertTestAttempt,
  ): Promise<TestAttempt> {
    const [created] = await this.db
      .insert(testAttempts)
      .values({
        ...testAttempt,
        startedAt: new Date(),
        status: testAttempt.status || "in_progress",
      })
      .returning();
    return created;
  }

  async updateTestAttempt(
    id: number,
    testAttemptUpdate: Partial<InsertTestAttempt>,
  ): Promise<TestAttempt | undefined> {
    // If status is completed, set completedAt
    const updates = { ...testAttemptUpdate };
    if (updates.status === "completed" && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const [updated] = await this.db
      .update(testAttempts)
      .set(updates)
      .where(eq(testAttempts.id, id))
      .returning();
    return updated;
  }

  // Enrollment Methods
  async getEnrollment(
    userId: number,
    courseId: number,
  ): Promise<Enrollment | undefined> {
    console.log(
      `Checking enrollment for userId=${userId}, courseId=${courseId}`,
    );

    try {
      // Use explicit and() for combining conditions to ensure both are applied
      const result = await this.db
        .select()
        .from(enrollments)
        .where(
          sql`${enrollments.userId} = ${userId} AND ${enrollments.courseId} = ${courseId}`,
        );

      console.log(`Enrollment check result:`, result);

      if (result && result.length > 0) {
        return result[0];
      }

      console.log(
        `No enrollment found for userId=${userId}, courseId=${courseId}`,
      );
      return undefined;
    } catch (error) {
      console.error(
        `Error in getEnrollment for userId=${userId}, courseId=${courseId}:`,
        error,
      );
      return undefined;
    }
  }

  async listEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId));
  }

  async listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await this.db
      .insert(enrollments)
      .values({
        ...enrollment,
        enrolledAt: new Date(),
        progress: enrollment.progress || 0,
        isCompleted: enrollment.isCompleted || false,
      })
      .returning();
    return created;
  }

  async updateEnrollment(
    userId: number,
    courseId: number,
    enrollmentUpdate: Partial<InsertEnrollment>,
  ): Promise<Enrollment | undefined> {
    console.log(`Updating enrollment: userId=${userId}, courseId=${courseId}`);

    const [updated] = await this.db
      .update(enrollments)
      .set(enrollmentUpdate)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .returning();

    console.log(`Updated enrollment result:`, updated);
    return updated;
  }

  async deleteEnrollment(userId: number, courseId: number): Promise<boolean> {
    console.log(
      `Deleting enrollment for userId=${userId}, courseId=${courseId}`,
    );

    const result = await this.db
      .delete(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      );

    console.log(`Deletion result:`, result);
    return result.count > 0;
  }
  
  // Enrollment Request Methods
  async getEnrollmentRequest(
    userId: number,
    courseId: number
  ): Promise<EnrollmentRequest | undefined> {
    console.log(`Getting enrollment request for userId=${userId}, courseId=${courseId}`);
    
    const [request] = await this.db
      .select()
      .from(enrollmentRequests)
      .where(
        and(eq(enrollmentRequests.userId, userId), eq(enrollmentRequests.courseId, courseId)),
      );
      
    return request;
  }
  
  async listEnrollmentRequestsByUser(userId: number): Promise<EnrollmentRequest[]> {
    console.log(`Listing enrollment requests for userId=${userId}`);
    
    const requests = await this.db
      .select()
      .from(enrollmentRequests)
      .where(eq(enrollmentRequests.userId, userId));
      
    return requests;
  }
  
  async listEnrollmentRequestsByCourse(courseId: number): Promise<EnrollmentRequest[]> {
    console.log(`Listing enrollment requests for courseId=${courseId}`);
    
    const requests = await this.db
      .select()
      .from(enrollmentRequests)
      .where(eq(enrollmentRequests.courseId, courseId));
      
    return requests;
  }
  
  async listEnrollmentRequestsByStatus(status: string): Promise<EnrollmentRequest[]> {
    console.log(`Listing enrollment requests with status=${status}`);
    
    const requests = await this.db
      .select()
      .from(enrollmentRequests)
      .where(eq(enrollmentRequests.status, status));
      
    return requests;
  }
  
  async listAllEnrollmentRequests(): Promise<EnrollmentRequest[]> {
    console.log(`Listing all enrollment requests`);
    
    const requests = await this.db
      .select()
      .from(enrollmentRequests);
    
      
    return requests;
  }
  
  async createEnrollmentRequest(request: InsertEnrollmentRequest): Promise<EnrollmentRequest> {
    console.log(`Creating enrollment request:`, request);
    
    const [created] = await this.db
      .insert(enrollmentRequests)
      .values({
        ...request,
        requestedAt: new Date(),
        status: "pending"
      })
      .returning();
      
    console.log(`Created enrollment request:`, created);
    return created;
  }
  
  async updateEnrollmentRequestStatus(
    userId: number,
    courseId: number,
    status: string,
    reviewedBy: number
  ): Promise<EnrollmentRequest | undefined> {
    console.log(
      `Updating enrollment request status: userId=${userId}, courseId=${courseId}, status=${status}, reviewedBy=${reviewedBy}`
    );
    
    const now = new Date();
    const [updated] = await this.db
      .update(enrollmentRequests)
      .set({
        status: status,
        reviewedBy: reviewedBy,
        reviewedAt: now
      })
      .where(
        and(eq(enrollmentRequests.userId, userId), eq(enrollmentRequests.courseId, courseId)),
      )
      .returning();
      
    console.log(`Updated enrollment request result:`, updated);
    return updated;
  }
  
  async deleteEnrollmentRequest(userId: number, courseId: number): Promise<boolean> {
    console.log(
      `Deleting enrollment request for userId=${userId}, courseId=${courseId}`
    );
    
    const result = await this.db
      .delete(enrollmentRequests)
      .where(
        and(eq(enrollmentRequests.userId, userId), eq(enrollmentRequests.courseId, courseId)),
      );
      
    console.log(`Deletion result:`, result);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Test Enrollment Request Methods
  async getTestEnrollmentRequest(
    userId: number,
    testId: number
  ): Promise<TestEnrollmentRequest | undefined> {
    console.log(`Getting test enrollment request for userId=${userId}, testId=${testId}`);
    
    const [request] = await this.db
      .select()
      .from(testEnrollmentRequests)
      .where(
        and(eq(testEnrollmentRequests.userId, userId), eq(testEnrollmentRequests.testId, testId)),
      );
      
    return request;
  }
  
  async listTestEnrollmentRequestsByUser(userId: number): Promise<TestEnrollmentRequest[]> {
    console.log(`Listing test enrollment requests for userId=${userId}`);
    
    const requests = await this.db
      .select()
      .from(testEnrollmentRequests)
      .where(eq(testEnrollmentRequests.userId, userId));
      
    return requests;
  }
  
  async listTestEnrollmentRequestsByTest(testId: number): Promise<TestEnrollmentRequest[]> {
    console.log(`Listing test enrollment requests for testId=${testId}`);
    
    const requests = await this.db
      .select()
      .from(testEnrollmentRequests)
      .where(eq(testEnrollmentRequests.testId, testId));
      
    return requests;
  }
  
  async listTestEnrollmentRequestsByStatus(status: string): Promise<TestEnrollmentRequest[]> {
    console.log(`Listing test enrollment requests with status=${status}`);
    
    const requests = await this.db
      .select()
      .from(testEnrollmentRequests)
      .where(eq(testEnrollmentRequests.status, status));
      
    return requests;
  }
  
  async listAllTestEnrollmentRequests(): Promise<TestEnrollmentRequest[]> {
    console.log(`Listing all test enrollment requests`);
    
    const requests = await this.db
      .select()
      .from(testEnrollmentRequests)
      .orderBy(desc(testEnrollmentRequests.requestedAt));
      
    return requests;
  }
  
  async createTestEnrollmentRequest(request: InsertTestEnrollmentRequest): Promise<TestEnrollmentRequest> {
    console.log(`Creating test enrollment request: userId=${request.userId}, testId=${request.testId}`);
    
    // Check if request already exists
    const existingRequest = await this.getTestEnrollmentRequest(request.userId, request.testId);
    if (existingRequest) {
      return existingRequest;
    }
    
    // Create new request
    const [createdRequest] = await this.db
      .insert(testEnrollmentRequests)
      .values({
        ...request,
        status: request.status || "pending",
        createdAt: new Date()
      })
      .returning();
      
    return createdRequest;
  }
  
  async updateTestEnrollmentRequestStatus(
    userId: number,
    testId: number,
    status: string,
    reviewedBy: number
  ): Promise<TestEnrollmentRequest | undefined> {
    console.log(
      `Updating test enrollment request status: userId=${userId}, testId=${testId}, status=${status}, reviewedBy=${reviewedBy}`
    );
    
    const now = new Date();
    const [updated] = await this.db
      .update(testEnrollmentRequests)
      .set({
        status: status,
        reviewedBy: reviewedBy,
        reviewedAt: now
      })
      .where(
        and(eq(testEnrollmentRequests.userId, userId), eq(testEnrollmentRequests.testId, testId)),
      )
      .returning();
      
    // If status is 'approved', also create the test enrollment
    if (status === 'approved') {
      console.log(`Request approved, checking if student can access test ${testId}`);
      
      // Get the test to find its courseId
      const test = await this.getTest(testId);
      if (test) {
        console.log(`Test ${testId} belongs to course ${test.courseId}`);
        
        // For tests linked to courses, check if the student is enrolled in the course
        if (test.courseId !== null) {
          const enrollment = await this.getEnrollment(userId, test.courseId);
          if (!enrollment) {
            console.log(`Student ${userId} is not enrolled in course ${test.courseId}, creating enrollment`);
            // Auto-enroll the student in the course if they're not already enrolled
            await this.createEnrollment({
              userId,
              courseId: test.courseId,
              progress: 0,
              isCompleted: false,
              enrolledAt: new Date()
            });
          }
        }
      }
    }
    
    return updated;
  }
  
  async deleteTestEnrollmentRequest(userId: number, testId: number): Promise<boolean> {
    console.log(`Deleting test enrollment request: userId=${userId}, testId=${testId}`);
    
    const result = await this.db
      .delete(testEnrollmentRequests)
      .where(
        and(eq(testEnrollmentRequests.userId, userId), eq(testEnrollmentRequests.testId, testId)),
      );
      
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Doubt Session Methods
  async getDoubtSession(id: number): Promise<DoubtSession | undefined> {
    const [session] = await this.db
      .select()
      .from(doubtSessions)
      .where(eq(doubtSessions.id, id));
    return session;
  }

  async listDoubtSessionsByUser(userId: number): Promise<DoubtSession[]> {
    return await this.db
      .select()
      .from(doubtSessions)
      .where(eq(doubtSessions.userId, userId));
  }

  async listDoubtSessionsByTeacher(teacherId: number): Promise<DoubtSession[]> {
    return await this.db
      .select()
      .from(doubtSessions)
      .where(eq(doubtSessions.teacherId, teacherId));
  }

  async createDoubtSession(
    doubtSession: InsertDoubtSession,
  ): Promise<DoubtSession> {
    const [created] = await this.db
      .insert(doubtSessions)
      .values({
        ...doubtSession,
        status: doubtSession.status || "pending",
        createdAt: new Date(),
      })
      .returning();
    return created;
  }

  async updateDoubtSession(
    id: number,
    doubtSessionUpdate: Partial<InsertDoubtSession>,
  ): Promise<DoubtSession | undefined> {
    const [updated] = await this.db
      .update(doubtSessions)
      .set(doubtSessionUpdate)
      .where(eq(doubtSessions.id, id))
      .returning();
    return updated;
  }

  // Study Time Methods
  async getStudyTime(id: number): Promise<StudyTime | undefined> {
    const [studyTime] = await this.db
      .select()
      .from(studyTimes)
      .where(eq(studyTimes.id, id));
    return studyTime;
  }

  async listStudyTimesByUser(userId: number): Promise<StudyTime[]> {
    return await this.db
      .select()
      .from(studyTimes)
      .where(eq(studyTimes.userId, userId));
  }

  async createStudyTime(studyTime: InsertStudyTime): Promise<StudyTime> {
    const [created] = await this.db
      .insert(studyTimes)
      .values({
        ...studyTime,
        startedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();
    return created;
  }

  async updateStudyTime(
    id: number,
    studyTimeUpdate: Partial<InsertStudyTime>,
  ): Promise<StudyTime | undefined> {
    const [updated] = await this.db
      .update(studyTimes)
      .set(studyTimeUpdate)
      .where(eq(studyTimes.id, id))
      .returning();
    return updated;
  }

  // Notification Methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async listNotificationsByUser(userId: number): Promise<Notification[]> {
    return await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
  }

  async listUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return await this.db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .orderBy(desc(notifications.createdAt))
  }

  async createNotification(
    notification: InsertNotification,
  ): Promise<Notification> {
    const [created] = await this.db
      .insert(notifications)
      .values({
        ...notification,
        isRead: false,
        createdAt: new Date(),
      })
      .returning();
    return created;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updated] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: number): Promise<number> {
    console.log(`Marking all notifications as read for userId=${userId}`);

    const result = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    console.log(`Marked as read result:`, result);
    // Return count of updated records
    return result.rowCount || 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    await this.db.delete(notifications).where(eq(notifications.id, id));
    return true;
  }

  // Course Update Notification Methods
  // This implementation has been removed to fix notification duplication issue
  // The correct implementation is at the beginning of this class

  // Analytics Methods
  async getStudentProgress(userId: number): Promise<{
    courseProgress: number;
    testPerformance: number;
    studyTimeThisWeek: number;
  }> {
    // Get all enrollments
    const userEnrollments = await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId));

    // Calculate overall course progress
    const totalProgress = userEnrollments.reduce(
      (sum, enrollment) => sum + enrollment.progress,
      0,
    );
    const courseProgress =
      userEnrollments.length > 0 ? totalProgress / userEnrollments.length : 0;

    // Calculate test performance
    const userAttempts = await this.db
      .select()
      .from(testAttempts)
      .where(
        and(
          eq(testAttempts.userId, userId),
          eq(testAttempts.status, "completed"),
        ),
      );

    const testPerformance =
      userAttempts.length > 0
        ? userAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) /
          userAttempts.length
        : 0;

    // Calculate study time for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentStudy = await this.db
      .select()
      .from(studyTimes)
      .where(eq(studyTimes.userId, userId));

    const recentStudyTimes = recentStudy.filter(
      (time) => time.createdAt && new Date(time.createdAt) >= oneWeekAgo,
    );
    const studyTimeThisWeek = recentStudyTimes.reduce(
      (sum, time) => sum + (time.duration || 0),
      0,
    );

    return {
      courseProgress,
      testPerformance,
      studyTimeThisWeek,
    };
  }

  async getOverallAnalytics(): Promise<any> {
    try {
      console.log("Starting getOverallAnalytics method");

      // Get total counts with error handling
      let userCount, courseCount, testCount, sessionCount, completedAttempts;

      try {
        [userCount] = await this.db.select({ count: count() }).from(users);
        console.log("User count query successful:", userCount);
      } catch (error) {
        console.error("Error getting user count:", error);
        userCount = { count: 0 };
      }

      try {
        [courseCount] = await this.db.select({ count: count() }).from(courses);
        console.log("Course count query successful:", courseCount);
      } catch (error) {
        console.error("Error getting course count:", error);
        courseCount = { count: 0 };
      }

      try {
        [testCount] = await this.db.select({ count: count() }).from(tests);
        console.log("Test count query successful:", testCount);
      } catch (error) {
        console.error("Error getting test count:", error);
        testCount = { count: 0 };
      }

      try {
        [sessionCount] = await this.db
          .select({ count: count() })
          .from(doubtSessions);
        console.log("Session count query successful:", sessionCount);
      } catch (error) {
        console.error("Error getting session count:", error);
        sessionCount = { count: 0 };
      }

      // Get all completed test attempts
      try {
        completedAttempts = await this.db
          .select()
          .from(testAttempts)
          .where(eq(testAttempts.status, "completed"));
        console.log(
          "Completed attempts query successful, count:",
          completedAttempts.length,
        );
      } catch (error) {
        console.error("Error getting completed attempts:", error);
        completedAttempts = [];
      }

      // Calculate avg score with safer handling of null/undefined values
      let avgScore = 0;
      try {
        if (completedAttempts && completedAttempts.length > 0) {
          const totalScore = completedAttempts.reduce((sum, attempt) => {
            // Ensure we're adding a number, default to 0 if score is null/undefined
            const attemptScore =
              attempt && attempt.score !== null && attempt.score !== undefined
                ? Number(attempt.score)
                : 0;

            return sum + attemptScore;
          }, 0);

          avgScore = totalScore / completedAttempts.length;
          console.log("Average score calculated:", avgScore);
        }
      } catch (error) {
        console.error("Error calculating average score:", error);
        avgScore = 0;
      }

      // Construct response
      const response = {
        counts: {
          users: userCount?.count || 0,
          courses: courseCount?.count || 0,
          tests: testCount?.count || 0,
          doubtSessions: sessionCount?.count || 0,
          testAttempts: completedAttempts?.length || 0,
        },
        performance: {
          avgScore,
        },
      };

      console.log("Analytics response:", response);
      return response;
    } catch (error) {
      console.error("Uncaught error in getOverallAnalytics:", error);
      // Return basic data structure to prevent UI errors
      return {
        counts: {
          users: 0,
          courses: 0,
          tests: 0,
          doubtSessions: 0,
          testAttempts: 0,
        },
        performance: {
          avgScore: 0,
        },
      };
    }
  }

  async getTestAnalytics(testId: number): Promise<any> {
    try {
      console.log(`Starting getTestAnalytics for testId: ${testId}`);

      // Get test details
      let test;
      try {
        const result = await this.db
          .select()
          .from(tests)
          .where(eq(tests.id, testId));
        test = result[0];
        console.log("Test query successful:", test);

        if (!test) {
          console.log(`No test found with id ${testId}`);
          return null;
        }
      } catch (error) {
        console.error("Error getting test details:", error);
        return null;
      }

      // Get all attempts for this test
      let attempts;
      try {
        attempts = await this.db
          .select()
          .from(testAttempts)
          .where(eq(testAttempts.testId, testId));
        console.log(`Retrieved ${attempts.length} test attempts`);
      } catch (error) {
        console.error("Error getting test attempts:", error);
        attempts = [];
      }

      const completedAttempts = attempts.filter(
        (attempt) => attempt.status === "completed",
      );
      console.log(`Found ${completedAttempts.length} completed attempts`);

      // Calculate statistics with safer handling of null/undefined values
      let avgScore = 0;
      try {
        if (completedAttempts.length > 0) {
          const totalScore = completedAttempts.reduce((sum, attempt) => {
            const attemptScore =
              attempt && attempt.score !== null && attempt.score !== undefined
                ? Number(attempt.score)
                : 0;
            return sum + attemptScore;
          }, 0);

          avgScore = totalScore / completedAttempts.length;
          console.log(`Average score calculated: ${avgScore}`);
        }
      } catch (error) {
        console.error("Error calculating average score:", error);
        avgScore = 0;
      }

      // Safely get passing score
      const passingScore =
        test && test.passingScore !== null && test.passingScore !== undefined
          ? Number(test.passingScore)
          : 0;

      let passingAttempts;
      try {
        passingAttempts = completedAttempts.filter((attempt) => {
          const score =
            attempt && attempt.score !== null && attempt.score !== undefined
              ? Number(attempt.score)
              : 0;
          return score >= passingScore;
        });
        console.log(`Found ${passingAttempts.length} passing attempts`);
      } catch (error) {
        console.error("Error calculating passing attempts:", error);
        passingAttempts = [];
      }

      let passRate = 0;
      try {
        passRate =
          completedAttempts.length > 0
            ? (passingAttempts.length / completedAttempts.length) * 100
            : 0;
        console.log(`Pass rate calculated: ${passRate}%`);
      } catch (error) {
        console.error("Error calculating pass rate:", error);
        passRate = 0;
      }

      const response = {
        testInfo: {
          title: test?.title || "Unknown Test",
          passingScore: test?.passingScore || 0,
          duration: test?.duration || 0,
        },
        attempts: {
          total: attempts?.length || 0,
          completed: completedAttempts?.length || 0,
          passed: passingAttempts?.length || 0,
        },
        performance: {
          avgScore,
          passRate,
        },
      };

      console.log("Test analytics response:", response);
      return response;
    } catch (error) {
      console.error("Uncaught error in getTestAnalytics:", error);
      // Return a valid response structure to prevent UI errors
      return {
        testInfo: {
          title: "Error retrieving test",
          passingScore: 0,
          duration: 0,
        },
        attempts: {
          total: 0,
          completed: 0,
          passed: 0,
        },
        performance: {
          avgScore: 0,
          passRate: 0,
        },
      };
    }
  }
}

// Use PostgreSQL database
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export const storage = new DatabaseStorage();
