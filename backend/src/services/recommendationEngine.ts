export interface MemberBudgetInput {
  userId: string;
  userName: string;
  preferredBudget: number;
  stretchBudget: number;
  hardLimit: number;
}

export interface MemberAvailabilityInput {
  userId: string;
  userName: string;
  date: string;
  timeSlot: string;
  status: 'AVAILABLE' | 'IF_NEEDED' | 'UNAVAILABLE';
}

export interface TravelEstimateInput {
  venueId: string;
  durationMinutes: number;
  distanceKm: number;
  trafficLevel: 'LOW' | 'MODERATE' | 'HEAVY';
  source: 'DEMO' | 'GOOGLE_ROUTES' | 'ESTIMATED';
}

export interface ProposalInput {
  id: string;
  title: string;
  category: string;
  estimatedCost: number;
  location?: string;
  metadata?: any;
  venueStatus?: 'CONFIRMED' | 'UNVERIFIED' | 'UNAVAILABLE';
  venueRating?: number;
  votes: {
    userId: string;
    score: number;
    voteType: string;
  }[];
}

export interface RecommendationEngineInputs {
  eventId: string;
  proposals: ProposalInput[];
  memberBudgets: MemberBudgetInput[];
  availabilities: MemberAvailabilityInput[];
  travelEstimates: Record<string, TravelEstimateInput>; // venueId -> TravelEstimateInput
  totalMembersCount: number;
  weights?: {
    preference: number;
    affordability: number;
    travel: number;
    traffic: number;
    suitability: number;
  };
}

export interface ScoredProposalResult {
  proposalId: string;
  title: string;
  estimatedCost: number;
  category: string;
  score: number; // 0 to 100
  rank: number;
  isFeasible: boolean;
  violatedConstraints: string[];
  positiveFactors: string[];
  negativeFactors: string[];
  explanation: string;
  breakdown: {
    preferenceScore: number;
    affordabilityScore: number;
    travelScore: number;
    trafficScore: number;
    suitabilityScore: number;
  };
  missingDataFlags: string[];
  dataSourceNotes: string[];
}

export interface RecommendationRunOutput {
  eventId: string;
  timestamp: string;
  hasFeasibleOption: boolean;
  rankedProposals: ScoredProposalResult[];
  noFeasibleSuggestions?: string[];
  summary: string;
}

const DEFAULT_WEIGHTS = {
  preference: 0.35,
  affordability: 0.25,
  travel: 0.20,
  traffic: 0.10,
  suitability: 0.10,
};

export class RecommendationEngine {
  public static evaluate(inputs: RecommendationEngineInputs): RecommendationRunOutput {
    const weights = inputs.weights || DEFAULT_WEIGHTS;
    const scoredList: ScoredProposalResult[] = [];

    // Stage 1: Input Validation
    if (!inputs.proposals || inputs.proposals.length === 0) {
      return {
        eventId: inputs.eventId,
        timestamp: new Date().toISOString(),
        hasFeasibleOption: false,
        rankedProposals: [],
        noFeasibleSuggestions: ['Add venue or activity proposals to evaluate group options.'],
        summary: 'No proposals currently available for ranking.',
      };
    }

    for (const proposal of inputs.proposals) {
      const violatedConstraints: string[] = [];
      const positiveFactors: string[] = [];
      const negativeFactors: string[] = [];
      const missingDataFlags: string[] = [];
      const dataSourceNotes: string[] = [];

      const cost = proposal.estimatedCost || 0;

      // STAGE 2: EVALUATE HARD CONSTRAINTS
      // 1. Venue status constraint
      if (proposal.venueStatus === 'UNAVAILABLE') {
        violatedConstraints.push(
          `Hard Constraint: Venue "${proposal.title}" is explicitly marked UNAVAILABLE.`
        );
      }

      // 2. Member Hard Budget Limits
      // Never allow an aggregate score to conceal a member exceeding hard spending limit!
      for (const mb of inputs.memberBudgets) {
        if (cost > mb.hardLimit) {
          const excess = cost - mb.hardLimit;
          violatedConstraints.push(
            `Hard Budget Exceeded: Exceeds ${mb.userName}'s hard limit of $${mb.hardLimit} by $${excess}.`
          );
        }
      }

      // STAGE 3: CALCULATE SOFT SCORES (Normalized 0 to 100)

      // A. Group Preference Score (Weight 35%)
      let preferenceScore = 50; // Neutral default if no votes
      if (inputs.totalMembersCount > 0 && proposal.votes.length > 0) {
        const upVotes = proposal.votes.filter(v => v.voteType === 'UP' || v.score > 0).length;
        const downVotes = proposal.votes.filter(v => v.voteType === 'DOWN' || v.score < 0).length;
        const netVotes = Math.max(0, upVotes - downVotes);
        const voteRatio = netVotes / Math.max(1, inputs.totalMembersCount);
        preferenceScore = Math.min(100, Math.round(voteRatio * 100));

        if (upVotes > inputs.totalMembersCount * 0.5) {
          positiveFactors.push(`High group popularity: ${upVotes} members voted in favor.`);
        } else if (upVotes > 0) {
          positiveFactors.push(`${upVotes} group member(s) supported this option.`);
        }
        if (downVotes > 0) {
          negativeFactors.push(`${downVotes} member(s) expressed dissent.`);
        }
      } else {
        missingDataFlags.push('No member votes cast yet. Using neutral preference baseline.');
      }

      // B. Affordability Score (Weight 25%)
      let affordabilityScore = 70;
      if (inputs.memberBudgets.length > 0) {
        let totalAffordabilityPoints = 0;
        let membersOverStretch = 0;
        let membersWithinPreferred = 0;

        for (const mb of inputs.memberBudgets) {
          if (cost <= mb.preferredBudget) {
            totalAffordabilityPoints += 100;
            membersWithinPreferred++;
          } else if (cost <= mb.stretchBudget) {
            // Linear scale between preferred and stretch
            const ratio = (cost - mb.preferredBudget) / Math.max(1, mb.stretchBudget - mb.preferredBudget);
            totalAffordabilityPoints += Math.max(40, 100 - ratio * 40);
          } else if (cost <= mb.hardLimit) {
            // Exceeds stretch but within hard limit
            membersOverStretch++;
            const ratio = (cost - mb.stretchBudget) / Math.max(1, mb.hardLimit - mb.stretchBudget);
            totalAffordabilityPoints += Math.max(10, 40 - ratio * 30);
          } else {
            // Hard violation - 0 points
            totalAffordabilityPoints += 0;
          }
        }

        affordabilityScore = Math.round(totalAffordabilityPoints / inputs.memberBudgets.length);

        if (membersWithinPreferred === inputs.memberBudgets.length) {
          positiveFactors.push('Comfortably within every member\'s ideal preferred budget.');
        } else if (membersOverStretch > 0) {
          negativeFactors.push(
            `${membersOverStretch} member(s) must utilize their stretch budget ($${cost}/person).`
          );
        }
      } else {
        missingDataFlags.push('No member budgets configured. Using default affordability rating.');
      }

      // C. Travel Time Score (Weight 20%) & Traffic Score (Weight 10%)
      const travel = inputs.travelEstimates[proposal.id] || 
                     (proposal.metadata?.venueId ? inputs.travelEstimates[proposal.metadata.venueId] : undefined);
      let travelScore = 50;
      let trafficScore = 50;

      if (travel) {
        // Shorter travel time = higher score (e.g. 15 min = 95, 60 min = 30)
        travelScore = Math.max(10, Math.min(100, Math.round(100 - (travel.durationMinutes / 60) * 60)));
        if (travel.durationMinutes <= 25) {
          positiveFactors.push(`Quick transit: approximately ${travel.durationMinutes} mins from group center.`);
        } else if (travel.durationMinutes > 45) {
          negativeFactors.push(`Longer commute: estimated ${travel.durationMinutes} mins travel time.`);
        }

        // Traffic rating
        if (travel.trafficLevel === 'LOW') {
          trafficScore = 95;
          positiveFactors.push('Light traffic conditions predicted on primary routes.');
        } else if (travel.trafficLevel === 'MODERATE') {
          trafficScore = 65;
        } else if (travel.trafficLevel === 'HEAVY') {
          trafficScore = 30;
          negativeFactors.push('Heavy peak-hour congestion expected on transit corridor.');
        }

        dataSourceNotes.push(
          `Travel estimates source: ${travel.source} (${travel.distanceKm} km, ~${travel.durationMinutes} min).`
        );
      } else {
        missingDataFlags.push('Travel & traffic routes not yet computed for this location. Neutral score assigned.');
        travelScore = 50;
        trafficScore = 50;
      }

      // D. Availability and Suitability Score (Weight 10%)
      let suitabilityScore = 75;
      if (proposal.venueRating) {
        suitabilityScore = Math.min(100, Math.round((proposal.venueRating / 5) * 100));
        if (proposal.venueRating >= 4.5) {
          positiveFactors.push(`Highly rated venue (${proposal.venueRating}/5.0 group suitability).`);
        }
      }
      if (proposal.venueStatus === 'CONFIRMED') {
        positiveFactors.push('Venue booking availability confirmed.');
      } else if (proposal.venueStatus === 'UNVERIFIED') {
        missingDataFlags.push('Venue reservation status is unverified; confirmation recommended.');
      }

      // STAGE 4: COMPOSITE SCORING
      const compositeScore = Math.round(
        preferenceScore * weights.preference +
        affordabilityScore * weights.affordability +
        travelScore * weights.travel +
        trafficScore * weights.traffic +
        suitabilityScore * weights.suitability
      );

      const isFeasible = violatedConstraints.length === 0;

      // Explanation generation
      let explanation = '';
      if (!isFeasible) {
        explanation = `Infeasible: Violated ${violatedConstraints.length} hard constraint(s). ${violatedConstraints.join(' ')}`;
      } else {
        explanation = `Ranked with composite score ${compositeScore}/100. `;
        if (positiveFactors.length > 0) {
          explanation += `Key strengths: ${positiveFactors.slice(0, 2).join(' ')} `;
        }
        if (negativeFactors.length > 0) {
          explanation += `Trade-offs to consider: ${negativeFactors.slice(0, 2).join(' ')}`;
        }
      }

      scoredList.push({
        proposalId: proposal.id,
        title: proposal.title,
        estimatedCost: cost,
        category: proposal.category,
        score: isFeasible ? compositeScore : Math.max(0, compositeScore - 40), // Infeasible options penalized in ranking
        rank: 0, // Assigned after sorting
        isFeasible,
        violatedConstraints,
        positiveFactors,
        negativeFactors,
        explanation: explanation.trim(),
        breakdown: {
          preferenceScore,
          affordabilityScore,
          travelScore,
          trafficScore,
          suitabilityScore,
        },
        missingDataFlags,
        dataSourceNotes,
      });
    }

    // Sort feasible options first by score descending, then infeasible by score descending
    scoredList.sort((a, b) => {
      if (a.isFeasible && !b.isFeasible) return -1;
      if (!a.isFeasible && b.isFeasible) return 1;
      return b.score - a.score;
    });

    // Assign rank
    scoredList.forEach((item, index) => {
      item.rank = index + 1;
    });

    const hasFeasibleOption = scoredList.some(item => item.isFeasible);
    const noFeasibleSuggestions: string[] = [];

    if (!hasFeasibleOption && scoredList.length > 0) {
      // Suggest relaxations
      const hardViolations = scoredList.flatMap(s => s.violatedConstraints);
      if (hardViolations.some(v => v.includes('Hard Budget Exceeded'))) {
        noFeasibleSuggestions.push(
          'Consider relaxing hard budget limits by $10–$15 per person or exploring lower-cost venue proposals.'
        );
      }
      if (hardViolations.some(v => v.includes('UNAVAILABLE'))) {
        noFeasibleSuggestions.push(
          'Contact venues to verify table openings or propose alternative dining destinations.'
        );
      }
      noFeasibleSuggestions.push(
        'Review closest alternatives listed below with explicit trade-off explanations.'
      );
    }

    let summary = '';
    if (hasFeasibleOption) {
      const topChoice = scoredList[0];
      summary = `The Group Decision Intelligence Engine recommends "${topChoice.title}" (Score: ${topChoice.score}/100) as the optimal compromise balancing group budget, commute distance, and votes.`;
    } else {
      summary = 'Warning: No proposals satisfy 100% of the group\'s hard constraints. Review violated constraints and suggested adjustments below.';
    }

    return {
      eventId: inputs.eventId,
      timestamp: new Date().toISOString(),
      hasFeasibleOption,
      rankedProposals: scoredList,
      noFeasibleSuggestions: noFeasibleSuggestions.length > 0 ? noFeasibleSuggestions : undefined,
      summary,
    };
  }
}
