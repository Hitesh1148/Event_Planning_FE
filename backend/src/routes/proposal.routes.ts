import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router({ mergeParams: true });

const createProposalSchema = z.object({
  category: z.enum(['VENUE', 'DATE', 'TIMESLOT', 'ACTIVITY']).default('VENUE'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  estimatedCost: z.number().min(0, 'Estimated cost must be non-negative'),
  location: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// List proposals
router.get('/events/:eventId/proposals', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposals = await prisma.eventProposal.findMany({
      where: { eventId: req.params.eventId },
      include: {
        createdBy: { select: { id: true, name: true } },
        votes: {
          include: { user: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ proposals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve proposals.' });
  }
});

// Create proposal
router.post('/events/:eventId/proposals', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { category, title, description, estimatedCost, location, metadata } = parsed.data;

    // Check if event is locked
    const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
    if (event?.status === 'LOCKED') {
      res.status(400).json({ error: 'Cannot add proposals: Event plan is LOCKED. Submit a change request instead.' });
      return;
    }

    const proposal = await prisma.eventProposal.create({
      data: {
        eventId: req.params.eventId,
        category,
        title,
        description,
        estimatedCost,
        location,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdById: req.user!.id
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Record decision history
    await prisma.decisionHistory.create({
      data: {
        eventId: req.params.eventId,
        actorId: req.user!.id,
        actionType: 'PROPOSAL_CREATED',
        entityType: 'EventProposal',
        entityId: proposal.id,
        details: JSON.stringify({ title: proposal.title, estimatedCost })
      }
    });

    res.status(201).json({ proposal, message: 'Proposal submitted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create proposal.' });
  }
});

// Update proposal
router.patch('/proposals/:proposalId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    const { title, description, estimatedCost, location } = req.body;

    const proposal = await prisma.eventProposal.findUnique({
      where: { id: proposalId },
      include: { event: true }
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found.' });
      return;
    }

    if (proposal.event.status === 'LOCKED') {
      res.status(400).json({ error: 'Event plan is LOCKED. Submit a change request to modify.' });
      return;
    }

    if (proposal.createdById !== req.user!.id && proposal.event.organizerId !== req.user!.id) {
      res.status(403).json({ error: 'Only the proposal creator or organizer can modify this proposal.' });
      return;
    }

    const updated = await prisma.eventProposal.update({
      where: { id: proposalId },
      data: {
        title,
        description,
        estimatedCost: estimatedCost !== undefined ? parseFloat(estimatedCost) : undefined,
        location
      }
    });

    res.json({ proposal: updated, message: 'Proposal updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update proposal.' });
  }
});

// Delete proposal
router.delete('/proposals/:proposalId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    const proposal = await prisma.eventProposal.findUnique({
      where: { id: proposalId },
      include: { event: true }
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found.' });
      return;
    }

    if (proposal.event.status === 'LOCKED') {
      res.status(400).json({ error: 'Event is LOCKED. Changes cannot be deleted directly.' });
      return;
    }

    if (proposal.createdById !== req.user!.id && proposal.event.organizerId !== req.user!.id) {
      res.status(403).json({ error: 'Only proposal author or organizer may delete this proposal.' });
      return;
    }

    await prisma.eventProposal.delete({ where: { id: proposalId } });

    res.json({ message: 'Proposal removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete proposal.' });
  }
});

export default router;
