import type { AdjustmentPlan, AppState, CapacityStats, Commitment, DurationUnit, Evaluation, FocusBudget, Opportunity, TimeUnit } from "./types";

export function makeId(prefix: string) {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function hours(value: number) {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}h`;
}

export function money(value: number, currency = "IDR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2
  }).format(Number(value || 0));
}

export function durationLabel(item: { durationAmount?: number; durationUnit?: DurationUnit }) {
  const amount = Number(item.durationAmount || 1);
  const unit = item.durationUnit || "week";
  return `${amount} ${unit}${amount === 1 ? "" : "s"}`;
}

export function durationInWeeks(item: { durationAmount?: number; durationUnit?: DurationUnit }) {
  const amount = Math.max(Number(item.durationAmount || 1), 1);
  const unit = item.durationUnit || "week";
  if (unit === "day") return Math.max(amount / 7, 1 / 7);
  if (unit === "month") return amount * 4.345;
  return amount;
}

export function weeklyImpact(item: { timeAmount?: number; timeUnit?: TimeUnit; durationAmount?: number; durationUnit?: DurationUnit }) {
  const amount = Number(item.timeAmount || 0);
  const unit = item.timeUnit || "per_week";
  if (unit === "per_day") return amount * 7;
  if (unit === "per_month") return amount / 4.345;
  if (unit === "total") return amount / Math.max(durationInWeeks(item), 1);
  return amount;
}

export function timeLabel(item: { timeAmount?: number; timeUnit?: TimeUnit }) {
  const amount = Number(item.timeAmount || 0);
  const labels: Record<TimeUnit, string> = {
    total: "total",
    per_day: "per day",
    per_week: "per week",
    per_month: "per month"
  };
  const unit = item.timeUnit || "per_week";
  return `${hours(amount)} ${labels[unit]}`;
}

export function activeCommitments(state: AppState) {
  return state.commitments.filter((commitment) => commitment.status === "active");
}

export function capacityStats(state: AppState, extraHours = 0): CapacityStats {
  const commitmentHours = activeCommitments(state).reduce((sum, item) => sum + weeklyImpact(item), 0);
  const allocated = commitmentHours;
  const capacity = Number(state.weeklyCapacity || 0);
  const remaining = capacity - allocated;
  const projected = allocated + Number(extraHours || 0);
  const utilization = capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;
  const projectedUtilization = capacity > 0 ? Math.round((projected / capacity) * 100) : 0;
  return { commitmentHours, allocated, capacity, remaining, utilization, projected, projectedUtilization };
}

export function evaluateOpportunity(state: AppState, opportunity: Opportunity): Evaluation {
  const opportunityImpact = weeklyImpact(opportunity);
  const stats = capacityStats(state, opportunityImpact);
  const overflow = Math.max(0, opportunityImpact - stats.remaining);
  const alignment = Number(opportunity.alignmentScore || 0);
  const topGoalPriority = Math.max(...state.goals.map((goal) => Number(goal.priority || 0)), 0);
  const focusDrift = alignment >= 8 ? "Low" : alignment >= 5 ? "Medium" : "High";
  const capacityImpact = overflow === 0 ? "Low" : overflow <= 3 ? "Medium" : "High";

  const adjustmentPlans = generateAdjustmentPlans(state, overflow);
  const focusBudgets = calculateFocusBudgets(state, opportunity);

  let recommendation: Evaluation["recommendation"] = "Defer";
  if (alignment >= 8 && capacityImpact === "Low" && focusDrift !== "High") recommendation = "Accept";
  if (alignment >= 6 && capacityImpact === "Medium" && adjustmentPlans.length > 0) recommendation = "Accept With Adjustments";
  if (alignment <= 4 && capacityImpact === "High" && focusDrift === "High") recommendation = "Reject";
  if (alignment <= 4 && capacityImpact !== "Low") recommendation = "Reject";

  const tradeoffs = findTradeoffs(state, overflow);
  const affectedGoals = [...new Set(tradeoffs.map((item) => item.goalId).filter(Boolean))]
    .map((goalId) => state.goals.find((goal) => goal.id === goalId))
    .filter((goal): goal is NonNullable<typeof goal> => Boolean(goal));
  const goalImpact = overflow === 0 ? "Low" : tradeoffs.some((item) => Number(item.priority || 0) >= topGoalPriority) ? "High" : "Medium";

  return { opportunity, stats, opportunityImpact, overflow, alignment, focusDrift, capacityImpact, recommendation, tradeoffs, adjustmentPlans, focusBudgets, affectedGoals, goalImpact };
}

export function findTradeoffs(state: AppState, overflow: number): Commitment[] {
  if (overflow <= 0) return [];
  return [...activeCommitments(state)]
    .sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0))
    .slice(0, 3);
}

export function generateAdjustmentPlans(state: AppState, overflow: number): AdjustmentPlan[] {
  if (overflow <= 0) return [];
  
  const activeComms = activeCommitments(state).sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0));
  const plans: AdjustmentPlan[] = [];
  let remainingOverflow = overflow;

  for (const comm of activeComms) {
    if (remainingOverflow <= 0) break;
    const weekly = weeklyImpact(comm);
    const reduction = Math.min(weekly, remainingOverflow);
    if (reduction > 0) {
      plans.push({
        commitmentId: comm.id,
        commitmentName: comm.name,
        originalHours: weekly,
        reducedHours: weekly - reduction,
        reduction
      });
      remainingOverflow -= reduction;
    }
  }

  return plans;
}

export function calculateFocusBudgets(state: AppState, opportunity?: Opportunity): FocusBudget[] {
  const totalCapacity = Number(state.weeklyCapacity || 40);
  const activeComms = activeCommitments(state);
  
  const getGoalHours = (goalId: string, extraOpportunity?: Opportunity) => {
    let hours = activeComms
      .filter(c => c.goalId === goalId)
      .reduce((sum, c) => sum + weeklyImpact(c), 0);
    
    // If opportunity aligns with this goal (simplification: based on category or notes)
    // For now, let's assume if it's evaluated, it adds to its category if we had that mapping.
    // Since we don't have a direct Goal <-> Opportunity mapping yet, 
    // we just use the existing hours for "Current".
    return hours;
  };

  const totalAllocated = activeComms.reduce((sum, c) => sum + weeklyImpact(c), 0);
  const oppImpact = opportunity ? weeklyImpact(opportunity) : 0;
  const projectedTotal = totalAllocated + oppImpact;

  return state.goals.map(goal => {
    const currentHours = getGoalHours(goal.id);
    const currentPercentage = totalAllocated > 0 ? Math.round((currentHours / totalAllocated) * 100) : 0;
    
    // Projected percentage: if we accept the opportunity, how does focus shift?
    // This is tricky because we don't know which goal the opportunity belongs to.
    // PRD says "Users allocate focus percentages".
    // Let's assume the opportunity might take away from everything proportionally or 
    // simply add to the total, diluting existing ones unless it's mapped.
    
    const projectedPercentage = projectedTotal > 0 ? Math.round((currentHours / projectedTotal) * 100) : 0;
    
    const diff = Math.abs(projectedPercentage - goal.focusPercentage);
    let status: FocusBudget["status"] = "Healthy";
    if (diff > 15) status = "Critical";
    else if (diff > 5) status = "Warning";

    return {
      goalId: goal.id,
      goalName: goal.name,
      budgetedPercentage: goal.focusPercentage,
      currentPercentage,
      projectedPercentage,
      status
    };
  });
}

export function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .map((item) => item.replace(/^[-*•]\s*/, ""))
    .filter(Boolean);
}

export function statusLabel(status: Opportunity["status"]) {
  const labels: Record<Opportunity["status"], string> = {
    pending_review: "Pending Review",
    accepted: "Accepted",
    rejected: "Rejected",
    deferred: "Deferred"
  };
  return labels[status];
}

export function recommendationTone(value: string) {
  if (value === "Accept" || value === "Accepted") return "good";
  if (value === "Reject" || value === "Rejected") return "bad";
  if (value === "Accept With Adjustments") return "warn";
  return "warn";
}
