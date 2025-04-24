import { Express, Request, Response } from 'express';
import { db } from '../db';
import { eq, desc } from 'drizzle-orm';
import { promoBanners, insertPromoBannerSchema } from '@shared/schema';
import { z } from 'zod';

export function registerPromoBannerRoutes(app: Express) {
  // Public endpoint to get active promotional banners
  app.get('/api/promo-banners', async (req, res) => {
    try {
      const now = new Date();
      
      // Get all active banners that are either not date-limited or within date range
      const banners = await db.select()
        .from(promoBanners)
        .where(eq(promoBanners.isActive, true))
        .orderBy(promoBanners.order);
      
      // Filter by date range in JavaScript to handle complex logic better
      const activeBanners = banners.filter(banner => {
        // If no date restrictions, always show
        if (!banner.startDate && !banner.endDate) {
          return true;
        }
        
        // Check start date if exists
        if (banner.startDate && new Date(banner.startDate) > now) {
          return false;
        }
        
        // Check end date if exists
        if (banner.endDate && new Date(banner.endDate) < now) {
          return false;
        }
        
        return true;
      });
      
      res.json(activeBanners);
    } catch (error) {
      console.error('Error fetching promotional banners:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin endpoint to get all promotional banners (including inactive)
  app.get('/api/admin/promo-banners', 
    (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    },
    async (req, res) => {
      try {
        const banners = await db.select()
          .from(promoBanners)
          .orderBy(promoBanners.order);
        
        res.json(banners);
      } catch (error) {
        console.error('Error fetching all promotional banners:', error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  );

  // Admin endpoint to create a new promotional banner
  app.post('/api/admin/promo-banners', 
    (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    },
    async (req, res) => {
      try {
        const bannerData = insertPromoBannerSchema.parse(req.body);
        
        const [newBanner] = await db.insert(promoBanners)
          .values(bannerData)
          .returning();
        
        res.status(201).json(newBanner);
      } catch (error) {
        console.error('Error creating promotional banner:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
        }
        
        res.status(500).json({ message: 'Server error' });
      }
    }
  );

  // Admin endpoint to update a promotional banner
  app.put('/api/admin/promo-banners/:id', 
    (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    },
    async (req, res) => {
      try {
        const bannerId = parseInt(req.params.id);
        
        // Allow partial updates
        const bannerData = insertPromoBannerSchema.partial().parse(req.body);
        
        const [updatedBanner] = await db.update(promoBanners)
          .set(bannerData)
          .where(eq(promoBanners.id, bannerId))
          .returning();
        
        if (!updatedBanner) {
          return res.status(404).json({ message: 'Banner not found' });
        }
        
        res.json(updatedBanner);
      } catch (error) {
        console.error(`Error updating promotional banner ${req.params.id}:`, error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
        }
        
        res.status(500).json({ message: 'Server error' });
      }
    }
  );

  // Admin endpoint to delete a promotional banner
  app.delete('/api/admin/promo-banners/:id', 
    (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    },
    async (req, res) => {
      try {
        const bannerId = parseInt(req.params.id);
        
        const [deletedBanner] = await db.delete(promoBanners)
          .where(eq(promoBanners.id, bannerId))
          .returning();
        
        if (!deletedBanner) {
          return res.status(404).json({ message: 'Banner not found' });
        }
        
        res.json({ message: 'Banner deleted successfully', id: bannerId });
      } catch (error) {
        console.error(`Error deleting promotional banner ${req.params.id}:`, error);
        res.status(500).json({ message: 'Server error' });
      }
    }
  );
}