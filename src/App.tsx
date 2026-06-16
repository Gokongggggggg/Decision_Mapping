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
  { id: "opportunities", label: "Opportunities", icon: Inbox },
  { id: "dashboard", label: "Dashboard", icon: Gauge },
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
  successMetrics: ""
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
  const [view, setView] = useState<View>("opportunities");
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

  function openApp(nextView: View = "opportunities") {
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
      expectedImpact: opportunity.expectedImpact.join(", ")
    });
  }

  function setDecision(id: string, status: Exclude<OpportunityStatus, "pending_review">) {
    setState((current) => ({
      ...current,
      opportunities: current.opportunities.map((item) => (item.id === id ? { ...item, status } : item))
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
          status: "active"
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
    <div className="app-bg min-h-screen text-[#111317]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-black/10 bg-white/75 p-5 shadow-[18px_0_60px_rgba(17,19,23,0.06)] backdrop-blur-xl lg:flex lg:flex-col">
        <button className="flex items-center gap-3 text-left" onClick={() => setMode("landing")}>
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-lime-300 text-lg font-black text-zinc-950 shadow-lg shadow-cyan-500/20">O</span>
          <span>
            <span className="block text-xs font-black uppercase text-zinc-500">Opportunity OS</span>
            <span className="block text-lg font-black">Decision Console</span>
          </span>
        </button>

        <nav className="mt-8 grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                className={`flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-black transition ${
                  active ? "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200" : "text-zinc-600 hover:bg-white hover:text-zinc-950"
                }`}
                onClick={() => setView(item.id)}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
                {active ? <ArrowRight size={16} /> : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3">
          <button className="soft-shimmer rounded-xl bg-[#111317] px-4 py-3 text-sm font-black text-white shadow-lg shadow-zinc-950/15" onClick={() => setState(demoState)}>
            Load Demo Workspace
          </button>
          <div className="surface-card rounded-2xl p-4">
            <p className="text-xs font-black uppercase text-zinc-500">Weekly Capacity</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                className="h-11 w-24 rounded-xl border border-zinc-200 px-3 font-black"
                type="number"
                min={1}
                max={168}
                value={state.weeklyCapacity}
                onChange={(event) => setState((current) => ({ ...current, weeklyCapacity: Number(event.target.value) }))}
              />
              <span className="font-black text-zinc-500">hours</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-black/10 bg-white/68 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-cyan-700">MVP v0.2</p>
              <h1 className="text-3xl font-black tracking-tight lg:text-4xl">{navItems.find((item) => item.id === view)?.label}</h1>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <MetricPill label="Allocated" value={hours(stats.allocated)} />
              <MetricPill label="Remaining" value={hours(stats.remaining)} tone={stats.remaining < 0 ? "bad" : "good"} />
              <MetricPill label="Utilization" value={`${stats.utilization}%`} tone={stats.utilization > 100 ? "bad" : stats.utilization >= 85 ? "warn" : "good"} />
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
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

          {view === "dashboard" ? <Dashboard state={state} stats={stats} pending={pending} recent={recent} openOpportunities={() => setView("opportunities")} /> : null}

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
    <div className="landing-shell min-h-screen overflow-hidden text-[#111317]">
      <header className="relative z-10 flex items-center justify-between px-5 py-5 lg:px-10">
        <button className="flex items-center gap-3 text-left" onClick={() => onOpenApp("opportunities")}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-lime-300 font-black text-zinc-950 shadow-lg shadow-cyan-500/20">O</span>
          <span className="font-black">Opportunity OS</span>
        </button>
        <nav className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/70 p-1 shadow-lg shadow-zinc-950/5 backdrop-blur md:flex">
          <a className="rounded-full px-4 py-2 text-sm font-black text-zinc-600" href="#engine">Engine</a>
          <a className="rounded-full px-4 py-2 text-sm font-black text-zinc-600" href="#workflow">Workflow</a>
          <button className="rounded-full bg-[#111317] px-4 py-2 text-sm font-black text-white" onClick={() => onOpenApp("opportunities")}>
            Open App
          </button>
        </nav>
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-84px)] items-center gap-10 px-5 pb-12 pt-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10">
        <div className="reveal max-w-3xl">
          <p className="mb-4 text-xs font-black uppercase text-cyan-700">Decision support for ambitious people</p>
          <h1 className="gradient-text text-6xl font-black leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">Know the cost before saying yes.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            Evaluate incoming academies, competitions, certifications, projects, internships, and startup ideas against the goals and commitments already fighting for your capacity.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="soft-shimmer rounded-xl bg-[#111317] px-5 py-4 font-black text-white shadow-xl shadow-zinc-950/20" onClick={() => onOpenApp("opportunities")}>
              Open Opportunity OS
            </button>
            <button className="rounded-xl border border-black/10 bg-white/75 px-5 py-4 font-black text-zinc-900 shadow-lg shadow-zinc-950/5 backdrop-blur" onClick={() => onOpenApp("dashboard")}>
              View Dashboard
            </button>
          </div>
        </div>

        <div className="surface-card float-panel reveal reveal-delay-1 rounded-[1.35rem] p-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl bg-[#121418] p-6 text-white shadow-xl shadow-zinc-950/12 ring-1 ring-white/8">
              <p className="text-[11px] font-black uppercase tracking-wide text-zinc-400">Opportunity Review</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">PM Academy</h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <PreviewStat label="Current Load" value="35h / 40h" />
                <PreviewStat label="After Accept" value="43h / 40h" danger />
                <PreviewStat label="Overflow" value="3h" danger />
                <PreviewStat label="Decision" value="Defer" warn />
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs font-black uppercase text-zinc-500">Affected Commitments</p>
                <div className="mt-4 grid gap-2">
                  {["CPTS progress", "HTB practice", "Portfolio project"].map((item) => (
                    <div key={item} className="impact-pulse rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs font-black uppercase text-zinc-500">Decision Queue</p>
                <div className="mt-4 space-y-2 text-sm font-black">
                  <div className="flex justify-between rounded-xl bg-cyan-50 px-3 py-2 text-cyan-800">
                    <span>One-Day CTF</span>
                    <span>9h total</span>
                  </div>
                  <div className="flex justify-between rounded-xl bg-zinc-100 px-3 py-2">
                    <span>SMT Korea</span>
                    <span>20h total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="engine" className="surface-card reveal reveal-delay-2 relative z-10 mx-5 mb-5 rounded-[1.35rem] p-6 lg:mx-10 lg:p-10">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase text-cyan-700">Review Engine</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight lg:text-6xl">Turn vague opportunity cost into a visible trade-off.</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            ["Capture", "Store opportunities with flexible time units, duration, cost, deadline, and expected gain."],
            ["Normalize", "Convert per-day, per-week, per-month, and total time into weekly impact."],
            ["Decide", "See affected commitments and goal impact before accepting, rejecting, or deferring."]
          ].map(([title, body], index) => (
            <div key={title} className="surface-card rounded-2xl p-5">
              <span className="text-sm font-black text-cyan-700">0{index + 1}</span>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-2 leading-7 text-zinc-600">{body}</p>
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

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(360px,0.9fr)_minmax(420px,1.1fr)]">
      <form className="surface-card reveal rounded-2xl p-5 xl:sticky xl:top-32 xl:self-start" onSubmit={(event) => submitOpportunity(event, "later")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-cyan-700">Capture</p>
            <h2 className="text-2xl font-black">{editingOpportunityId ? "Edit Opportunity" : "New Opportunity"}</h2>
          </div>
          {editingOpportunityId ? (
            <button className="rounded-xl bg-zinc-100 p-2" type="button" onClick={cancelEdit}>
              <X size={18} />
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Title">
            <input required value={opportunityForm.title} onChange={(event) => setOpportunityForm({ ...opportunityForm, title: event.target.value })} placeholder="PM Academy" />
          </Field>
          <Field label="Description">
            <textarea value={opportunityForm.description} onChange={(event) => setOpportunityForm({ ...opportunityForm, description: event.target.value })} placeholder="What is this opportunity about?" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time required">
              <div className="grid grid-cols-[1fr_120px] gap-2">
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
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <input type="number" min={1} step={1} value={opportunityForm.durationAmount} onChange={(event) => setOpportunityForm({ ...opportunityForm, durationAmount: Number(event.target.value) })} />
                <select value={opportunityForm.durationUnit} onChange={(event) => setOpportunityForm({ ...opportunityForm, durationUnit: event.target.value as DurationUnit })}>
                  <option value="day">Days</option>
                  <option value="week">Weeks</option>
                  <option value="month">Months</option>
                </select>
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Money cost">
              <div className="grid grid-cols-[86px_1fr] gap-2">
                <select value={opportunityForm.currency} onChange={(event) => setOpportunityForm({ ...opportunityForm, currency: event.target.value })}>
                  {["IDR", "USD", "SGD", "EUR"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <input type="number" min={0} value={opportunityForm.moneyCost} onChange={(event) => setOpportunityForm({ ...opportunityForm, moneyCost: Number(event.target.value) })} />
              </div>
            </Field>
            <Field label="Alignment">
              <input type="number" min={1} max={10} value={opportunityForm.alignmentScore} onChange={(event) => setOpportunityForm({ ...opportunityForm, alignmentScore: Number(event.target.value) })} />
            </Field>
          </div>
          <Field label="Expected gain">
            <input value={opportunityForm.expectedImpact} onChange={(event) => setOpportunityForm({ ...opportunityForm, expectedImpact: event.target.value })} placeholder="Network, certificate, product thinking" />
          </Field>
          <Field label="Notes">
            <textarea value={opportunityForm.notes} onChange={(event) => setOpportunityForm({ ...opportunityForm, notes: event.target.value })} />
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="rounded-xl border border-black/10 bg-white px-4 py-3 font-black shadow-sm" type="submit">
            Review Later
          </button>
          <button className="soft-shimmer rounded-xl bg-[#111317] px-4 py-3 font-black text-white shadow-lg shadow-zinc-950/15" type="button" onClick={(event) => submitOpportunity(event as unknown as FormEvent<HTMLFormElement>, "now")}>
            Review Now
          </button>
        </div>
      </form>

      <section className="surface-card reveal reveal-delay-1 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-zinc-500">Queue</p>
            <h2 className="text-2xl font-black">Opportunities</h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black">{state.opportunities.length} total</span>
        </div>
        <div className="mt-5 grid gap-3">
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
      <section className="surface-card reveal reveal-delay-2 grid min-h-[520px] place-items-center rounded-2xl border-dashed p-8 text-center">
        <div>
          <Inbox className="mx-auto text-zinc-400" size={42} />
          <h2 className="mt-4 text-2xl font-black">Select an opportunity to review</h2>
          <p className="mt-2 max-w-md text-zinc-600">Review Now opens the impact engine. Review Later stores the opportunity in the queue.</p>
        </div>
      </section>
    );
  }

  const danger = evaluation.overflow > 0;
  const tone = recommendationTone(evaluation.recommendation);

  return (
    <section className="surface-card reveal reveal-delay-2 rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-cyan-700">Opportunity Review</p>
          <h2 className="text-3xl font-black tracking-tight">{evaluation.opportunity.title}</h2>
          <p className="mt-2 text-zinc-600">{evaluation.opportunity.description || "No description provided."}</p>
        </div>
        <ToneBadge tone={tone}>{evaluation.recommendation}</ToneBadge>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ReviewStat label="Alignment" value={`${evaluation.alignment}/10`} />
        <ReviewStat label="Opportunity Time" value={timeLabel(evaluation.opportunity)} />
        <ReviewStat label="Weekly Impact" value={hours(evaluation.opportunityImpact)} danger={danger} />
        <ReviewStat label="Current Load" value={`${hours(evaluation.stats.allocated)} / ${hours(evaluation.stats.capacity)}`} />
        <ReviewStat label="After Accept" value={`${hours(evaluation.stats.projected)} / ${hours(evaluation.stats.capacity)}`} danger={danger} />
        <ReviewStat label="Overflow" value={hours(evaluation.overflow)} danger={danger} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ImpactBlock title="Gain" items={evaluation.opportunity.expectedImpact.length ? evaluation.opportunity.expectedImpact : ["No explicit benefits entered yet."]} />
        <ImpactBlock
          title="Affected commitments"
          danger={danger}
          items={
            evaluation.tradeoffs.length
              ? evaluation.tradeoffs.map((item) => `${item.name} may lose up to ${hours(Math.min(weeklyImpact(item), evaluation.overflow))} this week`)
              : ["No delay predicted from current capacity."]
          }
        />
      </div>

      <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4">
        <h3 className="font-black">Current commitments benchmark</h3>
        <div className="mt-3 grid gap-2">
          {state.commitments.map((item) => (
            <div key={item.id} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${danger ? "impact-pulse border border-rose-200 bg-rose-50 text-rose-800" : "bg-white"}`}>
              <span className="font-black">{item.name}</span>
              <span className="text-zinc-500">{hours(weeklyImpact(item))} weekly impact</span>
            </div>
          ))}
        </div>
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
    <article className={`rounded-2xl border p-4 transition ${selected ? "border-cyan-300 bg-cyan-50/80 shadow-lg shadow-cyan-500/10" : "border-black/10 bg-white/80 hover:border-cyan-200 hover:bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{opportunity.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{opportunity.description || "No description."}</p>
        </div>
        <ToneBadge tone={recommendationTone(statusLabel(opportunity.status))}>{statusLabel(opportunity.status)}</ToneBadge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Tag>{opportunity.category}</Tag>
        <Tag>{timeLabel(opportunity)}</Tag>
        <Tag>{durationLabel(opportunity)}</Tag>
        <Tag>{money(opportunity.moneyCost, opportunity.currency)}</Tag>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-xl bg-[#111317] px-3 py-2 text-xs font-black text-white" onClick={() => props.onSelect(opportunity.id)}>
          Review
        </button>
        <button className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-black" onClick={() => props.onEdit(opportunity)}>
          Edit
        </button>
        <button className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700" onClick={() => props.onDecision(opportunity.id, "accepted")}>
          Accept
        </button>
        <button className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700" onClick={() => props.onDecision(opportunity.id, "deferred")}>
          Defer
        </button>
        <button className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700" onClick={() => props.onDecision(opportunity.id, "rejected")}>
          Reject
        </button>
      </div>
    </article>
  );
}

function Dashboard({ state, stats, pending, recent, openOpportunities }: { state: AppState; stats: ReturnType<typeof capacityStats>; pending: Opportunity[]; recent: Opportunity[]; openOpportunities: () => void }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Clock3} label="Allocated" value={hours(stats.allocated)} helper={`${hours(stats.commitmentHours)} active commitments`} />
        <MetricCard icon={Gauge} label="Remaining" value={hours(stats.remaining)} helper="Available this week" danger={stats.remaining < 0} />
        <MetricCard icon={Activity} label="Utilization" value={`${stats.utilization}%`} helper={stats.utilization >= 85 ? "Near limit" : "Healthy load"} />
        <MetricCard icon={Inbox} label="Pending" value={String(pending.length)} helper="Needs review" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Current Focus</h2>
            <Target className="text-cyan-700" />
          </div>
          <div className="mt-4 grid gap-3">
            {[...state.goals]
              .sort((a, b) => b.priority - a.priority)
              .slice(0, 3)
              .map((goal) => (
                <div key={goal.id} className="rounded-2xl bg-zinc-50 p-4">
                  <div className="flex items-center justify-between">
                    <strong>{goal.name}</strong>
                    <Tag>Priority {goal.priority}</Tag>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{goal.deadline || "No deadline"}</p>
                </div>
              ))}
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Decision Queue</h2>
            <button className="rounded-xl bg-[#111317] px-3 py-2 text-sm font-black text-white" onClick={openOpportunities}>
              Review
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {pending.length ? pending.map((item) => <OpportunityMini key={item.id} opportunity={item} />) : <EmptyText>No pending reviews.</EmptyText>}
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-2xl font-black">Recent Decisions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recent.length ? recent.map((item) => <OpportunityMini key={item.id} opportunity={item} />) : <EmptyText>No decisions yet.</EmptyText>}
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
    <div className="grid gap-5 xl:grid-cols-[360px_360px_1fr]">
      <form className="surface-card rounded-2xl p-5" onSubmit={props.addGoal}>
        <h2 className="text-2xl font-black">Add Goal</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Name">
            <input required value={goalForm.name} onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })} />
          </Field>
          <Field label="Description">
            <textarea value={goalForm.description} onChange={(event) => setGoalForm({ ...goalForm, description: event.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <input type="number" min={1} max={10} value={goalForm.priority} onChange={(event) => setGoalForm({ ...goalForm, priority: Number(event.target.value) })} />
            </Field>
            <Field label="Deadline">
              <input type="date" value={goalForm.deadline} onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })} />
            </Field>
          </div>
          <Field label="Success Metrics">
            <input value={goalForm.successMetrics} onChange={(event) => setGoalForm({ ...goalForm, successMetrics: event.target.value })} placeholder="Complete CPTS, Apply to internships" />
          </Field>
          <button className="rounded-xl bg-[#111317] px-4 py-3 font-black text-white">Add Goal</button>
        </div>
      </form>

      <form className="surface-card rounded-2xl p-5" onSubmit={props.addCommitment}>
        <h2 className="text-2xl font-black">Add Commitment</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Name">
            <input required value={commitmentForm.name} onChange={(event) => setCommitmentForm({ ...commitmentForm, name: event.target.value })} placeholder="CPTS, University, Gym" />
          </Field>
          <Field label="Goal">
            <select value={commitmentForm.goalId} onChange={(event) => setCommitmentForm({ ...commitmentForm, goalId: event.target.value })}>
              <option value="">General commitment</option>
              {state.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time cost">
              <input type="number" min={0} step={0.5} value={commitmentForm.timeAmount} onChange={(event) => setCommitmentForm({ ...commitmentForm, timeAmount: Number(event.target.value) })} />
            </Field>
            <Field label="Unit">
              <select value={commitmentForm.timeUnit} onChange={(event) => setCommitmentForm({ ...commitmentForm, timeUnit: event.target.value as Exclude<TimeUnit, "total"> })}>
                <option value="per_day">Per day</option>
                <option value="per_week">Per week</option>
                <option value="per_month">Per month</option>
              </select>
            </Field>
          </div>
          <Field label="Priority">
            <input type="number" min={1} max={10} value={commitmentForm.priority} onChange={(event) => setCommitmentForm({ ...commitmentForm, priority: Number(event.target.value) })} />
          </Field>
          <button className="rounded-xl bg-[#111317] px-4 py-3 font-black text-white">Add Commitment</button>
        </div>
      </form>

      <section className="surface-card rounded-2xl p-5">
        <h2 className="text-2xl font-black">Goals & Commitments</h2>
        <div className="mt-5 grid gap-4">
          {state.goals.map((goal) => (
            <article key={goal.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black">{goal.name}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{goal.description}</p>
                </div>
                <button className="rounded-xl bg-red-50 p-2 text-red-700" onClick={() => props.deleteGoal(goal.id)}>
                  <X size={16} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Tag>Priority {goal.priority}</Tag>
                <Tag>{goal.deadline || "No deadline"}</Tag>
              </div>
              <div className="mt-4 grid gap-2">
                {state.commitments
                  .filter((item) => item.goalId === goal.id)
                  .map((commitment) => (
                    <div key={commitment.id} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                      <span className="text-sm font-black">{commitment.name}</span>
                      <span className="text-xs font-black text-zinc-500">{hours(weeklyImpact(commitment))} weekly</span>
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
  const toneClass = tone === "bad" ? "text-rose-700" : tone === "warn" ? "text-amber-700" : tone === "good" ? "text-lime-700" : "text-zinc-950";
  return (
    <div className="rounded-2xl border border-black/10 bg-white/78 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
      <p className={`text-xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, helper, danger }: { icon: typeof Clock3; label: string; value: string; helper: string; danger?: boolean }) {
  return (
    <article className="surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
        <Icon className={danger ? "text-rose-700" : "text-cyan-700"} size={20} />
      </div>
      <strong className={`mt-4 block text-4xl font-black ${danger ? "text-rose-700" : ""}`}>{value}</strong>
      <p className="mt-2 text-sm font-bold text-zinc-500">{helper}</p>
    </article>
  );
}

function ReviewStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${danger ? "impact-pulse border-rose-200 bg-rose-50 text-rose-700" : "border-black/10 bg-white/75"}`}>
      <p className="text-xs font-black uppercase opacity-70">{label}</p>
      <strong className="mt-2 block text-2xl font-black">{value}</strong>
    </div>
  );
}

function ImpactBlock({ title, items, danger }: { title: string; items: string[]; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/68 p-4">
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className={`rounded-xl px-3 py-2 text-sm font-bold ${danger ? "impact-pulse border border-rose-200 bg-rose-50 text-rose-700" : "bg-white text-zinc-700"}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToneBadge({ tone, children }: { tone: string; children: ReactNode }) {
  const className = tone === "good" ? "bg-lime-50 text-lime-700" : tone === "bad" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{children}</span>;
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-600 ring-1 ring-black/10">{children}</span>;
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-center text-sm font-black text-zinc-500">{children}</div>;
}

function OpportunityMini({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 p-4">
      <div className="flex items-center justify-between">
        <strong>{opportunity.title}</strong>
        <ToneBadge tone={recommendationTone(statusLabel(opportunity.status))}>{statusLabel(opportunity.status)}</ToneBadge>
      </div>
      <p className="mt-2 text-sm text-zinc-500">
        {timeLabel(opportunity)} / {durationLabel(opportunity)}
      </p>
    </div>
  );
}

function PreviewStat({ label, value, danger, warn }: { label: string; value: string; danger?: boolean; warn?: boolean }) {
  const accent = danger ? "border-l-rose-400/70" : warn ? "border-l-lime-400/65" : "border-l-zinc-500/70";
  const valueTone = danger ? "text-rose-100" : warn ? "text-lime-100" : "text-white";

  return (
    <div className={`min-h-[96px] rounded-xl border border-white/10 border-l-2 bg-white/[0.055] px-4 py-3.5 ${accent}`}>
      <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">{label}</p>
      <strong className={`mt-3 block text-xl font-black tracking-tight ${valueTone}`}>{value}</strong>
    </div>
  );
}
