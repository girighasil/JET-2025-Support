import { db } from './db';
import { eq, desc } from 'drizzle-orm';
import { notifications, Notification, InsertNotification } from '@shared/schema';

/**
 * Get a notification by ID
 */
export async function getNotification(
  id: number
): Promise<Notification | undefined> {
  const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
  return notification;
}

/**
 * List all notifications for a user, sorted by most recent first
 */
export async function listNotificationsByUser(
  userId: number
): Promise<Notification[]> {
  const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
  
  return userNotifications;
}

/**
 * List unread notifications for a user, sorted by most recent first
 */
export async function listUnreadNotificationsByUser(
  userId: number
): Promise<Notification[]> {
  const unreadNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .where(eq(notifications.isRead, false))
    .orderBy(desc(notifications.createdAt));
  
  return unreadNotifications;
}

/**
 * Create a new notification
 */
export async function createNotification(
  insertNotification: InsertNotification
): Promise<{ notification: Notification, newId: number }> {
  // Insert the notification
  const [result] = await db
    .insert(notifications)
    .values(insertNotification)
    .returning();
  
  const newId = result.id;
  
  // Now query for the complete notification to return
  const notification: Notification = {
    id: newId,
    userId: insertNotification.userId,
    title: insertNotification.title,
    message: insertNotification.message,
    type: insertNotification.type,
    resourceId: insertNotification.resourceId || null,
    resourceType: insertNotification.resourceType || null,
    isRead: false,
    createdAt: new Date()
  };
  
  return { notification, newId };
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  id: number
): Promise<Notification | undefined> {
  const [updatedNotification] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();
  
  return updatedNotification;
}

/**
 * Mark all notifications as read for a user
 * Returns the number of notifications marked as read
 */
export async function markAllNotificationsAsRead(
  userId: number
): Promise<number> {
  const result = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId))
    .where(eq(notifications.isRead, false));
  
  // Return the count of affected rows
  return result.rowCount || 0;
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  id: number
): Promise<boolean> {
  const result = await db
    .delete(notifications)
    .where(eq(notifications.id, id));
  
  return result.rowCount ? result.rowCount > 0 : false;
}