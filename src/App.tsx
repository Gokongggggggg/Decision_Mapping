import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Gauge,
  Home,
  Inbox,
  Layers3,
  PanelLeft,
  Plus,
  Target,
  WalletCards,
  X
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { demoState, emptyState } from "./data";
import {
  capacityStats,
  durationLabel,
  evaluateOpportunity,
  hours,
  makeId,
  money,
  recommendationTone,
  splitList,
  statusLabel,
  timeLabel,
  weeklyImpact
} from "./decisionEngine";
import type { AppState, Commitment, DurationUnit, Opportunity, OpportunityStatus, TimeUnit } from "./types";

const STORAGE_KEY = "opportunity-os-react-state-v1";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "opportunities", label: "Opportunities", icon: Inbox },
  { id: "goals", label: "Goals", icon: Target }
] as const;

type View = (typeof navItems)[number]["id"];
type Mode = "landing" | "app";

const blankOpportunity = {
  title: "",
  description: "",
  category: "academy",
  timeAmount: 4,
  timeUnit: "per_week" as TimeUnit,
  durationAmount: 1,
  durationUnit: "week" as DurationUnit,
  moneyCost: 0,
  currency: "IDR",
  deadline: "",
  notes: "",
  alignmentScore: 6,
  expectedImpact: ""
};

const blankGoal = {
  name: "",
  description: "",
  priority: 8,
  deadline: "",
  successMetrics: "",
  focusPercentage: 20
};

const blankCommitment = {
  name: "",
  goalId: "",
  timeAmount: 5,
  timeUnit: "per_week" as Exclude<TimeUnit, "total">,
  priority: 7,
  startDate: "",
  endDate: "",
  status: "active" as Commitment["status"],
  notes: ""
};

function loadState(): AppState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return emptyState;
  try {
    return JSON.parse(stored) as AppState;
  } catch {
    return emptyState;
  }
}

export default function App() {
  const [mode, setMode] = useState<Mode>("landing");
  const [view, setView] = useState<View>("dashboard");
  const [state, setState] = useState<AppState>(loadState);
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(null);
  const [opportunityForm, setOpportunityForm] = useState(blankOpportunity);
  const [goalForm, setGoalForm] = useState(blankGoal);
  const [commitmentForm, setCommitmentForm] = useState(blankCommitment);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const stats = useMemo(() => capacityStats(state), [state]);
  const selectedOpportunity = state.opportunities.find((item) => item.id === state.selectedOpportunityId) ?? null;
  const evaluation = selectedOpportunity ? evaluateOpportunity(state, selectedOpportunity) : null;
  const sortedGoals = [...state.goals].sort((a, b) => b.priority - a.priority);
  const pending = state.opportunities.filter((item) => item.status === "pending_review");
  const recent = state.opportunities.filter((item) => item.status !== "pending_review").slice(-5).reverse();

  function openApp(nextView: View = "dashboard") {
    setMode("app");
    setView(nextView);
  }

  function submitOpportunity(event: FormEvent<HTMLFormElement>, reviewMode: "later" | "now") {
    event.preventDefault();
    const payload: Opportunity = {
      id: editingOpportunityId ?? makeId("opportunity"),
      title: opportunityForm.title,
      description: opportunityForm.description,
      category: opportunityForm.category,
      timeAmount: Number(opportunityForm.timeAmount),
      timeUnit: opportunityForm.timeUnit,
      durationAmount: Number(opportunityForm.durationAmount),
      durationUnit: opportunityForm.durationUnit,
      moneyCost: Number(opportunityForm.moneyCost),
      currency: opportunityForm.currency,
      deadline: opportunityForm.deadline,
      notes: opportunityForm.notes,
      alignmentScore: Number(opportunityForm.alignmentScore),
      expectedImpact: splitList(opportunityForm.expectedImpact),
      status: "pending_review"
    };

    setState((current) => {
      const exists = current.opportunities.some((item) => item.id === payload.id);
      return {
        ...current,
        selectedOpportunityId: reviewMode === "now" ? payload.id : current.selectedOpportunityId,
        opportunities: exists ? current.opportunities.map((item) => (item.id === payload.id ? { ...item, ...payload } : item)) : [payload, ...current.opportunities]
      };
    });
    setEditingOpportunityId(null);
    setOpportunityForm(blankOpportunity);
  }

  function editOpportunity(opportunity: Opportunity) {
    setEditingOpportunityId(opportunity.id);
    setState((current) => ({ ...current, selectedOpportunityId: opportunity.id }));
    setOpportunityForm({
      title: opportunity.title,
      description: opportunity.description,
      category: opportunity.category,
      timeAmount: opportunity.timeAmount,
      timeUnit: opportunity.timeUnit,
      durationAmount: opportunity.durationAmount,
      durationUnit: opportunity.durationUnit,
      moneyCost: opportunity.moneyCost,
      currency: opportunity.currency,
      deadline: opportunity.deadline,
      notes: opportunity.notes,
      alignmentScore: opportunity.alignmentScore,
      expectedImpact: opportunity.expectedImpact.map((item) => `- ${item}`).join("\n")
    });
  }

  function setDecision(id: string, status: Exclude<OpportunityStatus, "pending_review">) {
    setState((current) => ({
      ...current,
      opportunities: current.opportunities.map((item) => (item.id === id ? { ...item, status, decisionDate: new Date().toISOString().split("T")[0] } : item))
    }));
  }

  function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((current) => ({
      ...current,
      goals: [
        {
          id: makeId("goal"),
          name: goalForm.name,
          description: goalForm.description,
          priority: Number(goalForm.priority),
          deadline: goalForm.deadline,
          successMetrics: splitList(goalForm.successMetrics),
          status: "active",
          focusPercentage: Number(goalForm.focusPercentage)
        },
        ...current.goals
      ]
    }));
    setGoalForm(blankGoal);
  }

  function addCommitment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((current) => ({
      ...current,
      commitments: [
        {
          id: makeId("commitment"),
          goalId: commitmentForm.goalId,
          name: commitmentForm.name,
          timeAmount: Number(commitmentForm.timeAmount),
          timeUnit: commitmentForm.timeUnit,
          priority: Number(commitmentForm.priority),
          startDate: commitmentForm.startDate,
          endDate: commitmentForm.endDate,
          status: commitmentForm.status,
          notes: commitmentForm.notes
        },
        ...current.commitments
      ]
    }));
    setCommitmentForm(blankCommitment);
  }

  if (mode === "landing") {
    return <LandingPage onOpenApp={openApp} />;
  }

  return (
    <div className="app-bg min-h-screen text-[#18181b]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-zinc-200/60 bg-white/60 p-6 shadow-[20px_0_60px_rgba(15,17,21,0.03)] backdrop-blur-2xl lg:flex lg:flex-col">
        <button className="flex items-center gap-3 text-left hover-lift" onClick={() => setMode("landing")}>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 text-lg font-black text-white shadow-lg shadow-cyan-500/25">O</span>
          <span>
            <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Opportunity OS</span>
            <span className="block text-lg font-black tracking-tight text-zinc-900">Decision Console</span>
          </span>
        </button>

        <nav className="mt-10 grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                className={`group flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-bold transition-all ${
                  active ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-500/20 shadow-sm" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
                onClick={() => setView(item.id)}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} className={active ? "text-cyan-600" : "text-zinc-400 group-hover:text-zinc-600"} />
                  {item.label}
                </span>
                {active ? <ArrowRight size={16} className="text-cyan-600" /> : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-4">
          <button className="soft-shimmer rounded-xl bg-[#0f1115] px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-zinc-900/10 hover:shadow-zinc-900/20" onClick={() => setState(demoState)}>
            Load Demo Workspace
          </button>
          <div className="surface-card rounded-2xl p-5 border-zinc-200/50 bg-white/80">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Weekly Capacity</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                className="h-12 w-28 rounded-xl border border-zinc-200 bg-white px-4 font-black shadow-sm text-lg"
                type="number"
                min={1}
                max={168}
                value={state.weeklyCapacity}
                onChange={(event) => setState((current) => ({ ...current, weeklyCapacity: Number(event.target.value) }))}
              />
              <span className="font-bold text-zinc-400">hours</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-zinc-200/60 bg-white/60 px-6 py-5 backdrop-blur-2xl lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">MVP v0.3</p>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 lg:text-4xl">{navItems.find((item) => item.id === view)?.label}</h1>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <MetricPill label="Allocated" value={hours(stats.allocated)} />
              <MetricPill label="Remaining" value={hours(stats.remaining)} tone={stats.remaining < 0 ? "bad" : "good"} />
              <MetricPill label="Utilization" value={`${stats.utilization}%`} tone={stats.utilization > 100 ? "bad" : stats.utilization >= 85 ? "warn" : "good"} />
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10">
          {view === "opportunities" ? (
            <OpportunityWorkspace
              state={state}
              opportunityForm={opportunityForm}
              setOpportunityForm={setOpportunityForm}
              editingOpportunityId={editingOpportunityId}
              submitOpportunity={submitOpportunity}
              cancelEdit={() => {
                setEditingOpportunityId(null);
                setOpportunityForm(blankOpportunity);
              }}
              selectedOpportunity={selectedOpportunity}
              evaluation={evaluation}
              onSelect={(id) => setState((current) => ({ ...current, selectedOpportunityId: id }))}
              onEdit={editOpportunity}
              onDelete={(id) =>
                setState((current) => ({
                  ...current,
                  selectedOpportunityId: current.selectedOpportunityId === id ? null : current.selectedOpportunityId,
                  opportunities: current.opportunities.filter((item) => item.id !== id)
                }))
              }
              onDecision={setDecision}
            />
          ) : null}

          {view === "dashboard" ? (
            <Dashboard
              state={state}
              stats={stats}
              pending={pending}
              recent={recent}
              openOpportunities={() => setView("opportunities")}
              openGoals={() => setView("goals")}
              reviewOpportunity={(id) => {
                setState((current) => ({ ...current, selectedOpportunityId: id }));
                setView("opportunities");
              }}
            />
          ) : null}

          {view === "goals" ? (
            <GoalsWorkspace
              state={state}
              goalForm={goalForm}
              setGoalForm={setGoalForm}
              commitmentForm={commitmentForm}
              setCommitmentForm={setCommitmentForm}
              addGoal={addGoal}
              addCommitment={addCommitment}
              deleteGoal={(id) =>
                setState((current) => ({
                  ...current,
                  goals: current.goals.filter((item) => item.id !== id),
                  commitments: current.commitments.map((item) => (item.goalId === id ? { ...item, goalId: "" } : item))
                }))
              }
              deleteCommitment={(id) => setState((current) => ({ ...current, commitments: current.commitments.filter((item) => item.id !== id) }))}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function LandingPage({ onOpenApp }: { onOpenApp: (view?: View) => void }) {
  return (
    <div className="landing-shell min-h-screen overflow-hidden text-[#18181b]">
      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
        <button className="flex items-center gap-3 text-left hover-lift" onClick={() => onOpenApp("dashboard")}>
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 font-black text-white shadow-lg shadow-cyan-500/20">O</span>
          <span className="font-black tracking-tight text-lg">Opportunity OS</span>
        </button>
        <nav className="hidden items-center gap-2 rounded-full border border-zinc-200/50 bg-white/60 p-1.5 shadow-lg shadow-zinc-900/5 backdrop-blur-md md:flex">
          <a className="rounded-full px-5 py-2 text-sm font-bold text-zinc-600 hover:bg-white hover:text-zinc-900 transition-colors" href="#engine">Engine</a>
          <a className="rounded-full px-5 py-2 text-sm font-bold text-zinc-600 hover:bg-white hover:text-zinc-900 transition-colors" href="#workflow">Workflow</a>
          <button className="rounded-full bg-[#0f1115] px-5 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all" onClick={() => onOpenApp("dashboard")}>
            Open App
          </button>
        </nav>
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-96px)] items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1fr_1.1fr] lg:px-12 xl:gap-20">
        <div className="reveal max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-700">Decision support for ambitious people</p>
          </div>
          <h1 className="gradient-text text-6xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]">
            Know the cost before saying yes.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-500 font-medium">
            Evaluate incoming academies, competitions, certifications, projects, internships, and startup ideas against the goals and commitments already fighting for your capacity.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <button className="soft-shimmer rounded-2xl bg-[#0f1115] px-7 py-4 text-base font-bold text-white shadow-xl shadow-zinc-900/15 hover:shadow-zinc-900/25 transition-all" onClick={() => onOpenApp("dashboard")}>
              Open Dashboard
            </button>
            <button className="rounded-2xl border border-zinc-200/80 bg-white/60 px-7 py-4 text-base font-bold text-zinc-900 shadow-lg shadow-zinc-900/5 backdrop-blur-md hover:bg-white transition-all" onClick={() => onOpenApp("opportunities")}>
              Add Opportunity
            </button>
          </div>
        </div>

        <div className="surface-card float-panel reveal reveal-delay-1 rounded-[2rem] p-5 shadow-[0_20px_80px_-20px_rgba(15,17,21,0.12)] border-white/40">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-zinc-100 bg-white p-7 shadow-xl shadow-zinc-900/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-600">
                <Target size={120} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Opportunity Review</p>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-zinc-900">PM Academy</h2>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <PreviewStat label="Current Load" value="35h / 40h" />
                  <PreviewStat label="After Accept" value="43h / 40h" danger />
                  <PreviewStat label="Overflow" value="3h" danger />
                  <PreviewStat label="Decision" value="Defer" warn />
                </div>
              </div>
            </div>
            <div className="grid gap-5">
              <div className="rounded-[1.5rem] border border-zinc-100 bg-white/80 p-6 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Affected Commitments</p>
                <div className="mt-4 grid gap-2.5">
                  {["CPTS progress", "HTB practice", "Portfolio project"].map((item) => (
                    <div key={item} className="impact-pulse rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-2.5 text-xs font-bold text-rose-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-zinc-100 bg-white/80 p-6 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Decision Queue</p>
                <div className="mt-4 space-y-2.5 text-xs font-bold">
                  <div className="flex justify-between items-center rounded-xl bg-cyan-50/80 px-4 py-2.5 text-cyan-800 border border-cyan-100">
                    <span>One-Day CTF</span>
                    <span className="bg-white rounded-md px-2 py-1 shadow-sm">9h total</span>
                  </div>
                  <div className="flex justify-between items-center rounded-xl bg-zinc-50 px-4 py-2.5 border border-zinc-100 text-zinc-600">
                    <span>SMT Korea</span>
                    <span className="bg-white rounded-md px-2 py-1 shadow-sm">20h total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="engine" className="surface-card reveal reveal-delay-2 relative z-10 mx-6 mb-12 rounded-[2.5rem] p-8 lg:mx-12 lg:p-16 border-white/40 shadow-xl shadow-zinc-900/5">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Review Engine</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight lg:text-[4rem] leading-[1.1]">Turn vague opportunity cost into a visible trade-off.</h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {[
            ["Capture", "Store opportunities with flexible time units, duration, cost, deadline, and expected gain.", Layers3],
            ["Normalize", "Convert per-day, per-week, per-month, and total time into weekly impact.", Activity],
            ["Decide", "See affected commitments and goal impact before accepting, rejecting, or deferring.", Target]
          ].map(([title, body, Icon], index) => (
            <div key={title as string} className="rounded-[1.5rem] bg-white/60 p-8 border border-zinc-200/50 hover:bg-white transition-colors duration-300">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-black text-zinc-300">0{index + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-black tracking-tight">{title as string}</h3>
              <p className="mt-3 leading-relaxed text-zinc-500 font-medium text-sm">{body as string}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function OpportunityWorkspace(props: {
  state: AppState;
  opportunityForm: typeof blankOpportunity;
  setOpportunityForm: (next: typeof blankOpportunity) => void;
  editingOpportunityId: string | null;
  submitOpportunity: (event: FormEvent<HTMLFormElement>, reviewMode: "later" | "now") => void;
  cancelEdit: () => void;
  selectedOpportunity: Opportunity | null;
  evaluation: ReturnType<typeof evaluateOpportunity> | null;
  onSelect: (id: string) => void;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (id: string) => void;
  onDecision: (id: string, status: Exclude<OpportunityStatus, "pending_review">) => void;
}) {
  const { state, opportunityForm, setOpportunityForm, editingOpportunityId, submitOpportunity, cancelEdit, selectedOpportunity, evaluation } = props;
  const expectedGains = opportunityForm.expectedImpact.length
    ? opportunityForm.expectedImpact.split("\n").map((item) => item.replace(/^[-*•]\s*/, ""))
    : [""];

  function updateExpectedGain(index: number, value: string) {
    const next = [...expectedGains];
    next[index] = value;
    setOpportunityForm({ ...opportunityForm, expectedImpact: next.join("\n") });
  }

  function addExpectedGain() {
    setOpportunityForm({ ...opportunityForm, expectedImpact: [...expectedGains, ""].join("\n") });
  }

  function removeExpectedGain(index: number) {
    const next = expectedGains.filter((_, itemIndex) => itemIndex !== index);
    setOpportunityForm({ ...opportunityForm, expectedImpact: (next.length ? next : [""]).join("\n") });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[440px_minmax(380px,0.9fr)_minmax(440px,1.1fr)]">
      <form className="surface-card reveal rounded-[2rem] p-6 lg:p-8 xl:sticky xl:top-32 xl:self-start border-white/40 shadow-[0_10px_40px_-10px_rgba(15,17,21,0.06)]" onSubmit={(event) => submitOpportunity(event, "later")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Capture</p>
            <h2 className="text-2xl font-black tracking-tight">{editingOpportunityId ? "Edit Opportunity" : "New Opportunity"}</h2>
          </div>
          {editingOpportunityId ? (
            <button className="rounded-xl bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors" type="button" onClick={cancelEdit}>
              <X size={18} />
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5">
          <Field label="Title">
            <input required value={opportunityForm.title} onChange={(event) => setOpportunityForm({ ...opportunityForm, title: event.target.value })} placeholder="e.g., PM Academy" />
          </Field>
          <Field label="Description">
            <textarea value={opportunityForm.description} onChange={(event) => setOpportunityForm({ ...opportunityForm, description: event.target.value })} placeholder="What does this entail?" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={opportunityForm.category} onChange={(event) => setOpportunityForm({ ...opportunityForm, category: event.target.value })}>
                {["internship", "academy", "competition", "certification", "startup idea", "networking"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Deadline">
              <input type="date" value={opportunityForm.deadline} onChange={(event) => setOpportunityForm({ ...opportunityForm, deadline: event.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Time required">
              <div className="grid grid-cols-[1fr_110px] gap-2">
                <input type="number" min={0} step={0.5} value={opportunityForm.timeAmount} onChange={(event) => setOpportunityForm({ ...opportunityForm, timeAmount: Number(event.target.value) })} />
                <select value={opportunityForm.timeUnit} onChange={(event) => setOpportunityForm({ ...opportunityForm, timeUnit: event.target.value as TimeUnit })}>
                  <option value="total">Total</option>
                  <option value="per_day">Per day</option>
                  <option value="per_week">Per week</option>
                  <option value="per_month">Per month</option>
                </select>
              </div>
            </Field>
            <Field label="Duration">
              <div className="grid grid-cols-[1fr_110px] gap-2">
                <input type="number" min={1} step={1} value={opportunityForm.durationAmount} onChange={(event) => setOpportunityForm({ ...opportunityForm, durationAmount: Number(event.target.value) })} />
                <select value={opportunityForm.durationUnit} onChange={(event) => setOpportunityForm({ ...opportunityForm, durationUnit: event.target.value as DurationUnit })}>
                  <option value="day">Days</option>
                  <option value="week">Weeks</option>
                  <option value="month">Months</option>
                </select>
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cost">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <select value={opportunityForm.currency} onChange={(event) => setOpportunityForm({ ...opportunityForm, currency: event.target.value })}>
                  {["IDR", "USD", "SGD", "EUR"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <input type="number" min={0} value={opportunityForm.moneyCost} onChange={(event) => setOpportunityForm({ ...opportunityForm, moneyCost: Number(event.target.value) })} />
              </div>
            </Field>
            <Field label="Goal Alignment (1-10)">
              <input type="number" min={1} max={10} value={opportunityForm.alignmentScore} onChange={(event) => setOpportunityForm({ ...opportunityForm, alignmentScore: Number(event.target.value) })} />
            </Field>
          </div>
          <Field label="Expected Gains">
            <div className="grid gap-2">
              {expectedGains.map((gain, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                  <input value={gain} onChange={(event) => updateExpectedGain(index, event.target.value)} placeholder={index === 0 ? "e.g., Product thinking" : "Another gain"} />
                  <button
                    className="rounded-xl border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-400 shadow-sm hover:bg-rose-50 hover:text-rose-600"
                    type="button"
                    onClick={() => removeExpectedGain(index)}
                    disabled={expectedGains.length === 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="mt-1 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-700 shadow-sm hover:bg-cyan-100" type="button" onClick={addExpectedGain}>
              + Add gain
            </button>
          </Field>
          <Field label="Notes">
            <textarea value={opportunityForm.notes} onChange={(event) => setOpportunityForm({ ...opportunityForm, notes: event.target.value })} />
          </Field>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button className="rounded-xl border border-zinc-200/80 bg-white px-5 py-3.5 font-bold shadow-sm hover:bg-zinc-50 transition-colors" type="submit">
            Review Later
          </button>
          <button className="soft-shimmer rounded-xl bg-[#0f1115] px-5 py-3.5 font-bold text-white shadow-lg shadow-zinc-900/15 hover:shadow-xl hover:shadow-zinc-900/20 transition-all" type="button" onClick={(event) => submitOpportunity(event as unknown as FormEvent<HTMLFormElement>, "now")}>
            Review Now
          </button>
        </div>
      </form>

      <section className="surface-card reveal reveal-delay-1 rounded-[2rem] p-6 lg:p-8 border-white/40 shadow-[0_10px_40px_-10px_rgba(15,17,21,0.06)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Queue</p>
            <h2 className="text-2xl font-black tracking-tight">Opportunities</h2>
          </div>
          <span className="rounded-full bg-cyan-50 text-cyan-700 px-3 py-1 text-[10px] font-black uppercase tracking-wider">{state.opportunities.length} total</span>
        </div>
        <div className="mt-6 grid gap-4">
          {state.opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} selected={selectedOpportunity?.id === opportunity.id} onSelect={props.onSelect} onEdit={props.onEdit} onDelete={props.onDelete} onDecision={props.onDecision} />
          ))}
        </div>
      </section>

      <ReviewPanel evaluation={evaluation} state={state} />
    </div>
  );
}

function ReviewPanel({ evaluation, state }: { evaluation: ReturnType<typeof evaluateOpportunity> | null; state: AppState }) {
  if (!evaluation) {
    return (
      <section className="surface-card reveal reveal-delay-2 grid min-h-[520px] place-items-center rounded-[2rem] border-dashed border-zinc-300/80 bg-zinc-50/50 p-8 text-center border-white/40 shadow-[0_10px_40px_-10px_rgba(15,17,21,0.06)]">
        <div>
          <div className="mx-auto w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
            <Inbox className="text-zinc-400" size={28} />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Select an opportunity to review</h2>
          <p className="mt-3 max-w-md text-zinc-500 font-medium">Review Now opens the impact engine. Review Later stores the opportunity in the queue.</p>
        </div>
      </section>
    );
  }

  const danger = evaluation.overflow > 0;
  const tone = recommendationTone(evaluation.recommendation);

  return (
    <section className="surface-card reveal reveal-delay-2 rounded-[2rem] p-6 lg:p-8 border-white/40 shadow-[0_10px_40px_-10px_rgba(15,17,21,0.06)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-600">Opportunity Review</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">{evaluation.opportunity.title}</h2>
          <p className="mt-3 text-zinc-500 font-medium leading-relaxed">{evaluation.opportunity.description || "No description provided."}</p>
        </div>
        <ToneBadge tone={tone}>{evaluation.recommendation}</ToneBadge>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ReviewStat label="Alignment" value={`${evaluation.alignment}/10`} />
        <ReviewStat label="Opportunity Time" value={timeLabel(evaluation.opportunity)} />
        <ReviewStat label="Weekly Impact" value={hours(evaluation.opportunityImpact)} danger={danger} />
      </div>

      <section className="mt-10">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Scenario Mode: Before vs After</h3>
        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-zinc-200/60 bg-white/70 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/80 font-bold text-zinc-500 border-b border-zinc-200/60">
              <tr>
                <th className="px-5 py-4">Metric</th>
                <th className="px-5 py-4">Current State</th>
                <th className="px-5 py-4">If Accepted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-5 py-4 font-bold text-zinc-500">Total Hours</td>
                <td className="px-5 py-4 font-black">{hours(evaluation.stats.allocated)}</td>
                <td className={`px-5 py-4 font-black ${danger ? "text-rose-600" : "text-cyan-600"}`}>{hours(evaluation.stats.projected)}</td>
              </tr>
              <tr className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-5 py-4 font-bold text-zinc-500">Utilization</td>
                <td className="px-5 py-4 font-black">{evaluation.stats.utilization}%</td>
                <td className={`px-5 py-4 font-black ${evaluation.stats.projectedUtilization > 100 ? "text-rose-600" : "text-cyan-600"}`}>{evaluation.stats.projectedUtilization}%</td>
              </tr>
              <tr className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-5 py-4 font-bold text-zinc-500">Remaining</td>
                <td className="px-5 py-4 font-black">{hours(evaluation.stats.remaining)}</td>
                <td className={`px-5 py-4 font-black ${evaluation.overflow > 0 ? "text-rose-600" : "text-emerald-600"}`}>{hours(Math.max(0, evaluation.stats.capacity - evaluation.stats.projected))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {evaluation.adjustmentPlans.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3 text-amber-600">
            <div className="p-2 bg-amber-50 rounded-xl">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-wider">Adjustment Planner: Required Changes</h3>
          </div>
          <div className="mt-5 grid gap-4">
            {evaluation.adjustmentPlans.map((plan) => (
              <div key={plan.commitmentId} className="flex items-center justify-between rounded-[1.5rem] border border-amber-200/60 bg-amber-50/50 p-5 hover:bg-amber-50 transition-colors">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600/80">Reduce {plan.commitmentName}</p>
                  <p className="mt-2 text-xl font-black text-amber-900 tracking-tight">
                    {hours(plan.originalHours)} <span className="text-amber-400 mx-1">→</span> {hours(plan.reducedHours)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600/80">Saved</p>
                  <p className="mt-2 text-xl font-black text-amber-600 tracking-tight">+{hours(plan.reduction)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Focus Budget Impact</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {evaluation.focusBudgets.map((budget) => (
            <div key={budget.goalId} className="rounded-[1.5rem] border border-zinc-200/60 bg-white/70 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{budget.goalName}</span>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                  budget.status === "Healthy" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : 
                  budget.status === "Warning" ? "bg-amber-50 text-amber-700 border border-amber-100" : 
                  "bg-rose-50 text-rose-700 border border-rose-100"
                }`}>
                  {budget.status}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="bg-zinc-50/80 rounded-xl p-2 border border-zinc-100">
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Budget</p>
                  <p className="text-sm font-black mt-1 text-zinc-700">{budget.budgetedPercentage}%</p>
                </div>
                <div className="bg-zinc-50/80 rounded-xl p-2 border border-zinc-100">
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Current</p>
                  <p className="text-sm font-black mt-1 text-zinc-700">{budget.currentPercentage}%</p>
                </div>
                <div className={`rounded-xl p-2 border ${budget.status !== "Healthy" ? "bg-rose-50/50 border-rose-100" : "bg-emerald-50/50 border-emerald-100"}`}>
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Projected</p>
                  <p className={`text-sm font-black mt-1 ${budget.status !== "Healthy" ? "text-rose-600" : "text-emerald-600"}`}>{budget.projectedPercentage}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <ImpactBlock title="Expected Gains" items={evaluation.opportunity.expectedImpact.length ? evaluation.opportunity.expectedImpact : ["No explicit benefits entered yet."]} />
        <ImpactBlock
          title="Trade-offs & Goal Impact"
          danger={danger}
          items={
            evaluation.tradeoffs.length
              ? evaluation.tradeoffs.map((item) => `${item.name} priority is ${item.priority}/10. Impact: ${evaluation.goalImpact} risk.`)
              : ["No immediate risk to existing goals predicted."]
          }
        />
      </div>
    </section>
  );
}

function OpportunityCard(props: {
  opportunity: Opportunity;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (id: string) => void;
  onDecision: (id: string, status: Exclude<OpportunityStatus, "pending_review">) => void;
}) {
  const { opportunity, selected } = props;
  return (
    <article
      className={`cursor-pointer rounded-[1.5rem] border p-5 transition-all duration-300 ${
        selected ? "border-cyan-300 bg-cyan-50/60 shadow-[0_8px_30px_-10px_rgba(6,182,212,0.2)] scale-[1.02]" : "border-zinc-200/60 bg-white/60 hover:border-cyan-200/60 hover:bg-white hover:shadow-md"
      }`}
      onClick={() => props.onSelect(opportunity.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") props.onSelect(opportunity.id);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-black text-lg tracking-tight">{opportunity.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm font-medium text-zinc-500 leading-relaxed">{opportunity.description || "No description."}</p>
        </div>
        <ToneBadge tone={recommendationTone(statusLabel(opportunity.status))}>{statusLabel(opportunity.status)}</ToneBadge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Tag>{opportunity.category}</Tag>
        <Tag>{timeLabel(opportunity)}</Tag>
        <Tag>{durationLabel(opportunity)}</Tag>
        <Tag>{money(opportunity.moneyCost, opportunity.currency)}</Tag>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button className="rounded-xl bg-[#0f1115] px-4 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md" type="button" onClick={(event) => { event.stopPropagation(); props.onSelect(opportunity.id); }}>
          Review
        </button>
        <button className="rounded-xl bg-white border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-600 shadow-sm hover:bg-zinc-50" type="button" onClick={(event) => { event.stopPropagation(); props.onEdit(opportunity); }}>
          Edit
        </button>
        <button className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100" type="button" onClick={(event) => { event.stopPropagation(); props.onDecision(opportunity.id, "accepted"); }}>
          Accept
        </button>
        <button className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-2 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-100" type="button" onClick={(event) => { event.stopPropagation(); props.onDecision(opportunity.id, "deferred"); }}>
          Defer
        </button>
        <button className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100" type="button" onClick={(event) => { event.stopPropagation(); props.onDecision(opportunity.id, "rejected"); }}>
          Reject
        </button>
        <button className="rounded-xl bg-white border border-rose-100 px-4 py-2 text-xs font-bold text-rose-600 shadow-sm hover:bg-rose-50" type="button" onClick={(event) => { event.stopPropagation(); props.onDelete(opportunity.id); }}>
          Delete
        </button>
      </div>
    </article>
  );
}

function Dashboard({
  state,
  stats,
  pending,
  recent,
  openOpportunities,
  openGoals,
  reviewOpportunity
}: {
  state: AppState;
  stats: ReturnType<typeof capacityStats>;
  pending: Opportunity[];
  recent: Opportunity[];
  openOpportunities: () => void;
  openGoals: () => void;
  reviewOpportunity: (id: string) => void;
}) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 md:grid-cols-4">
        <MetricCard icon={Clock3} label="Allocated" value={hours(stats.allocated)} helper={`${hours(stats.commitmentHours)} active commitments`} />
        <MetricCard icon={Gauge} label="Remaining" value={hours(stats.remaining)} helper="Available this week" danger={stats.remaining < 0} />
        <MetricCard icon={Activity} label="Utilization" value={`${stats.utilization}%`} helper={stats.utilization >= 85 ? "Near limit" : "Healthy load"} />
        <MetricCard icon={Inbox} label="Pending" value={String(pending.length)} helper="Needs review" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card rounded-[2rem] p-6 lg:p-8 border-white/40 shadow-[0_10px_40px_-10px_rgba(15,17,21,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Current Focus</h2>
            <Target className="text-cyan-600" />
          </div>
          <div className="mt-6 grid gap-4">
            {[...state.goals]
              .sort((a, b) => b.priority - a.priority)
              .slice(0, 3)
              .map((goal) => (
                <button key={goal.id} className="w-full rounded-2xl border border-zinc-200/50 bg-white/80 p-5 text-left shadow-sm hover:border-cyan-200 hover:bg-white hover:shadow-md transition-all" type="button" onClick={openGoals}>
                  <div className="flex items-center justify-between">
                    <strong className="text-lg font-black tracking-tight">{goal.name}</strong>
                    <Tag>Priority {goal.priority}</Tag>
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-500">{goal.deadline || "No deadline"}</p>
                </button>
              ))}
          </div>
        </section>

        <section className="surface-card rounded-[2rem] p-6 lg:p-8 border-white/40 shadow-[0_10px_40px_-10px_rgba(15,17,21,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Decision Queue</h2>
            <button className="rounded-xl bg-[#0f1115] px-4 py-2 text-sm font-bold text-white shadow-sm hover:shadow-md transition-all" onClick={openOpportunities}>
              Review
            </button>
          </div>
          <div className="mt-6 grid gap-4">
            {pending.length ? pending.map((item) => <OpportunityMini key={item.id} opportunity={item} onClick={() => reviewOpportunity(item.id)} />) : <EmptyText>No pending reviews.</EmptyText>}
          </div>
        </section>

        <section className="surface-card rounded-[2rem] p-6 lg:p-8 border-white/40 shadow-[0_10px_40px_-10px_rgba(15,17,21,0.06)] lg:col-span-2">
          <h2 className="text-2xl font-black tracking-tight">Recent Decisions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recent.length ? recent.map((item) => <OpportunityMini key={item.id} opportunity={item} onClick={() => reviewOpportunity(item.id)} />) : <EmptyText>No decisions yet.</EmptyText>}
          </div>
        </section>
      </div>
    </div>
  );
}
function GoalsWorkspace(props: {
  state: AppState;
  goalForm: typeof blankGoal;
  setGoalForm: (next: typeof blankGoal) => void;
  commitmentForm: typeof blankCommitment;
  setCommitmentForm: (next: typeof blankCommitment) => void;
  addGoal: (event: FormEvent<HTMLFormElement>) => void;
  addCommitment: (event: FormEvent<HTMLFormElement>) => void;
  deleteGoal: (id: string) => void;
  deleteCommitment: (id: string) => void;
}) {
  const { state, goalForm, setGoalForm, commitmentForm, setCommitmentForm } = props;
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_380px_1fr]">
      <form className="surface-card rounded-[2rem] p-6 lg:p-8" onSubmit={props.addGoal}>
        <h2 className="text-2xl font-black tracking-tight">Add Goal</h2>
        <div className="mt-6 grid gap-5">
          <Field label="Name">
            <input required value={goalForm.name} onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })} placeholder="e.g., Security Internship" />
          </Field>
          <Field label="Description">
            <textarea value={goalForm.description} onChange={(event) => setGoalForm({ ...goalForm, description: event.target.value })} placeholder="What are you trying to achieve?" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority (1-10)">
              <input type="number" min={1} max={10} value={goalForm.priority} onChange={(event) => setGoalForm({ ...goalForm, priority: Number(event.target.value) })} />
            </Field>
            <Field label="Focus Budget (%)">
              <input type="number" min={0} max={100} value={goalForm.focusPercentage} onChange={(event) => setGoalForm({ ...goalForm, focusPercentage: Number(event.target.value) })} />
            </Field>
          </div>
          <Field label="Deadline">
            <input type="date" value={goalForm.deadline} onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })} />
          </Field>
          <Field label="Success Metrics">
            <input value={goalForm.successMetrics} onChange={(event) => setGoalForm({ ...goalForm, successMetrics: event.target.value })} placeholder="Comma separated metrics" />
          </Field>
          <button className="rounded-xl bg-[#0f1115] px-5 py-3.5 font-bold text-white shadow-md mt-2 hover:shadow-lg transition-all">Add Goal</button>
        </div>
      </form>

      <form className="surface-card rounded-[2rem] p-6 lg:p-8" onSubmit={props.addCommitment}>
        <h2 className="text-2xl font-black tracking-tight">Add Commitment</h2>
        <div className="mt-6 grid gap-5">
          <Field label="Name">
            <input required value={commitmentForm.name} onChange={(event) => setCommitmentForm({ ...commitmentForm, name: event.target.value })} placeholder="e.g., CPTS Study, Gym" />
          </Field>
          <Field label="Linked Goal">
            <select value={commitmentForm.goalId} onChange={(event) => setCommitmentForm({ ...commitmentForm, goalId: event.target.value })}>
              <option value="">General commitment</option>
              {state.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Time required">
              <input type="number" min={0} step={0.5} value={commitmentForm.timeAmount} onChange={(event) => setCommitmentForm({ ...commitmentForm, timeAmount: Number(event.target.value) })} />
            </Field>
            <Field label="Frequency">
              <select value={commitmentForm.timeUnit} onChange={(event) => setCommitmentForm({ ...commitmentForm, timeUnit: event.target.value as Exclude<TimeUnit, "total"> })}>
                <option value="per_day">Per day</option>
                <option value="per_week">Per week</option>
                <option value="per_month">Per month</option>
              </select>
            </Field>
          </div>
          <Field label="Priority (1-10)">
            <input type="number" min={1} max={10} value={commitmentForm.priority} onChange={(event) => setCommitmentForm({ ...commitmentForm, priority: Number(event.target.value) })} />
          </Field>
          <button className="rounded-xl bg-[#0f1115] px-5 py-3.5 font-bold text-white shadow-md mt-2 hover:shadow-lg transition-all">Add Commitment</button>
        </div>
      </form>

      <section className="surface-card rounded-[2rem] p-6 lg:p-8 border-white/40 shadow-[0_10px_40px_-10px_rgba(15,17,21,0.06)]">
        <h2 className="text-2xl font-black tracking-tight">Goals & Commitments</h2>
        <div className="mt-6 grid gap-5">
          {state.goals.map((goal) => (
            <article key={goal.id} className="rounded-2xl border border-zinc-200/60 bg-white/70 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-black text-lg tracking-tight">{goal.name}</h3>
                  <p className="mt-1 text-sm font-medium text-zinc-500 leading-relaxed">{goal.description}</p>
                </div>
                <button className="rounded-xl bg-white border border-rose-100 p-2 text-rose-600 shadow-sm hover:bg-rose-50 transition-colors" onClick={() => props.deleteGoal(goal.id)}>
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Tag>Priority {goal.priority}</Tag>
                <Tag>Budget: {goal.focusPercentage}%</Tag>
                {goal.deadline && <Tag>{goal.deadline}</Tag>}
              </div>
              <div className="mt-5 grid gap-2.5">
                {state.commitments
                  .filter((item) => item.goalId === goal.id)
                  .map((commitment) => (
                    <div key={commitment.id} className="flex items-center justify-between rounded-xl bg-zinc-50/80 px-4 py-2.5 border border-zinc-100">
                      <span className="text-sm font-bold">{commitment.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-zinc-400 bg-white px-2 py-1 rounded-md shadow-sm">{hours(weeklyImpact(commitment))} weekly</span>
                        <button className="text-zinc-400 hover:text-rose-600 transition-colors" onClick={() => props.deleteCommitment(commitment.id)}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-zinc-500">
      {label}
      {children}
    </label>
  );
}

function MetricPill({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const toneClass = tone === "bad" ? "text-rose-600" : tone === "warn" ? "text-amber-600" : tone === "good" ? "text-lime-600" : "text-zinc-900";
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white/80 px-5 py-3 shadow-sm backdrop-blur hover:bg-white transition-colors">
      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`text-xl font-black mt-0.5 ${toneClass}`}>{value}</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, helper, danger }: { icon: typeof Clock3; label: string; value: string; helper: string; danger?: boolean }) {
  return (
    <article className="surface-card rounded-[1.5rem] p-6 hover-lift border-white/40">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
        <div className={`p-2 rounded-xl ${danger ? "bg-rose-50 text-rose-600" : "bg-cyan-50 text-cyan-600"}`}>
          <Icon size={20} />
        </div>
      </div>
      <strong className={`mt-5 block text-4xl font-black tracking-tight ${danger ? "text-rose-600" : "text-zinc-900"}`}>{value}</strong>
      <p className="mt-2 text-sm font-bold text-zinc-400">{helper}</p>
    </article>
  );
}

function ReviewStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 transition-colors ${danger ? "impact-pulse border-rose-200 bg-rose-50/80 text-rose-700" : "border-zinc-200/60 bg-white/70 hover:bg-white"}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
      <strong className="mt-2 block text-2xl font-black tracking-tight">{value}</strong>
    </div>
  );
}

function ImpactBlock({ title, items, danger }: { title: string; items: string[]; danger?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] border p-6 transition-colors ${danger ? "border-rose-200/60 bg-rose-50/30" : "border-zinc-200/60 bg-white/60"}`}>
      <h3 className="font-black text-lg tracking-tight text-zinc-900">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item} className={`rounded-xl px-4 py-3 text-sm font-bold shadow-sm ${danger ? "impact-pulse border border-rose-200 bg-rose-50 text-rose-700" : "bg-white text-zinc-600 border border-zinc-100"}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToneBadge({ tone, children }: { tone: string; children: ReactNode }) {
  const className = tone === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : tone === "bad" ? "bg-rose-50 text-rose-700 border-rose-200/50" : "bg-amber-50 text-amber-700 border-amber-200/50";
  return <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${className}`}>{children}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 border border-zinc-200 shadow-sm">{children}</span>;
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300/80 bg-zinc-50/50 p-6 text-center text-sm font-bold text-zinc-400">{children}</div>;
}

function OpportunityMini({ opportunity, onClick }: { opportunity: Opportunity; onClick?: () => void }) {
  return (
    <button className="w-full rounded-2xl border border-zinc-200/60 bg-white/70 p-5 text-left shadow-sm hover:border-cyan-200 hover:bg-white hover:shadow-md transition-all" onClick={onClick} type="button">
      <div className="flex items-center justify-between">
        <strong className="text-sm font-black tracking-tight">{opportunity.title}</strong>
        <ToneBadge tone={recommendationTone(statusLabel(opportunity.status))}>{statusLabel(opportunity.status)}</ToneBadge>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 font-bold">
        <span className="bg-white px-2 py-1 rounded-md border border-zinc-100">{timeLabel(opportunity)}</span>
        {opportunity.decisionDate && <span>{opportunity.decisionDate}</span>}
      </div>
    </button>
  );
}

function PreviewStat({ label, value, danger, warn }: { label: string; value: string; danger?: boolean; warn?: boolean }) {
  const accent = danger ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : warn ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]";
  const valueTone = danger ? "text-rose-600" : warn ? "text-amber-600" : "text-zinc-900";

  return (
    <div className="min-h-[96px] rounded-2xl border border-zinc-100 bg-zinc-50/80 px-5 py-4 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${accent}`}></div>
      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 pl-1">{label}</p>
      <strong className={`mt-3 block text-xl font-black tracking-tight pl-1 ${valueTone}`}>{value}</strong>
    </div>
  );
}

