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
import { eq } from "drizzle-orm";
import { db } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

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
  listTests(opts?: {
    courseId?: number;
    isActive?: boolean;
    visibility?: 'public' | 'private';
    testType?: 'formal' | 'practice';
  }): Promise<Test[]>;
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private modules: Map<number, Module>;
  private tests: Map<number, Test>;
  private questions: Map<number, Question>;
  private testAttempts: Map<number, TestAttempt>;
  private enrollments: Map<string, Enrollment>; // key: `${userId}-${courseId}`
  private doubtSessions: Map<number, DoubtSession>;
  private studyTimes: Map<number, StudyTime>;
  
  private notifications: Map<number, Notification>;
  
  private currentIds: {
    users: number;
    courses: number;
    modules: number;
    tests: number;
    questions: number;
    testAttempts: number;
    doubtSessions: number;
    studyTimes: number;
    notifications: number;
  };

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.modules = new Map();
    this.tests = new Map();
    this.questions = new Map();
    this.testAttempts = new Map();
    this.enrollments = new Map();
    this.doubtSessions = new Map();
    this.studyTimes = new Map();
    this.notifications = new Map();
    
    this.currentIds = {
      users: 1,
      courses: 1,
      modules: 1,
      tests: 1,
      questions: 1,
      testAttempts: 1,
      doubtSessions: 1,
      studyTimes: 1,
      notifications: 1
    };
    
    // Initialize with some sample data
    this.initializeData();
  }

  // Initialize some demo data
  private async initializeData() {
    // Create admin user
    await this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@mathsmagictown.com",
      fullName: "Admin User",
      role: "admin"
    });
    
    // Create teacher user
    await this.createUser({
      username: "teacher",
      password: "teacher123",
      email: "teacher@mathsmagictown.com",
      fullName: "Teacher User",
      role: "teacher"
    });
    
    // Create student user
    await this.createUser({
      username: "student",
      password: "student123",
      email: "student@mathsmagictown.com",
      fullName: "Student User",
      role: "student"
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const hashedPassword = await hash(insertUser.password);
    const now = new Date();
    
    const user: User = { 
      ...insertUser, 
      id, 
      password: hashedPassword,
      createdAt: now
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async listUsers(role?: string): Promise<User[]> {
    const users = Array.from(this.users.values());
    return role ? users.filter(user => user.role === role) : users;
  }
  
  // Course Methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async listCourses(isActive?: boolean): Promise<Course[]> {
    const courses = Array.from(this.courses.values());
    return isActive !== undefined 
      ? courses.filter(course => course.isActive === isActive)
      : courses;
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentIds.courses++;
    const now = new Date();
    
    const course: Course = {
      ...insertCourse,
      id,
      createdAt: now
    };
    
    this.courses.set(id, course);
    return course;
  }
  
  async updateCourse(id: number, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...courseUpdate };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }
  
  // Module Methods
  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }
  
  async listModules(courseId: number): Promise<Module[]> {
    return Array.from(this.modules.values())
      .filter(module => module.courseId === courseId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = this.currentIds.modules++;
    const now = new Date();
    
    const module: Module = {
      ...insertModule,
      id,
      createdAt: now
    };
    
    this.modules.set(id, module);
    return module;
  }
  
  async updateModule(id: number, moduleUpdate: Partial<InsertModule>): Promise<Module | undefined> {
    const module = this.modules.get(id);
    if (!module) return undefined;
    
    const updatedModule = { ...module, ...moduleUpdate };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }
  
  async deleteModule(id: number): Promise<boolean> {
    return this.modules.delete(id);
  }
  
  // Test Methods
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }
  
  async listTests(opts?: {
    courseId?: number;
    isActive?: boolean;
    visibility?: 'public' | 'private';
    testType?: 'formal' | 'practice';
  }): Promise<Test[]> {
    let tests = Array.from(this.tests.values());
    
    if (opts) {
      if (opts.courseId !== undefined) {
        tests = tests.filter(test => test.courseId === opts.courseId);
      }
      
      if (opts.isActive !== undefined) {
        tests = tests.filter(test => test.isActive === opts.isActive);
      }
      
      if (opts.visibility !== undefined) {
        tests = tests.filter(test => test.visibility === opts.visibility);
      }
      
      if (opts.testType !== undefined) {
        tests = tests.filter(test => test.testType === opts.testType);
      }
    }
    
    return tests;
  }
  
  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.currentIds.tests++;
    const now = new Date();
    
    const test: Test = {
      ...insertTest,
      id,
      createdAt: now
    };
    
    this.tests.set(id, test);
    return test;
  }
  
  async updateTest(id: number, testUpdate: Partial<InsertTest>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    const updatedTest = { ...test, ...testUpdate };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }
  
  async deleteTest(id: number): Promise<boolean> {
    return this.tests.delete(id);
  }
  
  // Question Methods
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async listQuestions(testId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.testId === testId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentIds.questions++;
    const now = new Date();
    
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: now
    };
    
    this.questions.set(id, question);
    return question;
  }
  
  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...questionUpdate };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  // Test Attempt Methods
  async getTestAttempt(id: number): Promise<TestAttempt | undefined> {
    return this.testAttempts.get(id);
  }
  
  async getTestAttemptsByUser(userId: number): Promise<TestAttempt[]> {
    return Array.from(this.testAttempts.values())
      .filter(attempt => attempt.userId === userId);
  }
  
  async getTestAttemptsByTest(testId: number): Promise<TestAttempt[]> {
    return Array.from(this.testAttempts.values())
      .filter(attempt => attempt.testId === testId);
  }
  
  async createTestAttempt(insertTestAttempt: InsertTestAttempt): Promise<TestAttempt> {
    const id = this.currentIds.testAttempts++;
    const now = new Date();
    
    const testAttempt: TestAttempt = {
      ...insertTestAttempt,
      id,
      startedAt: now,
      completedAt: null,
      score: null
    };
    
    this.testAttempts.set(id, testAttempt);
    return testAttempt;
  }
  
  async updateTestAttempt(id: number, testAttemptUpdate: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined> {
    const testAttempt = this.testAttempts.get(id);
    if (!testAttempt) return undefined;
    
    const updatedTestAttempt = { ...testAttempt, ...testAttemptUpdate };
    
    // If status is completed and completedAt is not set, set it
    if (updatedTestAttempt.status === "completed" && !updatedTestAttempt.completedAt) {
      updatedTestAttempt.completedAt = new Date();
    }
    
    this.testAttempts.set(id, updatedTestAttempt);
    return updatedTestAttempt;
  }
  
  // Enrollment Methods
  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(`${userId}-${courseId}`);
  }
  
  async listEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.userId === userId);
  }
  
  async listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.courseId === courseId);
  }
  
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const now = new Date();
    
    const enrollment: Enrollment = {
      ...insertEnrollment,
      enrolledAt: now
    };
    
    this.enrollments.set(`${enrollment.userId}-${enrollment.courseId}`, enrollment);
    return enrollment;
  }
  
  async updateEnrollment(userId: number, courseId: number, enrollmentUpdate: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const key = `${userId}-${courseId}`;
    const enrollment = this.enrollments.get(key);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...enrollmentUpdate };
    this.enrollments.set(key, updatedEnrollment);
    return updatedEnrollment;
  }
  
  async deleteEnrollment(userId: number, courseId: number): Promise<boolean> {
    return this.enrollments.delete(`${userId}-${courseId}`);
  }
  
  // Doubt Session Methods
  async getDoubtSession(id: number): Promise<DoubtSession | undefined> {
    return this.doubtSessions.get(id);
  }
  
  async listDoubtSessionsByUser(userId: number): Promise<DoubtSession[]> {
    return Array.from(this.doubtSessions.values())
      .filter(session => session.userId === userId);
  }
  
  async listDoubtSessionsByTeacher(teacherId: number): Promise<DoubtSession[]> {
    return Array.from(this.doubtSessions.values())
      .filter(session => session.teacherId === teacherId);
  }
  
  async createDoubtSession(insertDoubtSession: InsertDoubtSession): Promise<DoubtSession> {
    const id = this.currentIds.doubtSessions++;
    const now = new Date();
    
    const doubtSession: DoubtSession = {
      ...insertDoubtSession,
      id,
      createdAt: now
    };
    
    this.doubtSessions.set(id, doubtSession);
    return doubtSession;
  }
  
  async updateDoubtSession(id: number, doubtSessionUpdate: Partial<InsertDoubtSession>): Promise<DoubtSession | undefined> {
    const doubtSession = this.doubtSessions.get(id);
    if (!doubtSession) return undefined;
    
    const updatedDoubtSession = { ...doubtSession, ...doubtSessionUpdate };
    this.doubtSessions.set(id, updatedDoubtSession);
    return updatedDoubtSession;
  }
  
  // Study Time Methods
  async getStudyTime(id: number): Promise<StudyTime | undefined> {
    return this.studyTimes.get(id);
  }
  
  async listStudyTimesByUser(userId: number): Promise<StudyTime[]> {
    return Array.from(this.studyTimes.values())
      .filter(studyTime => studyTime.userId === userId);
  }
  
  async createStudyTime(insertStudyTime: InsertStudyTime): Promise<StudyTime> {
    const id = this.currentIds.studyTimes++;
    const now = new Date();
    
    const studyTime: StudyTime = {
      ...insertStudyTime,
      id,
      createdAt: now
    };
    
    this.studyTimes.set(id, studyTime);
    return studyTime;
  }
  
  async updateStudyTime(id: number, studyTimeUpdate: Partial<InsertStudyTime>): Promise<StudyTime | undefined> {
    const studyTime = this.studyTimes.get(id);
    if (!studyTime) return undefined;
    
    const updatedStudyTime = { ...studyTime, ...studyTimeUpdate };
    
    // Calculate duration if endedAt is provided
    if (studyTimeUpdate.endedAt && updatedStudyTime.startedAt) {
      const durationMs = new Date(updatedStudyTime.endedAt).getTime() - new Date(updatedStudyTime.startedAt).getTime();
      updatedStudyTime.duration = Math.floor(durationMs / 1000); // Convert to seconds
    }
    
    this.studyTimes.set(id, updatedStudyTime);
    return updatedStudyTime;
  }
  
  // Analytics Methods
  async getStudentProgress(userId: number): Promise<{courseProgress: number, testPerformance: number, studyTimeThisWeek: number}> {
    // Get enrollments for this user
    const enrollments = await this.listEnrollmentsByUser(userId);
    const totalCourses = enrollments.length;
    const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
    const courseProgress = totalCourses > 0 ? Math.floor(totalProgress / totalCourses) : 0;
    
    // Get test attempts for this user
    const testAttempts = await this.getTestAttemptsByUser(userId);
    const completedAttempts = testAttempts.filter(attempt => attempt.status === "completed");
    const testScores = completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    const testPerformance = completedAttempts.length > 0 ? Math.floor(testScores / completedAttempts.length) : 0;
    
    // Calculate study time for the current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const studyTimes = await this.listStudyTimesByUser(userId);
    const weekStudyTimes = studyTimes.filter(
      time => new Date(time.startedAt) >= startOfWeek
    );
    
    const totalSeconds = weekStudyTimes.reduce((sum, time) => {
      if (time.duration) {
        return sum + time.duration;
      } else if (time.endedAt) {
        const duration = (new Date(time.endedAt).getTime() - new Date(time.startedAt).getTime()) / 1000;
        return sum + duration;
      } else {
        // For ongoing sessions, calculate duration up to now
        const duration = (now.getTime() - new Date(time.startedAt).getTime()) / 1000;
        return sum + duration;
      }
    }, 0);
    
    // Convert seconds to hours
    const studyTimeThisWeek = parseFloat((totalSeconds / 3600).toFixed(1));
    
    return {
      courseProgress,
      testPerformance,
      studyTimeThisWeek
    };
  }
  
  async getOverallAnalytics(): Promise<any> {
    const totalStudents = (await this.listUsers("student")).length;
    const activeCourses = (await this.listCourses(true)).length;
    const totalTests = this.tests.size;
    const totalSessions = this.doubtSessions.size;
    const testAttempts = Array.from(this.testAttempts.values());
    
    // Test Performance Analytics
    const completedAttempts = testAttempts.filter(attempt => attempt.status === "completed");
    const avgScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length 
      : 0;
    
    // Get all questions to analyze by type
    const allQuestions = Array.from(this.questions.values());
    const questionTypes = [...new Set(allQuestions.map(q => q.type))];
    
    const scoresByType = questionTypes.map(type => {
      const typeQuestions = allQuestions.filter(q => q.type === type);
      const typeQuestionIds = typeQuestions.map(q => q.id);
      
      // Get all answers for this question type
      let correctAnswers = 0;
      let totalAnswers = 0;
      
      completedAttempts.forEach(attempt => {
        if (attempt.answers) {
          Object.entries(attempt.answers).forEach(([qId, answer]) => {
            const questionId = parseInt(qId);
            if (typeQuestionIds.includes(questionId)) {
              totalAnswers++;
              const question = this.questions.get(questionId);
              if (question && this.isAnswerCorrect(question, answer)) {
                correctAnswers++;
              }
            }
          });
        }
      });
      
      return {
        type,
        averageScore: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
        attemptCount: totalAnswers
      };
    });
    
    // Course enrollment analytics
    const enrollmentData = await Promise.all(
      Array.from(this.courses.values()).map(async course => {
        const enrollments = await this.listEnrollmentsByCourse(course.id);
        return {
          courseId: course.id,
          courseName: course.title,
          enrollmentCount: enrollments.length
        };
      })
    );
    
    // Performance over time (last 6 months)
    const now = new Date();
    const performanceData = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthAttempts = testAttempts.filter(
        attempt => attempt.status === "completed" && 
        attempt.completedAt && 
        new Date(attempt.completedAt) >= month && 
        new Date(attempt.completedAt) <= monthEnd
      );
      
      const monthAvg = monthAttempts.length > 0 
        ? monthAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / monthAttempts.length 
        : 0;
      
      performanceData.push({
        month: `${month.getFullYear()}-${month.getMonth() + 1}`,
        averageScore: monthAvg,
        attemptCount: monthAttempts.length
      });
    }
    
    return {
      counts: {
        users: totalStudents,
        courses: activeCourses,
        tests: totalTests,
        sessions: totalSessions,
        testAttempts: testAttempts.length
      },
      testPerformance: {
        averageScore: avgScore,
        totalAttempts: completedAttempts.length,
        scoresByType
      },
      enrollmentData,
      performanceOverTime: performanceData
    };
  }
  
  async getTestAnalytics(testId: number): Promise<any> {
    const test = await this.getTest(testId);
    if (!test) {
      throw new Error("Test not found");
    }
    
    const questions = await this.listQuestions(testId);
    const attempts = await this.getTestAttemptsByTest(testId);
    const completedAttempts = attempts.filter(attempt => attempt.status === "completed");
    
    // Overall stats
    const avgScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length 
      : 0;
    
    // Per question stats
    const questionStats = questions.map(question => {
      let correct = 0;
      let total = 0;
      
      completedAttempts.forEach(attempt => {
        if (attempt.answers && attempt.answers[question.id] !== undefined) {
          total++;
          if (this.isAnswerCorrect(question, attempt.answers[question.id])) {
            correct++;
          }
        }
      });
      
      return {
        questionId: question.id,
        question: question.question.substring(0, 50) + (question.question.length > 50 ? '...' : ''),
        correctRate: total > 0 ? (correct / total) * 100 : 0,
        attemptCount: total
      };
    });
    
    // Time spent stats
    const avgDuration = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, attempt) => {
          if (attempt.completedAt && attempt.startedAt) {
            return sum + (new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime());
          }
          return sum;
        }, 0) / completedAttempts.length 
      : 0;
    
    return {
      testId,
      testTitle: test.title,
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      averageScore: avgScore,
      passingRate: completedAttempts.length > 0 
        ? (completedAttempts.filter(a => (a.score || 0) >= test.passingScore).length / completedAttempts.length) * 100 
        : 0,
      averageDuration: avgDuration / 60000, // in minutes
      questionStats
    };
  }
  
  // Helper to check if an answer is correct
  private isAnswerCorrect(question: Question, answer: any): boolean {
    if (!question.correctAnswer) return false;
    
    switch(question.type) {
      case "mcq":
        // For MCQ, correctAnswer is an array of option IDs
        if (Array.isArray(question.correctAnswer)) {
          if (Array.isArray(answer)) {
            return question.correctAnswer.length === answer.length && 
                   question.correctAnswer.every(opt => answer.includes(opt));
          } else {
            return question.correctAnswer.includes(answer);
          }
        }
        return question.correctAnswer === answer;
        
      case "truefalse":
        // For true/false, correctAnswer is a boolean
        return question.correctAnswer === answer;
        
      case "fillblank":
        // For fill in blank, correctAnswer could be an array of possible answers
        if (Array.isArray(question.correctAnswer)) {
          return question.correctAnswer.some(
            opt => opt.toLowerCase() === String(answer).toLowerCase()
          );
        }
        return String(question.correctAnswer).toLowerCase() === String(answer).toLowerCase();
        
      case "subjective":
        // For subjective, we might have keywords that should be present
        if (Array.isArray(question.correctAnswer) && typeof answer === 'string') {
          return question.correctAnswer.some(
            keyword => answer.toLowerCase().includes(String(keyword).toLowerCase())
          );
        }
        return false;
        
      default:
        return false;
    }
  }
}

// Password utility functions for hashing
// Password utility functions using Node.js crypto
const scryptAsync = promisify(scrypt);

export async function hash(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // If the hash doesn't include a salt (the older format), use the old comparison
    if (!hashedPassword.includes('.')) {
      return hashedPassword === `hashed_${password}`;
    }
    
    // Otherwise use the secure comparison
    const [hashed, salt] = hashedPassword.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await hash(insertUser.password);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async listUsers(role?: string): Promise<User[]> {
    if (role) {
      return await db.select().from(users).where(eq(users.role, role));
    }
    return await db.select().from(users);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async listCourses(isActive?: boolean): Promise<Course[]> {
    if (isActive !== undefined) {
      return await db.select().from(courses).where(eq(courses.isActive, isActive));
    }
    return await db.select().from(courses);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async updateCourse(id: number, courseUpdate: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db
      .update(courses)
      .set(courseUpdate)
      .where(eq(courses.id, id))
      .returning();
    return course || undefined;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db
      .delete(courses)
      .where(eq(courses.id, id));
    return result.count > 0;
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module || undefined;
  }

  async listModules(courseId: number): Promise<Module[]> {
    return await db.select().from(modules).where(eq(modules.courseId, courseId));
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const [module] = await db
      .insert(modules)
      .values(insertModule)
      .returning();
    return module;
  }

  async updateModule(id: number, moduleUpdate: Partial<InsertModule>): Promise<Module | undefined> {
    const [module] = await db
      .update(modules)
      .set(moduleUpdate)
      .where(eq(modules.id, id))
      .returning();
    return module || undefined;
  }

  async deleteModule(id: number): Promise<boolean> {
    const result = await db
      .delete(modules)
      .where(eq(modules.id, id));
    return result.count > 0;
  }

  async getTest(id: number): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test || undefined;
  }

  async listTests(opts?: {
    courseId?: number;
    isActive?: boolean;
    visibility?: 'public' | 'private';
    testType?: 'formal' | 'practice';
  }): Promise<Test[]> {
    let query = db.select().from(tests);
    
    if (opts) {
      const conditions = [];
      
      if (opts.courseId !== undefined) {
        conditions.push(eq(tests.courseId, opts.courseId));
      }
      
      if (opts.isActive !== undefined) {
        conditions.push(eq(tests.isActive, opts.isActive));
      }
      
      if (opts.visibility !== undefined) {
        conditions.push(eq(tests.visibility, opts.visibility));
      }
      
      if (opts.testType !== undefined) {
        conditions.push(eq(tests.testType, opts.testType));
      }
      
      if (conditions.length === 1) {
        query = query.where(conditions[0]);
      } else if (conditions.length > 1) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query;
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const [test] = await db
      .insert(tests)
      .values(insertTest)
      .returning();
    return test;
  }

  async updateTest(id: number, testUpdate: Partial<InsertTest>): Promise<Test | undefined> {
    const [test] = await db
      .update(tests)
      .set(testUpdate)
      .where(eq(tests.id, id))
      .returning();
    return test || undefined;
  }

  async deleteTest(id: number): Promise<boolean> {
    const result = await db
      .delete(tests)
      .where(eq(tests.id, id));
    return result.count > 0;
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async listQuestions(testId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.testId, testId));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async updateQuestion(id: number, questionUpdate: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db
      .update(questions)
      .set(questionUpdate)
      .where(eq(questions.id, id))
      .returning();
    return question || undefined;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db
      .delete(questions)
      .where(eq(questions.id, id));
    return result.count > 0;
  }

  async getTestAttempt(id: number): Promise<TestAttempt | undefined> {
    const [testAttempt] = await db.select().from(testAttempts).where(eq(testAttempts.id, id));
    return testAttempt || undefined;
  }

  async getTestAttemptsByUser(userId: number): Promise<TestAttempt[]> {
    return await db.select().from(testAttempts).where(eq(testAttempts.userId, userId));
  }

  async getTestAttemptsByTest(testId: number): Promise<TestAttempt[]> {
    return await db.select().from(testAttempts).where(eq(testAttempts.testId, testId));
  }

  async createTestAttempt(insertTestAttempt: InsertTestAttempt): Promise<TestAttempt> {
    const [testAttempt] = await db
      .insert(testAttempts)
      .values(insertTestAttempt)
      .returning();
    return testAttempt;
  }

  async updateTestAttempt(id: number, testAttemptUpdate: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined> {
    const [testAttempt] = await db
      .update(testAttempts)
      .set(testAttemptUpdate)
      .where(eq(testAttempts.id, id))
      .returning();
    return testAttempt || undefined;
  }

  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment || undefined;
  }

  async listEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values(insertEnrollment)
      .returning();
    return enrollment;
  }

  async updateEnrollment(userId: number, courseId: number, enrollmentUpdate: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .update(enrollments)
      .set(enrollmentUpdate)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .returning();
    return enrollment || undefined;
  }

  async deleteEnrollment(userId: number, courseId: number): Promise<boolean> {
    const result = await db
      .delete(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return result.count > 0;
  }

  async getDoubtSession(id: number): Promise<DoubtSession | undefined> {
    const [doubtSession] = await db.select().from(doubtSessions).where(eq(doubtSessions.id, id));
    return doubtSession || undefined;
  }

  async listDoubtSessionsByUser(userId: number): Promise<DoubtSession[]> {
    return await db.select().from(doubtSessions).where(eq(doubtSessions.userId, userId));
  }

  async listDoubtSessionsByTeacher(teacherId: number): Promise<DoubtSession[]> {
    return await db.select().from(doubtSessions).where(eq(doubtSessions.teacherId, teacherId));
  }

  async createDoubtSession(insertDoubtSession: InsertDoubtSession): Promise<DoubtSession> {
    const [doubtSession] = await db
      .insert(doubtSessions)
      .values(insertDoubtSession)
      .returning();
    return doubtSession;
  }

  async updateDoubtSession(id: number, doubtSessionUpdate: Partial<InsertDoubtSession>): Promise<DoubtSession | undefined> {
    const [doubtSession] = await db
      .update(doubtSessions)
      .set(doubtSessionUpdate)
      .where(eq(doubtSessions.id, id))
      .returning();
    return doubtSession || undefined;
  }

  async getStudyTime(id: number): Promise<StudyTime | undefined> {
    const [studyTime] = await db.select().from(studyTimes).where(eq(studyTimes.id, id));
    return studyTime || undefined;
  }

  async listStudyTimesByUser(userId: number): Promise<StudyTime[]> {
    return await db.select().from(studyTimes).where(eq(studyTimes.userId, userId));
  }

  async createStudyTime(insertStudyTime: InsertStudyTime): Promise<StudyTime> {
    const [studyTime] = await db
      .insert(studyTimes)
      .values(insertStudyTime)
      .returning();
    return studyTime;
  }

  async updateStudyTime(id: number, studyTimeUpdate: Partial<InsertStudyTime>): Promise<StudyTime | undefined> {
    const [studyTime] = await db
      .update(studyTimes)
      .set(studyTimeUpdate)
      .where(eq(studyTimes.id, id))
      .returning();
    return studyTime || undefined;
  }

  async getStudentProgress(userId: number): Promise<{courseProgress: number, testPerformance: number, studyTimeThisWeek: number}> {
    // Get all test attempts by the user
    const userAttempts = await this.getTestAttemptsByUser(userId);
    const completedAttempts = userAttempts.filter(attempt => attempt.status === 'completed');
    
    // Calculate average test performance
    const testPerformance = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length
      : 0;
    
    // Get all enrollments for the user
    const userEnrollments = await this.listEnrollmentsByUser(userId);
    
    // Calculate course progress (percentage of courses completed)
    const courseProgress = userEnrollments.length > 0
      ? (userEnrollments.filter(enrollment => enrollment.progress === 100).length / userEnrollments.length) * 100
      : 0;
    
    // Get study time for the week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const userStudyTimes = await this.listStudyTimesByUser(userId);
    const weeklyStudyTimes = userStudyTimes.filter(
      studyTime => new Date(studyTime.date) >= oneWeekAgo
    );
    
    const studyTimeThisWeek = weeklyStudyTimes.reduce(
      (total, studyTime) => total + studyTime.duration, 0
    );
    
    return {
      courseProgress,
      testPerformance,
      studyTimeThisWeek
    };
  }

  async getOverallAnalytics(): Promise<any> {
    // Total counts
    const userCount = (await db.select({ count: count() }).from(users))[0].count;
    const courseCount = (await db.select({ count: count() }).from(courses))[0].count;
    const testCount = (await db.select({ count: count() }).from(tests))[0].count;
    const sessionCount = (await db.select({ count: count() }).from(doubtSessions))[0].count;
    const attemptCount = (await db.select({ count: count() }).from(testAttempts))[0].count;
    
    // Get all completed test attempts for performance calculation
    const allAttempts = await db.select().from(testAttempts).where(eq(testAttempts.status, 'completed'));
    
    // Calculate average score
    const averageScore = allAttempts.length > 0
      ? allAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / allAttempts.length
      : 0;
    
    // Group performance by test type
    const testDetails = await db.select().from(tests);
    const attemptsByType: Record<string, {total: number, score: number}> = {};
    
    for (const attempt of allAttempts) {
      const test = testDetails.find(t => t.id === attempt.testId);
      const testType = test?.type || 'unknown';
      
      if (!attemptsByType[testType]) {
        attemptsByType[testType] = { total: 0, score: 0 };
      }
      
      attemptsByType[testType].total++;
      attemptsByType[testType].score += attempt.score || 0;
    }
    
    const scoresByType = Object.entries(attemptsByType).map(([type, data]) => ({
      type,
      averageScore: data.total > 0 ? data.score / data.total : 0,
      attemptCount: data.total
    }));
    
    // Get course enrollment data
    const allCourses = await db.select().from(courses);
    const courseEnrollments = await Promise.all(
      allCourses.map(async course => {
        const enrollmentCount = (
          await db.select({ count: count() }).from(enrollments).where(eq(enrollments.courseId, course.id))
        )[0].count;
        
        return {
          courseId: course.id,
          courseName: course.title,
          enrollmentCount
        };
      })
    );
    
    // Generate performance over time (last 6 months)
    const performanceData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthAttempts = allAttempts.filter(attempt => {
        const attemptDate = new Date(attempt.completedAt || "");
        return attemptDate >= month && attemptDate <= monthEnd;
      });
      
      const averageScoreForMonth = monthAttempts.length > 0
        ? monthAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / monthAttempts.length
        : 0;
      
      performanceData.push({
        month: month.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
        averageScore: averageScoreForMonth,
        attemptCount: monthAttempts.length
      });
    }
    
    return {
      counts: {
        users: userCount,
        courses: courseCount,
        tests: testCount,
        sessions: sessionCount,
        testAttempts: attemptCount
      },
      testPerformance: {
        averageScore,
        totalAttempts: allAttempts.length,
        scoresByType
      },
      enrollmentData: courseEnrollments,
      performanceOverTime: performanceData
    };
  }

  async getTestAnalytics(testId: number): Promise<any> {
    // Get test details
    const test = await this.getTest(testId);
    if (!test) {
      throw new Error("Test not found");
    }
    
    // Get all attempts for this test
    const testAttemptsList = await this.getTestAttemptsByTest(testId);
    const completedAttempts = testAttemptsList.filter(attempt => attempt.status === 'completed');
    
    // Calculate overall stats
    const totalAttempts = completedAttempts.length;
    const averageScore = totalAttempts > 0
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts
      : 0;
    
    // Get pass rate
    const passingScore = test.passingScore || 60;
    const passedAttempts = completedAttempts.filter(attempt => (attempt.score || 0) >= passingScore);
    const passRate = totalAttempts > 0 ? (passedAttempts.length / totalAttempts) * 100 : 0;
    
    // Get questions for this test
    const testQuestions = await this.listQuestions(testId);
    
    // Calculate difficulty by question (if we had answer data, we would use it here)
    // This is a simplified version
    
    return {
      testId,
      title: test.title,
      totalAttempts,
      averageScore,
      passRate,
      questionCount: testQuestions.length,
      duration: test.duration,
      // Would include more sophisticated analytics with actual answer data
    };
  }

  private isAnswerCorrect(question: Question, answer: any): boolean {
    switch (question.type) {
      case 'mcq':
        return JSON.stringify(question.correctAnswer) === JSON.stringify(answer);
      case 'truefalse':
        return question.correctAnswer === answer;
      case 'fillblank':
        if (Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
          return question.correctAnswer.every((val, idx) => 
            val.toLowerCase() === (answer[idx] || '').toLowerCase()
          );
        }
        return false;
      case 'subjective':
        // Subjective questions would usually be manually graded
        return false;
      default:
        return false;
    }
  }
}

// Import necessary modules for the DatabaseStorage class
import { db } from './db';
import { eq, and, count } from 'drizzle-orm';

// Use the DatabaseStorage implementation instead of MemStorage
export const storage = new DatabaseStorage();
