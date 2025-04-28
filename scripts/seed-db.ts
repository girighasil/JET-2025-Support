import { db } from '../server/db';
import { users, courses, tests, modules } from '../shared/schema';
import { hash } from '../server/storage-impl';

async function seedDatabase() {
  console.log('Seeding database...');
  
  // Create admin user
  const adminPassword = await hash('admin123');
  await db.insert(users).values({
    username: 'admin',
    password: adminPassword,
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    mobileNumber: '1234567890',
    createdAt: new Date(),
  }).onConflictDoNothing();
  
  // Create teacher user
  const teacherPassword = await hash('teacher123');
  await db.insert(users).values({
    username: 'teacher',
    password: teacherPassword,
    fullName: 'Teacher User',
    email: 'teacher@example.com',
    role: 'teacher',
    mobileNumber: '2345678901',
    createdAt: new Date(),
  }).onConflictDoNothing();
  
  // Create student user
  const studentPassword = await hash('student123');
  await db.insert(users).values({
    username: 'student',
    password: studentPassword,
    fullName: 'Student User',
    email: 'student@example.com',
    role: 'student',
    mobileNumber: '3456789012',
    createdAt: new Date(),
  }).onConflictDoNothing();
  
  // Create a sample course
  const [course] = await db.insert(courses).values({
    title: 'Mathematics Fundamentals',
    description: 'A comprehensive course covering essential mathematics concepts',
    category: 'Mathematics',
    createdBy: 2, // teacher user id
    isActive: true,
    createdAt: new Date(),
  }).returning().onConflictDoNothing();
  
  if (course) {
    // Create sample modules
    await db.insert(modules).values({
      title: 'Algebra Basics',
      content: 'Introduction to algebraic expressions and equations',
      courseId: course.id,
      sortOrder: 1,
      createdAt: new Date(),
    }).onConflictDoNothing();
    
    await db.insert(modules).values({
      title: 'Geometry Fundamentals',
      content: 'Basic geometric shapes and their properties',
      courseId: course.id,
      sortOrder: 2,
      createdAt: new Date(),
    }).onConflictDoNothing();
    
    // Create sample tests
    await db.insert(tests).values({
      title: 'Algebra Practice Test',
      description: 'Test your algebra skills with this practice test',
      duration: 60, // 60 minutes
      passingScore: 70,
      createdBy: 2, // teacher user id
      courseId: course.id,
      isActive: true,
      testType: 'practice',
      visibility: 'public',
      createdAt: new Date(),
    }).onConflictDoNothing();
    
    await db.insert(tests).values({
      title: 'Geometry Formal Assessment',
      description: 'Formal assessment for geometry concepts',
      duration: 90, // 90 minutes
      passingScore: 75,
      createdBy: 2, // teacher user id
      courseId: course.id,
      isActive: true,
      testType: 'formal',
      visibility: 'private',
      createdAt: new Date(),
    }).onConflictDoNothing();
  }
  
  console.log('Database seeded successfully!');
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });