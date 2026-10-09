import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UsersThree, Plus, Key, ArrowRight, Check, Copy } from '@phosphor-icons/react';
import { api } from '../services/api';
import { Group } from '../types';

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    setLoading(true);
    try {
      const data = await api.getGroups();
      setGroups(data.groups || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    try {
      const res = await api.createGroup({ name: newGroupName, description: newGroupDesc });
      setSuccess(`Group "${res.group.name}" created with code: ${res.group.inviteCode}`);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      loadGroups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      const res = await api.joinGroup(joinCode);
      setSuccess(res.message);
      setShowJoinModal(false);
      setJoinCode('');
      loadGroups();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#222D38]">
            Friend Groups
          </h1>
          <p className="text-sm text-[#65717A] mt-1">
            Spaces for your friends to co-plan events, pool availability, and align on budgets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-3.5 py-2 rounded-md bg-[#FBF9F4] border border-[#D9D6CD] text-xs font-semibold text-[#222D38] hover:bg-[#EAE7DF] transition-colors flex items-center space-x-1.5"
          >
            <Key size={16} />
            <span>Join with Code</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d] transition-colors flex items-center space-x-1.5"
          >
            <Plus size={16} weight="bold" />
            <span>Create Group</span>
          </button>
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

      {loading ? (
        <div className="card-clean p-8 text-center text-xs text-[#65717A]">Loading friend groups...</div>
      ) : groups.length === 0 ? (
        <div className="card-clean p-10 text-center space-y-3">
          <UsersThree size={40} className="mx-auto text-[#65717A]" />
          <h3 className="font-heading text-base font-bold text-[#222D38]">No groups joined yet</h3>
          <p className="text-xs text-[#65717A] max-w-sm mx-auto">
            Create a friend group or ask a friend for their 6-character invite code.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map(g => (
            <div key={g.id} className="card-clean p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-xl font-bold text-[#222D38]">
                    <Link to={`/groups/${g.id}`} className="hover:text-[#294D68]">
                      {g.name}
                    </Link>
                  </h3>
                  <button
                    onClick={() => copyCode(g.inviteCode)}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#EAE7DF] hover:bg-[#dfdbd1] text-[11px] font-mono font-semibold text-[#294D68] transition-colors"
                    title="Click to copy invite code"
                  >
                    <span>{g.inviteCode}</span>
                    {copiedCode === g.inviteCode ? <Check size={12} weight="bold" /> : <Copy size={12} />}
                  </button>
                </div>
                <p className="text-xs text-[#65717A] line-clamp-2">
                  {g.description || 'Friend group workspace for shared dinners and outings.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[#D9D6CD] flex items-center justify-between text-xs">
                <span className="text-[#65717A] font-medium">
                  {g.members?.length || 0} Members
                </span>
                <Link
                  to={`/groups/${g.id}`}
                  className="font-bold text-[#294D68] hover:underline flex items-center space-x-1"
                >
                  <span>Open Group</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#222D38]/50 flex items-center justify-center p-4">
          <div className="bg-[#FBF9F4] border border-[#D9D6CD] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-heading text-lg font-bold text-[#222D38]">Create a Friend Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Crew, Hiking Gang"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What kinds of outings does this group plan together?"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#65717A] hover:text-[#222D38]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d]"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-[#222D38]/50 flex items-center justify-center p-4">
          <div className="bg-[#FBF9F4] border border-[#D9D6CD] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-heading text-lg font-bold text-[#222D38]">Join an Existing Group</h3>
            <p className="text-xs text-[#65717A]">
              Enter the unique 6-character code provided by your group organizer.
            </p>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#222D38] uppercase tracking-wider mb-1">
                  Invite Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WEEKEND"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono tracking-wider uppercase bg-white border border-[#D9D6CD] rounded-md focus:outline-none focus:border-[#294D68]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#65717A] hover:text-[#222D38]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[#294D68] text-white text-xs font-bold hover:bg-[#1e384d]"
                >
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
