import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const availabilityEntrySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  timeSlot: z.string(), // e.g. "19:00 - 22:00"
  status: z.enum(['AVAILABLE', 'IF_NEEDED', 'UNAVAILABLE']).default('AVAILABLE')
});

const saveAvailabilitySchema = z.object({
  slots: z.array(availabilityEntrySchema)
});

// Get availability overview & matrix
router.get('/events/:eventId/availability', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const availabilities = await prisma.memberAvailability.findMany({
      where: { eventId: req.params.eventId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    const event = await prisma.event.findUnique({
      where: { id: req.params.eventId },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true } } }
            }
          }
        }
      }
    });

    const totalGroupMembers = event?.group.members.length || 0;

    // Calculate matrix by slot key (date + timeSlot)
    const matrix: Record<string, {
      date: string;
      timeSlot: string;
      availableCount: number;
      ifNeededCount: number;
      unavailableCount: number;
      availableUsers: { id: string; name: string }[];
      overlapPercentage: number;
    }> = {};

    for (const a of availabilities) {
      const key = `${a.date}_${a.timeSlot}`;
      if (!matrix[key]) {
        matrix[key] = {
          date: a.date,
          timeSlot: a.timeSlot,
          availableCount: 0,
          ifNeededCount: 0,
          unavailableCount: 0,
          availableUsers: [],
          overlapPercentage: 0
        };
      }

      if (a.status === 'AVAILABLE') {
        matrix[key].availableCount++;
        matrix[key].availableUsers.push({ id: a.user.id, name: a.user.name });
      } else if (a.status === 'IF_NEEDED') {
        matrix[key].ifNeededCount++;
      } else {
        matrix[key].unavailableCount++;
      }
    }

    // Compute overlap percentages
    const slotSummaries = Object.values(matrix).map(slot => {
      const totalAffirmative = slot.availableCount + slot.ifNeededCount * 0.5;
      slot.overlapPercentage = totalGroupMembers > 0
        ? Math.round((totalAffirmative / totalGroupMembers) * 100)
        : 0;
      return slot;
    });

    slotSummaries.sort((a, b) => b.overlapPercentage - a.overlapPercentage || b.availableCount - a.availableCount);

    res.json({
      availabilities,
      slots: slotSummaries,
      bestSlot: slotSummaries.length > 0 ? slotSummaries[0] : null,
      totalGroupMembers
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve availability matrix.' });
  }
});

// Update current user's availability
router.put('/events/:eventId/availability', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = saveAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { slots } = parsed.data;
    const userId = req.user!.id;
    const eventId = req.params.eventId;

    // Upsert each slot
    for (const s of slots) {
      await prisma.memberAvailability.upsert({
        where: {
          eventId_userId_date_timeSlot: {
            eventId,
            userId,
            date: s.date,
            timeSlot: s.timeSlot
          }
        },
        update: { status: s.status },
        create: {
          eventId,
          userId,
          date: s.date,
          timeSlot: s.timeSlot,
          status: s.status
        }
      });
    }

    // Audit trail
    await prisma.decisionHistory.create({
      data: {
        eventId,
        actorId: userId,
        actionType: 'AVAILABILITY_UPDATED',
        entityType: 'MemberAvailability',
        details: JSON.stringify({
          updatedBy: req.user!.name,
          slotsCount: slots.length
        })
      }
    });

    res.json({ message: 'Availability schedule successfully saved.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update availability.' });
  }
});

export default router;
