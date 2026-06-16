# Product Requirements Document (PRD)

## Product Name

Opportunity OS

## Version

v0.1

## Author

Gokong

## Status

Draft MVP

---

## 1. Background

Individuals with multiple ambitions often struggle to evaluate new opportunities objectively.

When a new opportunity appears, such as internships, competitions, certifications, academies, side projects, startup ideas, or networking events, people usually evaluate the potential benefits but rarely evaluate the opportunity cost.

As a result, users frequently overcommit, lose focus on their primary goals, and experience slower progress despite being highly productive.

Current productivity tools such as Notion, Trello, Todoist, and Google Calendar help users organize tasks, but they do not explicitly answer a more important question:

> If I say yes to this opportunity, what am I saying no to?

Opportunity OS aims to solve this problem by helping users evaluate new opportunities against their goals, current commitments, and available capacity.

---

## 2. Problem Statement

Users have:

- Multiple long-term goals
- Limited time, energy, and money
- Frequent incoming opportunities

However, they lack a structured system to evaluate:

- Alignment with current goals
- Resource consumption
- Opportunity cost
- Impact on existing commitments

As a result:

- Focus becomes fragmented
- Priorities become unclear
- Important goals get delayed
- Decision making becomes emotional rather than rational

---

## 3. Product Vision

Help ambitious individuals make better decisions by visualizing the true cost of every opportunity.

---

## 4. Target Users

### Primary Users

- Students
- Early-career professionals
- Builders
- Founders
- High-achievers managing multiple goals

### Example Personas

#### Security Student

A university student pursuing a security internship while balancing CPTS, HTB machines, portfolio projects, bug bounty, and academic commitments.

#### Early-Career Professional

A professional choosing between certifications, side projects, networking events, and career growth opportunities.

#### Founder-Student

A founder balancing startup execution, university obligations, competitions, and personal development.

---

## 5. Goals And Success Metrics

### Product Metrics

- Weekly Active Users
- Opportunities Evaluated per Week
- Decision Acceptance Rate
- Opportunity Rejection Rate
- Goal Completion Rate

### User Outcome Metrics

- Reduced overcommitment
- Increased goal completion
- Increased focus consistency
- Increased confidence in decisions

### MVP Success Criteria

The MVP is considered successful if users can:

- Define goals, initiatives, commitments, and opportunities
- See their weekly capacity clearly
- Compare a new opportunity against current commitments
- Receive a simple recommendation: Accept, Reject, or Defer
- Understand what will likely be delayed if they accept an opportunity

---

## 6. User Flow

### Step 1: Define Goals

User creates one or more long-term goals.

Example:

- Goal: Become Security Intern
- Priority: 10/10
- Deadline: December 2026
- Success Metrics: Complete CPTS, build portfolio, apply to internships

### Step 2: Create Initiatives

User maps initiatives required to achieve each goal.

Example:

- Goal: Become Security Intern
- Initiatives:
  - CPTS
  - HTB Machines
  - Portfolio Projects
  - Bug Bounty

### Step 3: Define Commitments

User records existing recurring responsibilities.

Example:

- University
- Gym
- Research
- Existing projects

### Step 4: Calculate Available Capacity

System calculates available weekly capacity.

Example:

- Weekly Capacity: 40h
- Allocated: 35h
- Remaining: 5h
- Utilization: 87.5%

### Step 5: Add New Opportunity

User enters a new opportunity.

Example:

- Opportunity: COMPFEST PM Academy
- Expected Time: 8h/week
- Duration: 10 weeks
- Expected Benefits:
  - Product Thinking
  - Network
  - Certificate

### Step 6: Evaluate Opportunity

System evaluates the opportunity.

Example output:

- Alignment Score: 6/10
- Time Impact: High
- Focus Drift: Medium
- Capacity Impact: Overflow +3h/week
- Predicted Delays:
  - CPTS delayed by 2 weeks
  - HTB reduced by 10 hours/week
- Recommendation: Defer

---

## 7. Core Features

## Feature 1: Goal Management

### Purpose

Store and prioritize long-term goals.

### Fields

- Goal Name
- Description
- Priority, 1-10
- Deadline
- Success Metrics
- Status: Active, Paused, Completed

### MVP Requirements

- User can create, edit, and delete goals
- User can assign priority and deadline to each goal
- User can view goals sorted by priority or deadline

### Acceptance Criteria

- Given a user creates a goal, when they save it, then it appears in the goal list
- Given a goal has a priority, when opportunities are evaluated, then the priority contributes to alignment scoring

---

## Feature 2: Initiative Mapping

### Purpose

Map actions required to achieve goals.

### Fields

- Initiative Name
- Related Goal
- Estimated Duration
- Estimated Weekly Time
- Progress
- Status: Not Started, In Progress, Completed, Paused

### MVP Requirements

- User can attach initiatives to goals
- User can define weekly time allocation for each initiative
- System includes initiative hours in capacity calculation

### Acceptance Criteria

- Given an initiative has estimated weekly hours, when capacity is calculated, then those hours are counted as allocated time
- Given an initiative is linked to a goal, when an opportunity affects that goal, then the initiative appears in possible trade-offs

---

## Feature 3: Commitment Tracker

### Purpose

Track already committed responsibilities.

### Fields

- Activity Name
- Weekly Hours
- Energy Cost: Low, Medium, High
- Commitment Type: Fixed, Flexible
- Notes

### MVP Requirements

- User can create recurring commitments
- User can classify commitments as fixed or flexible
- System includes commitment hours in capacity calculation

### Acceptance Criteria

- Given a commitment is marked fixed, when simulating opportunity cost, then the system should avoid suggesting it as the first item to reduce
- Given commitments exceed capacity, when the dashboard loads, then the system shows an overload warning

---

## Feature 4: Capacity Engine

### Purpose

Calculate remaining resources.

### Dimensions

- Time
- Energy
- Money

### Outputs

- Remaining Capacity
- Utilization Percentage
- Overload Warning
- Capacity Impact from New Opportunity

### MVP Requirements

- User can define weekly available hours
- System calculates allocated hours from initiatives and commitments
- System calculates remaining hours
- System flags overload when allocation exceeds capacity

### Basic Formula

```text
Allocated Hours = Initiative Hours + Commitment Hours
Remaining Hours = Weekly Capacity - Allocated Hours
Utilization % = Allocated Hours / Weekly Capacity * 100
Opportunity Overflow = Opportunity Weekly Hours - Remaining Hours
```

### Acceptance Criteria

- Given weekly capacity is 40h and allocated time is 35h, when capacity is calculated, then remaining capacity is 5h
- Given a new opportunity requires 8h/week and remaining capacity is 5h, when evaluated, then overflow is +3h/week

---

## Feature 5: Opportunity Inbox

### Purpose

Store incoming opportunities before users decide.

### Examples

- Internship
- Academy
- Competition
- Certification
- Startup Idea
- Networking Event

### Fields

- Title
- Description
- Category
- Time Cost per Week
- Duration
- Money Cost
- Urgency: Low, Medium, High
- Expected Impact
- Related Goal
- Status: Inbox, Accepted, Rejected, Deferred

### MVP Requirements

- User can create, edit, and delete opportunities
- User can attach an opportunity to one or more goals
- User can mark decision status

### Acceptance Criteria

- Given a user creates an opportunity, when they save it, then it appears in the opportunity inbox
- Given an opportunity has status Deferred, when viewing the inbox, then it remains visible for later review

---

## Feature 6: Opportunity Cost Simulator

### Purpose

Show consequences before accepting an opportunity.

### Example Output

If accepted, the user may gain:

- Product Thinking
- New Network
- Certificate

But likely delayed:

- CPTS by 2 weeks
- HTB progress by 10 machines
- Portfolio Project #2

### MVP Requirements

- System compares opportunity time cost with remaining capacity
- System identifies initiatives most likely to be delayed
- System shows potential trade-offs in plain language

### Acceptance Criteria

- Given an opportunity creates time overflow, when simulated, then the system lists affected lower-priority or flexible initiatives
- Given an opportunity fits within remaining capacity, when simulated, then the system shows no overload warning

---

## Feature 7: Decision Recommendation Engine

### Purpose

Recommend whether the user should accept, reject, or defer an opportunity.

### Possible Outcomes

- Accept
- Reject
- Defer

### Recommendation Factors

- Goal Alignment
- Capacity Availability
- Opportunity Cost
- Focus Budget
- Urgency

### MVP Recommendation Logic

The MVP will use rule-based logic, not AI.

```text
Accept:
- High alignment
- Fits within available capacity
- Low or manageable opportunity cost

Defer:
- Medium alignment
- Capacity overflow exists
- Opportunity may be useful later

Reject:
- Low alignment
- High capacity impact
- High opportunity cost against priority goals
```

### Acceptance Criteria

- Given an opportunity has high alignment and does not exceed capacity, when evaluated, then recommendation is Accept
- Given an opportunity has medium alignment and exceeds capacity moderately, when evaluated, then recommendation is Defer
- Given an opportunity has low alignment and creates major overload, when evaluated, then recommendation is Reject

---

## 8. MVP Scope

### Included

- Goals
- Initiatives
- Commitments
- Capacity Calculator
- Opportunity Inbox
- Opportunity Comparison
- Rule-based Decision Recommendation

### Excluded

- AI Recommendation
- Calendar Sync
- Team Collaboration
- Mobile App
- Advanced analytics
- Automatic time tracking

### Platform

Web Application

### Target MVP Duration

4-6 weeks

---

## 9. Non-Functional Requirements

### Usability

- Interface should prioritize clarity over feature density
- User should understand their capacity status within 5 seconds
- Evaluation results should be readable without technical explanation

### Performance

- Dashboard should load within 2 seconds for normal MVP data volume
- Capacity calculation should update instantly after data changes

### Privacy

- User data may include personal goals, career plans, and financial constraints
- MVP should avoid unnecessary third-party data sharing
- Authentication can be deferred for local prototype, but required for hosted production

### Reliability

- User-created data should persist after refresh
- Calculations should be deterministic and explainable

---

## 10. Information Architecture

### Primary Pages

- Dashboard
- Goals
- Initiatives
- Commitments
- Opportunity Inbox
- Opportunity Evaluation

### Dashboard Summary

Dashboard should show:

- Weekly capacity
- Allocated hours
- Remaining hours
- Utilization percentage
- Active goals
- Active opportunities
- Current overload warning, if any

---

## 11. Data Model

### Goal

```json
{
  "id": "goal_001",
  "name": "Become Security Intern",
  "description": "Prepare for security internship applications.",
  "priority": 10,
  "deadline": "2026-12-31",
  "successMetrics": ["Complete CPTS", "Build portfolio", "Apply to internships"],
  "status": "active"
}
```

### Initiative

```json
{
  "id": "initiative_001",
  "goalId": "goal_001",
  "name": "CPTS",
  "estimatedWeeklyHours": 10,
  "estimatedDurationWeeks": 20,
  "status": "in_progress",
  "progress": 35
}
```

### Commitment

```json
{
  "id": "commitment_001",
  "name": "University",
  "weeklyHours": 20,
  "energyCost": "high",
  "type": "fixed"
}
```

### Opportunity

```json
{
  "id": "opportunity_001",
  "title": "COMPFEST PM Academy",
  "description": "Product management academy program.",
  "category": "academy",
  "weeklyHours": 8,
  "durationWeeks": 10,
  "moneyCost": 0,
  "urgency": "medium",
  "expectedImpact": ["Product Thinking", "Network", "Certificate"],
  "relatedGoalIds": ["goal_001"],
  "status": "inbox"
}
```

---

## 12. Scoring Model For MVP

### Alignment Score

User manually rates alignment from 1-10, with optional system assistance based on related goals.

### Capacity Impact

```text
Low = Opportunity fits within remaining capacity
Medium = Overflow is 1-3h/week
High = Overflow is more than 3h/week
```

### Focus Drift

```text
Low = Directly supports top goal
Medium = Supports secondary goal or adjacent skill
High = Unrelated to active goals
```

### Recommendation Rules

```text
Accept if:
- Alignment >= 8
- Capacity impact is Low
- Focus drift is Low or Medium

Defer if:
- Alignment is 5-7
- Capacity impact is Medium or High
- Opportunity is not urgent

Reject if:
- Alignment <= 4
- Capacity impact is High
- Focus drift is High
```

---

## 13. Future Features

- AI-powered opportunity evaluation
- Historical decision analysis
- Focus drift detection
- Personal operating system dashboard
- Calendar integration
- Time tracking integration
- Scenario planning
- Weekly review workflow
- Decision journal

---

## 14. Risks And Open Questions

### Risks

- Users may not know how to estimate time accurately
- Rule-based recommendations may feel too rigid
- Opportunity cost prediction may be oversimplified in MVP
- Too many inputs may make onboarding feel heavy

### Open Questions

- Should users set one global weekly capacity or capacity per category?
- Should energy cost affect recommendations in MVP or only appear as context?
- Should money cost be included in v0.1 calculation or deferred?
- Should opportunities be compared one at a time or side by side?

---

## 15. MVP Delivery Plan

### Week 1

- Finalize UX flow and data model
- Build core layout and navigation
- Implement local data persistence

### Week 2

- Build Goal Management
- Build Initiative Mapping

### Week 3

- Build Commitment Tracker
- Build Capacity Engine

### Week 4

- Build Opportunity Inbox
- Build Opportunity Cost Simulator

### Week 5

- Build rule-based recommendation engine
- Add dashboard summaries
- Add empty states and validation

### Week 6

- QA, bug fixes, usability polish
- Prepare MVP demo

---

## 16. Definition Of Done

The MVP is done when:

- User can define goals, initiatives, commitments, and opportunities
- System calculates weekly capacity accurately
- System identifies overload caused by a new opportunity
- System shows likely delayed initiatives or commitments
- System recommends Accept, Reject, or Defer using explainable logic
- User data persists between sessions
- The app is usable as a web application prototype
