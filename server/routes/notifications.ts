import { Express, Request, Response } from "express";
import { storage } from "../storage-impl";
import { notifications } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "../db";

export const registerNotificationRoutes = (app: Express) => {
  // Check if the user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Not authenticated" });
  };

  // Get all notifications for the current user
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      });

      return res.json(userNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get unread notifications for the current user
  app.get("/api/notifications/unread", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const unreadNotifications = await db.query.notifications.findMany({
        where: (notifications, { and, eq }) =>
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
          ),
        orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      });

      return res.json(unreadNotifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get count of unread notifications for the current user
  app.get(
    "/api/notifications/unread/count",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.user!.id;

        // Use the query builder pattern which seems to work reliably in other routes
        const unreadNotifications = await db.query.notifications.findMany({
          where: (notifications, { and, eq }) =>
            and(
              eq(notifications.userId, userId),
              eq(notifications.isRead, false),
            ),
        });

        return res.json({ count: unreadNotifications.length });
      } catch (error) {
        console.error("Error in unread count endpoint:", error);
        // Return 0 as a fallback to prevent UI errors
        return res.json({ count: 0 });
      }
    },
  );

  // Mark notification as read
  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);

      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId));

      // Check if notification exists and belongs to the user
      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Update notification
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));

      return res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Mark all notifications as read
  app.put("/api/notifications/all/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Update all notifications for the user
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
          ),
        );

      return res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Create a notification (for testing purposes)
  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { userId, title, message, type, relatedId } =
        req.body;

      const [createdNotification] = await db
        .insert(notifications)
        .values({
          userId,
          title,
          message,
          type,
          relatedId,
          isRead: false,
          createdAt: new Date(),
        })
        .returning();

      return res.status(201).json(createdNotification);
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
};
