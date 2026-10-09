import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const createChangeRequestSchema = z.object({
  proposedChange: z.string().min(5, 'Proposed change description is required'),
  reason: z.string().min(5, 'Reason for the change is required')
});

// List change requests
router.get('/events/:eventId/change-requests', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requests = await prisma.changeRequest.findMany({
      where: { eventId: req.params.eventId },
      include: {
        requestedBy: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ changeRequests: requests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve change requests.' });
  }
});

// Create change request
router.post('/events/:eventId/change-requests', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createChangeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { proposedChange, reason } = parsed.data;

    const request = await prisma.changeRequest.create({
      data: {
        eventId: req.params.eventId,
        requestedById: req.user!.id,
        proposedChange,
        reason,
        status: 'PENDING'
      },
      include: {
        requestedBy: { select: { id: true, name: true } }
      }
    });

    // Record decision history
    await prisma.decisionHistory.create({
      data: {
        eventId: req.params.eventId,
        actorId: req.user!.id,
        actionType: 'CHANGE_REQUEST_SUBMITTED',
        entityType: 'ChangeRequest',
        entityId: request.id,
        details: JSON.stringify({
          proposedChange,
          reason,
          requester: req.user!.name
        })
      }
    });

    res.status(201).json({ changeRequest: request, message: 'Change request submitted for group review.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create change request.' });
  }
});

// Approve change request
router.post('/change-requests/:requestId/approve', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const existing = await prisma.changeRequest.findUnique({
      where: { id: requestId },
      include: { event: true }
    });

    if (!existing) {
      res.status(404).json({ error: 'Change request not found.' });
      return;
    }

    // Verify organizer or admin permission
    if (existing.event.organizerId !== req.user!.id) {
      res.status(403).json({ error: 'Only the event organizer can approve formal change requests.' });
      return;
    }

    const updated = await prisma.changeRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedById: req.user!.id,
        reviewedAt: new Date()
      }
    });

    // Unset locked status to PLANNING so modifications can proceed, or log
    await prisma.event.update({
      where: { id: existing.eventId },
      data: { status: 'PLANNING' }
    });

    await prisma.decisionHistory.create({
      data: {
        eventId: existing.eventId,
        actorId: req.user!.id,
        actionType: 'CHANGE_REQUEST_APPROVED',
        entityType: 'ChangeRequest',
        entityId: requestId,
        details: JSON.stringify({
          change: existing.proposedChange,
          approvedBy: req.user!.name,
          planUnlocked: true
        })
      }
    });

    res.json({
      changeRequest: updated,
      message: 'Change request APPROVED. Event status returned to PLANNING to apply modifications.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve change request.' });
  }
});

// Reject change request
router.post('/change-requests/:requestId/reject', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const existing = await prisma.changeRequest.findUnique({
      where: { id: requestId },
      include: { event: true }
    });

    if (!existing) {
      res.status(404).json({ error: 'Change request not found.' });
      return;
    }

    if (existing.event.organizerId !== req.user!.id) {
      res.status(403).json({ error: 'Only the event organizer can review change requests.' });
      return;
    }

    const updated = await prisma.changeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedById: req.user!.id,
        reviewedAt: new Date()
      }
    });

    await prisma.decisionHistory.create({
      data: {
        eventId: existing.eventId,
        actorId: req.user!.id,
        actionType: 'CHANGE_REQUEST_REJECTED',
        entityType: 'ChangeRequest',
        entityId: requestId,
        details: JSON.stringify({
          change: existing.proposedChange,
          rejectedBy: req.user!.name
        })
      }
    });

    res.json({ changeRequest: updated, message: 'Change request rejected.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject change request.' });
  }
});

export default router;
