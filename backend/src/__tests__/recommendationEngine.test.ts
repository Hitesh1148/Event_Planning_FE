import { describe, it, expect } from 'vitest';
import { RecommendationEngine, RecommendationEngineInputs } from '../services/recommendationEngine';

describe('Group Decision Intelligence Recommendation Engine', () => {
  it('correctly identifies hard budget violations and marks proposal as infeasible', () => {
    const inputs: RecommendationEngineInputs = {
      eventId: 'evt-test-1',
      totalMembersCount: 2,
      proposals: [
        {
          id: 'p-expensive',
          title: 'Luxury Rooftop Lounge',
          category: 'VENUE',
          estimatedCost: 80,
          venueStatus: 'CONFIRMED',
          venueRating: 4.8,
          votes: [{ userId: 'user-1', score: 1, voteType: 'UP' }]
        },
        {
          id: 'p-affordable',
          title: 'Cozy Neighborhood Cafe',
          category: 'VENUE',
          estimatedCost: 30,
          venueStatus: 'CONFIRMED',
          venueRating: 4.3,
          votes: [{ userId: 'user-1', score: 1, voteType: 'UP' }]
        }
      ],
      memberBudgets: [
        {
          userId: 'user-1',
          userName: 'Alice',
          preferredBudget: 40,
          stretchBudget: 60,
          hardLimit: 75
        },
        {
          userId: 'user-2',
          userName: 'Bob',
          preferredBudget: 25,
          stretchBudget: 35,
          hardLimit: 40 // Strict limit: 80 > 40!
        }
      ],
      availabilities: [],
      travelEstimates: {
        'p-expensive': {
          venueId: 'v1',
          durationMinutes: 20,
          distanceKm: 5,
          trafficLevel: 'LOW',
          source: 'DEMO'
        },
        'p-affordable': {
          venueId: 'v2',
          durationMinutes: 15,
          distanceKm: 4,
          trafficLevel: 'LOW',
          source: 'DEMO'
        }
      }
    };

    const result = RecommendationEngine.evaluate(inputs);

    expect(result.hasFeasibleOption).toBe(true);
    expect(result.rankedProposals.length).toBe(2);

    // Affordable option should rank first and be feasible
    const topOption = result.rankedProposals[0];
    expect(topOption.title).toBe('Cozy Neighborhood Cafe');
    expect(topOption.isFeasible).toBe(true);
    expect(topOption.violatedConstraints.length).toBe(0);

    // Expensive option must be flagged as INFEASIBLE due to Bob's hard limit
    const expensiveOption = result.rankedProposals[1];
    expect(expensiveOption.title).toBe('Luxury Rooftop Lounge');
    expect(expensiveOption.isFeasible).toBe(false);
    expect(expensiveOption.violatedConstraints.some(c => c.includes("Bob's hard limit"))).toBe(true);
  });

  it('marks explicitly UNAVAILABLE venue as a hard constraint violation', () => {
    const inputs: RecommendationEngineInputs = {
      eventId: 'evt-test-2',
      totalMembersCount: 1,
      proposals: [
        {
          id: 'p-closed',
          title: 'Closed Bistro',
          category: 'VENUE',
          estimatedCost: 25,
          venueStatus: 'UNAVAILABLE',
          votes: []
        }
      ],
      memberBudgets: [
        {
          userId: 'user-1',
          userName: 'Alice',
          preferredBudget: 30,
          stretchBudget: 40,
          hardLimit: 50
        }
      ],
      availabilities: [],
      travelEstimates: {}
    };

    const result = RecommendationEngine.evaluate(inputs);
    expect(result.hasFeasibleOption).toBe(false);
    expect(result.rankedProposals[0].isFeasible).toBe(false);
    expect(result.rankedProposals[0].violatedConstraints.some(v => v.includes('UNAVAILABLE'))).toBe(true);
  });

  it('gracefully handles missing travel and traffic data with neutral fallback', () => {
    const inputs: RecommendationEngineInputs = {
      eventId: 'evt-test-3',
      totalMembersCount: 1,
      proposals: [
        {
          id: 'p-no-travel',
          title: 'Remote Cabin',
          category: 'VENUE',
          estimatedCost: 20,
          venueStatus: 'CONFIRMED',
          votes: []
        }
      ],
      memberBudgets: [
        {
          userId: 'user-1',
          userName: 'Alice',
          preferredBudget: 30,
          stretchBudget: 40,
          hardLimit: 50
        }
      ],
      availabilities: [],
      travelEstimates: {} // No travel data provided
    };

    const result = RecommendationEngine.evaluate(inputs);
    expect(result.hasFeasibleOption).toBe(true);
    const item = result.rankedProposals[0];
    // Must flag missing travel data
    expect(item.missingDataFlags.some(f => f.includes('Travel'))).toBe(true);
    // Neutral fallback scores 50, not artificially 100
    expect(item.breakdown.travelScore).toBe(50);
  });

  it('returns no-feasible-option state with relaxation advice when all options violate constraints', () => {
    const inputs: RecommendationEngineInputs = {
      eventId: 'evt-test-4',
      totalMembersCount: 1,
      proposals: [
        {
          id: 'p-too-high',
          title: 'Overpriced Venue',
          category: 'VENUE',
          estimatedCost: 150,
          venueStatus: 'CONFIRMED',
          votes: []
        }
      ],
      memberBudgets: [
        {
          userId: 'user-1',
          userName: 'Alice',
          preferredBudget: 30,
          stretchBudget: 40,
          hardLimit: 50 // 150 exceeds 50!
        }
      ],
      availabilities: [],
      travelEstimates: {}
    };

    const result = RecommendationEngine.evaluate(inputs);
    expect(result.hasFeasibleOption).toBe(false);
    expect(result.noFeasibleSuggestions).toBeDefined();
    expect(result.noFeasibleSuggestions!.length).toBeGreaterThan(0);
    expect(result.summary).toContain('Warning');
  });
});
