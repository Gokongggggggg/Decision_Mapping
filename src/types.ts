export type TimeUnit = "total" | "per_day" | "per_week" | "per_month";
export type DurationUnit = "day" | "week" | "month";
export type Status = "active" | "paused" | "completed";
export type OpportunityStatus = "pending_review" | "accepted" | "rejected" | "deferred";
export type Recommendation = "Accept" | "Defer" | "Reject" | "Accept With Adjustments";

export interface Goal {
  id: string;
  name: string;
  description: string;
  priority: number;
  deadline: string;
  successMetrics: string[];
  status: Status;
  focusPercentage: number; // New: for Focus Budget
}

export interface Commitment {
  id: string;
  goalId: string;
  name: string;
  timeAmount: number;
  timeUnit: Exclude<TimeUnit, "total">;
  priority: number;
  startDate: string;
  endDate: string;
  status: Status;
  notes: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  timeAmount: number;
  timeUnit: TimeUnit;
  durationAmount: number;
  durationUnit: DurationUnit;
  moneyCost: number;
  currency: string;
  deadline: string;
  notes: string;
  alignmentScore: number;
  expectedImpact: string[];
  status: OpportunityStatus;
  decisionDate?: string; // New: for Decision Journal
  decisionReason?: string; // New: for Decision Journal
}

export interface AppState {
  weeklyCapacity: number;
  selectedOpportunityId: string | null;
  goals: Goal[];
  commitments: Commitment[];
  opportunities: Opportunity[];
}

export interface CapacityStats {
  commitmentHours: number;
  allocated: number;
  capacity: number;
  remaining: number;
  utilization: number;
  projected: number;
  projectedUtilization: number;
}

export interface AdjustmentPlan {
  commitmentId: string;
  commitmentName: string;
  originalHours: number;
  reducedHours: number;
  reduction: number;
}

export interface FocusBudget {
  goalId: string;
  goalName: string;
  budgetedPercentage: number;
  currentPercentage: number;
  projectedPercentage: number;
  status: "Healthy" | "Warning" | "Critical";
}

export interface Evaluation {
  opportunity: Opportunity;
  stats: CapacityStats;
  opportunityImpact: number;
  overflow: number;
  alignment: number;
  focusDrift: "Low" | "Medium" | "High";
  capacityImpact: "Low" | "Medium" | "High";
  recommendation: Recommendation;
  tradeoffs: Commitment[];
  adjustmentPlans: AdjustmentPlan[]; // New: Adjustment Planner
  focusBudgets: FocusBudget[]; // New: Focus Budget
  affectedGoals: Goal[];
  goalImpact: "Low" | "Medium" | "High";
}
