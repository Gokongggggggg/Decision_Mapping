# Opportunity OS

## MVP PRD v0.2

## Product Vision

Help users understand the consequences of saying "yes" before committing to a new opportunity.

Instead of helping users manage tasks, Opportunity OS helps users evaluate trade-offs between goals, commitments, and incoming opportunities.

---

## Core User Problem

Users frequently encounter new opportunities:

- Academies
- Competitions
- Certifications
- Projects
- Internships
- Startup Ideas

However, users struggle to answer:

- Do I actually have capacity?
- What existing commitments will be affected?
- What goals will be delayed?
- Is this opportunity worth the trade-off?

Current productivity tools help users organize work. They do not help users evaluate opportunity cost.

---

## MVP Scope

### Included

#### Goals

Users define long-term goals.

Example:

- Goal: Become Security Intern
- Priority: 10
- Deadline: December 2026

#### Commitments

Users define existing commitments.

Examples:

- CPTS
- HTB Machines
- University
- Gym
- Research Project

Fields:

- Name
- Weekly Hours
- Start Date
- End Date, optional
- Priority
- Status

#### Opportunities

Users can add opportunities.

Examples:

- PM Academy
- SMT Korea
- New Startup Idea
- Bug Bounty Program

Fields:

- Title
- Description
- Expected Weekly Hours
- Duration, with flexible unit such as days, weeks, or months
- Cost
- Deadline
- Notes

---

## Opportunity Workflow

When a user creates a new opportunity, show two options.

### Option 1: Review Later

Purpose:

Store opportunity inside Opportunity Inbox.

No analysis is performed.

Status:

Pending Review

### Option 2: Review Now

Purpose:

Immediately evaluate opportunity impact.

System opens the Opportunity Review experience.

---

## Opportunity Review Engine

When reviewing an opportunity, system automatically gathers:

### Current Goals

Example:

- Security Internship
- Pentest Skill Development
- Product Building

### Active Commitments

Example:

- CPTS
- HTB
- Gym
- University

### Capacity Information

Example:

- Weekly Capacity: 40h
- Allocated: 35h
- Remaining: 5h

---

## Impact Analysis

System simulates:

> What happens if this opportunity is accepted?

Example:

- Opportunity: PM Academy
- Required: 8h/week
- Current Remaining: 5h/week
- Result: Overflow 3h/week

---

## Affected Commitments

System identifies commitments likely to be impacted.

Example:

- CPTS
- HTB Machines
- Portfolio Project

Reason:

Insufficient remaining capacity.

---

## Goal Impact

System identifies affected goals.

Example:

- Goal: Security Internship
- Current ETA: December 2026
- Predicted ETA: January 2027
- Impact: Medium

---

## Resource Impact

### Time

- Current: 35h / 40h
- After Acceptance: 43h / 40h

### Money

- Current: Rp500k / month
- After Acceptance: Rp1.000.000 / month

---

## Trade-off Summary

### Gain

- Product Thinking
- Network
- Certificate

### Potential Loss

- CPTS Progress Delay
- Reduced HTB Practice
- Less Project Building Time

---

## Recommendation

Possible outputs:

- Accept
- Defer
- Reject

Reasoning must always be shown.

Example:

- Recommendation: Defer
- Reason: Opportunity exceeds available weekly capacity and delays highest-priority goal.

---

## Dashboard MVP

### Section 1: Current Focus

Top 3 goals only.

### Section 2: Capacity Overview

- Time
- Energy
- Money

### Section 3: Decision Queue

Pending opportunities waiting for review.

### Section 4: Recent Decisions

- Accepted
- Rejected
- Deferred

---

## Success Metrics

### User Metrics

- Opportunities Reviewed
- Opportunities Accepted
- Opportunities Rejected
- Opportunities Deferred

### Product Metrics

- Weekly Active Users
- Average Reviews per User
- Decision Completion Rate

### Outcome Metrics

- Reduced Overcommitment
- Improved Goal Completion
- Reduced Goal Drift

---

## Out Of Scope

- AI Decision Making
- Calendar Integration
- Team Collaboration
- Mobile App
- Automatic Time Tracking

These features will be considered after validating the Opportunity Review Engine.
