import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, 
  UsersThree, 
  CheckCircle, 
  Clock, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  WarningCircle, 
  TrendUp,
  Tag,
  HourglassHigh
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [eventsRes, groupsRes] = await Promise.all([
        api.getEvents(),
        api.getGroups()
      ]);
      setEvents(eventsRes.events || []);
      setGroups(groupsRes.groups || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  // Find polls awaiting a vote for current user
  const eventsAwaitingVotes = events.filter(e => {
    if (e.status === 'LOCKED' || e.status === 'COMPLETED') return false;
    return e._count?.proposals > 0;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#222D38]">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#65717A] mt-1">
            Review active group decisions, upcoming timelines, and assigned responsibilities.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/groups"
            className="px-3.5 py-2 rounded-md bg-[#FBF9F4] border border-[#D9D6CD] text-xs font-semibold text-[#222D38] hover:bg-[#EAE7DF] transition-colors shadow-xs"
          >
            My Groups ({groups.length})
          </Link>
          <Link
            to="/events/new"
            className="px-4 py-2 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d] transition-colors shadow-sm flex items-center space-x-1.5"
          >
            <Plus size={16} weight="bold" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#A64F49]/10 border border-[#A64F49]/30 rounded-md text-xs font-semibold text-[#A64F49]">
          {error}
        </div>
      )}

      {/* Decision Intelligence Priority Banner */}
      {eventsAwaitingVotes.length > 0 && (
        <div className="p-4 bg-[#EAE7DF] border border-[#D9D6CD] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-[#C17A43]/15 text-[#C17A43] rounded-md shrink-0 mt-0.5">
              <HourglassHigh size={20} weight="bold" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#C17A43]">
                Group Polls Awaiting Feedback
              </div>
              <p className="text-sm font-semibold text-[#222D38] mt-0.5">
                "{eventsAwaitingVotes[0]?.title}" has venue proposals ready for your vote and budget limit.
              </p>
            </div>
          </div>
          <Link
            to={`/events/${eventsAwaitingVotes[0]?.id}`}
            className="px-3.5 py-1.5 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d] transition-colors shrink-0 flex items-center space-x-1.5"
          >
            <span>Vote in Event</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      )}

      {/* Active Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-[#222D38]">Upcoming Events</h2>
          <Link to="/events" className="text-xs font-bold text-[#294D68] hover:underline">
            View All Events ({events.length})
          </Link>
        </div>

        {loading ? (
          <div className="card-clean p-8 text-center text-xs text-[#65717A]">
            Loading group events...
          </div>
        ) : events.length === 0 ? (
          <div className="card-clean p-8 text-center space-y-3">
            <CalendarCheck size={36} weight="regular" className="mx-auto text-[#65717A]" />
            <div className="text-sm font-semibold text-[#222D38]">No upcoming events scheduled</div>
            <p className="text-xs text-[#65717A] max-w-sm mx-auto">
              Start planning a dinner, birthday, weekend trip, or hangout with your friend group.
            </p>
            <Link
              to="/events/new"
              className="inline-block mt-2 px-4 py-2 bg-[#294D68] text-white text-xs font-bold rounded-md hover:bg-[#1e384d]"
            >
              Start New Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(event => {
              const isLocked = event.status === 'LOCKED';
              return (
                <div 
                  key={event.id}
                  className="card-clean p-5 hover:border-[#294D68]/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#527C75] uppercase tracking-wide text-[10px]">
                        {event.group?.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isLocked 
                          ? 'bg-[#294D68]/15 text-[#294D68]' 
                          : 'bg-[#477B62]/15 text-[#477B62]'
                      }`}>
                        {event.status}
                      </span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-[#222D38] leading-tight">
                      <Link to={`/events/${event.id}`} className="hover:text-[#294D68]">
                        {event.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-[#65717A] line-clamp-2">
                      {event.description || 'Collaborative group event planning.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D9D6CD] space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#65717A]">
                      <div className="flex items-center space-x-1.5">
                        <Clock size={14} />
                        <span>{event.selectedDate || 'Date in discussion'}</span>
                      </div>
                      <div>
                        {event._count?.proposals || 0} Proposals
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {event.members?.slice(0, 4).map((m: any) => (
                          <div 
                            key={m.id}
                            className="w-6 h-6 rounded-full border border-white bg-[#EAE7DF] text-[#222D38] flex items-center justify-center text-[10px] font-bold"
                            title={m.user?.name}
                          >
                            {m.user?.name?.charAt(0)}
                          </div>
                        ))}
                      </div>

                      <Link
                        to={`/events/${event.id}`}
                        className="text-xs font-bold text-[#294D68] hover:underline flex items-center space-x-1"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight size={12} weight="bold" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Friend Groups Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-[#222D38]">My Friend Groups</h2>
          <Link to="/groups" className="text-xs font-bold text-[#294D68] hover:underline">
            Manage Groups
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <div key={g.id} className="card-clean p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-base text-[#222D38]">{g.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAE7DF] text-[#65717A]">
                  Code: {g.inviteCode}
                </span>
              </div>
              <p className="text-xs text-[#65717A] line-clamp-2">
                {g.description || 'Shared friend workspace for group events.'}
              </p>
              <div className="pt-2 border-t border-[#D9D6CD] flex items-center justify-between text-xs">
                <span className="text-[#65717A]">{g.members?.length || 0} Members</span>
                <Link to={`/groups/${g.id}`} className="font-bold text-[#294D68] hover:underline">
                  View Group →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
