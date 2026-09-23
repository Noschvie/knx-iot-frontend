/**
 * BFF REST Routes for Raffstore API
 */

import express, { Router, Request, Response } from 'express';
import { RaffstoreService } from '../services/raffstore.service';
import { BFFResponse } from '../models';

export function createRaffstoreRouter(raffstoreService: RaffstoreService): Router {
  const router = express.Router();

  /**
   * GET /raffstores
   * Returns all raffstores
   */
  router.get('/raffstores', (req: Request, res: Response) => {
    try {
      const raffstores = raffstoreService.getRaffstores();
      const response: BFFResponse = {
        success: true,
        data: raffstores,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error getting raffstores:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * GET /raffstores/:id
   * Returns a single raffstore
   */
  router.get('/raffstores/:id', (req: Request, res: Response) => {
    try {
      const raffstore = raffstoreService.getRaffstore(req.params.id as string);
      if (!raffstore) {
        return res.status(404).json({
          success: false,
          error: `Raffstore not found: ${req.params.id as string}`,
          timestamp: Date.now()
        });
      }

      const response: BFFResponse = {
        success: true,
        data: raffstore,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error getting raffstore:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * POST /raffstores/:id/moveUp
   * Move raffstore up
   */
  router.post('/raffstores/:id/moveUp', async (req: Request, res: Response) => {
    try {
      await raffstoreService.moveUp(req.params.id as string);
      const raffstore = raffstoreService.getRaffstore(req.params.id as string);
      const response: BFFResponse = {
        success: true,
        data: raffstore,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error moveUp:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * POST /raffstores/:id/moveDown
   * Move raffstore down
   */
  router.post('/raffstores/:id/moveDown', async (req: Request, res: Response) => {
    try {
      await raffstoreService.moveDown(req.params.id as string);
      const raffstore = raffstoreService.getRaffstore(req.params.id as string);
      const response: BFFResponse = {
        success: true,
        data: raffstore,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error moveDown:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * POST /raffstores/:id/stop
   * Stop raffstore
   */
  router.post('/raffstores/:id/stop', async (req: Request, res: Response) => {
    try {
      await raffstoreService.stop(req.params.id as string);
      const raffstore = raffstoreService.getRaffstore(req.params.id as string);
      const response: BFFResponse = {
        success: true,
        data: raffstore,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error stop:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * PUT /raffstores/:id/height
   * Set height step
   * Body: { heightStep: number }
   */
  router.put('/raffstores/:id/height', async (req: Request, res: Response) => {
    try {
      const { heightStep } = req.body;
      if (heightStep === undefined || typeof heightStep !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid heightStep',
          timestamp: Date.now()
        });
      }

      await raffstoreService.setHeight(req.params.id as string, heightStep);
      const raffstore = raffstoreService.getRaffstore(req.params.id as string);
      const response: BFFResponse = {
        success: true,
        data: raffstore,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error setHeight:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * PUT /raffstores/:id/angle
   * Set angle step
   * Body: { angleStep: number }
   */
  router.put('/raffstores/:id/angle', async (req: Request, res: Response) => {
    try {
      const { angleStep } = req.body;
      if (angleStep === undefined || typeof angleStep !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid angleStep',
          timestamp: Date.now()
        });
      }

      await raffstoreService.setAngle(req.params.id as string, angleStep);
      const raffstore = raffstoreService.getRaffstore(req.params.id as string);
      const response: BFFResponse = {
        success: true,
        data: raffstore,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error setAngle:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * PUT /raffstores/:id/position
   * Set position (height + angle)
   * Body: { heightStep: number, angleStep: number }
   */
  router.put('/raffstores/:id/position', async (req: Request, res: Response) => {
    try {
      const { heightStep, angleStep } = req.body;
      if (heightStep === undefined || angleStep === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing heightStep or angleStep',
          timestamp: Date.now()
        });
      }

      await raffstoreService.setPosition(req.params.id as string, heightStep, angleStep);
      const raffstore = raffstoreService.getRaffstore(req.params.id as string);
      const response: BFFResponse = {
        success: true,
        data: raffstore,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error setPosition:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * POST /raffstores/:id/favorite
   * Apply favorite
   * Body: { favorite: Favorite }
   */
  router.post('/raffstores/:id/favorite', async (req: Request, res: Response) => {
    try {
      const { favorite } = req.body;
      if (!favorite || favorite.heightStep === undefined || favorite.angleStep === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid favorite',
          timestamp: Date.now()
        });
      }

      await raffstoreService.applyFavorite(req.params.id as string, favorite);
      const raffstore = raffstoreService.getRaffstore(req.params.id as string);
      const response: BFFResponse = {
        success: true,
        data: raffstore,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error applyFavorite:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * POST /raffstores/group/:floor/:direction
   * Group command for all raffstores on a floor
   * Params: floor (EG|OG), direction (up|down)
   */
  router.post('/raffstores/group/:floor/:direction', async (req: Request, res: Response) => {
    try {
      const floor = req.params.floor as 'EG' | 'OG';
      const direction = req.params.direction as 'up' | 'down';

      if (!['EG', 'OG'].includes(floor)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid floor: must be EG or OG',
          timestamp: Date.now()
        });
      }

      if (!['up', 'down'].includes(direction)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid direction: must be up or down',
          timestamp: Date.now()
        });
      }

      await raffstoreService.groupCommand(floor, direction);
      const raffstores = raffstoreService.getRaffstores();
      const response: BFFResponse = {
        success: true,
        data: raffstores,
        timestamp: Date.now()
      };
      res.json(response);
    } catch (error) {
      console.error('[API] Error groupCommand:', error);
      res.status(500).json({
        success: false,
        error: String(error),
        timestamp: Date.now()
      });
    }
  });

  /**
   * GET /raffstores/events
   * Get recent events (SSE - Server-Sent Events)
   */
  router.get('/raffstores/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const unsubscribe = raffstoreService.onEvent((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
      res.end();
    });
  });

  return router;
}
