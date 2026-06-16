import type { AppState } from "./types";

export const emptyState: AppState = {
  weeklyCapacity: 40,
  selectedOpportunityId: null,
  goals: [
    {
      id: "goal_security_intern",
      name: "Become Security Intern",
      description: "Prepare for security internship applications.",
      priority: 10,
      deadline: "2026-12-31",
      successMetrics: ["Complete CPTS", "Build portfolio", "Apply to internships"],
      status: "active"
    }
  ],
  commitments: [
    {
      id: "commitment_cpts",
      goalId: "goal_security_intern",
      name: "CPTS",
      timeAmount: 10,
      timeUnit: "per_week",
      priority: 10,
      startDate: "",
      endDate: "",
      status: "active",
      notes: "Certification preparation"
    },
    {
      id: "commitment_htb",
      goalId: "goal_security_intern",
      name: "HTB Machines",
      timeAmount: 5,
      timeUnit: "per_week",
      priority: 9,
      startDate: "",
      endDate: "",
      status: "active",
      notes: "Practical security training"
    },
    {
      id: "commitment_university",
      goalId: "",
      name: "University",
      timeAmount: 20,
      timeUnit: "per_week",
      priority: 8,
      startDate: "",
      endDate: "",
      status: "active",
      notes: ""
    },
    {
      id: "commitment_gym",
      goalId: "goal_security_intern",
      name: "Gym",
      timeAmount: 4,
      timeUnit: "per_week",
      priority: 5,
      startDate: "",
      endDate: "",
      status: "active",
      notes: ""
    }
  ],
  opportunities: [
    {
      id: "opportunity_compfest_pm",
      title: "COMPFEST PM Academy",
      description: "Product management academy program.",
      category: "academy",
      timeAmount: 8,
      timeUnit: "per_week",
      durationAmount: 10,
      durationUnit: "week",
      moneyCost: 0,
      currency: "IDR",
      deadline: "",
      notes: "Example opportunity",
      alignmentScore: 6,
      expectedImpact: ["Product Thinking", "Network", "Certificate"],
      status: "pending_review"
    }
  ]
};

export const demoState: AppState = {
  weeklyCapacity: 40,
  selectedOpportunityId: "opportunity_pm_academy",
  goals: [
    {
      id: "goal_security_intern",
      name: "Security Internship",
      description: "Prepare for security internship applications.",
      priority: 10,
      deadline: "2026-12-31",
      successMetrics: ["Complete CPTS", "Build portfolio", "Apply to internships"],
      status: "active"
    },
    {
      id: "goal_product_building",
      name: "Product Building",
      description: "Ship practical products and improve product thinking.",
      priority: 7,
      deadline: "2026-10-31",
      successMetrics: ["Ship MVP", "Get user feedback"],
      status: "active"
    },
    {
      id: "goal_health",
      name: "Health Baseline",
      description: "Maintain energy while pursuing technical goals.",
      priority: 6,
      deadline: "",
      successMetrics: ["Train consistently", "Sleep baseline"],
      status: "active"
    }
  ],
  commitments: [
    {
      id: "commitment_cpts",
      goalId: "goal_security_intern",
      name: "CPTS",
      timeAmount: 10,
      timeUnit: "per_week",
      priority: 10,
      startDate: "",
      endDate: "",
      status: "active",
      notes: "Core certification prep"
    },
    {
      id: "commitment_htb",
      goalId: "goal_security_intern",
      name: "HTB Machines",
      timeAmount: 1.5,
      timeUnit: "per_day",
      priority: 9,
      startDate: "",
      endDate: "",
      status: "active",
      notes: "Daily practical reps"
    },
    {
      id: "commitment_university",
      goalId: "",
      name: "University",
      timeAmount: 18,
      timeUnit: "per_week",
      priority: 8,
      startDate: "",
      endDate: "",
      status: "active",
      notes: "Classes and assignments"
    },
    {
      id: "commitment_portfolio",
      goalId: "goal_product_building",
      name: "Portfolio Project",
      timeAmount: 12,
      timeUnit: "per_month",
      priority: 7,
      startDate: "",
      endDate: "",
      status: "active",
      notes: "Monthly shipping block"
    },
    {
      id: "commitment_gym",
      goalId: "goal_health",
      name: "Gym",
      timeAmount: 4,
      timeUnit: "per_week",
      priority: 5,
      startDate: "",
      endDate: "",
      status: "active",
      notes: "Energy maintenance"
    }
  ],
  opportunities: [
    {
      id: "opportunity_pm_academy",
      title: "PM Academy",
      description: "Product management academy with weekly sessions and assignments.",
      category: "academy",
      timeAmount: 8,
      timeUnit: "per_week",
      durationAmount: 10,
      durationUnit: "week",
      moneyCost: 0,
      currency: "IDR",
      deadline: "",
      notes: "Good network, but competes with CPTS and HTB.",
      alignmentScore: 6,
      expectedImpact: ["Product Thinking", "Network", "Certificate"],
      status: "pending_review"
    },
    {
      id: "opportunity_ctf_day",
      title: "One-Day CTF Competition",
      description: "Short security competition happening this weekend.",
      category: "competition",
      timeAmount: 9,
      timeUnit: "total",
      durationAmount: 1,
      durationUnit: "day",
      moneyCost: 50000,
      currency: "IDR",
      deadline: "2026-07-12",
      notes: "One intense day, low long-term commitment.",
      alignmentScore: 9,
      expectedImpact: ["Security Practice", "Team Experience"],
      status: "pending_review"
    },
    {
      id: "opportunity_startup_idea",
      title: "New Startup Idea",
      description: "Explore and validate a new SaaS idea.",
      category: "startup idea",
      timeAmount: 30,
      timeUnit: "per_month",
      durationAmount: 3,
      durationUnit: "month",
      moneyCost: 200000,
      currency: "IDR",
      deadline: "",
      notes: "Interesting, but broad and potentially distracting.",
      alignmentScore: 5,
      expectedImpact: ["Business Learning", "Product Portfolio"],
      status: "deferred"
    },
    {
      id: "opportunity_smt_korea",
      title: "SMT Korea",
      description: "International program with short application window.",
      category: "academy",
      timeAmount: 20,
      timeUnit: "total",
      durationAmount: 2,
      durationUnit: "week",
      moneyCost: 1000000,
      currency: "IDR",
      deadline: "2026-08-01",
      notes: "Useful exposure, but medium relevance.",
      alignmentScore: 6,
      expectedImpact: ["International Exposure", "Network"],
      status: "pending_review"
    }
  ]
};
