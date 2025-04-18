import {
  users, User, InsertUser,
  courses, Course, InsertCourse,
  modules, Module, InsertModule, 
  tests, Test, InsertTest,
  questions, Question, InsertQuestion,
  testAttempts, TestAttempt, InsertTestAttempt,
  enrollments, Enrollment, InsertEnrollment,
  doubtSessions, DoubtSession, InsertDoubtSession,
  studyTimes, StudyTime, InsertStudyTime,
  notifications, Notification, InsertNotification
} from "@shared/schema";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc } from 'drizzle-orm';
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

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
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
  listCourses(isActive?: boolean): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Module Methods
  getModule(id: number): Promise<Module | undefined>;
  listModules(courseId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, module: Partial<InsertModule>): Promise<Module | undefined>;
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
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Test Attempt Methods
  getTestAttempt(id: number): Promise<TestAttempt | undefined>;
  getTestAttemptsByUser(userId: number): Promise<TestAttempt[]>;
  getTestAttemptsByTest(testId: number): Promise<TestAttempt[]>;
  createTestAttempt(testAttempt: InsertTestAttempt): Promise<TestAttempt>;
  updateTestAttempt(id: number, testAttempt: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined>;
  
  // Enrollment Methods
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  listEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(userId: number, courseId: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(userId: number, courseId: number): Promise<boolean>;
  
  // Doubt Session Methods
  getDoubtSession(id: number): Promise<DoubtSession | undefined>;
  listDoubtSessionsByUser(userId: number): Promise<DoubtSession[]>;
  listDoubtSessionsByTeacher(teacherId: number): Promise<DoubtSession[]>;
  createDoubtSession(doubtSession: InsertDoubtSession): Promise<DoubtSession>;
  updateDoubtSession(id: number, doubtSession: Partial<InsertDoubtSession>): Promise<DoubtSession | undefined>;
  
  // Study Time Methods
  getStudyTime(id: number): Promise<StudyTime | undefined>;
  listStudyTimesByUser(userId: number): Promise<StudyTime[]>;
  createStudyTime(studyTime: InsertStudyTime): Promise<StudyTime>;
  updateStudyTime(id: number, studyTime: Partial<InsertStudyTime>): Promise<StudyTime | undefined>;
  
  // Analytics Methods
  getStudentProgress(userId: number): Promise<{courseProgress: number, testPerformance: number, studyTimeThisWeek: number}>;
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
  notifyCourseUpdate(courseId: number, updateType: string, message: string): Promise<void>;
  
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
      createTableIfMissing: true
    });
  }
  
  // Notification Methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await this.db.select().from(notifications).where(eq(notifications.id, id));
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

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await this.db.insert(notifications).values(notification).returning();
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

  async notifyCourseUpdate(courseId: number, updateType: string, message: string): Promise<void> {
    // Get all users enrolled in this course
    const enrolledUsers = await this.listEnrollmentsByCourse(courseId);
    
    // Get the course details
    const course = await this.getCourse(courseId);
    if (!course) return;
    
    const title = updateType === 'course_update' 
                 ? `Course "${course.title}" Updated` 
                 : updateType === 'test_update' 
                 ? `Test Updated for "${course.title}"`
                 : `Update for "${course.title}"`;
    
    // Create a notification for each enrolled user
    for (const enrollment of enrolledUsers) {
      await this.createNotification({
        userId: enrollment.userId,
        title,
        message,
        type: updateType,
        resourceId: courseId,
        resourceType: 'course'
      });
    }
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await hash(insertUser.password);
    const userData = { ...insertUser, password: hashedPassword };
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
    const [course] = await this.db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async listCourses(isActive?: boolean): Promise<Course[]> {
    if (isActive !== undefined) {
      return await this.db.select().from(courses).where(eq(courses.isActive, isActive));
    }
    return await this.db.select().from(courses);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await this.db.insert(courses).values(course).returning();
    return created;
  }

  async updateCourse(id: number, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
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
    const [module] = await this.db.select().from(modules).where(eq(modules.id, id));
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

  async updateModule(id: number, moduleUpdate: Partial<InsertModule>): Promise<Module | undefined> {
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

  async listTests(courseId?: number, isActive?: boolean): Promise<Test[]> {
    let query = this.db.select().from(tests);
    
    if (courseId !== undefined) {
      query = query.where(eq(tests.courseId, courseId));
    }
    
    if (isActive !== undefined) {
      query = query.where(eq(tests.isActive, isActive));
    }
    
    return await query;
  }

  async createTest(test: InsertTest): Promise<Test> {
    const [created] = await this.db.insert(tests).values(test).returning();
    return created;
  }

  async updateTest(id: number, testUpdate: Partial<InsertTest>): Promise<Test | undefined> {
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
    const [question] = await this.db.select().from(questions).where(eq(questions.id, id));
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
    const [created] = await this.db.insert(questions).values(question).returning();
    return created;
  }

  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
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
    const [attempt] = await this.db.select().from(testAttempts).where(eq(testAttempts.id, id));
    return attempt;
  }

  async getTestAttemptsByUser(userId: number): Promise<TestAttempt[]> {
    return await this.db.select().from(testAttempts).where(eq(testAttempts.userId, userId));
  }

  async getTestAttemptsByTest(testId: number): Promise<TestAttempt[]> {
    return await this.db.select().from(testAttempts).where(eq(testAttempts.testId, testId));
  }

  async createTestAttempt(testAttempt: InsertTestAttempt): Promise<TestAttempt> {
    const [created] = await this.db.insert(testAttempts).values({
      ...testAttempt,
      startedAt: new Date(),
      status: testAttempt.status || 'in_progress'
    }).returning();
    return created;
  }

  async updateTestAttempt(id: number, testAttemptUpdate: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined> {
    // If status is completed, set completedAt
    const updates = { ...testAttemptUpdate };
    if (updates.status === 'completed' && !updates.completedAt) {
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
  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .where(eq(enrollments.courseId, courseId));
    return enrollment;
  }

  async listEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return await this.db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await this.db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await this.db.insert(enrollments).values({
      ...enrollment,
      enrolledAt: new Date(),
      progress: enrollment.progress || 0,
      isCompleted: enrollment.isCompleted || false
    }).returning();
    return created;
  }

  async updateEnrollment(
    userId: number,
    courseId: number,
    enrollmentUpdate: Partial<InsertEnrollment>
  ): Promise<Enrollment | undefined> {
    const [updated] = await this.db
      .update(enrollments)
      .set(enrollmentUpdate)
      .where(eq(enrollments.userId, userId))
      .where(eq(enrollments.courseId, courseId))
      .returning();
    return updated;
  }

  async deleteEnrollment(userId: number, courseId: number): Promise<boolean> {
    await this.db
      .delete(enrollments)
      .where(eq(enrollments.userId, userId))
      .where(eq(enrollments.courseId, courseId));
    return true;
  }

  // Doubt Session Methods
  async getDoubtSession(id: number): Promise<DoubtSession | undefined> {
    const [session] = await this.db.select().from(doubtSessions).where(eq(doubtSessions.id, id));
    return session;
  }

  async listDoubtSessionsByUser(userId: number): Promise<DoubtSession[]> {
    return await this.db.select().from(doubtSessions).where(eq(doubtSessions.userId, userId));
  }

  async listDoubtSessionsByTeacher(teacherId: number): Promise<DoubtSession[]> {
    return await this.db.select().from(doubtSessions).where(eq(doubtSessions.teacherId, teacherId));
  }

  async createDoubtSession(doubtSession: InsertDoubtSession): Promise<DoubtSession> {
    const [created] = await this.db.insert(doubtSessions).values({
      ...doubtSession,
      status: doubtSession.status || 'pending',
      createdAt: new Date()
    }).returning();
    return created;
  }

  async updateDoubtSession(id: number, doubtSessionUpdate: Partial<InsertDoubtSession>): Promise<DoubtSession | undefined> {
    const [updated] = await this.db
      .update(doubtSessions)
      .set(doubtSessionUpdate)
      .where(eq(doubtSessions.id, id))
      .returning();
    return updated;
  }

  // Study Time Methods
  async getStudyTime(id: number): Promise<StudyTime | undefined> {
    const [studyTime] = await this.db.select().from(studyTimes).where(eq(studyTimes.id, id));
    return studyTime;
  }

  async listStudyTimesByUser(userId: number): Promise<StudyTime[]> {
    return await this.db.select().from(studyTimes).where(eq(studyTimes.userId, userId));
  }

  async createStudyTime(studyTime: InsertStudyTime): Promise<StudyTime> {
    const [created] = await this.db.insert(studyTimes).values({
      ...studyTime,
      startedAt: new Date(),
      createdAt: new Date()
    }).returning();
    return created;
  }

  async updateStudyTime(id: number, studyTimeUpdate: Partial<InsertStudyTime>): Promise<StudyTime | undefined> {
    const [updated] = await this.db
      .update(studyTimes)
      .set(studyTimeUpdate)
      .where(eq(studyTimes.id, id))
      .returning();
    return updated;
  }

  // Notification Methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await this.db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async listNotificationsByUser(userId: number): Promise<Notification[]> {
    return await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt, 'desc');
  }

  async listUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .where(eq(notifications.isRead, false))
      .orderBy(notifications.createdAt, 'desc');
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await this.db.insert(notifications).values({
      ...notification,
      isRead: false,
      createdAt: new Date()
    }).returning();
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
    
    // Return count of updated records
    return result.rowCount || 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    await this.db.delete(notifications).where(eq(notifications.id, id));
    return true;
  }

  // Course Update Notification Methods
  async notifyCourseUpdate(courseId: number, updateType: string, message: string): Promise<void> {
    const [course] = await this.db.select().from(courses).where(eq(courses.id, courseId));
    if (!course) return;
    
    // Find all students enrolled in this course
    const enrolledUsers = await this.db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
    
    // Create a notification for each enrolled student
    for (const enrollment of enrolledUsers) {
      await this.createNotification({
        userId: enrollment.userId,
        title: `Course Update: ${course.title}`,
        message,
        type: 'course_update',
        resourceId: courseId,
        resourceType: 'course'
      });
    }
  }

  // Analytics Methods
  async getStudentProgress(userId: number): Promise<{courseProgress: number, testPerformance: number, studyTimeThisWeek: number}> {
    // Get all enrollments
    const userEnrollments = await this.db.select().from(enrollments).where(eq(enrollments.userId, userId));
    
    // Calculate overall course progress
    const totalProgress = userEnrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
    const courseProgress = userEnrollments.length > 0 
      ? totalProgress / userEnrollments.length 
      : 0;
    
    // Calculate test performance
    const userAttempts = await this.db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.userId, userId))
      .where(eq(testAttempts.status, 'completed'));
    
    const testPerformance = userAttempts.length > 0
      ? userAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / userAttempts.length
      : 0;
    
    // Calculate study time for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentStudy = await this.db
      .select()
      .from(studyTimes)
      .where(eq(studyTimes.userId, userId));
    
    const recentStudyTimes = recentStudy.filter(time => time.createdAt && new Date(time.createdAt) >= oneWeekAgo);
    const studyTimeThisWeek = recentStudyTimes.reduce((sum, time) => sum + (time.duration || 0), 0);
    
    return {
      courseProgress,
      testPerformance,
      studyTimeThisWeek
    };
  }

  async getOverallAnalytics(): Promise<any> {
    // Get total counts
    const [userCount] = await this.db.select({ count: count() }).from(users);
    const [courseCount] = await this.db.select({ count: count() }).from(courses);
    const [testCount] = await this.db.select({ count: count() }).from(tests);
    const [sessionCount] = await this.db.select({ count: count() }).from(doubtSessions);
    
    // Get all completed test attempts
    const completedAttempts = await this.db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.status, 'completed'));
    
    // Calculate avg score
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length
      : 0;
    
    return {
      counts: {
        users: userCount.count,
        courses: courseCount.count,
        tests: testCount.count,
        doubtSessions: sessionCount.count,
        testAttempts: completedAttempts.length
      },
      performance: {
        avgScore
      }
    };
  }

  async getTestAnalytics(testId: number): Promise<any> {
    // Get test details
    const [test] = await this.db.select().from(tests).where(eq(tests.id, testId));
    if (!test) return null;
    
    // Get all attempts for this test
    const attempts = await this.db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.testId, testId));
    
    const completedAttempts = attempts.filter(attempt => attempt.status === 'completed');
    
    // Calculate statistics
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length
      : 0;
    
    const passingAttempts = completedAttempts.filter(attempt => 
      (attempt.score || 0) >= test.passingScore
    );
    
    const passRate = completedAttempts.length > 0
      ? (passingAttempts.length / completedAttempts.length) * 100
      : 0;
    
    return {
      testInfo: {
        title: test.title,
        passingScore: test.passingScore,
        duration: test.duration
      },
      attempts: {
        total: attempts.length,
        completed: completedAttempts.length,
        passed: passingAttempts.length
      },
      performance: {
        avgScore,
        passRate
      }
    };
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