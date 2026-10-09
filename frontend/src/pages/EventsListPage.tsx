import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Plus, ArrowRight, Clock } from '@phosphor-icons/react';
import { api } from '../services/api';

export const EventsListPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvents()
      .then(res => setEvents(res.events || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#222D38]">
            All Group Events
          </h1>
          <p className="text-sm text-[#65717A] mt-1">
            Browse all events across your joined friend circles.
          </p>
        </div>

        <Link
          to="/events/new"
          className="px-4 py-2 bg-[#294D68] text-white text-xs font-bold rounded-md hover:bg-[#1e384d] flex items-center space-x-1.5"
        >
          <Plus size={16} weight="bold" />
          <span>New Event</span>
        </Link>
      </div>

      {loading ? (
        <div className="card-clean p-8 text-center text-xs text-[#65717A]">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="card-clean p-8 text-center space-y-2">
          <CalendarCheck size={36} className="mx-auto text-[#65717A]" />
          <div className="text-sm font-semibold">No events found</div>
          <Link to="/events/new" className="text-xs font-bold text-[#294D68] underline">
            Plan your first event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(event => (
            <div key={event.id} className="card-clean p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#527C75] text-[10px] uppercase">
                    {event.group?.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EAE7DF] text-[#65717A]">
                    {event.status}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-bold text-[#222D38]">
                  <Link to={`/events/${event.id}`} className="hover:text-[#294D68]">
                    {event.title}
                  </Link>
                </h3>

                <p className="text-xs text-[#65717A] line-clamp-2">
                  {event.description || 'Collaborative group plan.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#D9D6CD] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-[#65717A]">
                  <Clock size={14} />
                  <span>{event.selectedDate || 'Date open'}</span>
                </div>
                <Link
                  to={`/events/${event.id}`}
                  className="font-bold text-[#294D68] hover:underline flex items-center space-x-1"
                >
                  <span>Open Workspace</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
