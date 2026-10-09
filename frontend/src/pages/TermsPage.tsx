import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from '@phosphor-icons/react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Link to="/" className="text-xs font-bold text-[#294D68] hover:underline flex items-center space-x-1">
        <ArrowLeft size={14} weight="bold" />
        <span>Return to Home</span>
      </Link>

      <div className="card-clean p-8 space-y-6">
        <div className="flex items-center space-x-3">
          <FileText size={28} weight="bold" className="text-[#294D68]" />
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#222D38]">
            PlanWise Terms of Service
          </h1>
        </div>

        <p className="text-xs text-[#65717A]">Last Updated: October 2026</p>

        <section className="space-y-2 text-sm text-[#222D38] leading-relaxed">
          <h2 className="font-heading font-bold text-base">1. Collaborative Platform Agreement</h2>
          <p>
            By using PlanWise, you agree to coordinate group events respectfully. The Group Decision Intelligence system provides recommendations and trade-off explanations, but groups maintain final decision-making authority.
          </p>
        </section>

        <section className="space-y-2 text-sm text-[#222D38] leading-relaxed">
          <h2 className="font-heading font-bold text-base">2. Expense Calculations & Disclaimers</h2>
          <p>
            PlanWise calculates penny-accurate expense splits and settlement balances for group accounting. PlanWise does not process banking transactions directly or claim that funds have cleared.
          </p>
        </section>

        <section className="space-y-2 text-sm text-[#222D38] leading-relaxed">
          <h2 className="font-heading font-bold text-base">3. Venue Estimations</h2>
          <p>
            Operating hours, estimated per-person costs, and travel estimates are provided for planning guidance and do not guarantee restaurant reservations without direct confirmation.
          </p>
        </section>
      </div>
    </div>
  );
};
