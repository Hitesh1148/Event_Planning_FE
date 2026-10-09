import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const createEventSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  eventType: z.string().default('DINNER'),
  selectedDate: z.string().optional(),
  selectedTime: z.string().optional(),
  rsvpDeadline: z.string().optional(),
  votingDeadline: z.string().optional(),
  // Initial organizer budget preference
  preferredBudget: z.number().optional(),
  stretchBudget: z.number().optional(),
  hardLimit: z.number().optional(),
  // Initial venue proposal suggestions
  venueSuggestions: z.array(z.object({
    title: z.string(),
    estimatedCost: z.number().optional(),
    location: z.string().optional()
  })).optional()
});

// List events for user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userGroups = await prisma.groupMember.findMany({
      where: { userId: req.user!.id },
      select: { groupId: true }
    });

    const groupIds = userGroups.map(g => g.groupId);

    const events = await prisma.event.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        group: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        },
        proposals: { select: { id: true, title: true, estimatedCost: true, status: true } },
        _count: {
          select: { tasks: true, proposals: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve events.' });
  }
});

// Create event (from Wizard)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const data = parsed.data;

    // Verify user is in group
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: req.user!.id } }
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of the selected group.' });
      return;
    }

    const event = await prisma.event.create({
      data: {
        groupId: data.groupId,
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        organizerId: req.user!.id,
        status: 'PLANNING',
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        rsvpDeadline: data.rsvpDeadline ? new Date(data.rsvpDeadline) : undefined,
        votingDeadline: data.votingDeadline ? new Date(data.votingDeadline) : undefined,
        members: {
          create: {
            userId: req.user!.id,
            rsvpStatus: 'ATTENDING'
          }
        }
      }
    });

    // Record decision history
    await prisma.decisionHistory.create({
      data: {
        eventId: event.id,
        actorId: req.user!.id,
        actionType: 'EVENT_CREATED',
        entityType: 'Event',
        entityId: event.id,
        details: JSON.stringify({ title: event.title, eventType: event.eventType })
      }
    });

    // Set organizer initial budget if provided
    if (data.preferredBudget && data.stretchBudget && data.hardLimit) {
      await prisma.memberBudget.create({
        data: {
          eventId: event.id,
          userId: req.user!.id,
          preferredBudget: data.preferredBudget,
          stretchBudget: data.stretchBudget,
          hardLimit: data.hardLimit
        }
      });
    }

    // Create initial proposals if supplied
    if (data.venueSuggestions && data.venueSuggestions.length > 0) {
      for (const sug of data.venueSuggestions) {
        await prisma.eventProposal.create({
          data: {
            eventId: event.id,
            category: 'VENUE',
            title: sug.title,
            estimatedCost: sug.estimatedCost || 30,
            location: sug.location || 'Local area',
            createdById: req.user!.id
          }
        });
      }
    }

    res.status(201).json({ event, message: 'Event successfully created!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

// Get comprehensive event details
router.get('/:eventId', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.eventId },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
            }
          }
        },
        organizer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
        },
        proposals: {
          include: {
            createdBy: { select: { id: true, name: true } },
            votes: {
              include: { user: { select: { id: true, name: true } } }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        budgets: {
          include: { user: { select: { id: true, name: true } } }
        },
        availabilities: {
          include: { user: { select: { id: true, name: true } } }
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        itineraryItems: {
          orderBy: { orderIndex: 'asc' }
        },
        expenses: {
          include: {
            payer: { select: { id: true, name: true } },
            participants: {
              include: { user: { select: { id: true, name: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        changeRequests: {
          include: {
            requestedBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        decisionHistory: {
          include: {
            actor: { select: { id: true, name: true } }
          },
          orderBy: { timestamp: 'desc' },
          take: 30
        },
        recommendationRuns: {
          include: { results: true },
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    res.json({ event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve event.' });
  }
});

// Update event
router.patch('/:eventId', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, selectedDate, selectedTime, agreedBudget, status, votingDeadline } = req.body;

    const event = await prisma.event.update({
      where: { id: req.params.eventId },
      data: {
        title,
        description,
        selectedDate,
        selectedTime,
        agreedBudget: agreedBudget !== undefined ? parseFloat(agreedBudget) : undefined,
        status,
        votingDeadline: votingDeadline ? new Date(votingDeadline) : undefined
      }
    });

    res.json({ event, message: 'Event details updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event.' });
  }
});

// Lock plan (State transition to LOCKED)
router.post('/:eventId/lock', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.eventId },
      include: {
        proposals: { where: { status: 'ACCEPTED' } },
        budgets: true
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    if (event.status === 'LOCKED') {
      res.status(400).json({ error: 'Plan is already locked.' });
      return;
    }

    const updated = await prisma.event.update({
      where: { id: req.params.eventId },
      data: { status: 'LOCKED' }
    });

    // Record decision history
    await prisma.decisionHistory.create({
      data: {
        eventId: event.id,
        actorId: req.user!.id,
        actionType: 'PLAN_LOCKED',
        entityType: 'Event',
        entityId: event.id,
        details: JSON.stringify({
          lockedBy: req.user!.name,
          date: event.selectedDate,
          time: event.selectedTime
        })
      }
    });

    res.json({
      event: updated,
      message: 'Plan has been officially finalized and LOCKED. Further modifications require a change request.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lock plan.' });
  }
});

// Manual Override Selection (User picks another option explicitly)
router.post('/:eventId/override-selection', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { proposalId, reason } = req.body;
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required for manual override.' });
      return;
    }

    const proposal = await prisma.eventProposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal || proposal.eventId !== req.params.eventId) {
      res.status(404).json({ error: 'Proposal not found for this event.' });
      return;
    }

    // Set all other proposals to ACTIVE and this one to ACCEPTED
    await prisma.eventProposal.updateMany({
      where: { eventId: req.params.eventId },
      data: { status: 'ACTIVE' }
    });

    await prisma.eventProposal.update({
      where: { id: proposalId },
      data: { status: 'ACCEPTED' }
    });

    // Update event selected venue / agreed budget
    await prisma.event.update({
      where: { id: req.params.eventId },
      data: {
        selectedVenueId: proposal.id,
        agreedBudget: proposal.estimatedCost || undefined,
        status: 'RECOMMENDED'
      }
    });

    // Record audit trail
    await prisma.decisionHistory.create({
      data: {
        eventId: req.params.eventId,
        actorId: req.user!.id,
        actionType: 'MANUAL_OVERRIDE_SELECTION',
        entityType: 'EventProposal',
        entityId: proposalId,
        details: JSON.stringify({
          chosenProposal: proposal.title,
          reason: reason || 'Manual selection chosen by group consensus.',
          actorName: req.user!.name
        })
      }
    });

    res.json({
      message: `Option "${proposal.title}" has been selected. Group override recorded in decision history.`,
      proposal
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply manual override.' });
  }
});

// Update user RSVP
router.post('/:eventId/rsvp', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { rsvpStatus } = req.body;
    if (!['ATTENDING', 'MAYBE', 'DECLINED'].includes(rsvpStatus)) {
      res.status(400).json({ error: 'Invalid RSVP status.' });
      return;
    }

    const rsvp = await prisma.eventMember.upsert({
      where: {
        eventId_userId: {
          eventId: req.params.eventId,
          userId: req.user!.id
        }
      },
      update: { rsvpStatus },
      create: {
        eventId: req.params.eventId,
        userId: req.user!.id,
        rsvpStatus
      }
    });

    res.json({ rsvp, message: `RSVP updated to ${rsvpStatus}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update RSVP.' });
  }
});

export default router;
