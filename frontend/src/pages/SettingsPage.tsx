import React from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { User, ShieldCheck, Check } from '@phosphor-icons/react';

export const SettingsPage: React.FC = () => {
  const { user, quickDemoLogin } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-extrabold text-[#222D38]">
        Profile & Settings
      </h1>

      {/* Account Info */}
      <div className="card-clean p-6 space-y-4">
        <h3 className="font-heading font-bold text-base text-[#222D38]">Account Details</h3>
        <div className="flex items-center space-x-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full border border-[#D9D6CD]" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#294D68] text-white flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-heading font-bold text-lg text-[#222D38]">{user?.name}</div>
            <div className="text-xs text-[#65717A]">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Demo Persona Switcher */}
      <div className="card-clean p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={20} weight="bold" className="text-[#527C75]" />
          <h3 className="font-heading font-bold text-base text-[#222D38]">Demo Profile Switcher</h3>
        </div>
        <p className="text-xs text-[#65717A]">
          Switch personas instantly to test how the Group Decision Intelligence engine handles different budget limits, voting behaviors, and task assignments.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {DEMO_ACCOUNTS.map(acc => (
            <button
              key={acc.email}
              onClick={() => quickDemoLogin(acc.email)}
              className={`p-3 text-left rounded-md border text-xs transition-colors flex items-start justify-between ${
                user?.email === acc.email ? 'bg-[#294D68]/10 border-[#294D68]' : 'bg-[#F4F1EA] border-[#D9D6CD] hover:bg-[#EAE7DF]'
              }`}
            >
              <div>
                <div className="font-bold text-[#222D38]">{acc.name}</div>
                <div className="text-[11px] text-[#65717A]">{acc.role}</div>
                <div className="text-[10px] text-[#527C75] font-mono mt-1">{acc.budgetText}</div>
              </div>
              {user?.email === acc.email && <Check size={16} weight="bold" className="text-[#294D68]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
