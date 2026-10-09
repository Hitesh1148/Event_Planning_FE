import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  HourglassHigh, 
  MapPin, 
  Clock, 
  UsersThree, 
  CheckCircle, 
  WarningCircle, 
  ArrowLeft,
  NavigationArrow,
  Receipt,
  Phone
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { EventDetail } from '../types';

export const LastMinuteModePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      api.getEvent(eventId)
        .then(res => setEvent(res.event))
        .finally(() => setLoading(false));
    }
  }, [eventId]);

  if (loading) {
    return <div className="card-clean p-12 text-center text-xs text-[#65717A]">Loading event-day mode...</div>;
  }

  if (!event) {
    return <div className="card-clean p-12 text-center text-xs text-[#A64F49]">Event not found.</div>;
  }

  const urgentTasks = event.tasks?.filter(t => t.status !== 'COMPLETED') || [];
  const attendingMembers = event.members?.filter(m => m.rsvpStatus === 'ATTENDING') || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with Return Action */}
      <div className="flex items-center justify-between">
        <Link
          to={`/events/${event.id}`}
          className="text-xs font-bold text-[#294D68] hover:underline flex items-center space-x-1"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Back to Event Workspace</span>
        </Link>
        <span className="px-2.5 py-0.5 rounded-full bg-[#C17A43]/15 text-[#C17A43] text-xs font-extrabold uppercase tracking-wider">
          Last-Minute Mode
        </span>
      </div>

      {/* Main Focus Card */}
      <div className="bg-[#294D68] text-white p-6 rounded-xl space-y-4 shadow-lg">
        <div className="space-y-1">
          <div className="text-xs text-[#EAE7DF] uppercase tracking-wider font-semibold">Today's Event</div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            {event.title}
          </h1>
        </div>

        {/* Countdown & Meeting Time */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-white/10 rounded-lg backdrop-blur-xs">
            <div className="text-[11px] text-[#EAE7DF]">Scheduled Start</div>
            <div className="font-heading text-lg font-bold mt-0.5">{event.selectedTime || '19:30'}</div>
          </div>
          <div className="p-3 bg-white/10 rounded-lg backdrop-blur-xs">
            <div className="text-[11px] text-[#EAE7DF]">Target Date</div>
            <div className="font-heading text-lg font-bold mt-0.5">{event.selectedDate || 'Today'}</div>
          </div>
        </div>
      </div>

      {/* Venue & Directions */}
      <div className="card-clean p-5 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#294D68] uppercase tracking-wider">
          <MapPin size={18} weight="bold" />
          <span>Venue & Meeting Point</span>
        </div>
        <div className="space-y-1">
          <h3 className="font-heading font-bold text-base text-[#222D38]">R-City Courtyard Bistro</h3>
          <p className="text-xs text-[#65717A]">LBS Rd, Ghatkopar West, Mumbai (Level 1 Central Fountain Entrance)</p>
        </div>
        <div className="pt-2 flex items-center space-x-3 text-xs">
          <a
            href="https://maps.google.com/?q=R-City+Mall"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-[#EAE7DF] hover:bg-[#dfdbd1] border border-[#D9D6CD] rounded text-[#222D38] font-bold flex items-center space-x-1.5"
          >
            <NavigationArrow size={14} weight="bold" />
            <span>Open Directions</span>
          </a>
          <span className="text-[#527C75] font-semibold">Estimated Commute: ~18 mins (Low Traffic)</span>
        </div>
      </div>

      {/* Attendees Quick Rollcall */}
      <div className="card-clean p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#222D38] uppercase tracking-wider">
            Attending Members ({attendingMembers.length})
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {attendingMembers.map(m => (
            <span key={m.id} className="px-2.5 py-1 rounded bg-[#EAE7DF] text-[#222D38] font-medium flex items-center space-x-1">
              <CheckCircle size={14} weight="fill" className="text-[#477B62]" />
              <span>{m.user.name}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Urgent Responsibilities */}
      <div className="card-clean p-5 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#A64F49] uppercase tracking-wider">
          <WarningCircle size={16} weight="bold" />
          <span>Outstanding Responsibilities ({urgentTasks.length})</span>
        </div>
        {urgentTasks.length === 0 ? (
          <p className="text-xs text-[#477B62] font-semibold">All assigned tasks completed!</p>
        ) : (
          <div className="space-y-2">
            {urgentTasks.map(t => (
              <div key={t.id} className="p-2.5 bg-[#F4F1EA] rounded border border-[#D9D6CD] flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-[#222D38]">{t.title}</div>
                  <div className="text-[#65717A]">Assigned to: <strong>{t.assignedTo?.name || 'Unassigned'}</strong></div>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C17A43]">{t.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chronological Itinerary */}
      <div className="card-clean p-5 space-y-3">
        <div className="text-xs font-bold text-[#222D38] uppercase tracking-wider">Day-of Itinerary</div>
        <div className="space-y-2 text-xs">
          {event.itineraryItems?.map(item => (
            <div key={item.id} className="p-2.5 bg-[#F4F1EA] rounded flex items-start space-x-3">
              <span className="font-mono font-bold text-[#294D68] shrink-0">{item.startTime}</span>
              <div>
                <div className="font-bold text-[#222D38]">{item.title}</div>
                {item.location && <div className="text-[#65717A] text-[11px]">{item.location}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
