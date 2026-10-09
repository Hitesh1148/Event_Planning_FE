import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const createItinerarySchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string(), // e.g. "19:00"
  endTime: z.string().optional(),
  location: z.string().optional(),
  responsibleMemberId: z.string().optional(),
  notes: z.string().optional(),
  orderIndex: z.number().int().default(0)
});

// List itinerary
router.get('/events/:eventId/itinerary', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const items = await prisma.itineraryItem.findMany({
      where: { eventId: req.params.eventId },
      orderBy: [{ startTime: 'asc' }, { orderIndex: 'asc' }]
    });

    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve itinerary items.' });
  }
});

// Create itinerary item
router.post('/events/:eventId/itinerary', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createItinerarySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const item = await prisma.itineraryItem.create({
      data: {
        eventId: req.params.eventId,
        ...parsed.data
      }
    });

    await prisma.decisionHistory.create({
      data: {
        eventId: req.params.eventId,
        actorId: req.user!.id,
        actionType: 'ITINERARY_ITEM_ADDED',
        entityType: 'ItineraryItem',
        entityId: item.id,
        details: JSON.stringify({ title: item.title, startTime: item.startTime, location: item.location })
      }
    });

    res.status(201).json({ item, message: 'Itinerary step added.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create itinerary item.' });
  }
});

// Update itinerary item
router.patch('/itinerary/:itemId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { title, description, startTime, endTime, location, notes, responsibleMemberId, orderIndex } = req.body;

    const updated = await prisma.itineraryItem.update({
      where: { id: itemId },
      data: {
        title,
        description,
        startTime,
        endTime,
        location,
        notes,
        responsibleMemberId,
        orderIndex
      }
    });

    res.json({ item: updated, message: 'Itinerary step updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update itinerary item.' });
  }
});

// Delete itinerary item
router.delete('/itinerary/:itemId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    await prisma.itineraryItem.delete({ where: { id: itemId } });
    res.json({ message: 'Itinerary item deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete itinerary item.' });
  }
});

export default router;
