import { hash } from '../server/storage';
import { db } from '../server/db';
import { users, courses, modules, tests, questions } from '../shared/schema';

async function seedDatabase() {
  console.log('Seeding database with initial data...');
  
  try {
    // Check if we already have users
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      console.log('Database already has users, skipping seeding');
      process.exit(0);
    }
    
    // Create admin user
    const adminPassword = await hash('admin123');
    await db.insert(users).values({
      username: 'admin',
      password: adminPassword,
      email: 'admin@mathsmagic.com',
      fullName: 'Admin User',
      role: 'admin',
      avatar: null,
      createdAt: new Date()
    });
    console.log('Created admin user (username: admin, password: admin123)');
    
    // Create teacher user
    const teacherPassword = await hash('teacher123');
    await db.insert(users).values({
      username: 'teacher',
      password: teacherPassword,
      email: 'teacher@mathsmagic.com',
      fullName: 'Teacher User',
      role: 'teacher',
      avatar: null,
      createdAt: new Date()
    });
    console.log('Created teacher user (username: teacher, password: teacher123)');
    
    // Create student user
    const studentPassword = await hash('student123');
    await db.insert(users).values({
      username: 'student',
      password: studentPassword,
      email: 'student@mathsmagic.com',
      fullName: 'Student User',
      role: 'student',
      avatar: null,
      createdAt: new Date()
    });
    console.log('Created student user (username: student, password: student123)');
    
    // Create a sample course
    const [course] = await db.insert(courses).values({
      title: 'Algebra Fundamentals',
      description: 'Learn the basics of algebra with this comprehensive course',
      category: 'Mathematics',
      thumbnail: null,
      createdBy: 1, // Admin user
      isActive: true,
      createdAt: new Date()
    }).returning();
    console.log('Created sample course: Algebra Fundamentals');
    
    // Create sample modules
    await db.insert(modules).values([
      {
        title: 'Introduction to Algebra',
        description: 'Learn the basic concepts of algebra',
        courseId: course.id,
        sortOrder: 1,
        content: 'Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols.',
        createdAt: new Date()
      },
      {
        title: 'Linear Equations',
        description: 'Solving linear equations step by step',
        courseId: course.id,
        sortOrder: 2,
        content: 'A linear equation is an equation that may be put in the form a*x + b = 0, where a and b are constants.',
        createdAt: new Date()
      }
    ]);
    console.log('Created sample modules for the Algebra course');
    
    // Create a sample test
    const [test] = await db.insert(tests).values({
      title: 'Algebra Basics Test',
      description: 'Test your understanding of basic algebra concepts',
      courseId: course.id,
      createdBy: 1, // Admin user
      isActive: true,
      duration: 30,
      passingScore: 70,
      scheduledFor: null,
      createdAt: new Date()
    }).returning();
    console.log('Created sample test: Algebra Basics Test');
    
    // Create sample questions
    await db.insert(questions).values([
      {
        testId: test.id,
        question: 'What is the value of x in the equation 2x + 3 = 9?',
        type: 'mcq',
        sortOrder: 1,
        options: JSON.stringify(['1', '2', '3', '4']),
        correctAnswer: JSON.stringify('3'),
        points: 10,
        explanation: 'To solve, subtract 3 from both sides, then divide by 2: 2x = 6, so x = 3',
        createdAt: new Date()
      },
      {
        testId: test.id,
        question: 'Is the equation y = 2x + 1 a linear equation?',
        type: 'truefalse',
        sortOrder: 2,
        options: JSON.stringify(['True', 'False']),
        correctAnswer: JSON.stringify('True'),
        points: 5,
        explanation: 'Yes, it is a linear equation as it can be written in the form y = mx + b',
        createdAt: new Date()
      }
    ]);
    console.log('Created sample questions for the Algebra test');
    
    console.log('Database seeding complete!');
    console.log('You can now log in with the following credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Teacher: username=teacher, password=teacher123');
    console.log('Student: username=student, password=student123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedDatabase();