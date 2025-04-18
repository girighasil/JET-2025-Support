import { db } from '../server/db';
import { notifications } from '../shared/schema';

async function main() {
  const args = process.argv.slice(2);
  const userId = parseInt(args[0] || '1'); // Default to user ID 1 if none provided
  
  if (isNaN(userId)) {
    console.error('Please provide a valid user ID as the first argument');
    process.exit(1);
  }
  
  try {
    // Create test notifications
    await db.insert(notifications).values([
      {
        userId,
        title: 'New Course Available',
        message: 'A new course "Advanced Algebra" has been added to your enrolled courses.',
        type: 'course_update',
        resourceId: 1, // Assumes course ID 1 exists
        resourceType: 'course',
        isRead: false,
        createdAt: new Date()
      },
      {
        userId,
        title: 'Test Coming Up',
        message: 'You have a test scheduled for tomorrow. Good luck!',
        type: 'test_update',
        resourceId: 1, // Assumes test ID 1 exists
        resourceType: 'test',
        isRead: false,
        createdAt: new Date()
      },
      {
        userId,
        title: 'System Maintenance',
        message: 'The platform will be under maintenance from 2-3 AM tonight.',
        type: 'system',
        isRead: false,
        createdAt: new Date()
      }
    ]);
    
    console.log(`Successfully created 3 test notifications for user ID ${userId}`);
    
  } catch (error) {
    console.error('Error creating test notifications:', error);
  } finally {
    process.exit(0);
  }
}

main();