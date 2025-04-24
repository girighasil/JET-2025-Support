import { Express, Request, Response } from 'express';
import { db } from '../db';
import { siteConfig, insertSiteConfigSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema for updating site config
const updateSiteConfigSchema = z.object({
  value: z.any(),
});

/**
 * Register routes for site configuration
 */
export function registerSiteConfigRoutes(app: Express) {
  /**
   * Get all site configurations
   */
  app.get('/api/site-config', async (req: Request, res: Response) => {
    try {
      const allConfigs = await db.select().from(siteConfig);
      
      // Transform array of configs into a single object
      const configObject: Record<string, any> = {};
      
      for (const config of allConfigs) {
        configObject[config.key] = config.value;
      }
      
      // Merge all configuration objects into a single object
      const merged = {
        ...configObject.siteSettings,
        examInfo: configObject.examInfo,
        ...configObject.contactAndSocial
      };
      
      res.json(merged);
    } catch (error) {
      console.error('Error fetching site config:', error);
      res.status(500).json({ message: 'Failed to fetch site configuration' });
    }
  });

  /**
   * Get a specific site configuration by key
   */
  app.get('/api/site-config/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const config = await db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, key))
        .limit(1);
      
      if (!config.length) {
        return res.status(404).json({ message: `Configuration with key '${key}' not found` });
      }
      
      res.json(config[0].value);
    } catch (error) {
      console.error(`Error fetching site config for key '${req.params.key}':`, error);
      res.status(500).json({ message: 'Failed to fetch site configuration' });
    }
  });

  /**
   * Create or update a site configuration
   * Admin only endpoint
   */
  app.put('/api/site-config/:key', async (req: Request, res: Response) => {
    try {
      // Require admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can update site configuration' });
      }
      
      const { key } = req.params;
      const parseResult = updateSiteConfigSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid request body', errors: parseResult.error.errors });
      }
      
      const { value } = parseResult.data;
      
      // Check if config already exists
      const existingConfig = await db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, key))
        .limit(1);
      
      if (existingConfig.length) {
        // Update existing config
        await db
          .update(siteConfig)
          .set({ value, updatedAt: new Date() })
          .where(eq(siteConfig.key, key));
        
        return res.json({ message: `Configuration '${key}' updated successfully` });
      } else {
        // Create new config
        await db.insert(siteConfig).values({
          key,
          value,
        });
        
        return res.status(201).json({ message: `Configuration '${key}' created successfully` });
      }
    } catch (error) {
      console.error(`Error updating site config for key '${req.params.key}':`, error);
      res.status(500).json({ message: 'Failed to update site configuration' });
    }
  });

  /**
   * Delete a site configuration
   * Admin only endpoint
   */
  app.delete('/api/site-config/:key', async (req: Request, res: Response) => {
    try {
      // Require admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only administrators can delete site configuration' });
      }
      
      const { key } = req.params;
      
      const result = await db
        .delete(siteConfig)
        .where(eq(siteConfig.key, key));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: `Configuration with key '${key}' not found` });
      }
      
      res.json({ message: `Configuration '${key}' deleted successfully` });
    } catch (error) {
      console.error(`Error deleting site config for key '${req.params.key}':`, error);
      res.status(500).json({ message: 'Failed to delete site configuration' });
    }
  });
}