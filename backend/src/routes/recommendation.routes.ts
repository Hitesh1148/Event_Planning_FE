import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, requireEventAccess } from '../middleware/auth';
import { RecommendationEngine, RecommendationEngineInputs, TravelEstimateInput } from '../services/recommendationEngine';
import { TravelService } from '../services/travelService';
import { DEMO_VENUES } from '../services/venueService';

const router = Router();

// Run Recommendation Engine and persist results
router.post('/events/:eventId/recommendations/run', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.eventId;

    // Fetch live event data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true } } }
            }
          }
        },
        proposals: {
          include: {
            votes: true
          }
        },
        budgets: {
          include: { user: { select: { id: true, name: true } } }
        },
        availabilities: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    // Prepare Travel Estimates
    const travelEstimates: Record<string, TravelEstimateInput> = {};
    for (const proposal of event.proposals) {
      // Look up venue by title or ID
      const matchingVenue = DEMO_VENUES.find(v => 
        v.name.toLowerCase().includes(proposal.title.toLowerCase()) || 
        proposal.title.toLowerCase().includes(v.name.toLowerCase())
      );
      const venueId = matchingVenue ? matchingVenue.id : 'venue-rcity';
      const travel = await TravelService.getEstimate(venueId);
      travelEstimates[proposal.id] = {
        venueId: travel.venueId,
        durationMinutes: travel.durationMinutes,
        distanceKm: travel.distanceKm,
        trafficLevel: travel.trafficLevel,
        source: travel.source
      };
    }

    const engineInputs: RecommendationEngineInputs = {
      eventId: event.id,
      totalMembersCount: event.group.members.length,
      proposals: event.proposals.map(p => {
        let venueStatus: 'CONFIRMED' | 'UNVERIFIED' | 'UNAVAILABLE' = 'CONFIRMED';
        const matchingVenue = DEMO_VENUES.find(v => 
          v.name.toLowerCase().includes(p.title.toLowerCase()) || 
          p.title.toLowerCase().includes(v.name.toLowerCase())
        );
        if (matchingVenue) {
          venueStatus = matchingVenue.status;
        }

        return {
          id: p.id,
          title: p.title,
          category: p.category,
          estimatedCost: p.estimatedCost || 0,
          location: p.location || undefined,
          venueStatus,
          venueRating: matchingVenue ? matchingVenue.rating : 4.5,
          votes: p.votes.map(v => ({
            userId: v.userId,
            score: v.score,
            voteType: v.voteType
          }))
        };
      }),
      memberBudgets: event.budgets.map(b => ({
        userId: b.userId,
        userName: b.user.name,
        preferredBudget: b.preferredBudget,
        stretchBudget: b.stretchBudget,
        hardLimit: b.hardLimit
      })),
      availabilities: event.availabilities.map(a => ({
        userId: a.userId,
        userName: a.user.name,
        date: a.date,
        timeSlot: a.timeSlot,
        status: a.status as any
      })),
      travelEstimates
    };

    const evaluation = RecommendationEngine.evaluate(engineInputs);

    // Persist RecommendationRun
    const run = await prisma.recommendationRun.create({
      data: {
        eventId: event.id,
        runById: req.user!.id,
        inputsSnapshot: JSON.stringify({
          proposalsCount: engineInputs.proposals.length,
          budgetsCount: engineInputs.memberBudgets.length,
          weights: engineInputs.weights
        }),
        results: {
          create: evaluation.rankedProposals.map(p => ({
            proposalId: p.proposalId,
            score: p.score,
            rank: p.rank,
            isFeasible: p.isFeasible,
            violatedConstraints: JSON.stringify(p.violatedConstraints),
            positiveFactors: JSON.stringify(p.positiveFactors),
            negativeFactors: JSON.stringify(p.negativeFactors),
            explanation: p.explanation,
            breakdown: JSON.stringify(p.breakdown)
          }))
        }
      },
      include: { results: true }
    });

    // Record decision history
    await prisma.decisionHistory.create({
      data: {
        eventId: event.id,
        actorId: req.user!.id,
        actionType: 'RECOMMENDATION_CALCULATED',
        entityType: 'RecommendationRun',
        entityId: run.id,
        details: JSON.stringify({
          topOption: evaluation.rankedProposals[0]?.title || 'None',
          hasFeasibleOption: evaluation.hasFeasibleOption,
          totalRanked: evaluation.rankedProposals.length
        })
      }
    });

    res.json({
      evaluation,
      runId: run.id,
      message: 'Group Decision Intelligence calculation complete.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run recommendation engine.' });
  }
});

// Get latest recommendations
router.get('/events/:eventId/recommendations/latest', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const latestRun = await prisma.recommendationRun.findFirst({
      where: { eventId: req.params.eventId },
      orderBy: { timestamp: 'desc' },
      include: {
        results: true
      }
    });

    if (!latestRun) {
      res.json({ latest: null });
      return;
    }

    const proposals = await prisma.eventProposal.findMany({
      where: { eventId: req.params.eventId }
    });
    const proposalMap = new Map(proposals.map(p => [p.id, p]));

    const formattedResults = latestRun.results.map(r => {
      const prop = proposalMap.get(r.proposalId);
      return {
        proposalId: r.proposalId,
        title: prop?.title || 'Unknown Proposal',
        category: prop?.category || 'VENUE',
        estimatedCost: prop?.estimatedCost || 0,
        score: r.score,
        rank: r.rank,
        isFeasible: r.isFeasible,
        violatedConstraints: JSON.parse(r.violatedConstraints || '[]'),
        positiveFactors: JSON.parse(r.positiveFactors || '[]'),
        negativeFactors: JSON.parse(r.negativeFactors || '[]'),
        explanation: r.explanation,
        breakdown: JSON.parse(r.breakdown || '{}'),
        missingDataFlags: [],
        dataSourceNotes: []
      };
    }).sort((a, b) => a.rank - b.rank);

    res.json({
      latest: {
        runId: latestRun.id,
        timestamp: latestRun.timestamp,
        hasFeasibleOption: formattedResults.some(r => r.isFeasible),
        rankedProposals: formattedResults,
        summary: formattedResults.some(r => r.isFeasible)
          ? `Top recommended choice is "${formattedResults[0]?.title}" with score ${formattedResults[0]?.score}/100.`
          : 'Warning: No currently feasible option satisfies 100% of hard constraints.'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest recommendations.' });
  }
});

// What-If Scenario Simulator
router.post('/events/:eventId/recommendations/simulate', authenticate, requireEventAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { simulatedBudgets, simulatedProposals, simulatedWeights } = req.body;
    const eventId = req.params.eventId;

    // Load baseline event data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true } } }
            }
          }
        },
        proposals: { include: { votes: true } },
        budgets: { include: { user: { select: { id: true, name: true } } } },
        availabilities: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    // Build baseline inputs
    const travelEstimates: Record<string, TravelEstimateInput> = {};
    for (const proposal of event.proposals) {
      const travel = await TravelService.getEstimate('venue-rcity');
      travelEstimates[proposal.id] = {
        venueId: travel.venueId,
        durationMinutes: travel.durationMinutes,
        distanceKm: travel.distanceKm,
        trafficLevel: travel.trafficLevel,
        source: travel.source
      };
    }

    // Baseline evaluation
    const baselineInputs: RecommendationEngineInputs = {
      eventId: event.id,
      totalMembersCount: event.group.members.length,
      proposals: event.proposals.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        estimatedCost: p.estimatedCost || 0,
        venueStatus: 'CONFIRMED',
        votes: p.votes.map(v => ({ userId: v.userId, score: v.score, voteType: v.voteType }))
      })),
      memberBudgets: event.budgets.map(b => ({
        userId: b.userId,
        userName: b.user.name,
        preferredBudget: b.preferredBudget,
        stretchBudget: b.stretchBudget,
        hardLimit: b.hardLimit
      })),
      availabilities: event.availabilities.map(a => ({
        userId: a.userId,
        userName: a.user.name,
        date: a.date,
        timeSlot: a.timeSlot,
        status: a.status as any
      })),
      travelEstimates
    };

    const baselineResult = RecommendationEngine.evaluate(baselineInputs);

    // Simulated evaluation
    const simulatedInputs: RecommendationEngineInputs = {
      ...baselineInputs,
      weights: simulatedWeights || undefined,
      memberBudgets: simulatedBudgets ? simulatedBudgets : baselineInputs.memberBudgets,
      proposals: simulatedProposals ? simulatedProposals : baselineInputs.proposals
    };

    const simulatedResult = RecommendationEngine.evaluate(simulatedInputs);

    res.json({
      isSimulation: true,
      baseline: baselineResult,
      simulated: simulatedResult,
      differences: {
        feasibleChanged: baselineResult.hasFeasibleOption !== simulatedResult.hasFeasibleOption,
        topRankChanged: baselineResult.rankedProposals[0]?.title !== simulatedResult.rankedProposals[0]?.title,
        previousTop: baselineResult.rankedProposals[0]?.title || 'None',
        newTop: simulatedResult.rankedProposals[0]?.title || 'None'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run what-if simulation.' });
  }
});

export default router;
