const STORAGE_KEY = "opportunity-os-state-v1";

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const seedState = {
  weeklyCapacity: 40,
  selectedOpportunityId: null,
  editingOpportunityId: null,
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
  initiatives: [],
  commitments: [
    {
      id: "commitment_cpts",
      goalId: "goal_security_intern",
      name: "CPTS",
      weeklyHours: 10,
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
      weeklyHours: 5,
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
      weeklyHours: 20,
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
      weeklyHours: 4,
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
      weeklyHours: 8,
      durationWeeks: 10,
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

let state = loadState();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(seedState);

  try {
    return migrateState({ ...structuredClone(seedState), ...JSON.parse(stored) });
  } catch {
    return structuredClone(seedState);
  }
}

function migrateState(nextState) {
  const migratedCommitments = [...(nextState.commitments || [])];
  const existingNames = new Set(migratedCommitments.map((item) => item.name));

  (nextState.initiatives || []).forEach((item) => {
    if (existingNames.has(item.name)) return;
    migratedCommitments.push({
      id: `commitment_${item.id}`,
      goalId: item.goalId || "",
      name: item.name,
      weeklyHours: Number(item.estimatedWeeklyHours || 0),
      priority: Number(goalByIdFrom(nextState, item.goalId)?.priority || 5),
      startDate: "",
      endDate: "",
      status: item.status === "completed" ? "completed" : "active",
      notes: "Migrated from action plan"
    });
  });

  return { ...nextState, initiatives: [], commitments: migratedCommitments };
}

function goalByIdFrom(nextState, id) {
  return (nextState.goals || []).find((goal) => goal.id === id);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

function hours(value) {
  return `${Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 1)}h`;
}

function money(value, currency = "IDR") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2
  }).format(amount);
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function activeCommitments() {
  return state.commitments.filter((item) => item.status === "active" || !item.status);
}

function capacityStats(extraHours = 0) {
  const commitmentHours = activeCommitments().reduce((sum, item) => sum + Number(item.weeklyHours || 0), 0);
  const allocated = commitmentHours;
  const capacity = Number(state.weeklyCapacity || 0);
  const remaining = capacity - allocated;
  const projected = allocated + Number(extraHours || 0);
  const utilization = capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;
  const projectedUtilization = capacity > 0 ? Math.round((projected / capacity) * 100) : 0;
  return { commitmentHours, allocated, capacity, remaining, utilization, projected, projectedUtilization };
}

function goalById(id) {
  return state.goals.find((goal) => goal.id === id);
}

function setView(view) {
  $all(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $all(".view").forEach((section) => section.classList.remove("active"));
  $(`#${view}View`).classList.add("active");
  $("#viewTitle").textContent = view[0].toUpperCase() + view.slice(1);
}

function render() {
  saveState();
  renderCapacity();
  renderSelects();
  renderOpportunityFormState();
  renderGoals();
  renderDashboardSections();
  renderOpportunities();
  renderEvaluation();
}

function renderCapacity() {
  const stats = capacityStats();
  $("#weeklyCapacity").value = state.weeklyCapacity;
  $("#allocatedHours").textContent = hours(stats.allocated);
  $("#remainingHours").textContent = hours(stats.remaining);
  $("#utilization").textContent = `${stats.utilization}%`;
  $("#inboxCount").textContent = state.opportunities.filter((item) => item.status === "pending_review").length;
  $("#loadLabel").textContent = `${hours(stats.allocated)} / ${hours(stats.capacity)}`;
  $("#loadBar").style.width = `${Math.min(stats.utilization, 130)}%`;
  $("#allocatedHint").textContent = `${hours(stats.commitmentHours)} active commitments`;

  const warning = $("#capacityWarning");
  warning.className = "notice";
  if (stats.allocated === 0) {
    warning.classList.add("neutral");
    warning.textContent = "Add goals and commitments to see your focus load.";
  } else if (stats.remaining < 0) {
    warning.classList.add("danger");
    warning.textContent = `Overloaded by ${hours(Math.abs(stats.remaining))}. Any new yes needs an explicit no.`;
  } else if (stats.utilization >= 85) {
    warning.classList.add("warn");
    warning.textContent = `Tight capacity. Only ${hours(stats.remaining)} remains this week.`;
  } else {
    warning.classList.add("good");
    warning.textContent = `${hours(stats.remaining)} still available. You have room for focused bets.`;
  }

  $("#utilizationHint").textContent = stats.utilization > 100 ? "Over capacity" : stats.utilization >= 85 ? "Near limit" : "Healthy load";
  $("#globalStatus").textContent = stats.utilization > 100 ? "Overloaded" : stats.utilization >= 85 ? "Tight" : "Ready";
}

function renderSelects() {
  const goalOptions = state.goals
    .map((goal) => `<option value="${goal.id}">${escapeHtml(goal.name)}</option>`)
    .join("");
  const fallback = `<option value="">Create a goal first</option>`;
  document.querySelector('#commitmentForm [name="goalId"]').innerHTML = `<option value="">General commitment</option>${goalOptions}`;
}

function renderGoals() {
  const sorted = [...state.goals].sort((a, b) => Number(b.priority) - Number(a.priority));
  $("#goalCount").textContent = `${state.goals.length} active`;
  $("#goalSummary").innerHTML = sorted.slice(0, 4).map(renderGoalSummary).join("") || empty("No goals yet.");
  $("#goalsList").innerHTML = sorted.map(renderGoal).join("") || empty("No goals yet.");
}

function renderGoalSummary(goal) {
  return `
    <div class="entity">
      <div class="entity-top">
        <div>
          <h4 class="entity-title">${escapeHtml(goal.name)}</h4>
          <div class="entity-meta">
            <span class="tag green">Priority ${goal.priority}/10</span>
            <span class="tag blue">${goal.deadline || "No deadline"}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGoal(goal) {
  const metrics = (goal.successMetrics || []).map((metric) => `<span class="tag">${escapeHtml(metric)}</span>`).join("");
  const goalCommitments = state.commitments.filter((item) => item.goalId === goal.id);
  const commitmentList = goalCommitments.map(renderCommitmentRow).join("") || `<div class="empty compact">No commitments yet.</div>`;
  return `
    <div class="entity">
      <div class="entity-top">
        <div>
          <h4 class="entity-title">${escapeHtml(goal.name)}</h4>
          <p>${escapeHtml(goal.description || "")}</p>
        </div>
        <div class="entity-actions">
          <button class="danger-action" data-delete-goal="${goal.id}">Delete</button>
        </div>
      </div>
      <div class="entity-meta">
        <span class="tag green">Priority ${goal.priority}/10</span>
        <span class="tag blue">${goal.deadline || "No deadline"}</span>
        ${metrics}
      </div>
      <div class="goal-detail-grid">
        <div>
          <h5>Commitments</h5>
          <div class="mini-list">${commitmentList}</div>
        </div>
      </div>
    </div>
  `;
}

function renderCommitmentRow(item) {
  return `
    <div class="mini-item">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${hours(item.weeklyHours)}/week - Priority ${item.priority || 5} - ${escapeHtml(item.status || "active")}</span>
      </div>
      <div class="entity-actions">
        <button class="danger-action" data-delete-commitment="${item.id}">Delete</button>
      </div>
    </div>
  `;
}

function renderDashboardSections() {
  const pending = state.opportunities.filter((item) => item.status === "pending_review");
  const decided = state.opportunities.filter((item) => ["accepted", "rejected", "deferred"].includes(item.status)).slice(-5).reverse();

  $("#decisionQueue").innerHTML = pending
    .map((item) => `<div class="entity"><strong>${escapeHtml(item.title)}</strong><div class="entity-meta"><span class="tag amber">Pending Review</span><span class="tag">${hours(item.weeklyHours)}/week</span></div></div>`)
    .join("") || empty("No pending reviews.");

  $("#recentDecisions").innerHTML = decided
    .map((item) => `<div class="entity"><strong>${escapeHtml(item.title)}</strong><div class="entity-meta"><span class="tag ${recommendationClass(statusLabel(item.status))}">${statusLabel(item.status)}</span></div></div>`)
    .join("") || empty("No decisions yet.");
}

function renderOpportunities() {
  $("#opportunityCount").textContent = `${state.opportunities.length} opportunities`;
  $("#opportunitiesList").innerHTML = state.opportunities.map((item) => {
    const evaluation = evaluateOpportunity(item);
    const selected = state.selectedOpportunityId === item.id ? "Reviewing" : "Review Now";
    return `
      <div class="entity">
        <div class="entity-top">
          <div>
            <h4 class="entity-title">${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.description || "")}</p>
          </div>
          <div class="entity-actions">
            <button data-select-opportunity="${item.id}">${selected}</button>
            <button data-edit-opportunity="${item.id}">Edit</button>
            <button data-decision="${item.id}:accepted">Accept</button>
            <button data-decision="${item.id}:deferred">Defer</button>
            <button data-decision="${item.id}:rejected">Reject</button>
            <button class="danger-action" data-delete-opportunity="${item.id}">Delete</button>
          </div>
        </div>
        <div class="entity-meta">
          <span class="tag">${escapeHtml(item.category)}</span>
          <span class="tag">${hours(item.weeklyHours)}/week</span>
          <span class="tag">${money(item.moneyCost, item.currency || "IDR")}</span>
          <span class="tag blue">${item.durationWeeks} weeks</span>
          <span class="tag green">Alignment ${item.alignmentScore}/10</span>
          <span class="tag ${recommendationClass(evaluation.recommendation)}">${evaluation.recommendation}</span>
          <span class="tag">${statusLabel(item.status)}</span>
        </div>
      </div>
    `;
  }).join("") || empty("No opportunities yet.");
}

function evaluateOpportunity(opportunity) {
  const stats = capacityStats(opportunity.weeklyHours);
  const overflow = Math.max(0, Number(opportunity.weeklyHours || 0) - stats.remaining);
  const alignment = Number(opportunity.alignmentScore || 0);
  const topGoalPriority = Math.max(...state.goals.map((goal) => Number(goal.priority || 0)), 0);
  const focusDrift = alignment >= 8 ? "Low" : alignment >= 5 ? "Medium" : "High";
  const capacityImpact = overflow === 0 ? "Low" : overflow <= 3 ? "Medium" : "High";

  let recommendation = "Defer";
  if (alignment >= 8 && capacityImpact === "Low" && focusDrift !== "High") recommendation = "Accept";
  if (alignment <= 4 && capacityImpact === "High" && focusDrift === "High") recommendation = "Reject";
  if (alignment <= 4 && capacityImpact !== "Low") recommendation = "Reject";

  const tradeoffs = findTradeoffs(opportunity, overflow);
  const affectedGoals = [...new Set(tradeoffs.map((item) => item.goalId).filter(Boolean))]
    .map((goalId) => goalById(goalId))
    .filter(Boolean);
  const goalImpact = overflow === 0 ? "Low" : tradeoffs.some((item) => Number(item.priority || 0) >= topGoalPriority) ? "High" : "Medium";
  return { stats, overflow, alignment, focusDrift, capacityImpact, recommendation, tradeoffs, affectedGoals, goalImpact };
}

function findTradeoffs(opportunity, overflow) {
  if (overflow <= 0) return [];

  return activeCommitments()
    .sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0))
    .slice(0, 3);
}

function renderEvaluation() {
  const selected = state.opportunities.find((item) => item.id === state.selectedOpportunityId);
  const output = $("#evaluationOutput");
  if (!selected) {
    output.className = "evaluation-empty";
    output.textContent = "Create or select an opportunity to see the cost of saying yes.";
    $("#selectedOpportunityLabel").textContent = "No selection";
    return;
  }

  state.selectedOpportunityId = selected.id;
  $("#selectedOpportunityLabel").textContent = selected.title;
  const evaluation = evaluateOpportunity(selected);
  const commitmentLoad = state.commitments
    .map((item) => `<li>${escapeHtml(item.name)}: ${hours(item.weeklyHours)}/week, priority ${item.priority || 5}, ${escapeHtml(item.status || "active")}</li>`)
    .join("");
  const impacts = selected.expectedImpact?.length
    ? selected.expectedImpact.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No explicit benefits entered yet.</li>";
  const tradeoffs = evaluation.tradeoffs.length
    ? evaluation.tradeoffs.map((item) => `<li>${escapeHtml(item.name)} may lose up to ${hours(Math.min(item.weeklyHours, evaluation.overflow))}/week because remaining capacity is insufficient.</li>`).join("")
    : "<li>No delay predicted from current capacity.</li>";
  const affectedGoals = evaluation.affectedGoals.length
    ? evaluation.affectedGoals.map((goal) => `<li>${escapeHtml(goal.name)} - predicted impact ${evaluation.goalImpact}</li>`).join("")
    : "<li>No directly affected goal detected.</li>";

  output.className = "evaluation-card";
  output.innerHTML = `
    <div class="entity-top">
      <div>
        <p class="eyebrow">Selected Opportunity</p>
        <h3>${escapeHtml(selected.title)}</h3>
      </div>
      <span class="tag ${recommendationClass(evaluation.recommendation)}">${evaluation.recommendation}</span>
    </div>
    <div class="eval-grid">
      <div class="eval-stat"><span>Alignment</span><strong>${evaluation.alignment}/10</strong></div>
      <div class="eval-stat"><span>Capacity Impact</span><strong>${evaluation.capacityImpact}</strong></div>
      <div class="eval-stat"><span>Focus Drift</span><strong>${evaluation.focusDrift}</strong></div>
      <div class="eval-stat"><span>Money Cost</span><strong>${money(selected.moneyCost, selected.currency || "IDR")}</strong></div>
      <div class="eval-stat"><span>Current Load</span><strong>${hours(evaluation.stats.allocated)} / ${hours(evaluation.stats.capacity)}</strong></div>
      <div class="eval-stat"><span>After Accept</span><strong>${hours(evaluation.stats.projected)} / ${hours(evaluation.stats.capacity)}</strong></div>
      <div class="eval-stat"><span>Projected Use</span><strong>${evaluation.stats.projectedUtilization}%</strong></div>
      <div class="eval-stat"><span>Overflow</span><strong>${hours(evaluation.overflow)}</strong></div>
      <div class="eval-stat"><span>Goal Impact</span><strong>${evaluation.goalImpact}</strong></div>
    </div>
    <div class="two-col">
      <div>
        <h4>If accepted, you gain</h4>
        <ul class="tradeoff-list">${impacts}</ul>
      </div>
      <div>
        <h4>Affected commitments</h4>
        <ul class="tradeoff-list">${tradeoffs}</ul>
      </div>
    </div>
    <div class="benchmark-block">
      <h4>Goal impact</h4>
      <ul class="tradeoff-list">${affectedGoals}</ul>
    </div>
    <div class="benchmark-block">
      <h4>Current commitments benchmark</h4>
      <ul class="tradeoff-list">${commitmentLoad || "<li>No commitments entered yet.</li>"}</ul>
    </div>
  `;
}

function recommendationClass(value) {
  if (value === "Accept" || value === "Accepted") return "green";
  if (value === "Reject" || value === "Rejected") return "red";
  return "amber";
}

function statusLabel(value) {
  const labels = {
    pending_review: "Pending Review",
    accepted: "Accepted",
    rejected: "Rejected",
    deferred: "Deferred",
    inbox: "Pending Review"
  };
  return labels[value] || value || "Pending Review";
}

function empty(text) {
  return `<div class="empty">${text}</div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addFromForm(form, mapper) {
  const data = Object.fromEntries(new FormData(form).entries());
  mapper(data);
  form.reset();
  render();
}

function opportunityFromData(data, existing = {}) {
  return {
    ...existing,
    title: data.title,
    description: data.description,
    category: data.category,
    weeklyHours: Number(data.weeklyHours),
    durationWeeks: Number(data.durationWeeks),
    moneyCost: Number(data.moneyCost),
    currency: data.currency,
    deadline: data.deadline,
    notes: data.notes,
    alignmentScore: Number(data.alignmentScore),
    expectedImpact: splitList(data.expectedImpact || "")
  };
}

function fillOpportunityForm(opportunity) {
  const form = $("#opportunityForm");
  form.elements.title.value = opportunity.title || "";
  form.elements.description.value = opportunity.description || "";
  form.elements.category.value = opportunity.category || "academy";
  form.elements.weeklyHours.value = opportunity.weeklyHours ?? 4;
  form.elements.durationWeeks.value = opportunity.durationWeeks ?? 4;
  form.elements.currency.value = opportunity.currency || "IDR";
  form.elements.moneyCost.value = opportunity.moneyCost ?? 0;
  form.elements.deadline.value = opportunity.deadline || "";
  form.elements.alignmentScore.value = opportunity.alignmentScore ?? 6;
  form.elements.notes.value = opportunity.notes || "";
  form.elements.expectedImpact.value = (opportunity.expectedImpact || []).join(", ");
}

function resetOpportunityForm() {
  state.editingOpportunityId = null;
  $("#opportunityForm").reset();
  render();
}

function renderOpportunityFormState() {
  const isEditing = Boolean(state.editingOpportunityId);
  $("#opportunityFormTitle").textContent = isEditing ? "Edit Opportunity" : "Add Opportunity";
  $("#reviewLaterSubmit").textContent = isEditing ? "Update Later" : "Review Later";
  $("#reviewNowSubmit").textContent = isEditing ? "Update & Review" : "Review Now";
  $("#cancelOpportunityEdit").classList.toggle("hidden", !isEditing);
}

$("#weeklyCapacity").addEventListener("input", (event) => {
  state.weeklyCapacity = Number(event.target.value || 0);
  render();
});

$all(".nav-item").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

$all("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.jump));
});

$("#goalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addFromForm(event.currentTarget, (data) => {
    state.goals.push({
      id: makeId(),
      name: data.name,
      description: data.description,
      priority: Number(data.priority),
      deadline: data.deadline,
      successMetrics: splitList(data.successMetrics || ""),
      status: "active"
    });
  });
});

$("#commitmentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addFromForm(event.currentTarget, (data) => {
    state.commitments.push({
      id: makeId(),
      goalId: data.goalId,
      name: data.name,
      weeklyHours: Number(data.weeklyHours),
      priority: Number(data.priority),
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      notes: data.notes
    });
  });
});

$("#opportunityForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const reviewMode = event.submitter?.value || "later";

  if (state.editingOpportunityId) {
    const opportunity = state.opportunities.find((item) => item.id === state.editingOpportunityId);
    if (opportunity) {
      Object.assign(opportunity, opportunityFromData(data, opportunity));
      if (reviewMode === "now") opportunity.status = "pending_review";
      state.selectedOpportunityId = opportunity.id;
    }
    state.editingOpportunityId = null;
  } else {
    const opportunity = opportunityFromData(data, {
      id: makeId(),
      status: "pending_review"
    });
    state.opportunities.push(opportunity);
    if (reviewMode === "now") state.selectedOpportunityId = opportunity.id;
  }

  form.reset();
  render();
  setView("opportunities");
});

$("#cancelOpportunityEdit").addEventListener("click", () => {
  resetOpportunityForm();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const deleteGoal = target.dataset.deleteGoal;
  const deleteInitiative = target.dataset.deleteInitiative;
  const deleteCommitment = target.dataset.deleteCommitment;
  const deleteOpportunity = target.dataset.deleteOpportunity;
  const editOpportunity = target.dataset.editOpportunity;
  const toggleInitiative = target.dataset.toggleInitiative;
  const selectOpportunity = target.dataset.selectOpportunity;
  const decision = target.dataset.decision;

  if (deleteGoal) {
    state.goals = state.goals.filter((item) => item.id !== deleteGoal);
    state.initiatives = state.initiatives.filter((item) => item.goalId !== deleteGoal);
    state.commitments = state.commitments.map((item) => item.goalId === deleteGoal ? { ...item, goalId: "" } : item);
  }

  if (deleteInitiative) state.initiatives = state.initiatives.filter((item) => item.id !== deleteInitiative);
  if (deleteCommitment) state.commitments = state.commitments.filter((item) => item.id !== deleteCommitment);
  if (deleteOpportunity) {
    state.opportunities = state.opportunities.filter((item) => item.id !== deleteOpportunity);
    if (state.editingOpportunityId === deleteOpportunity) state.editingOpportunityId = null;
  }

  if (toggleInitiative) {
    const initiative = state.initiatives.find((item) => item.id === toggleInitiative);
    if (initiative) initiative.status = initiative.status === "completed" ? "in_progress" : "completed";
  }

  if (selectOpportunity) {
    state.selectedOpportunityId = selectOpportunity;
    setView("opportunities");
  }

  if (editOpportunity) {
    const opportunity = state.opportunities.find((item) => item.id === editOpportunity);
    if (opportunity) {
      state.editingOpportunityId = editOpportunity;
      state.selectedOpportunityId = editOpportunity;
      setView("opportunities");
      render();
      fillOpportunityForm(opportunity);
      return;
    }
  }

  if (decision) {
    const [id, status] = decision.split(":");
    const opportunity = state.opportunities.find((item) => item.id === id);
    if (opportunity) opportunity.status = status;
  }

  render();
});

render();
