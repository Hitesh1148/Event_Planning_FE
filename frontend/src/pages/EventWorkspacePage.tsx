import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  LockKey, 
  LockKeyOpen, 
  Sparkle, 
  Clock, 
  MapPin, 
  Coins, 
  UsersThree, 
  ThumbsUp, 
  ThumbsDown, 
  WarningCircle, 
  CheckCircle, 
  SlidersHorizontal, 
  ListChecks, 
  CalendarBlank, 
  Receipt, 
  ClockAfternoon, 
  ChatCircleText,
  Plus,
  Trash,
  Car,
  HourglassHigh,
  ArrowRight,
  ShieldCheck,
  Check
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { EventDetail, ScoredProposal, RecommendationRunData } from '../types';

export const EventWorkspacePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'proposals' | 'recommendations' | 'simulator' | 'availability' | 'budgets' | 'venues' | 'tasks' | 'itinerary' | 'expenses' | 'lock' | 'history'
  >('proposals');

  // Recommendation State
  const [recommendations, setRecommendations] = useState<RecommendationRunData | null>(null);
  const [runningEngine, setRunningEngine] = useState(false);

  // Voting Results State
  const [votingResults, setVotingResults] = useState<any>(null);

  // Simulation State
  const [simulatedBudgetBob, setSimulatedBudgetBob] = useState<number>(40);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Forms Modals / States
  const [showAddProposal, setShowAddProposal] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propCost, setPropCost] = useState(35);
  const [propLoc, setPropLoc] = useState('');
  const [propDesc, setPropDesc] = useState('');

  // Budget Edit State
  const [myPrefBudget, setMyPrefBudget] = useState(35);
  const [myStretchBudget, setMyStretchBudget] = useState(45);
  const [myHardLimit, setMyHardLimit] = useState(50);
  const [savingBudget, setSavingBudget] = useState(false);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  // Itinerary Form State
  const [itinTitle, setItinTitle] = useState('');
  const [itinTime, setItinTime] = useState('19:30');
  const [itinLoc, setItinLoc] = useState('');

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(40);
  const [expCategory, setExpCategory] = useState('FOOD');
  const [expSplitMethod, setExpSplitMethod] = useState<'EQUAL' | 'PARTICIPANT_BASED' | 'CUSTOM'>('EQUAL');

  // Change Request State
  const [changeDesc, setChangeDesc] = useState('');
  const [changeReason, setChangeReason] = useState('');

  // Manual Override Modal
  const [overrideProposalId, setOverrideProposalId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadLatestRecommendations();
      loadVotingResults();

      // Setup Socket.IO real-time room
      const socket = getSocket();
      socket.emit('join_event', eventId);

      socket.on('vote_changed', () => {
        loadVotingResults();
        loadEvent();
      });

      socket.on('proposal_added', () => {
        loadEvent();
      });

      return () => {
        socket.emit('leave_event', eventId);
        socket.off('vote_changed');
        socket.off('proposal_added');
      };
    }
  }, [eventId]);

  async function loadEvent() {
    setLoading(true);
    try {
      const data = await api.getEvent(eventId!);
      setEvent(data.event);

      // Pre-fill my budget if exists
      const myBudget = data.event.budgets?.find((b: any) => b.userId === user?.id);
      if (myBudget) {
        setMyPrefBudget(myBudget.preferredBudget);
        setMyStretchBudget(myBudget.stretchBudget);
        setMyHardLimit(myBudget.hardLimit);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  }

  async function loadLatestRecommendations() {
    try {
      const res = await api.getLatestRecommendations(eventId!);
      if (res.latest) {
        setRecommendations(res.latest);
      }
    } catch (e) {}
  }

  async function loadVotingResults() {
    try {
      const res = await api.getVotingResults(eventId!);
      setVotingResults(res);
    } catch (e) {}
  }

  const handleRunEngine = async () => {
    setRunningEngine(true);
    setError(null);
    try {
      const res = await api.runRecommendations(eventId!);
      setRecommendations({
        runId: res.runId,
        timestamp: res.evaluation.timestamp,
        hasFeasibleOption: res.evaluation.hasFeasibleOption,
        rankedProposals: res.evaluation.rankedProposals,
        summary: res.evaluation.summary,
        noFeasibleSuggestions: res.evaluation.noFeasibleSuggestions
      });
      setSuccess('Decision Intelligence calculation completed.');
      setActiveTab('recommendations');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunningEngine(false);
    }
  };

  const handleCastVote = async (proposalId: string, score: number, voteType: 'UP' | 'DOWN') => {
    try {
      await api.castVote(proposalId, score, voteType);
      loadEvent();
      loadVotingResults();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    setError(null);
    try {
      await api.updateBudget(eventId!, {
        preferredBudget: Number(myPrefBudget),
        stretchBudget: Number(myStretchBudget),
        hardLimit: Number(myHardLimit)
      });
      setSuccess('Your individual budget limits have been recorded.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleAddProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle) return;
    try {
      await api.createProposal(eventId!, {
        title: propTitle,
        estimatedCost: Number(propCost),
        location: propLoc,
        description: propDesc,
        category: 'VENUE'
      });
      setPropTitle('');
      setPropLoc('');
      setPropDesc('');
      setShowAddProposal(false);
      setSuccess('New proposal added to group board.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      await api.createTask(eventId!, {
        title: taskTitle,
        assignedToId: taskAssignee || undefined,
        priority: taskPriority
      });
      setTaskTitle('');
      setTaskAssignee('');
      setSuccess('Task created.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itinTitle) return;
    try {
      await api.createItineraryItem(eventId!, {
        title: itinTitle,
        startTime: itinTime,
        location: itinLoc
      });
      setItinTitle('');
      setItinLoc('');
      setSuccess('Itinerary item added.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !event) return;
    try {
      const participantIds = event.members.map(m => m.userId);
      await api.createExpense(eventId!, {
        title: expTitle,
        totalAmount: Number(expAmount),
        category: expCategory,
        payerId: user!.id,
        date: new Date().toISOString().split('T')[0],
        splitMethod: expSplitMethod,
        participantIds
      });
      setExpTitle('');
      setSuccess('Expense added and split calculated.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLockPlan = async () => {
    if (!window.confirm('Locking this plan finalizes the agreed venue, date, and budget. Any future modifications will require submitting a Change Request. Proceed?')) return;
    try {
      await api.lockEvent(eventId!);
      setSuccess('Plan officially finalized and LOCKED.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleManualOverride = async () => {
    if (!overrideProposalId) return;
    try {
      await api.overrideSelection(eventId!, overrideProposalId, overrideReason);
      setOverrideProposalId(null);
      setOverrideReason('');
      setSuccess('Manual selection applied and logged to Decision History.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const bobUser = event?.budgets.find(b => b.user.name.toLowerCase().includes('bob'));
      const simulatedBudgets = event?.budgets.map(b => {
        if (b.user.name.toLowerCase().includes('bob')) {
          return {
            userId: b.userId,
            userName: b.user.name,
            preferredBudget: b.preferredBudget,
            stretchBudget: simulatedBudgetBob,
            hardLimit: simulatedBudgetBob
          };
        }
        return {
          userId: b.userId,
          userName: b.user.name,
          preferredBudget: b.preferredBudget,
          stretchBudget: b.stretchBudget,
          hardLimit: b.hardLimit
        };
      });

      const res = await api.simulateRecommendations(eventId!, { simulatedBudgets });
      setSimulationResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleCreateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeDesc || !changeReason) return;
    try {
      await api.createChangeRequest(eventId!, {
        proposedChange: changeDesc,
        reason: changeReason
      });
      setChangeDesc('');
      setChangeReason('');
      setSuccess('Change request submitted for organizer review.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveChangeRequest = async (id: string) => {
    try {
      await api.approveChangeRequest(id);
      setSuccess('Change request approved. Plan returned to PLANNING status.');
      loadEvent();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="card-clean p-12 text-center text-xs text-[#65717A]">Loading event workspace...</div>;
  }

  if (!event) {
    return (
      <div className="card-clean p-12 text-center space-y-3">
        <div className="text-base font-bold text-[#A64F49]">Event not found</div>
        <Link to="/events" className="text-xs font-bold text-[#294D68] underline">
          Return to Events
        </Link>
      </div>
    );
  }

  const isLocked = event.status === 'LOCKED';
  const isOrganizer = event.organizerId === user?.id;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="card-clean p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs">
              <Link to={`/groups/${event.groupId}`} className="font-semibold text-[#527C75] hover:underline">
                {event.group?.name}
              </Link>
              <span className="text-[#65717A]">·</span>
              <span className="text-[#65717A]">Organizer: {event.organizer?.name}</span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#222D38]">
              {event.title}
            </h1>
            <p className="text-xs text-[#65717A] max-w-2xl">
              {event.description || 'Collaborative event planning workspace.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pill */}
            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              isLocked ? 'bg-[#294D68]/15 text-[#294D68] border border-[#294D68]/30' : 'bg-[#477B62]/15 text-[#477B62]'
            }`}>
              {event.status}
            </span>

            {/* Last-Minute Mode CTA */}
            <Link
              to={`/events/${event.id}/last-minute`}
              className="px-3.5 py-1.5 rounded-md bg-[#C17A43] text-white text-xs font-bold hover:bg-[#a66533] transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <HourglassHigh size={16} weight="bold" />
              <span>Last-Minute Mode</span>
            </Link>

            {/* Run Engine Button */}
            <button
              onClick={handleRunEngine}
              disabled={runningEngine}
              className="px-3.5 py-1.5 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d] transition-colors flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
            >
              <ShieldCheck size={16} weight="bold" className="text-[#527C75]" />
              <span>{runningEngine ? 'Analyzing...' : 'Run Decision Engine'}</span>
            </button>

            {/* Lock Plan Button */}
            {!isLocked && isOrganizer && (
              <button
                onClick={handleLockPlan}
                className="px-3.5 py-1.5 rounded-md bg-[#EAE7DF] border border-[#D9D6CD] text-[#222D38] text-xs font-bold hover:bg-[#dfdbd1] transition-colors flex items-center space-x-1"
                title="Freeze plan and require change requests"
              >
                <LockKey size={14} weight="bold" />
                <span>Lock Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="pt-3 border-t border-[#D9D6CD] flex flex-wrap items-center gap-4 text-xs text-[#65717A]">
          <div className="flex items-center space-x-1.5">
            <Clock size={16} className="text-[#294D68]" />
            <span>Date: <strong>{event.selectedDate || 'Pending Consensus'}</strong> ({event.selectedTime || 'TBD'})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Coins size={16} className="text-[#527C75]" />
            <span>Agreed Budget: <strong>{event.agreedBudget ? `$${event.agreedBudget}/person` : 'Under evaluation'}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <UsersThree size={16} className="text-[#C17A43]" />
            <span>Participants: <strong>{event.members?.length} members</strong></span>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-[#477B62]/10 border border-[#477B62]/30 rounded-md text-xs font-semibold text-[#477B62]">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-[#A64F49]/10 border border-[#A64F49]/30 rounded-md text-xs font-semibold text-[#A64F49]">
          {error}
        </div>
      )}

      {/* Tie Detection Banner */}
      {votingResults?.hasTie && (
        <div className="p-3.5 bg-[#B77B35]/15 border border-[#B77B35]/40 rounded-md text-xs text-[#222D38] flex items-center space-x-2">
          <WarningCircle size={18} weight="bold" className="text-[#B77B35] shrink-0" />
          <span>
            <strong>Voting Tie Detected:</strong> {votingResults.tieNotice}. Use the Decision Intelligence Engine below to evaluate travel and budget trade-offs.
          </span>
        </div>
      )}

      {/* Workspace Tabs Navigation */}
      <div className="border-b border-[#D9D6CD] flex space-x-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'proposals', label: 'Proposals & Voting', count: event.proposals?.length },
          { id: 'recommendations', label: 'Decision Intelligence', highlight: true },
          { id: 'simulator', label: 'What-If Simulator' },
          { id: 'budgets', label: 'Hard Budgets', count: event.budgets?.length },
          { id: 'availability', label: 'Availability', count: event.availabilities?.length },
          { id: 'venues', label: 'Venues & Travel' },
          { id: 'tasks', label: 'Tasks', count: event.tasks?.length },
          { id: 'itinerary', label: 'Itinerary', count: event.itineraryItems?.length },
          { id: 'expenses', label: 'Expenses', count: event.expenses?.length },
          { id: 'lock', label: isLocked ? 'Locked Plan (Change Requests)' : 'Plan Finalization' },
          { id: 'history', label: 'Decision Audit History' }
        ].map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-t-md font-bold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === tab.id
                ? 'bg-[#FBF9F4] text-[#294D68] border-t-2 border-t-[#294D68] border-x border-[#D9D6CD] -mb-1'
                : 'text-[#65717A] hover:text-[#222D38] hover:bg-[#EAE7DF]'
            }`}
          >
            {tab.highlight && <ShieldCheck size={14} weight="bold" className="text-[#527C75]" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EAE7DF] text-[#65717A]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. PROPOSALS & VOTING */}
      {activeTab === 'proposals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#222D38]">Venue & Activity Proposals</h2>
              <p className="text-xs text-[#65717A]">
                Each member can cast one vote per proposal. Deadlines and duplicate votes are enforced on the server.
              </p>
            </div>
            {!isLocked && (
              <button
                onClick={() => setShowAddProposal(true)}
                className="px-3.5 py-1.5 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d] flex items-center space-x-1"
              >
                <Plus size={14} weight="bold" />
                <span>Add Proposal</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {event.proposals.map(p => {
              const myVote = p.votes.find(v => v.userId === user?.id);
              const upVotes = p.votes.filter(v => v.voteType === 'UP').length;
              const downVotes = p.votes.filter(v => v.voteType === 'DOWN').length;

              return (
                <div key={p.id} className="card-clean p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-[#65717A] uppercase">{p.category}</span>
                      <span className="font-bold text-[#527C75]">${p.estimatedCost}/person</span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-[#222D38]">{p.title}</h3>
                    <p className="text-xs text-[#65717A]">{p.description || 'No additional description.'}</p>
                    {p.location && (
                      <div className="text-[11px] text-[#65717A] flex items-center space-x-1">
                        <MapPin size={12} />
                        <span>{p.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#D9D6CD] flex items-center justify-between">
                    <div className="text-xs space-x-2">
                      <span className="font-bold text-[#477B62]">+{upVotes}</span>
                      <span className="font-bold text-[#A64F49]">-{downVotes}</span>
                    </div>

                    {!isLocked && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleCastVote(p.id, 1, 'UP')}
                          className={`p-1.5 rounded border transition-colors ${
                            myVote?.voteType === 'UP' ? 'bg-[#477B62] text-white border-[#477B62]' : 'bg-[#EAE7DF] border-[#D9D6CD] hover:bg-[#dfdbd1]'
                          }`}
                          title="Vote in favor"
                        >
                          <ThumbsUp size={14} weight="bold" />
                        </button>
                        <button
                          onClick={() => handleCastVote(p.id, -1, 'DOWN')}
                          className={`p-1.5 rounded border transition-colors ${
                            myVote?.voteType === 'DOWN' ? 'bg-[#A64F49] text-white border-[#A64F49]' : 'bg-[#EAE7DF] border-[#D9D6CD] hover:bg-[#dfdbd1]'
                          }`}
                          title="Vote against"
                        >
                          <ThumbsDown size={14} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Proposal Modal */}
          {showAddProposal && (
            <div className="fixed inset-0 z-50 bg-[#222D38]/50 flex items-center justify-center p-4">
              <div className="bg-[#FBF9F4] border border-[#D9D6CD] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="font-heading text-lg font-bold text-[#222D38]">Submit Proposal</h3>
                <form onSubmit={handleAddProposal} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                      Venue / Activity Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Phoenix Grand Arcade & Eatery"
                      value={propTitle}
                      onChange={e => setPropTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CD] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                      Estimated Cost per Person ($)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={propCost}
                      onChange={e => setPropCost(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CD] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                      Location / Neighborhood
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kurla West, Mumbai"
                      value={propLoc}
                      onChange={e => setPropLoc(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CD] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                      Description & Vibe
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Atmosphere, food type, reasons to pick..."
                      value={propDesc}
                      onChange={e => setPropDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CD] rounded"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProposal(false)}
                      className="px-3 py-1.5 text-xs text-[#65717A]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#294D68] text-white text-xs font-bold rounded"
                    >
                      Save Proposal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. GROUP DECISION INTELLIGENCE ENGINE (CORE DIFFERENTIATOR) */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-[#222D38] flex items-center space-x-2">
                <ShieldCheck size={22} weight="bold" className="text-[#527C75]" />
                <span>Group Decision Intelligence Engine</span>
              </h2>
              <p className="text-xs text-[#65717A] mt-0.5">
                Evaluates hard budget constraints first, then ranks options with transparent scoring weights.
              </p>
            </div>
            <button
              onClick={handleRunEngine}
              disabled={runningEngine}
              className="px-4 py-2 bg-[#294D68] text-white text-xs font-bold rounded-md hover:bg-[#1e384d] flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
            >
              <ShieldCheck size={16} weight="bold" />
              <span>{runningEngine ? 'Calculating Trade-offs...' : 'Recalculate Recommendations'}</span>
            </button>
          </div>

          {/* Engine Scoring Weights Banner */}
          <div className="p-3 bg-[#EAE7DF] border border-[#D9D6CD] rounded-md flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#222D38]">
            <span className="font-bold uppercase tracking-wider text-[#65717A]">Active Engine Weights:</span>
            <span>Preferences: <strong>35%</strong></span>
            <span>Affordability: <strong>25%</strong></span>
            <span>Travel Time: <strong>20%</strong></span>
            <span>Traffic Conditions: <strong>10%</strong></span>
            <span>Suitability: <strong>10%</strong></span>
          </div>

          {!recommendations ? (
            <div className="card-clean p-10 text-center space-y-3">
              <ShieldCheck size={40} className="mx-auto text-[#65717A]" />
              <h3 className="font-heading text-base font-bold text-[#222D38]">No recommendation run recorded yet</h3>
              <p className="text-xs text-[#65717A] max-w-sm mx-auto">
                Click "Recalculate Recommendations" to analyze member votes, individual hard budgets, and commute times.
              </p>
              <button
                onClick={handleRunEngine}
                className="px-4 py-2 bg-[#294D68] text-white text-xs font-bold rounded-md"
              >
                Run Decision Intelligence
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Box */}
              <div className={`p-4 rounded-lg border text-xs leading-relaxed ${
                recommendations.hasFeasibleOption 
                  ? 'bg-[#477B62]/10 border-[#477B62]/30 text-[#222D38]' 
                  : 'bg-[#A64F49]/10 border-[#A64F49]/30 text-[#A64F49]'
              }`}>
                <div className="font-bold text-sm mb-1">
                  {recommendations.hasFeasibleOption ? 'Optimal Consensus Recommendation' : 'Constraint Conflict Detected'}
                </div>
                <p>{recommendations.summary}</p>
                {recommendations.noFeasibleSuggestions && (
                  <ul className="list-disc list-inside mt-2 space-y-1 font-semibold">
                    {recommendations.noFeasibleSuggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Ranked Proposals Cards */}
              <div className="space-y-4">
                {recommendations.rankedProposals.map(item => (
                  <div
                    key={item.proposalId}
                    className={`card-clean p-5 space-y-4 ${
                      item.isFeasible && item.rank === 1 ? 'border-2 border-[#477B62]' : ''
                    } ${!item.isFeasible ? 'bg-[#A64F49]/5 border-[#A64F49]/40' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-extrabold text-sm ${
                          item.isFeasible ? 'bg-[#294D68] text-white' : 'bg-[#A64F49] text-white'
                        }`}>
                          #{item.rank}
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg text-[#222D38]">{item.title}</h3>
                          <div className="text-xs text-[#65717A]">
                            Estimated Cost: <strong className="text-[#222D38]">${item.estimatedCost}/person</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-xs text-[#65717A]">Composite Score</div>
                          <div className="font-heading font-extrabold text-xl text-[#222D38]">{item.score}/100</div>
                        </div>

                        {/* Manual Override Action */}
                        {!isLocked && (
                          <button
                            onClick={() => setOverrideProposalId(item.proposalId)}
                            className="px-3 py-1.5 bg-[#FBF9F4] hover:bg-[#EAE7DF] border border-[#D9D6CD] text-[#222D38] text-xs font-bold rounded transition-colors"
                          >
                            Select This Plan
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hard Constraint Violations Banner */}
                    {item.violatedConstraints.length > 0 && (
                      <div className="p-3 bg-[#A64F49]/10 border border-[#A64F49]/30 rounded-md text-xs font-bold text-[#A64F49] space-y-1">
                        <div className="uppercase tracking-wider text-[10px]">Hard Constraint Violation</div>
                        {item.violatedConstraints.map((v, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5">
                            <WarningCircle size={14} weight="bold" />
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Score Breakdown Bars */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px]">
                      <div className="p-2 bg-[#EAE7DF] rounded">
                        <div className="text-[#65717A]">Preference</div>
                        <div className="font-bold text-[#222D38]">{item.breakdown.preferenceScore}/100</div>
                      </div>
                      <div className="p-2 bg-[#EAE7DF] rounded">
                        <div className="text-[#65717A]">Affordability</div>
                        <div className="font-bold text-[#222D38]">{item.breakdown.affordabilityScore}/100</div>
                      </div>
                      <div className="p-2 bg-[#EAE7DF] rounded">
                        <div className="text-[#65717A]">Travel Time</div>
                        <div className="font-bold text-[#222D38]">{item.breakdown.travelScore}/100</div>
                      </div>
                      <div className="p-2 bg-[#EAE7DF] rounded">
                        <div className="text-[#65717A]">Traffic</div>
                        <div className="font-bold text-[#222D38]">{item.breakdown.trafficScore}/100</div>
                      </div>
                      <div className="p-2 bg-[#EAE7DF] rounded">
                        <div className="text-[#65717A]">Suitability</div>
                        <div className="font-bold text-[#222D38]">{item.breakdown.suitabilityScore}/100</div>
                      </div>
                    </div>

                    {/* Explanation Text */}
                    <div className="text-xs text-[#222D38] bg-[#F4F1EA] p-3 rounded-md space-y-1">
                      <div className="font-bold text-[#294D68]">Trade-off Explanation:</div>
                      <p>{item.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Override Confirmation Modal */}
          {overrideProposalId && (
            <div className="fixed inset-0 z-50 bg-[#222D38]/50 flex items-center justify-center p-4">
              <div className="bg-[#FBF9F4] border border-[#D9D6CD] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="font-heading text-lg font-bold text-[#222D38]">Confirm Manual Override</h3>
                <p className="text-xs text-[#65717A]">
                  You are manually choosing this option for the group. The override, actor, and timestamp will be permanently logged in the Decision History.
                </p>
                <div>
                  <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                    Reason for Override (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Group agreed in chat that rooftop ambiance outweighs travel time"
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CD] rounded"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOverrideProposalId(null)}
                    className="px-3 py-1.5 text-xs text-[#65717A]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleManualOverride}
                    className="px-4 py-1.5 bg-[#294D68] text-white text-xs font-bold rounded"
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. WHAT-IF SCENARIO SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#EAE7DF] border border-[#D9D6CD] rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#C17A43] uppercase tracking-wider">
              <SlidersHorizontal size={18} weight="bold" />
              <span>What-If Scenario Simulator</span>
            </div>
            <p className="text-xs text-[#222D38]">
              Test hypotheticals without modifying live database records! Simulate what happens if Bob stretches his budget limit to $55, or if traffic improves.
            </p>
          </div>

          <div className="card-clean p-6 space-y-5">
            <h3 className="font-heading font-bold text-base text-[#222D38]">Simulation Parameters</h3>

            <div className="p-4 bg-[#F4F1EA] rounded-md border border-[#D9D6CD] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-[#222D38]">Simulate Bob's Hard Spending Limit:</span>
                <span className="font-bold text-[#294D68]">${simulatedBudgetBob}/person</span>
              </div>
              <input
                type="range"
                min="30"
                max="80"
                step="5"
                value={simulatedBudgetBob}
                onChange={e => setSimulatedBudgetBob(Number(e.target.value))}
                className="w-full accent-[#294D68]"
              />
              <div className="flex justify-between text-[10px] text-[#65717A]">
                <span>$30 (Current strict)</span>
                <span>$55 (Enables Viviana Rooftop)</span>
                <span>$80 (High flexibility)</span>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="px-4 py-2 bg-[#294D68] text-white text-xs font-bold rounded-md hover:bg-[#1e384d] flex items-center space-x-2"
            >
              <SlidersHorizontal size={16} />
              <span>{simulating ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>

          {/* Simulation Output Comparison */}
          {simulationResult && (
            <div className="card-clean p-6 space-y-4 border-2 border-[#C17A43]">
              <div className="flex items-center justify-between border-b border-[#D9D6CD] pb-3">
                <span className="font-heading font-bold text-base text-[#222D38]">
                  Simulation Results vs Live Baseline
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-[#C17A43]/15 text-[#C17A43] font-bold">
                  SIMULATION ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Baseline Column */}
                <div className="p-4 bg-[#F4F1EA] rounded-md space-y-2 border border-[#D9D6CD]">
                  <div className="font-bold text-[#65717A] uppercase text-[10px]">Current Live State (Bob: $40 Hard Limit)</div>
                  <div className="font-bold text-sm text-[#222D38]">{simulationResult.baseline.rankedProposals[0]?.title}</div>
                  <p className="text-[#65717A]">{simulationResult.baseline.summary}</p>
                </div>

                {/* Simulated Column */}
                <div className="p-4 bg-[#477B62]/10 rounded-md space-y-2 border border-[#477B62]/30">
                  <div className="font-bold text-[#477B62] uppercase text-[10px]">Simulated State (Bob: ${simulatedBudgetBob} Limit)</div>
                  <div className="font-bold text-sm text-[#222D38]">{simulationResult.simulated.rankedProposals[0]?.title}</div>
                  <p className="text-[#222D38]">{simulationResult.simulated.summary}</p>
                </div>
              </div>

              <div className="text-xs p-3 bg-[#EAE7DF] rounded text-[#222D38]">
                <strong>Key Difference: </strong>
                {simulatedBudgetBob >= 55 ? (
                  <span>Viviana Rooftop Grill ($55/person) becomes 100% FEASIBLE without any hard budget violations!</span>
                ) : (
                  <span>Viviana Rooftop Grill remains infeasible because it still exceeds Bob's simulated limit of ${simulatedBudgetBob}.</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. HARD BUDGETS */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#222D38]">Individual Member Budgets</h2>
              <p className="text-xs text-[#65717A]">
                Every member declares three levels. An aggregate average is never used to hide an individual member's hard spending limit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Budgets Table */}
            <div className="lg:col-span-2 card-clean p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#222D38]">Declared Group Budgets</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#EAE7DF] text-[#65717A] uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Member</th>
                      <th className="p-2.5">Preferred</th>
                      <th className="p-2.5">Stretch</th>
                      <th className="p-2.5 font-bold text-[#A64F49]">Strict Hard Limit</th>
                      <th className="p-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9D6CD]">
                    {event.budgets.map(b => (
                      <tr key={b.id} className="hover:bg-[#EAE7DF]/50">
                        <td className="p-2.5 font-bold text-[#222D38]">{b.user.name}</td>
                        <td className="p-2.5 text-[#527C75] font-semibold">${b.preferredBudget}</td>
                        <td className="p-2.5 text-[#B77B35] font-semibold">${b.stretchBudget}</td>
                        <td className="p-2.5 font-bold text-[#A64F49]">${b.hardLimit}</td>
                        <td className="p-2.5 text-[#65717A]">{b.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* My Budget Form */}
            <div className="card-clean p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#222D38]">My Spending Limits</h3>
              <form onSubmit={handleSaveBudget} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#527C75] uppercase mb-1">Preferred ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={myPrefBudget}
                    onChange={e => setMyPrefBudget(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B77B35] uppercase mb-1">Stretch ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={myStretchBudget}
                    onChange={e => setMyStretchBudget(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A64F49] uppercase mb-1">Hard Limit ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={myHardLimit}
                    onChange={e => setMyHardLimit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="w-full py-2 bg-[#294D68] text-white text-xs font-bold rounded hover:bg-[#1e384d]"
                >
                  {savingBudget ? 'Saving...' : 'Update My Limits'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. AVAILABILITY MATRIX */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#222D38]">Group Availability Matrix</h2>
              <p className="text-xs text-[#65717A]">
                Aggregates candidate time slots to find the highest overlapping participation.
              </p>
            </div>
          </div>

          <div className="card-clean p-5 space-y-4">
            <div className="space-y-3">
              {event.availabilities?.map(a => (
                <div key={a.id} className="p-3 bg-[#F4F1EA] rounded-md border border-[#D9D6CD] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#222D38]">{a.user.name}</span>
                    <span className="text-[#65717A] ml-2">Slot: {a.date} ({a.timeSlot})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.status === 'AVAILABLE' ? 'bg-[#477B62]/15 text-[#477B62]' : 'bg-[#B77B35]/15 text-[#B77B35]'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. VENUES & TRAVEL */}
      {activeTab === 'venues' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#222D38]">Venues & Travel Estimates</h2>
              <p className="text-xs text-[#65717A]">
                Demonstration mode with verified local venues and traffic transit modeling.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'R-City Courtyard Bistro',
                cost: '$35/person',
                rating: '4.6 ★',
                transit: '18 min (5.2 km)',
                traffic: 'Low Congestion',
                status: 'CONFIRMED'
              },
              {
                title: 'Viviana Rooftop Grill',
                cost: '$55/person',
                rating: '4.8 ★',
                transit: '38 min (16.4 km)',
                traffic: 'Moderate Congestion',
                status: 'CONFIRMED'
              },
              {
                title: 'Phoenix Grand Arcade & Eatery',
                cost: '$42/person',
                rating: '4.4 ★',
                transit: '24 min (8.1 km)',
                traffic: 'Low Congestion',
                status: 'UNVERIFIED'
              }
            ].map((v, idx) => (
              <div key={idx} className="card-clean p-5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#222D38]">{v.title}</span>
                  <span className="text-[#527C75] font-bold">{v.cost}</span>
                </div>
                <div className="text-xs text-[#65717A] space-y-1">
                  <div>Rating: <strong>{v.rating}</strong></div>
                  <div>Commute from center: <strong>{v.transit}</strong></div>
                  <div>Traffic: <strong>{v.traffic}</strong></div>
                </div>
                <div className="pt-2 border-t border-[#D9D6CD] flex justify-between items-center text-[10px]">
                  <span className="font-mono text-[#65717A]">DEMO VENUE</span>
                  <span className="px-2 py-0.5 rounded bg-[#477B62]/10 text-[#477B62] font-bold">
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TASKS & RESPONSIBILITIES */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-[#222D38]">Tasks & Responsibilities</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {event.tasks.map(t => (
                <div key={t.id} className="card-clean p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#222D38]">{t.title}</div>
                    <div className="text-[#65717A] mt-0.5">
                      Assigned to: <strong>{t.assignedTo?.name || 'Unassigned'}</strong>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'URGENT' ? 'bg-[#A64F49]/15 text-[#A64F49]' : 'bg-[#EAE7DF] text-[#65717A]'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#477B62]/10 text-[#477B62] text-[10px] font-bold">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task Form */}
            <div className="card-clean p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#222D38]">Add Task</h3>
              <form onSubmit={handleAddTask} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                />
                <select
                  value={taskAssignee}
                  onChange={e => setTaskAssignee(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                >
                  <option value="">Unassigned</option>
                  {event.members.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#294D68] text-white text-xs font-bold rounded"
                >
                  Add Task
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 8. ITINERARY */}
      {activeTab === 'itinerary' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-[#222D38]">Event Timeline & Itinerary</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {event.itineraryItems.map(item => (
                <div key={item.id} className="card-clean p-4 flex items-start space-x-3 text-xs">
                  <div className="font-mono font-bold text-[#294D68] shrink-0 pt-0.5">
                    {item.startTime}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="font-bold text-[#222D38]">{item.title}</div>
                    {item.location && <div className="text-[#65717A]">{item.location}</div>}
                    {item.notes && <div className="text-[11px] text-[#65717A] italic">{item.notes}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="card-clean p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#222D38]">Add Step</h3>
              <form onSubmit={handleAddItinerary} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Activity / Step..."
                  value={itinTitle}
                  onChange={e => setItinTitle(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                />
                <input
                  type="time"
                  required
                  value={itinTime}
                  onChange={e => setItinTime(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                />
                <input
                  type="text"
                  placeholder="Location / Booth..."
                  value={itinLoc}
                  onChange={e => setItinLoc(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-[#294D68] text-white text-xs font-bold rounded"
                >
                  Add to Itinerary
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 9. EXPENSE TRACKING */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#222D38]">Shared Expenses & Penny-Accurate Splits</h2>
              <p className="text-xs text-[#65717A]">
                Expenses are split accurately to the penny. Balances show who owes whom.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {event.expenses.map(exp => (
                <div key={exp.id} className="card-clean p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#222D38] text-sm">{exp.title}</span>
                    <span className="font-bold text-[#477B62] text-sm">${exp.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="text-[#65717A]">
                    Paid by <strong>{exp.payer.name}</strong> · Method: {exp.splitMethod}
                  </div>
                  <div className="pt-2 border-t border-[#D9D6CD] flex flex-wrap gap-2 text-[11px]">
                    {exp.participants.map(p => (
                      <span key={p.userId} className="px-2 py-0.5 bg-[#EAE7DF] rounded text-[#222D38]">
                        {p.user.name}: ${p.shareAmount.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card-clean p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#222D38]">Record Expense</h3>
              <form onSubmit={handleAddExpense} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Expense description..."
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Total amount ($)"
                  value={expAmount}
                  onChange={e => setExpAmount(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                />
                <select
                  value={expSplitMethod}
                  onChange={e => setExpSplitMethod(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                >
                  <option value="EQUAL">Equal Split</option>
                  <option value="PARTICIPANT_BASED">Participant-Based Split</option>
                </select>
                <button
                  type="submit"
                  className="w-full py-2 bg-[#294D68] text-white text-xs font-bold rounded"
                >
                  Split & Track Expense
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 10. PLAN LOCK & CHANGE REQUESTS */}
      {activeTab === 'lock' && (
        <div className="space-y-6">
          {isLocked ? (
            <div className="card-clean p-6 space-y-6">
              <div className="flex items-center space-x-2 text-[#294D68] font-heading font-bold text-lg">
                <LockKey size={24} weight="bold" />
                <span>This Plan is LOCKED</span>
              </div>
              <p className="text-xs text-[#65717A]">
                The group has finalized date, venue, and budget. Any major modifications must be formally requested and approved by the organizer.
              </p>

              {/* Submit Change Request Form */}
              <div className="p-4 bg-[#F4F1EA] rounded-md border border-[#D9D6CD] space-y-3">
                <h4 className="font-heading font-bold text-sm text-[#222D38]">Submit Formal Change Request</h4>
                <form onSubmit={handleCreateChangeRequest} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Proposed change (e.g. Move start time back by 30 mins)..."
                    value={changeDesc}
                    onChange={e => setChangeDesc(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                  />
                  <textarea
                    rows={2}
                    required
                    placeholder="Reason for change..."
                    value={changeReason}
                    onChange={e => setChangeReason(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#294D68] text-white text-xs font-bold rounded"
                  >
                    Submit Change Request
                  </button>
                </form>
              </div>

              {/* Pending Change Requests */}
              <div className="space-y-3">
                <h4 className="font-heading font-bold text-sm text-[#222D38]">Change Requests History</h4>
                {event.changeRequests.map(cr => (
                  <div key={cr.id} className="p-3 bg-[#EAE7DF] rounded flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-[#222D38]">{cr.proposedChange}</div>
                      <div className="text-[#65717A]">Reason: {cr.reason} · Requester: {cr.requestedBy?.name}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase">{cr.status}</span>
                      {isOrganizer && cr.status === 'PENDING' && (
                        <button
                          onClick={() => handleApproveChangeRequest(cr.id)}
                          className="px-2.5 py-1 bg-[#477B62] text-white rounded text-[10px] font-bold"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-clean p-6 space-y-4">
              <h3 className="font-heading font-bold text-base text-[#222D38]">Pre-Lock Finalization Checklist</h3>
              <p className="text-xs text-[#65717A]">
                Verify that date, venue proposals, and voting consensus are complete before locking.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} weight="fill" className="text-[#477B62]" />
                  <span>Selected Date: {event.selectedDate || 'Configured'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} weight="fill" className="text-[#477B62]" />
                  <span>Proposals Voted: {event.proposals.length} options evaluated</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle size={16} weight="fill" className="text-[#477B62]" />
                  <span>Individual Budgets Registered: {event.budgets.length} members</span>
                </div>
              </div>

              {isOrganizer ? (
                <button
                  onClick={handleLockPlan}
                  className="px-5 py-2.5 bg-[#294D68] text-white text-xs font-bold rounded hover:bg-[#1e384d] flex items-center space-x-2 mt-4"
                >
                  <LockKey size={16} weight="bold" />
                  <span>Lock and Finalize This Plan</span>
                </button>
              ) : (
                <p className="text-xs text-[#65717A] italic">
                  Only the organizer ({event.organizer.name}) can execute the final plan lock.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 11. DECISION AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="card-clean p-5 space-y-4">
          <h3 className="font-heading font-bold text-base text-[#222D38]">Group Decision Audit Trail</h3>
          <p className="text-xs text-[#65717A]">
            Complete permanent record of votes, proposal additions, engine calculations, manual overrides, and locks.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {event.decisionHistory.map(dh => (
              <div key={dh.id} className="p-3 bg-[#F4F1EA] rounded-md border border-[#D9D6CD] text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] font-bold text-[#294D68]">{dh.actionType}</span>
                  <span className="text-[10px] text-[#65717A]">{new Date(dh.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-[#222D38]">
                  Actor: <strong>{dh.actor?.name}</strong>
                </div>
                {dh.details && (
                  <div className="text-[11px] text-[#65717A] font-mono bg-white p-1.5 rounded border border-[#D9D6CD]">
                    {dh.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
