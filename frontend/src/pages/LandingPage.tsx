import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  WarningCircle, 
  ShieldCheck, 
  NavigationArrow, 
  Coins, 
  CalendarBlank, 
  ChatCircleDots, 
  UsersThree, 
  SlidersHorizontal,
  LockKey,
  Compass
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleExploreSample = async () => {
    // 1-Click direct entry into the showcase event
    await quickDemoLogin('alice@planwise.local');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#222D38] flex flex-col font-sans selection:bg-[#294D68] selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-[#D9D6CD] bg-[#FBF9F4]/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-[#294D68] text-white flex items-center justify-center font-serif text-xl font-bold">
            P
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-[#222D38]">PlanWise</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-[#65717A]">
          <a href="#how-it-works" className="hover:text-[#222D38] transition-colors">How It Works</a>
          <a href="#decision-intelligence" className="hover:text-[#222D38] transition-colors">Decision Intelligence</a>
          <a href="#budget-engine" className="hover:text-[#222D38] transition-colors">Hard Budgets</a>
          <a href="#interactive-preview" className="hover:text-[#222D38] transition-colors">Product Preview</a>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-md bg-[#294D68] text-white text-sm font-semibold hover:bg-[#1e384d] transition-colors shadow-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/signin"
                className="px-3.5 py-2 rounded-md text-sm font-medium text-[#222D38] hover:bg-[#EAE7DF] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-md bg-[#294D68] text-white text-sm font-semibold hover:bg-[#1e384d] transition-colors shadow-sm"
              >
                Start Planning
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-8 pt-16 pb-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAE7DF] border border-[#D9D6CD] text-xs font-semibold text-[#294D68] mb-6">
          <ShieldCheck size={16} weight="bold" className="text-[#527C75]" />
          <span>Group Decision Intelligence Platform</span>
        </div>

        <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl leading-[1.1] text-[#222D38] max-w-4xl mx-auto tracking-tight">
          Make plans everyone can agree on.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-[#65717A] max-w-2xl mx-auto leading-relaxed font-normal">
          Bring your friends, budgets, availability, and ideas into one shared space. Compare your options, understand the trade-offs, and turn group discussions into plans everyone can follow.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-md bg-[#294D68] text-white font-heading font-bold text-base hover:bg-[#1e384d] transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span>Start Planning</span>
            <ArrowRight size={18} weight="bold" />
          </Link>

          <button
            onClick={handleExploreSample}
            className="w-full sm:w-auto px-7 py-3.5 rounded-md bg-[#FBF9F4] border border-[#D9D6CD] text-[#222D38] font-heading font-bold text-base hover:bg-[#EAE7DF] transition-all shadow-sm flex items-center justify-center space-x-2"
          >
            <span>Explore a Sample Plan</span>
          </button>
        </div>

        <div className="mt-4 text-xs text-[#65717A]">
          No credit card required. Works in zero-config demo mode with realistic friend groups.
        </div>
      </section>

      {/* Real Interactive Preview Card */}
      <section id="interactive-preview" className="px-4 sm:px-8 py-10 max-w-6xl mx-auto w-full">
        <div className="bg-[#FBF9F4] border border-[#D9D6CD] rounded-xl shadow-xl overflow-hidden">
          {/* Mock Window Header */}
          <div className="bg-[#EAE7DF] border-b border-[#D9D6CD] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#A64F49]/40 border border-[#A64F49]"></span>
              <span className="w-3 h-3 rounded-full bg-[#B77B35]/40 border border-[#B77B35]"></span>
              <span className="w-3 h-3 rounded-full bg-[#477B62]/40 border border-[#477B62]"></span>
              <span className="ml-3 text-xs font-mono font-medium text-[#65717A]">
                event/birthday-dinner-preview · Group: Weekend Crew (4 Members)
              </span>
            </div>
            <div className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#477B62]/10 text-[#477B62] border border-[#477B62]/20">
              Deterministic Engine Active
            </div>
          </div>

          {/* Realistic Event Workspace Content */}
          <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D6CD] pb-4">
              <div>
                <h3 className="font-heading text-2xl font-bold text-[#222D38]">Birthday Dinner Celebration</h3>
                <p className="text-sm text-[#65717A] mt-1">Saturday Evening · Target per-person budget: $35 · 3 Venues Under Comparison</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs px-3 py-1 bg-[#EAE7DF] text-[#222D38] rounded-md font-medium">
                  RSVP: 3 Attending, 1 Maybe
                </span>
                <span className="text-xs px-3 py-1 bg-[#294D68] text-white rounded-md font-bold">
                  Status: Planning
                </span>
              </div>
            </div>

            {/* Venues Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Top Feasible Choice */}
              <div className="p-4 bg-[#F4F1EA] border-2 border-[#477B62] rounded-lg relative">
                <div className="absolute -top-3 left-4 bg-[#477B62] text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Rank #1 · Score 88/100
                </div>
                <div className="mt-2 flex items-start justify-between">
                  <h4 className="font-heading font-bold text-base text-[#222D38]">R-City Courtyard Bistro</h4>
                  <span className="text-xs font-bold text-[#477B62]">$35/person</span>
                </div>
                <p className="text-xs text-[#65717A] mt-1">Italian & Continental · 18 min commute · Low traffic</p>
                <div className="mt-3 pt-3 border-t border-[#D9D6CD] text-xs space-y-1">
                  <div className="text-[#477B62] font-semibold flex items-center space-x-1">
                    <CheckCircle size={14} weight="bold" />
                    <span>Feasible for 100% of member budgets</span>
                  </div>
                  <div className="text-[#65717A]">3 Upvotes (Alice, Bob, Charlie)</div>
                </div>
              </div>

              {/* Option 2: Feasible Alternative */}
              <div className="p-4 bg-[#FBF9F4] border border-[#D9D6CD] rounded-lg">
                <div className="text-[10px] font-bold text-[#65717A] uppercase tracking-wider">
                  Rank #2 · Score 74/100
                </div>
                <div className="mt-1 flex items-start justify-between">
                  <h4 className="font-heading font-bold text-base text-[#222D38]">Phoenix Grand Arcade</h4>
                  <span className="text-xs font-bold text-[#222D38]">$42/person</span>
                </div>
                <p className="text-xs text-[#65717A] mt-1">Pan-Asian & Arcade · 24 min commute · Low traffic</p>
                <div className="mt-3 pt-3 border-t border-[#D9D6CD] text-xs space-y-1">
                  <div className="text-[#B77B35] font-semibold flex items-center space-x-1">
                    <WarningCircle size={14} weight="bold" />
                    <span>Requires Bob to stretch budget ($42 vs $40)</span>
                  </div>
                  <div className="text-[#65717A]">2 Upvotes</div>
                </div>
              </div>

              {/* Option 3: Hard Budget Violation */}
              <div className="p-4 bg-[#A64F49]/5 border border-[#A64F49]/40 rounded-lg">
                <div className="text-[10px] font-bold text-[#A64F49] uppercase tracking-wider">
                  Infeasible · Hard Constraint Violated
                </div>
                <div className="mt-1 flex items-start justify-between">
                  <h4 className="font-heading font-bold text-base text-[#222D38]">Viviana Rooftop Grill</h4>
                  <span className="text-xs font-bold text-[#A64F49]">$55/person</span>
                </div>
                <p className="text-xs text-[#65717A] mt-1">Rooftop BBQ · 38 min commute · Moderate traffic</p>
                <div className="mt-3 pt-3 border-t border-[#D9D6CD] text-xs space-y-1">
                  <div className="text-[#A64F49] font-bold flex items-center space-x-1">
                    <WarningCircle size={14} weight="bold" />
                    <span>Exceeds Bob's hard limit of $40 by $15</span>
                  </div>
                  <div className="text-[#65717A]">Ranked 3rd · Never hides individual budget constraints</div>
                </div>
              </div>
            </div>

            {/* Explanation Panel */}
            <div className="p-4 bg-[#EAE7DF] border border-[#D9D6CD] rounded-lg">
              <div className="text-xs font-bold uppercase tracking-wider text-[#294D68] mb-1">
                Decision Intelligence Explanation
              </div>
              <p className="text-sm text-[#222D38] leading-relaxed">
                "R-City Courtyard Bistro" is recommended because it satisfies every member's strict spending limit, has the shortest group transit time (18 mins), and secured 3 affirmative votes. "Viviana Rooftop Grill" scored highest on ambiance but violates Bob's non-negotiable hard spending limit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Pillars / How It Works */}
      <section id="how-it-works" className="px-4 sm:px-8 py-20 bg-[#FBF9F4] border-y border-[#D9D6CD]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-editorial text-3xl sm:text-5xl text-[#222D38]">
              Designed to solve group indecision
            </h2>
            <p className="mt-4 text-[#65717A] text-base">
              Traditional group chats lead to endless back-and-forth, ignored budgets, and scattered logistics. PlanWise unifies group decision making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-clean p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#294D68]/10 text-[#294D68] flex items-center justify-center">
                <Coins size={28} weight="bold" />
              </div>
              <h3 className="font-heading text-xl font-bold text-[#222D38]">Three-Tier Hard Budgets</h3>
              <p className="text-sm text-[#65717A] leading-relaxed">
                Declare your preferred budget, stretch budget, and strict hard spending limit. Higher-income friends never get extra voting weight, and individual hard limits are never concealed by group averages.
              </p>
            </div>

            <div className="card-clean p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#527C75]/10 text-[#527C75] flex items-center justify-center">
                <ShieldCheck size={28} weight="bold" />
              </div>
              <h3 className="font-heading text-xl font-bold text-[#222D38]">Group Decision Engine</h3>
              <p className="text-sm text-[#65717A] leading-relaxed">
                A deterministic ranking engine evaluates hard constraints first, then computes soft scores balancing preferences (35%), affordability (25%), travel time (20%), and traffic conditions (10%).
              </p>
            </div>

            <div className="card-clean p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#C17A43]/10 text-[#C17A43] flex items-center justify-center">
                <SlidersHorizontal size={28} weight="bold" />
              </div>
              <h3 className="font-heading text-xl font-bold text-[#222D38]">What-If Scenario Simulator</h3>
              <p className="text-sm text-[#65717A] leading-relaxed">
                Test hypotheticals in real time: what if Bob stretches his budget by $10? What if traffic is heavy? Test without altering live event records until the group agrees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Execution Capabilities */}
      <section className="px-4 sm:px-8 py-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 bg-[#EAE7DF] border border-[#D9D6CD] rounded text-xs font-semibold text-[#294D68]">
              Execution & Event Day
            </div>
            <h2 className="font-editorial text-3xl sm:text-5xl text-[#222D38] leading-tight">
              From decision to execution without friction.
            </h2>
            <p className="text-[#65717A] text-base leading-relaxed">
              Once the group decides, lock the plan to freeze major changes. Assign responsibilities, assemble the minute-by-minute itinerary, track shared expenses with penny-accurate splits, and switch into Last-Minute Mode on event day.
            </p>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 text-sm text-[#222D38]">
                <CheckCircle size={20} weight="fill" className="text-[#477B62] shrink-0 mt-0.5" />
                <span><strong>Plan Lock & Change Requests:</strong> Lock agreed venues and budgets. Changes require formal group requests.</span>
              </div>
              <div className="flex items-start space-x-3 text-sm text-[#222D38]">
                <CheckCircle size={20} weight="fill" className="text-[#477B62] shrink-0 mt-0.5" />
                <span><strong>Penny-Accurate Splits:</strong> Equal and custom expense splits that properly distribute rounding remainders.</span>
              </div>
              <div className="flex items-start space-x-3 text-sm text-[#222D38]">
                <CheckCircle size={20} weight="fill" className="text-[#477B62] shrink-0 mt-0.5" />
                <span><strong>Last-Minute Mode:</strong> Clean event-day dashboard with live countdown, address, itinerary, and urgent tasks.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExploreSample}
                className="px-6 py-3 rounded-md bg-[#294D68] text-white font-heading font-bold text-sm hover:bg-[#1e384d] transition-colors"
              >
                Test Full Workflow in Sample Event
              </button>
            </div>
          </div>

          <div className="bg-[#FBF9F4] border border-[#D9D6CD] p-6 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D9D6CD] pb-3">
              <span className="font-heading font-bold text-base text-[#222D38]">Event-Day Snapshot</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-[#C17A43]/10 text-[#C17A43] font-bold">
                Last-Minute Mode Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#F4F1EA] rounded-md border border-[#D9D6CD]">
                <div className="text-xs text-[#65717A]">Time Until Event</div>
                <div className="font-heading text-xl font-extrabold text-[#294D68] mt-1">2h 45m</div>
              </div>
              <div className="p-3 bg-[#F4F1EA] rounded-md border border-[#D9D6CD]">
                <div className="text-xs text-[#65717A]">Meeting Point</div>
                <div className="font-heading text-sm font-bold text-[#222D38] mt-1 truncate">Level 1 Fountain</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#EAE7DF] rounded flex items-center justify-between">
                <span>19:30 · Seated Dinner Table #14</span>
                <span className="text-[#477B62] font-bold">Confirmed</span>
              </div>
              <div className="p-2.5 bg-[#EAE7DF] rounded flex items-center justify-between">
                <span>Task: Pick up custom birthday cake</span>
                <span className="text-[#C17A43] font-bold">Assigned to Charlie</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="px-4 sm:px-8 py-16 bg-[#EAE7DF] border-t border-[#D9D6CD] text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="font-editorial text-3xl sm:text-4xl text-[#222D38]">
            Ready to plan your next outing together?
          </h2>
          <p className="text-[#65717A] text-base">
            Create a group, invite friends with a single code, and stop repeated discussions.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3 rounded-md bg-[#294D68] text-white font-heading font-bold text-sm hover:bg-[#1e384d] transition-colors"
            >
              Get Started for Free
            </Link>
            <Link
              to="/signin"
              className="w-full sm:w-auto px-7 py-3 rounded-md bg-[#FBF9F4] border border-[#D9D6CD] text-[#222D38] font-heading font-bold text-sm hover:bg-[#dfdbd1] transition-colors"
            >
              Sign In to Your Group
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D9D6CD] bg-[#FBF9F4] px-4 sm:px-8 py-8 text-xs text-[#65717A]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-heading font-bold text-[#222D38]">PlanWise</span>
            <span>· Plan Together. Decide Smarter. Execute Better.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="hover:text-[#222D38] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#222D38] transition-colors">Terms of Service</Link>
            <span>Demo Version 1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
