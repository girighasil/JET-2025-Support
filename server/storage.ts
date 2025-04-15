import {
  users, User, InsertUser,
  courses, Course, InsertCourse,
  modules, Module, InsertModule, 
  tests, Test, InsertTest,
  questions, Question, InsertQuestion,
  testAttempts, TestAttempt, InsertTestAttempt,
  enrollments, Enrollment, InsertEnrollment,
  doubtSessions, DoubtSession, InsertDoubtSession,
  studyTimes, StudyTime, InsertStudyTime
} from "@shared/schema";
import { hash, compare } from "./utils";

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
  
  private currentIds: {
    users: number;
    courses: number;
    modules: number;
    tests: number;
    questions: number;
    testAttempts: number;
    doubtSessions: number;
    studyTimes: number;
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
    
    this.currentIds = {
      users: 1,
      courses: 1,
      modules: 1,
      tests: 1,
      questions: 1,
      testAttempts: 1,
      doubtSessions: 1,
      studyTimes: 1
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
  
  async listTests(courseId?: number, isActive?: boolean): Promise<Test[]> {
    let tests = Array.from(this.tests.values());
    
    if (courseId !== undefined) {
      tests = tests.filter(test => test.courseId === courseId);
    }
    
    if (isActive !== undefined) {
      tests = tests.filter(test => test.isActive === isActive);
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
export async function hash(password: string): Promise<string> {
  // In a real application, use bcrypt or similar
  // This is just a simple mock for the in-memory storage
  return `hashed_${password}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return hashedPassword === `hashed_${password}`;
}

export const storage = new MemStorage();
