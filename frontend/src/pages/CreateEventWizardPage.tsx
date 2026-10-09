import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  CalendarCheck, 
  Coins, 
  MapPin, 
  Sparkle,
  Plus,
  Trash
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { Group } from '../types';

export const CreateEventWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGroupId = searchParams.get('groupId') || '';

  const [step, setStep] = useState(1);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [groupId, setGroupId] = useState(initialGroupId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('DINNER');

  // Step 2: Date & RSVP
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('19:30 - 22:30');
  const [rsvpDeadline, setRsvpDeadline] = useState('');
  const [votingDeadline, setVotingDeadline] = useState('');

  // Step 3: Budget
  const [preferredBudget, setPreferredBudget] = useState(35);
  const [stretchBudget, setStretchBudget] = useState(45);
  const [hardLimit, setHardLimit] = useState(50);

  // Step 4: Venues / Suggestions
  const [venueSuggestions, setVenueSuggestions] = useState<Array<{ title: string; estimatedCost: number; location: string }>>([
    { title: 'R-City Courtyard Bistro', estimatedCost: 35, location: 'Ghatkopar West' },
    { title: 'Viviana Rooftop Grill', estimatedCost: 55, location: 'Thane West' }
  ]);
  const [newVenueTitle, setNewVenueTitle] = useState('');
  const [newVenueCost, setNewVenueCost] = useState(40);
  const [newVenueLoc, setNewVenueLoc] = useState('');

  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await api.getGroups();
        setGroups(data.groups || []);
        if (!groupId && data.groups?.length > 0) {
          setGroupId(data.groups[0].id);
        }
      } catch (err) {}
    }
    loadGroups();
  }, []);

  const addVenueSuggestion = () => {
    if (!newVenueTitle) return;
    setVenueSuggestions(prev => [
      ...prev,
      { title: newVenueTitle, estimatedCost: newVenueCost, location: newVenueLoc || 'Local area' }
    ]);
    setNewVenueTitle('');
    setNewVenueCost(40);
    setNewVenueLoc('');
  };

  const removeVenueSuggestion = (index: number) => {
    setVenueSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateEvent = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.createEvent({
        groupId,
        title,
        description,
        eventType,
        selectedDate: selectedDate || undefined,
        selectedTime: selectedTime || undefined,
        rsvpDeadline: rsvpDeadline || undefined,
        votingDeadline: votingDeadline || undefined,
        preferredBudget: Number(preferredBudget),
        stretchBudget: Number(stretchBudget),
        hardLimit: Number(hardLimit),
        venueSuggestions
      });

      navigate(`/events/${res.event.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!title.trim()) {
        setError('Please provide an event title.');
        return;
      }
      if (!groupId) {
        setError('Please select a friend group for this event.');
        return;
      }
    } else if (step === 3) {
      if (preferredBudget > stretchBudget) {
        setError('Preferred budget cannot exceed stretch budget.');
        return;
      }
      if (stretchBudget > hardLimit) {
        setError('Stretch budget cannot exceed hard spending limit.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Wizard Header & Steps */}
      <div className="text-center space-y-1">
        <h1 className="font-heading text-2xl font-extrabold text-[#222D38]">
          Plan a Group Event
        </h1>
        <p className="text-xs text-[#65717A]">
          Set up preferences, date options, individual spending limits, and venue proposals.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between px-2">
        {[
          { num: 1, label: 'Details' },
          { num: 2, label: 'Dates' },
          { num: 3, label: 'Budgets' },
          { num: 4, label: 'Venues' },
          { num: 5, label: 'Review' }
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= s.num ? 'bg-[#294D68] text-white' : 'bg-[#EAE7DF] text-[#65717A]'
            }`}>
              {step > s.num ? <Check size={14} weight="bold" /> : s.num}
            </div>
            <span className={`hidden sm:inline text-xs font-semibold ${
              step === s.num ? 'text-[#222D38]' : 'text-[#65717A]'
            }`}>
              {s.label}
            </span>
            {idx < 4 && <div className="w-4 sm:w-8 h-0.5 bg-[#D9D6CD]" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-[#A64F49]/10 border border-[#A64F49]/30 rounded-md text-xs font-semibold text-[#A64F49]">
          {error}
        </div>
      )}

      {/* Step Container Card */}
      <div className="card-clean p-6 space-y-6">
        {/* STEP 1: DETAILS */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-[#222D38]">Step 1: Event Details</h3>

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Friend Group
              </label>
              {groups.length === 0 ? (
                <div className="text-xs text-[#A64F49]">
                  You have not joined any groups yet. Please <Link to="/groups" className="underline font-bold">create a group first</Link>.
                </div>
              ) : (
                <select
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Event Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Birthday Dinner, Saturday Board Games, Weekend Getaway"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
              >
                <option value="DINNER">Dinner / Restaurant</option>
                <option value="BIRTHDAY">Birthday Celebration</option>
                <option value="TRIP">Weekend Trip</option>
                <option value="OUTING">City Outing</option>
                <option value="SPORTS">Sports / Fitness</option>
                <option value="CAMPING">Camping / Outdoor</option>
                <option value="PARTY">Party / Social</option>
                <option value="OTHER">Other Activity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Description & Notes
              </label>
              <textarea
                rows={3}
                placeholder="Brief summary or context for group members..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
              />
            </div>
          </div>
        )}

        {/* STEP 2: DATES & AVAILABILITY */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-[#222D38]">Step 2: Dates & Deadlines</h3>

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Target Date (Optional Initial Pick)
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                Proposed Time Slot
              </label>
              <input
                type="text"
                placeholder="e.g. 19:30 - 22:30 or Saturday Afternoon"
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                  RSVP Deadline
                </label>
                <input
                  type="date"
                  value={rsvpDeadline}
                  onChange={e => setRsvpDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                  Voting Deadline
                </label>
                <input
                  type="date"
                  value={votingDeadline}
                  onChange={e => setVotingDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BUDGET */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-[#222D38]">Step 3: Your Personal Budget Limits</h3>
            <p className="text-xs text-[#65717A]">
              PlanWise respects individual constraints. Your hard limit will be strictly enforced by the recommendation engine.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-[#F4F1EA] border border-[#D9D6CD] rounded-md space-y-1">
                <label className="block text-xs font-bold text-[#527C75] uppercase tracking-wider">
                  Preferred Budget
                </label>
                <div className="text-[11px] text-[#65717A]">Ideal comfortable spend</div>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-bold text-[#65717A] mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    value={preferredBudget}
                    onChange={e => setPreferredBudget(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm font-bold bg-white border border-[#D9D6CD] rounded"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F4F1EA] border border-[#D9D6CD] rounded-md space-y-1">
                <label className="block text-xs font-bold text-[#B77B35] uppercase tracking-wider">
                  Stretch Budget
                </label>
                <div className="text-[11px] text-[#65717A]">Acceptable for high value</div>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-bold text-[#65717A] mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    value={stretchBudget}
                    onChange={e => setStretchBudget(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm font-bold bg-white border border-[#D9D6CD] rounded"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F4F1EA] border border-[#D9D6CD] rounded-md space-y-1">
                <label className="block text-xs font-bold text-[#A64F49] uppercase tracking-wider">
                  Hard Limit
                </label>
                <div className="text-[11px] text-[#65717A]">Non-negotiable ceiling</div>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-bold text-[#65717A] mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    value={hardLimit}
                    onChange={e => setHardLimit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-sm font-bold bg-white border border-[#D9D6CD] rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: VENUE PROPOSALS */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-[#222D38]">Step 4: Initial Venue Suggestions</h3>
            <p className="text-xs text-[#65717A]">
              Add candidate venues for your group to vote on and evaluate trade-offs.
            </p>

            <div className="space-y-2">
              {venueSuggestions.map((s, idx) => (
                <div key={idx} className="p-3 bg-[#F4F1EA] border border-[#D9D6CD] rounded-md flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#222D38]">{s.title}</span>
                    <span className="text-[#65717A] ml-2">({s.location})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-[#527C75]">${s.estimatedCost}/person</span>
                    <button
                      type="button"
                      onClick={() => removeVenueSuggestion(idx)}
                      className="text-[#A64F49] hover:opacity-80"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add suggestion inputs */}
            <div className="pt-2 border-t border-[#D9D6CD] space-y-3">
              <div className="text-xs font-bold text-[#65717A] uppercase tracking-wider">
                Add Another Suggestion
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Venue or activity name"
                  value={newVenueTitle}
                  onChange={e => setNewVenueTitle(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                />
                <input
                  type="text"
                  placeholder="Area / Location"
                  value={newVenueLoc}
                  onChange={e => setNewVenueLoc(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Cost/person"
                    value={newVenueCost}
                    onChange={e => setNewVenueCost(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 text-xs bg-white border border-[#D9D6CD] rounded"
                  />
                  <button
                    type="button"
                    onClick={addVenueSuggestion}
                    className="flex-1 py-1.5 bg-[#EAE7DF] border border-[#D9D6CD] hover:bg-[#dfdbd1] text-xs font-bold rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-bold text-[#222D38]">Step 5: Review & Confirm</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F4F1EA] rounded-md border border-[#D9D6CD] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#65717A]">Title:</span>
                  <span className="font-bold text-[#222D38]">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#65717A]">Event Type:</span>
                  <span className="font-bold text-[#222D38]">{eventType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#65717A]">Target Date & Time:</span>
                  <span className="font-bold text-[#222D38]">{selectedDate || 'Open discussion'} ({selectedTime})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#65717A]">Your Hard Budget Limit:</span>
                  <span className="font-bold text-[#A64F49]">${hardLimit}/person</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#65717A]">Initial Proposals:</span>
                  <span className="font-bold text-[#222D38]">{venueSuggestions.length} items</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#D9D6CD]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="px-4 py-2 text-xs font-bold text-[#65717A] hover:text-[#222D38] flex items-center space-x-1"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d] flex items-center space-x-1.5"
            >
              <span>Continue</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateEvent}
              className="px-6 py-2.5 rounded-md bg-[#477B62] text-white text-xs font-bold hover:bg-[#3b6752] flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <span>{loading ? 'Creating Event...' : 'Create & Open Event'}</span>
              <Check size={14} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
