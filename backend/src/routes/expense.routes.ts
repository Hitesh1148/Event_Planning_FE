import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const createExpenseSchema = z.object({
  title: z.string().min(2, 'Expense title is required'),
  description: z.string().optional(),
  category: z.string().default('FOOD'),
  totalAmount: z.number().gt(0, 'Total amount must be greater than 0'),
  payerId: z.string(),
  date: z.string(), // YYYY-MM-DD
  splitMethod: z.enum(['EQUAL', 'PARTICIPANT_BASED', 'CUSTOM']).default('EQUAL'),
  isEstimated: z.boolean().default(false),
  participantIds: z.array(z.string()).min(1, 'At least one participant must be included'),
  customShares: z.record(z.string(), z.number()).optional() // userId -> amount for CUSTOM split
});

// List expenses and compute settlement balances
router.get('/events/:eventId/expenses', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { eventId: req.params.eventId },
      include: {
        payer: { select: { id: true, name: true, avatarUrl: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Aggregate statistics
    let totalActualSpending = 0;
    let totalEstimatedSpending = 0;

    // Balances: net balance per user (positive = owed money, negative = owes money)
    const netBalances: Record<string, { userId: string; name: string; paid: number; share: number; net: number }> = {};

    for (const exp of expenses) {
      if (exp.isEstimated) {
        totalEstimatedSpending += exp.totalAmount;
      } else {
        totalActualSpending += exp.totalAmount;
      }

      // Initialize payer
      if (!netBalances[exp.payerId]) {
        netBalances[exp.payerId] = {
          userId: exp.payerId,
          name: exp.payer.name,
          paid: 0,
          share: 0,
          net: 0
        };
      }
      if (!exp.isEstimated) {
        netBalances[exp.payerId].paid += exp.totalAmount;
      }

      // Record shares
      for (const p of exp.participants) {
        if (!netBalances[p.userId]) {
          netBalances[p.userId] = {
            userId: p.userId,
            name: p.user.name,
            paid: 0,
            share: 0,
            net: 0
          };
        }
        if (!exp.isEstimated) {
          netBalances[p.userId].share += p.shareAmount;
        }
      }
    }

    // Compute net
    Object.values(netBalances).forEach(b => {
      b.net = Math.round((b.paid - b.share) * 100) / 100;
      b.paid = Math.round(b.paid * 100) / 100;
      b.share = Math.round(b.share * 100) / 100;
    });

    res.json({
      expenses,
      summary: {
        totalActualSpending: Math.round(totalActualSpending * 100) / 100,
        totalEstimatedSpending: Math.round(totalEstimatedSpending * 100) / 100,
        balances: Object.values(netBalances)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve expenses.' });
  }
});

// Create expense
router.post('/events/:eventId/expenses', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parsed = createExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { title, description, category, totalAmount, payerId, date, splitMethod, isEstimated, participantIds, customShares } = parsed.data;

    // Calculate individual participant shares
    const participantShares: { userId: string; shareAmount: number }[] = [];

    if (splitMethod === 'EQUAL' || splitMethod === 'PARTICIPANT_BASED') {
      const count = participantIds.length;
      const baseShare = Math.floor((totalAmount / count) * 100) / 100;
      let remainder = Math.round((totalAmount - baseShare * count) * 100) / 100;

      for (let i = 0; i < count; i++) {
        // Distribute rounding cents evenly
        const extraCent = remainder > 0 ? 0.01 : 0;
        if (remainder > 0) remainder = Math.round((remainder - 0.01) * 100) / 100;

        participantShares.push({
          userId: participantIds[i],
          shareAmount: Math.round((baseShare + extraCent) * 100) / 100
        });
      }
    } else if (splitMethod === 'CUSTOM') {
      if (!customShares) {
        res.status(400).json({ error: 'Custom shares must be provided for CUSTOM split method.' });
        return;
      }

      let sum = 0;
      for (const uid of participantIds) {
        const share = customShares[uid] || 0;
        sum += share;
        participantShares.push({ userId: uid, shareAmount: Math.round(share * 100) / 100 });
      }

      // Check sum equality within penny tolerance
      if (Math.abs(sum - totalAmount) > 0.05) {
        res.status(400).json({
          error: `Custom shares sum ($${sum.toFixed(2)}) does not match total expense amount ($${totalAmount.toFixed(2)}).`
        });
        return;
      }
    }

    const expense = await prisma.expense.create({
      data: {
        eventId: req.params.eventId,
        title,
        description,
        category,
        totalAmount,
        payerId,
        date,
        splitMethod,
        isEstimated,
        participants: {
          create: participantShares.map(p => ({
            userId: p.userId,
            shareAmount: p.shareAmount
          }))
        }
      },
      include: {
        payer: { select: { id: true, name: true } },
        participants: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    // Record decision history
    await prisma.decisionHistory.create({
      data: {
        eventId: req.params.eventId,
        actorId: req.user!.id,
        actionType: 'EXPENSE_ADDED',
        entityType: 'Expense',
        entityId: expense.id,
        details: JSON.stringify({
          title: expense.title,
          totalAmount: expense.totalAmount,
          splitMethod,
          payer: expense.payer.name
        })
      }
    });

    res.status(201).json({ expense, message: 'Expense tracked and split calculated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record expense.' });
  }
});

// Delete expense
router.delete('/expenses/:expenseId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { expenseId } = req.params;
    await prisma.expense.delete({ where: { id: expenseId } });
    res.json({ message: 'Expense removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

export default router;
