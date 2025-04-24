import { Express, Request, Response } from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { siteConfig, insertSiteConfigSchema } from '@shared/schema';
import { z } from 'zod';

export function registerSiteConfigRoutes(app: Express) {
  // Public endpoint to get all site configuration
  app.get('/api/site-config', async (req, res) => {
    try {
      const configEntries = await db.select().from(siteConfig);
      
      // Convert array of key-value entries to a single object
      const configObject = configEntries.reduce((acc, entry) => {
        acc[entry.key] = entry.value;
        return acc;
      }, {} as Record<string, any>);
      
      res.json(configObject);
    } catch (error) {
      console.error('Error fetching site configuration:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get a specific configuration value
  app.get('/api/site-config/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const configEntry = await db.query.siteConfig.findFirst({
        where: eq(siteConfig.key, key)
      });
      
      if (!configEntry) {
        return res.status(404).json({ message: 'Configuration not found' });
      }
      
      res.json({ key: configEntry.key, value: configEntry.value });
    } catch (error) {
      console.error(`Error fetching site configuration for key ${req.params.key}:`, error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin endpoint to update a configuration
  app.put('/api/admin/site-config/:key', 
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
        const key = req.params.key;
        const updateSchema = z.object({
          value: z.any(),
        });
        
        const { value } = updateSchema.parse(req.body);
        
        // Check if key exists
        const existingConfig = await db.query.siteConfig.findFirst({
          where: eq(siteConfig.key, key)
        });
        
        if (existingConfig) {
          // Update existing config
          await db.update(siteConfig)
            .set({ value, updatedAt: new Date() })
            .where(eq(siteConfig.key, key));
        } else {
          // Insert new config
          await db.insert(siteConfig).values({
            key,
            value,
            updatedAt: new Date()
          });
        }
        
        res.json({ key, value, updated: true });
      } catch (error) {
        console.error(`Error updating site configuration for key ${req.params.key}:`, error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Invalid data format', errors: error.errors });
        }
        
        res.status(500).json({ message: 'Server error' });
      }
    }
  );
}