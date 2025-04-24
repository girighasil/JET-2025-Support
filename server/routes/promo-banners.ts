import { Express, Request, Response } from 'express';
import { db } from '../db';
import { promoBanners, insertPromoBannerSchema } from '@shared/schema';
import { eq, and, or, gte, lte, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { now } from 'drizzle-orm/sql/expressions';

// Schema for updating a promo banner
const updatePromoBannerSchema = z.object({
  text: z.string().min(5).optional(),
  url: z.string().url().nullish(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(1).optional(),
  startDate: z.string().nullish().transform(val => val ? new Date(val) : null),
  endDate: z.string().nullish().transform(val => val ? new Date(val) : null),
});

/**
 * Register routes for promotional banners
 */
export function registerPromoBannerRoutes(app: Express) {
  /**
   * Get active promotional banners for public display
   */
  app.get('/api/promo-banners', async (req: Request, res: Response) => {
    try {
      const now = new Date();
      
      // Get banners that are active and within their date range (if specified)
      const activeBanners = await db
        .select()
        .from(promoBanners)
        .where(
          and(
            eq(promoBanners.isActive, true),
            or(
              // No start date specified or start date is in the past
              or(
                sql`${promoBanners.startDate} IS NULL`,
                lte(promoBanners.startDate, now)
              ),
              // No end date specified or end date is in the future
              or(
                sql`${promoBanners.endDate} IS NULL`,
                gte(promoBanners.endDate, now)
              )
            )
          )
        )
        .orderBy(promoBanners.order);
      
      res.json(activeBanners);
    } catch (error) {
      console.error('Error fetching promotional banners:', error);
      res.status(500).json({ message: 'Failed to fetch promotional banners' });
    }
  });

  /**
   * Admin: Get all promotional banners (for management)
   */
  app.get('/api/admin/promo-banners', async (req: Request, res: Response) => {
    try {
      // Require admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can access this endpoint' });
      }
      
      const allBanners = await db
        .select()
        .from(promoBanners)
        .orderBy(promoBanners.order);
      
      res.json(allBanners);
    } catch (error) {
      console.error('Error fetching all promotional banners:', error);
      res.status(500).json({ message: 'Failed to fetch promotional banners' });
    }
  });

  /**
   * Admin: Get a specific promotional banner by ID
   */
  app.get('/api/admin/promo-banners/:id', async (req: Request, res: Response) => {
    try {
      // Require admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can access this endpoint' });
      }
      
      const { id } = req.params;
      const banner = await db
        .select()
        .from(promoBanners)
        .where(eq(promoBanners.id, parseInt(id, 10)))
        .limit(1);
      
      if (!banner.length) {
        return res.status(404).json({ message: `Banner with ID ${id} not found` });
      }
      
      res.json(banner[0]);
    } catch (error) {
      console.error(`Error fetching banner with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch promotional banner' });
    }
  });

  /**
   * Admin: Create a new promotional banner
   */
  app.post('/api/admin/promo-banners', async (req: Request, res: Response) => {
    try {
      // Require admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can create promotional banners' });
      }
      
      const parseResult = insertPromoBannerSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid request body', errors: parseResult.error.errors });
      }
      
      const bannerData = parseResult.data;
      
      const result = await db.insert(promoBanners).values(bannerData).returning();
      
      res.status(201).json({
        message: 'Promotional banner created successfully',
        banner: result[0],
      });
    } catch (error) {
      console.error('Error creating promotional banner:', error);
      res.status(500).json({ message: 'Failed to create promotional banner' });
    }
  });

  /**
   * Admin: Update a promotional banner
   */
  app.put('/api/admin/promo-banners/:id', async (req: Request, res: Response) => {
    try {
      // Require admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can update promotional banners' });
      }
      
      const { id } = req.params;
      const parseResult = updatePromoBannerSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid request body', errors: parseResult.error.errors });
      }
      
      const bannerData = parseResult.data;
      
      // Check if banner exists
      const existingBanner = await db
        .select()
        .from(promoBanners)
        .where(eq(promoBanners.id, parseInt(id, 10)))
        .limit(1);
      
      if (!existingBanner.length) {
        return res.status(404).json({ message: `Banner with ID ${id} not found` });
      }
      
      // Update banner
      const result = await db
        .update(promoBanners)
        .set(bannerData)
        .where(eq(promoBanners.id, parseInt(id, 10)))
        .returning();
      
      res.json({
        message: 'Promotional banner updated successfully',
        banner: result[0],
      });
    } catch (error) {
      console.error(`Error updating banner with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to update promotional banner' });
    }
  });

  /**
   * Admin: Delete a promotional banner
   */
  app.delete('/api/admin/promo-banners/:id', async (req: Request, res: Response) => {
    try {
      // Require admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can delete promotional banners' });
      }
      
      const { id } = req.params;
      
      const result = await db
        .delete(promoBanners)
        .where(eq(promoBanners.id, parseInt(id, 10)));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: `Banner with ID ${id} not found` });
      }
      
      res.json({ message: 'Promotional banner deleted successfully' });
    } catch (error) {
      console.error(`Error deleting banner with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to delete promotional banner' });
    }
  });
}