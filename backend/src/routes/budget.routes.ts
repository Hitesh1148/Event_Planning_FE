import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const budgetUpdateSchema = z.object({
  preferredBudget: z.number().min(0, 'Preferred budget must be non-negative'),
  stretchBudget: z.number().min(0, 'Stretch budget must be non-negative'),
  hardLimit: z.number().min(0, 'Hard limit must be non-negative'),
  currency: z.string().default('USD'),
  notes: z.string().optional()
}).refine(data => data.preferredBudget <= data.stretchBudget, {
  message: 'Preferred budget cannot exceed stretch budget.',
  path: ['preferredBudget']
}).refine(data => data.stretchBudget <= data.hardLimit, {
  message: 'Stretch budget cannot exceed hard spending limit.',
  path: ['stretchBudget']
});

// Get all budgets for event with affordability breakdown
router.get('/events/:eventId/budgets', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const budgets = await prisma.memberBudget.findMany({
      where: { eventId: req.params.eventId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    const proposals = await prisma.eventProposal.findMany({
      where: { eventId: req.params.eventId }
    });

    // Calculate group budget stats
    let minHardLimit = Infinity;
    let maxHardLimit = 0;
    let avgPreferred = 0;

    if (budgets.length > 0) {
      minHardLimit = Math.min(...budgets.map(b => b.hardLimit));
      maxHardLimit = Math.max(...budgets.map(b => b.hardLimit));
      avgPreferred = Math.round(budgets.reduce((acc, b) => acc + b.preferredBudget, 0) / budgets.length);
    } else {
      minHardLimit = 0;
    }

    // Affordability analysis per proposal
    const proposalAffordability = proposals.map(p => {
      const cost = p.estimatedCost || 0;
      const violatedMembers: { name: string; hardLimit: number; excess: number }[] = [];
      const stretchMembers: { name: string; stretchBudget: number }[] = [];

      for (const b of budgets) {
        if (cost > b.hardLimit) {
          violatedMembers.push({
            name: b.user.name,
            hardLimit: b.hardLimit,
            excess: cost - b.hardLimit
          });
        } else if (cost > b.preferredBudget) {
          stretchMembers.push({
            name: b.user.name,
            stretchBudget: b.stretchBudget
          });
        }
      }

      const isAffordableForEveryone = violatedMembers.length === 0;

      return {
        proposalId: p.id,
        title: p.title,
        estimatedCost: cost,
        isAffordableForEveryone,
        violatedMembers,
        stretchMembers,
        warning: violatedMembers.length > 0
          ? `CRITICAL BUDGET VIOLATION: Exceeds hard limit for ${violatedMembers.map(m => `${m.name} (limit: $${m.hardLimit})`).join(', ')}`
          : null
      };
    });

    res.json({
      budgets,
      stats: {
        totalConfigured: budgets.length,
        minHardLimit: minHardLimit === Infinity ? 0 : minHardLimit,
        maxHardLimit,
        avgPreferred
      },
      proposalAffordability
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve event budgets.' });
  }
});

// Update or set current user's budget
router.put('/events/:eventId/budgets', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = budgetUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { preferredBudget, stretchBudget, hardLimit, currency, notes } = parsed.data;
    const userId = req.user!.id;
    const eventId = req.params.eventId;

    const budget = await prisma.memberBudget.upsert({
      where: {
        eventId_userId: { eventId, userId }
      },
      update: {
        preferredBudget,
        stretchBudget,
        hardLimit,
        currency,
        notes
      },
      create: {
        eventId,
        userId,
        preferredBudget,
        stretchBudget,
        hardLimit,
        currency,
        notes
      }
    });

    // Record decision history
    await prisma.decisionHistory.create({
      data: {
        eventId,
        actorId: userId,
        actionType: 'BUDGET_UPDATED',
        entityType: 'MemberBudget',
        entityId: budget.id,
        details: JSON.stringify({
          userName: req.user!.name,
          preferredBudget,
          stretchBudget,
          hardLimit
        })
      }
    });

    res.json({ budget, message: 'Personal budget limits saved.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member budget.' });
  }
});

export default router;
