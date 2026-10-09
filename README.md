# PlanWise — Event Co-Planning for Friend Groups

> **Tagline:** Plan Together. Decide Smarter. Execute Better.

PlanWise is a full-stack collaborative event co-planning platform for friend groups. It replaces fragmented group chats, disjointed calendar invites, separate map queries, and unorganized split spreadsheets with a **single, unified planning workspace**.

Its defining core capability is the **Group Decision Intelligence Engine** — an explainable, deterministic ranking engine that enforces **individual hard budget limits**, balances preferences and travel times, and explains group trade-offs transparently.

---

## Key Highlights & Core Differentiators

1. **Group Decision Intelligence (Explainable Engine)**
   - Distinguishes **hard constraints** (non-negotiable member spending ceilings, venue closures) from **soft preferences** (commute times, cuisine tastes, traffic congestion).
   - Never allows high-budget members to overpower lower-budget friends.
   - **Never conceals an individual budget violation** behind a group average.
   - Computes weighted composite scores:
     - **Group Preference:** 35%
     - **Affordability:** 25%
     - **Travel Duration:** 20%
     - **Traffic Levels:** 10%
     - **Venue Suitability & Availability:** 10%
   - Generates transparent explanations showing positive strengths, trade-offs, and relaxation advice if no option is feasible.
   - Supports **Manual Group Overrides** with permanent audit logging in the decision history.

2. **What-If Scenario Simulator**
   - Allows groups to test hypothetical scenarios (e.g. *What if Bob relaxes his limit from $40 to $55?* or *What if commute traffic doubles?*).
   - Recalculates recommendations with temporary inputs **without altering live database records**.
   - Displays side-by-side comparison cards with a clear simulated-state indicator.

3. **Three-Tier Individual Budget Limits**
   - **Preferred Budget:** Ideal target spending.
   - **Stretch Budget:** Amount acceptable if the plan offers high value.
   - **Hard Limit:** Non-negotiable spending ceiling.

4. **Execution & Event Day**
   - **Plan Lock & Change Requests:** Finalize the agreed plan to freeze major changes. Once locked, modifications require submitting formal change requests for organizer review.
   - **Penny-Accurate Shared Expenses:** Equal, participant-based, and custom split calculations with remainder distribution and net settlement balance calculation (who owes whom).
   - **Last-Minute Mode:** Dedicated event-day dashboard with live event countdown, meeting point directions, attendee rollcall, and urgent tasks.
   - **Tasks & Responsibilities:** Kanban-style task management with priorities (Low, Medium, High, Urgent) and assignee tracking.
   - **Itinerary:** Minute-by-minute chronological schedule.
   - **Decision History:** Complete immutable audit log of all decisions, votes, budget edits, and plan locks.

---

## Technology Stack

- **Frontend:**
  - React 18 with TypeScript & Vite
  - Tailwind CSS with custom design system tokens
  - Typography: **DM Serif Display** (editorial headings), **Manrope** (section headings), **DM Sans** (body & controls)
  - Color Tokens: Warm neutral background (`#F4F1EA`), primary surface (`#FBF9F4`), primary action (`#294D68`), accents (`#527C75`, `#C17A43`), borders (`#D9D6CD`)
  - Icons: **Phosphor Icons** (`@phosphor-icons/react`)
  - React Router v6
  - Socket.IO Client for real-time collaboration
- **Backend:**
  - Node.js & Express with TypeScript
  - Prisma ORM with relational schema
  - SQLite database for zero-config local development (compatible with PostgreSQL)
  - JWT authentication & BCrypt password hashing
  - Socket.IO with room-level access authorization
  - Zod validation
- **Testing:**
  - Vitest & Supertest for backend unit/integration tests
  - Browser E2E subagent verification

---

## Demonstration Credentials (1-Click Switcher Available)

For instant evaluation, the app includes a **1-click Profile Switcher** in the top navigation bar and login page. All accounts share password: `Password123!`:

| Member | Email | Role & Budget Persona | Individual Limits |
| :--- | :--- | :--- | :--- |
| **Alice Johnson** | `alice@planwise.local` | Organizer (Moderate Budget) | Pref: $35 · Stretch: $45 · **Hard: $50** |
| **Bob Smith** | `bob@planwise.local` | Student (**Strict Hard Budget**) | Pref: $30 · Stretch: $40 · **Hard: $40** |
| **Charlie Davis** | `charlie@planwise.local` | Foodie (Flexible Budget) | Pref: $40 · Stretch: $60 · **Hard: $75** |
| **Dana Lee** | `dana@planwise.local` | Busy Member (High Budget) | Pref: $50 · Stretch: $70 · **Hard: $80** |

> **Key Scenario to Observe:**
> In the seeded event *"Birthday Dinner Celebration"*, venue proposal **Viviana Rooftop Grill** costs **$55/person**.
> While other members can afford it, the Decision Intelligence engine flags:
> `Hard Budget Exceeded: Exceeds Bob Smith's hard limit of $40 by $15.`
> Consequently, **R-City Courtyard Bistro ($35/person)** is ranked #1 with composite score 88/100 because it satisfies 100% of member budgets.

---

## Getting Started & Installation

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Clone & Setup Workspace
```bash
cd "c:\Hackathon\code_Astra\Event planning"
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

---

## Running Locally

Run both backend and frontend servers:

### Terminal 1: Backend Server (Port 5000)
```bash
cd backend
npx tsx src/server.ts
# Server runs at http://localhost:5000
```

### Terminal 2: Frontend Dev Server (Port 5173)
```bash
cd frontend
npm run dev
# App runs at http://localhost:5173
```

---

## Running Automated Tests

Run backend unit and integration test suite:

```bash
cd backend
npm test
```
**Test Results:**
- `src/__tests__/recommendationEngine.test.ts`: 4 tests (Hard budget violations, venue unavailability, missing data fallback, relaxation suggestions)
- `src/__tests__/api.test.ts`: 5 tests (Health check, auth protection, demo login, password check, group retrieval)
- **100% Passing (9 / 9 tests)**

---

## Environment Configuration

Configure `backend/.env`:

```env
DATABASE_URL="file:./dev.db" # Or postgresql://user:pass@localhost:5432/planwise
PORT=5000
JWT_SECRET="planwise-super-secret-jwt-key-2026"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"

# Optional External API Services
# PlanWise functions completely in DEMO MODE without external keys.
GOOGLE_MAPS_API_KEY=""
GOOGLE_PLACES_API_KEY=""
GOOGLE_ROUTES_API_KEY=""
```

---

## Live Data vs. Estimated vs. Demo Data

| Dimension | Implementation | Labeling & Provenance |
| :--- | :--- | :--- |
| **Venues** | Seeded demo venues (`R-City`, `Viviana`, `Phoenix`) with menu price estimates | Labeled with `DEMO VENUE` and confirmation statuses (`CONFIRMED`, `UNVERIFIED`) |
| **Travel & Transit** | Modeled transit durations, distances, and traffic congestion patterns | Clearly tagged as `DEMO / ESTIMATED` with source notes |
| **Budgets & Votes** | Real persisted database records calculated deterministically | 100% live relational data |
| **Expense Splits** | Penny-accurate arithmetic with remainder cent redistribution | Calculated accurately on backend |

---

## License
MIT
