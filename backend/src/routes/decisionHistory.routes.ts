import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

const router = Router();

router.get('/events/:eventId/history', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const history = await prisma.decisionHistory.findMany({
      where: { eventId: req.params.eventId },
      include: {
        actor: { select: { id: true, name: true, avatarUrl: true } }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve decision history.' });
  }
});

export default router;
