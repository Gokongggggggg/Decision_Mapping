export type TimeUnit = "total" | "per_day" | "per_week" | "per_month";
export type DurationUnit = "day" | "week" | "month";
export type Status = "active" | "paused" | "completed";
export type OpportunityStatus = "pending_review" | "accepted" | "rejected" | "deferred";
export type Recommendation = "Accept" | "Defer" | "Reject";

export interface Goal {
  id: string;
  name: string;
  description: string;
  priority: number;
  deadline: string;
  successMetrics: string[];
  status: Status;
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
  affectedGoals: Goal[];
  goalImpact: "Low" | "Medium" | "High";
}
