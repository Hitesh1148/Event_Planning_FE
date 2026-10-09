import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';

import { formatZodError } from '../utils/validation';

const router = Router();

const castVoteSchema = z.object({
  score: z.number().int().min(-1).max(5).default(1),
  voteType: z.enum(['UP', 'DOWN', 'RANK']).default('UP')
});

// Cast or update a vote on a proposal
router.post('/proposals/:proposalId/votes', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    const parsed = castVoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const { score, voteType } = parsed.data;

    const proposal = await prisma.eventProposal.findUnique({
      where: { id: proposalId },
      include: {
        event: {
          include: {
            group: {
              include: {
                members: { where: { userId: req.user!.id } }
              }
            }
          }
        }
      }
    });

    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found.' });
      return;
    }

    // Verify group membership
    if (proposal.event.group.members.length === 0) {
      res.status(403).json({ error: 'You are not a member of the group for this event.' });
      return;
    }

    // Enforce deadline
    if (proposal.event.votingDeadline && new Date() > new Date(proposal.event.votingDeadline)) {
      res.status(400).json({ error: 'Voting is officially closed. The voting deadline has passed.' });
      return;
    }

    if (proposal.event.status === 'LOCKED') {
      res.status(400).json({ error: 'Event plan is LOCKED. Voting is disabled.' });
      return;
    }

    // Check if vote already exists (allows changing vote before deadline, prevents duplicates)
    const existingVote = await prisma.vote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId: req.user!.id
        }
      }
    });

    const vote = await prisma.vote.upsert({
      where: {
        proposalId_userId: {
          proposalId,
          userId: req.user!.id
        }
      },
      update: { score, voteType },
      create: {
        proposalId,
        userId: req.user!.id,
        score,
        voteType
      }
    });

    // Audit trail
    await prisma.decisionHistory.create({
      data: {
        eventId: proposal.eventId,
        actorId: req.user!.id,
        actionType: existingVote ? 'VOTE_UPDATED' : 'VOTE_CAST',
        entityType: 'Vote',
        entityId: vote.id,
        details: JSON.stringify({
          proposalTitle: proposal.title,
          voteType,
          score,
          voterName: req.user!.name
        })
      }
    });

    res.json({
      vote,
      message: existingVote ? 'Vote successfully updated!' : 'Vote recorded!'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record vote.' });
  }
});

// Get voting results with tie detection
router.get('/events/:eventId/voting-results', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proposals = await prisma.eventProposal.findMany({
      where: { eventId: req.params.eventId },
      include: {
        createdBy: { select: { id: true, name: true } },
        votes: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    const results = proposals.map(p => {
      const upVotes = p.votes.filter(v => v.voteType === 'UP' || v.score > 0).length;
      const downVotes = p.votes.filter(v => v.voteType === 'DOWN' || v.score < 0).length;
      const netScore = upVotes - downVotes;
      const totalVotes = p.votes.length;

      return {
        proposalId: p.id,
        title: p.title,
        category: p.category,
        estimatedCost: p.estimatedCost,
        upVotes,
        downVotes,
        netScore,
        totalVotes,
        voters: p.votes.map(v => ({ name: v.user.name, voteType: v.voteType }))
      };
    });

    results.sort((a, b) => b.netScore - a.netScore || b.upVotes - a.upVotes);

    // Tie detection: top 2 or more proposals share same highest netScore
    let hasTie = false;
    let tiedProposals: string[] = [];
    if (results.length > 1 && results[0].netScore > 0 && results[0].netScore === results[1].netScore) {
      hasTie = true;
      const topScore = results[0].netScore;
      tiedProposals = results.filter(r => r.netScore === topScore).map(r => r.title);
    }

    res.json({
      results,
      hasTie,
      tiedProposals,
      tieNotice: hasTie ? `Tie detected between: ${tiedProposals.join(', ')}. A second voting round or engine recommendation may be needed.` : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve voting results.' });
  }
});

// Close voting manually
router.post('/events/:eventId/close-voting', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.update({
      where: { id: req.params.eventId },
      data: { votingDeadline: new Date() }
    });

    await prisma.decisionHistory.create({
      data: {
        eventId: event.id,
        actorId: req.user!.id,
        actionType: 'VOTING_CLOSED',
        entityType: 'Event',
        entityId: event.id,
        details: JSON.stringify({ closedBy: req.user!.name, timestamp: new Date() })
      }
    });

    res.json({ message: 'Voting has been closed.', event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close voting.' });
  }
});

// Reopen voting
router.post('/events/:eventId/reopen-voting', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 3);

    const event = await prisma.event.update({
      where: { id: req.params.eventId },
      data: { votingDeadline: newDeadline }
    });

    await prisma.decisionHistory.create({
      data: {
        eventId: event.id,
        actorId: req.user!.id,
        actionType: 'VOTING_REOPENED',
        entityType: 'Event',
        entityId: event.id,
        details: JSON.stringify({ reopenedBy: req.user!.name, newDeadline })
      }
    });

    res.json({ message: 'Voting has been reopened.', event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reopen voting.' });
  }
});

export default router;
