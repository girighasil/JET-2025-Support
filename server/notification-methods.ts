import { Notification, InsertNotification } from "@shared/schema";

export async function getNotification(
  notifications: Map<number, Notification>,
  id: number
): Promise<Notification | undefined> {
  return notifications.get(id);
}

export async function listNotificationsByUser(
  notifications: Map<number, Notification>,
  userId: number
): Promise<Notification[]> {
  return Array.from(notifications.values())
    .filter(notification => notification.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
}

export async function listUnreadNotificationsByUser(
  notifications: Map<number, Notification>,
  userId: number
): Promise<Notification[]> {
  return Array.from(notifications.values())
    .filter(notification => notification.userId === userId && !notification.isRead)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
}

export async function createNotification(
  notifications: Map<number, Notification>,
  currentId: number,
  insertNotification: InsertNotification
): Promise<{ notification: Notification, newId: number }> {
  const id = currentId;
  const now = new Date();
  
  const notification: Notification = {
    ...insertNotification,
    id,
    isRead: false,
    createdAt: now
  };
  
  notifications.set(id, notification);
  return { notification, newId: currentId + 1 };
}

export async function markNotificationAsRead(
  notifications: Map<number, Notification>,
  id: number
): Promise<Notification | undefined> {
  const notification = notifications.get(id);
  if (!notification) return undefined;
  
  const updatedNotification = { ...notification, isRead: true };
  notifications.set(id, updatedNotification);
  return updatedNotification;
}

export async function markAllNotificationsAsRead(
  notifications: Map<number, Notification>,
  userId: number
): Promise<number> {
  let count = 0;
  
  Array.from(notifications.entries())
    .filter(([_, notification]) => notification.userId === userId && !notification.isRead)
    .forEach(([id, notification]) => {
      notifications.set(id, { ...notification, isRead: true });
      count++;
    });
  
  return count;
}

export async function deleteNotification(
  notifications: Map<number, Notification>,
  id: number
): Promise<boolean> {
  return notifications.delete(id);
}