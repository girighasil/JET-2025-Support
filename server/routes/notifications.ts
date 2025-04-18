import { Router } from "express";
import { storage } from "../storage";
import { ZodError } from "zod";
import { insertNotificationSchema } from "@shared/schema";

const router = Router();

// Get all notifications for the current user
router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    const userId = req.user!.id;
    const notifications = await storage.listNotificationsByUser(userId);
    return res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Get all unread notifications for the current user
router.get("/unread", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    const userId = req.user!.id;
    const notifications = await storage.listUnreadNotificationsByUser(userId);
    return res.json(notifications);
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return res.status(500).json({ message: "Failed to fetch unread notifications" });
  }
});

// Mark a notification as read
router.patch("/:id/read", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // First, check if the notification belongs to the user
    const notification = await storage.getNotification(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Cannot mark notification as read: it belongs to another user" });
    }
    
    const updatedNotification = await storage.markNotificationAsRead(notificationId);
    return res.json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read for the current user
router.post("/mark-all-read", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    const userId = req.user!.id;
    const count = await storage.markAllNotificationsAsRead(userId);
    return res.json({ message: `Marked ${count} notifications as read` });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

// Delete a notification
router.delete("/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // First, check if the notification belongs to the user
    const notification = await storage.getNotification(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Cannot delete notification: it belongs to another user" });
    }
    
    await storage.deleteNotification(notificationId);
    return res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

// Create a notification (admin/teacher only)
router.post("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  // Only admins and teachers can create notifications
  if (req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
    return res.status(403).json({ message: "Only admins and teachers can create notifications" });
  }
  
  try {
    const notificationData = insertNotificationSchema.parse(req.body);
    const notification = await storage.createNotification(notificationData);
    return res.status(201).json(notification);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Invalid notification data", 
        errors: error.errors 
      });
    }
    
    console.error("Error creating notification:", error);
    return res.status(500).json({ message: "Failed to create notification" });
  }
});

export default router;