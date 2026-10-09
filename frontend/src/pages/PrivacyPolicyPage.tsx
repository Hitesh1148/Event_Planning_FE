import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from '@phosphor-icons/react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Link to="/" className="text-xs font-bold text-[#294D68] hover:underline flex items-center space-x-1">
        <ArrowLeft size={14} weight="bold" />
        <span>Return to Home</span>
      </Link>

      <div className="card-clean p-8 space-y-6">
        <div className="flex items-center space-x-3">
          <ShieldCheck size={28} weight="bold" className="text-[#527C75]" />
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#222D38]">
            PlanWise Privacy Policy
          </h1>
        </div>

        <p className="text-xs text-[#65717A]">Last Updated: October 2026</p>

        <section className="space-y-2 text-sm text-[#222D38] leading-relaxed">
          <h2 className="font-heading font-bold text-base">1. Commitment to Group Privacy</h2>
          <p>
            PlanWise is designed to make group co-planning collaborative and stress-free. We treat personal budgets, location preferences, and individual availability as confidential data shared exclusively within the groups you explicitly join.
          </p>
        </section>

        <section className="space-y-2 text-sm text-[#222D38] leading-relaxed">
          <h2 className="font-heading font-bold text-base">2. Individual Budget Protections</h2>
          <p>
            Your declared preferred budget, stretch budget, and strict hard spending limit are used strictly by the deterministic Group Decision Intelligence engine to detect constraint violations. Your individual hard limits are never concealed or sold to third parties.
          </p>
        </section>

        <section className="space-y-2 text-sm text-[#222D38] leading-relaxed">
          <h2 className="font-heading font-bold text-base">3. Data Provenance & Demo Mode</h2>
          <p>
            In demonstration mode, no external data brokers or paid location trackers are utilized. All venue information and traffic simulation parameters are localized within your private session.
          </p>
        </section>
      </div>
    </div>
  );
};
