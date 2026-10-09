import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  UsersThree, 
  Copy, 
  Check, 
  EnvelopeSimple, 
  Plus, 
  Trash, 
  SignOut, 
  CalendarCheck,
  ShieldCheck,
  ArrowRight
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { Group } from '../types';
import { useAuth } from '../context/AuthContext';

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Invite by email state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) loadGroup();
  }, [groupId]);

  async function loadGroup() {
    setLoading(true);
    try {
      const data = await api.getGroup(groupId!);
      setGroup(data.group);
    } catch (err: any) {
      setError(err.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  }

  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await api.inviteMember(groupId!, inviteEmail);
      setInviteResult(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail('');
      loadGroup();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string, isSelf: boolean) => {
    if (!window.confirm(isSelf ? 'Are you sure you want to leave this group?' : 'Remove this member from the group?')) return;
    try {
      await api.removeGroupMember(groupId!, userId);
      if (isSelf) {
        navigate('/groups');
      } else {
        setSuccess('Member removed.');
        loadGroup();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="card-clean p-8 text-center text-xs text-[#65717A]">Loading group...</div>;
  }

  if (!group) {
    return (
      <div className="card-clean p-8 text-center space-y-3">
        <div className="text-sm font-semibold text-[#A64F49]">Group not found</div>
        <Link to="/groups" className="text-xs font-bold text-[#294D68] hover:underline">
          Return to groups
        </Link>
      </div>
    );
  }

  const myMembership = group.members.find(m => m.userId === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-clean p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#222D38]">
              {group.name}
            </h1>
            {isAdmin && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#294D68]/15 text-[#294D68]">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-[#65717A] mt-1 max-w-xl">
            {group.description || 'Shared friend circle for co-planning group events.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#EAE7DF] border border-[#D9D6CD] px-3 py-2 rounded-md text-xs font-mono">
            <span className="text-[#65717A] font-sans">Invite Code:</span>
            <span className="font-bold text-[#294D68]">{group.inviteCode}</span>
            <button
              onClick={handleCopyCode}
              className="text-[#65717A] hover:text-[#222D38] ml-1"
              title="Copy code"
            >
              {copiedCode ? <Check size={14} weight="bold" className="text-[#477B62]" /> : <Copy size={14} />}
            </button>
          </div>

          <Link
            to={`/events/new?groupId=${group.id}`}
            className="px-3.5 py-2 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d] transition-colors flex items-center space-x-1.5"
          >
            <Plus size={16} weight="bold" />
            <span>Plan Event</span>
          </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Members & Invite */}
        <div className="lg:col-span-1 space-y-6">
          {/* Members Card */}
          <div className="card-clean p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D6CD] pb-3">
              <h3 className="font-heading font-bold text-base text-[#222D38]">
                Members ({group.members?.length || 0})
              </h3>
            </div>

            <div className="space-y-3">
              {group.members?.map(m => (
                <div key={m.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 truncate">
                    {m.user?.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt={m.user.name} className="w-7 h-7 rounded-full border border-[#D9D6CD]" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#294D68] text-white flex items-center justify-center font-bold text-xs">
                        {m.user?.name?.charAt(0)}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-semibold text-[#222D38] truncate">{m.user?.name}</div>
                      <div className="text-[10px] text-[#65717A] truncate">{m.user?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      m.role === 'ADMIN' ? 'bg-[#294D68]/15 text-[#294D68]' : 'bg-[#EAE7DF] text-[#65717A]'
                    }`}>
                      {m.role}
                    </span>
                    {(isAdmin && m.userId !== user?.id) && (
                      <button
                        onClick={() => handleRemoveMember(m.userId, false)}
                        className="text-[#65717A] hover:text-[#A64F49]"
                        title="Remove member"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Leave Group Action */}
            <div className="pt-3 border-t border-[#D9D6CD]">
              <button
                onClick={() => handleRemoveMember(user!.id, true)}
                className="text-xs text-[#A64F49] hover:underline flex items-center space-x-1"
              >
                <SignOut size={14} />
                <span>Leave this group</span>
              </button>
            </div>
          </div>

          {/* Email Invite Card */}
          <div className="card-clean p-5 space-y-3">
            <h3 className="font-heading font-bold text-sm text-[#222D38]">Invite Friend by Email</h3>
            <p className="text-xs text-[#65717A]">
              Send an invite token to your friend or share your group invite code directly.
            </p>
            {inviteResult && (
              <div className="p-2 bg-[#477B62]/10 text-[#477B62] rounded text-xs font-semibold">
                {inviteResult}
              </div>
            )}
            <form onSubmit={handleSendInvite} className="space-y-3">
              <input
                type="email"
                required
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
              />
              <button
                type="submit"
                disabled={inviting}
                className="w-full py-2 bg-[#EAE7DF] hover:bg-[#dfdbd1] border border-[#D9D6CD] text-[#222D38] text-xs font-bold rounded-md transition-colors"
              >
                {inviting ? 'Generating Invite...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Group Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg text-[#222D38]">Group Events</h2>
            <Link
              to={`/events/new?groupId=${group.id}`}
              className="text-xs font-bold text-[#294D68] hover:underline flex items-center space-x-1"
            >
              <Plus size={14} weight="bold" />
              <span>Plan New Outing</span>
            </Link>
          </div>

          {!group.events || group.events.length === 0 ? (
            <div className="card-clean p-8 text-center space-y-2">
              <CalendarCheck size={36} className="mx-auto text-[#65717A]" />
              <div className="text-sm font-semibold text-[#222D38]">No events currently planned</div>
              <p className="text-xs text-[#65717A]">
                Start by proposing a dinner, birthday, or weekend trip with the group.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {group.events.map((ev: any) => (
                <div key={ev.id} className="card-clean p-4 flex items-center justify-between hover:border-[#294D68]/40 transition-colors">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-base text-[#222D38]">
                        <Link to={`/events/${ev.id}`} className="hover:text-[#294D68]">
                          {ev.title}
                        </Link>
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#EAE7DF] text-[#65717A]">
                        {ev.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#65717A] mt-1">
                      {ev.selectedDate || 'Date in discussion'} · Type: {ev.eventType}
                    </div>
                  </div>

                  <Link
                    to={`/events/${ev.id}`}
                    className="px-3 py-1.5 rounded bg-[#294D68] text-white text-xs font-semibold hover:bg-[#1e384d] transition-colors flex items-center space-x-1"
                  >
                    <span>Open Plan</span>
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
