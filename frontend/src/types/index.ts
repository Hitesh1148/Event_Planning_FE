export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: User;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  createdById: string;
  createdAt: string;
  members: GroupMember[];
  events?: {
    id: string;
    title: string;
    status: string;
    selectedDate?: string;
    eventType: string;
  }[];
  myRole?: 'ADMIN' | 'MEMBER';
}

export interface EventMember {
  id: string;
  eventId: string;
  userId: string;
  rsvpStatus: 'ATTENDING' | 'MAYBE' | 'DECLINED' | 'INVITED';
  joinedAt: string;
  user: User;
}

export interface Vote {
  id: string;
  proposalId: string;
  userId: string;
  score: number;
  voteType: 'UP' | 'DOWN' | 'RANK';
  user: {
    id: string;
    name: string;
  };
}

export interface Proposal {
  id: string;
  eventId: string;
  category: 'VENUE' | 'DATE' | 'TIMESLOT' | 'ACTIVITY';
  title: string;
  description?: string;
  estimatedCost: number;
  location?: string;
  status: 'ACTIVE' | 'ACCEPTED' | 'REJECTED';
  createdById: string;
  createdBy: {
    id: string;
    name: string;
  };
  votes: Vote[];
  createdAt: string;
}

export interface MemberBudget {
  id: string;
  eventId: string;
  userId: string;
  preferredBudget: number;
  stretchBudget: number;
  hardLimit: number;
  currency: string;
  notes?: string;
  user: {
    id: string;
    name: string;
  };
}

export interface MemberAvailability {
  id: string;
  eventId: string;
  userId: string;
  date: string;
  timeSlot: string;
  status: 'AVAILABLE' | 'IF_NEEDED' | 'UNAVAILABLE';
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface Task {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  deadline?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  createdById: string;
  createdAt: string;
}

export interface ItineraryItem {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  orderIndex: number;
  responsibleMemberId?: string;
  notes?: string;
}

export interface ExpenseParticipant {
  id: string;
  expenseId: string;
  userId: string;
  shareAmount: number;
  isSettled: boolean;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface Expense {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  category: string;
  totalAmount: number;
  payerId: string;
  payer: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  date: string;
  splitMethod: 'EQUAL' | 'PARTICIPANT_BASED' | 'CUSTOM';
  isEstimated: boolean;
  participants: ExpenseParticipant[];
}

export interface ChangeRequest {
  id: string;
  eventId: string;
  requestedById: string;
  requestedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  proposedChange: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface DecisionHistoryItem {
  id: string;
  eventId: string;
  actorId: string;
  actor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  actionType: string;
  entityType: string;
  entityId?: string;
  details?: string;
  timestamp: string;
}

export interface ScoredProposal {
  proposalId: string;
  title: string;
  category: string;
  estimatedCost: number;
  score: number;
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
  missingDataFlags?: string[];
  dataSourceNotes?: string[];
}

export interface RecommendationRunData {
  runId: string;
  timestamp: string;
  hasFeasibleOption: boolean;
  rankedProposals: ScoredProposal[];
  summary: string;
  noFeasibleSuggestions?: string[];
}

export interface EventDetail {
  id: string;
  groupId: string;
  group: Group;
  title: string;
  description?: string;
  eventType: string;
  organizerId: string;
  organizer: User;
  status: 'PLANNING' | 'VOTING' | 'RECOMMENDED' | 'LOCKED' | 'COMPLETED' | 'CANCELLED';
  selectedDate?: string;
  selectedTime?: string;
  selectedVenueId?: string;
  agreedBudget?: number;
  rsvpDeadline?: string;
  votingDeadline?: string;
  createdAt: string;
  members: EventMember[];
  proposals: Proposal[];
  budgets: MemberBudget[];
  availabilities: MemberAvailability[];
  tasks: Task[];
  itineraryItems: ItineraryItem[];
  expenses: Expense[];
  changeRequests: ChangeRequest[];
  decisionHistory: DecisionHistoryItem[];
  recommendationRuns?: {
    id: string;
    timestamp: string;
    results: any[];
  }[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
