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
  initiatives: [
    {
      id: "initiative_cpts",
      goalId: "goal_security_intern",
      name: "CPTS",
      estimatedWeeklyHours: 10,
      estimatedDurationWeeks: 20,
      status: "in_progress",
      progress: 35
    },
    {
      id: "initiative_htb",
      goalId: "goal_security_intern",
      name: "HTB Machines",
      estimatedWeeklyHours: 5,
      estimatedDurationWeeks: 16,
      status: "in_progress",
      progress: 20
    }
  ],
  commitments: [
    {
      id: "commitment_university",
      goalId: "",
      name: "University",
      weeklyHours: 20,
      energyCost: "high",
      type: "fixed",
      notes: ""
    },
    {
      id: "commitment_gym",
      goalId: "goal_security_intern",
      name: "Gym",
      weeklyHours: 4,
      energyCost: "medium",
      type: "flexible",
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
      urgency: "medium",
      alignmentScore: 6,
      expectedImpact: ["Product Thinking", "Network", "Certificate"],
      relatedGoalId: "goal_security_intern",
      status: "inbox"
    }
  ]
};

let state = loadState();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(seedState);

  try {
    return { ...structuredClone(seedState), ...JSON.parse(stored) };
  } catch {
    return structuredClone(seedState);
  }
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

function activeInitiatives() {
  return state.initiatives.filter((item) => item.status !== "completed");
}

function capacityStats(extraHours = 0) {
  const initiativeHours = activeInitiatives().reduce((sum, item) => sum + Number(item.estimatedWeeklyHours || 0), 0);
  const commitmentHours = state.commitments.reduce((sum, item) => sum + Number(item.weeklyHours || 0), 0);
  const allocated = initiativeHours + commitmentHours;
  const capacity = Number(state.weeklyCapacity || 0);
  const remaining = capacity - allocated;
  const projected = allocated + Number(extraHours || 0);
  const utilization = capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;
  const projectedUtilization = capacity > 0 ? Math.round((projected / capacity) * 100) : 0;
  return { initiativeHours, commitmentHours, allocated, capacity, remaining, utilization, projected, projectedUtilization };
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
  renderOpportunities();
  renderEvaluation();
}

function renderCapacity() {
  const stats = capacityStats();
  $("#weeklyCapacity").value = state.weeklyCapacity;
  $("#allocatedHours").textContent = hours(stats.allocated);
  $("#remainingHours").textContent = hours(stats.remaining);
  $("#utilization").textContent = `${stats.utilization}%`;
  $("#inboxCount").textContent = state.opportunities.filter((item) => item.status === "inbox").length;
  $("#loadLabel").textContent = `${hours(stats.allocated)} / ${hours(stats.capacity)}`;
  $("#loadBar").style.width = `${Math.min(stats.utilization, 130)}%`;
  $("#allocatedHint").textContent = `${hours(stats.initiativeHours)} action plans + ${hours(stats.commitmentHours)} commitments`;

  const warning = $("#capacityWarning");
  warning.className = "notice";
  if (stats.allocated === 0) {
    warning.classList.add("neutral");
    warning.textContent = "Add goals, action plans, and commitments to see your focus load.";
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
  document.querySelector('#initiativeForm [name="goalId"]').innerHTML = goalOptions || fallback;
  document.querySelector('#commitmentForm [name="goalId"]').innerHTML = `<option value="">General commitment</option>${goalOptions}`;
  document.querySelector('#opportunityForm [name="relatedGoalId"]').innerHTML = `<option value="">No related goal</option>${goalOptions}`;
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
  const goalInitiatives = state.initiatives.filter((item) => item.goalId === goal.id);
  const goalCommitments = state.commitments.filter((item) => item.goalId === goal.id);
  const initiativeList = goalInitiatives.map(renderInitiativeRow).join("") || `<div class="empty compact">No action plans yet.</div>`;
  const commitmentList = goalCommitments.map(renderCommitmentRow).join("") || `<div class="empty compact">No supporting commitments yet.</div>`;
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
          <h5>Action Plans</h5>
          <div class="mini-list">${initiativeList}</div>
        </div>
        <div>
          <h5>Commitments</h5>
          <div class="mini-list">${commitmentList}</div>
        </div>
      </div>
    </div>
  `;
}

function renderInitiativeRow(item) {
  return `
    <div class="mini-item">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${hours(item.estimatedWeeklyHours)}/week - ${item.progress || 0}% - ${escapeHtml(item.status)}</span>
      </div>
      <div class="entity-actions">
        <button data-toggle-initiative="${item.id}">${item.status === "completed" ? "Reopen" : "Complete"}</button>
        <button class="danger-action" data-delete-initiative="${item.id}">Delete</button>
      </div>
    </div>
  `;
}

function renderCommitmentRow(item) {
  return `
    <div class="mini-item">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${hours(item.weeklyHours)}/week - ${escapeHtml(item.energyCost)} energy - ${escapeHtml(item.type)}</span>
      </div>
      <div class="entity-actions">
        <button class="danger-action" data-delete-commitment="${item.id}">Delete</button>
      </div>
    </div>
  `;
}

function renderOpportunities() {
  $("#opportunityCount").textContent = `${state.opportunities.length} opportunities`;
  $("#opportunitiesList").innerHTML = state.opportunities.map((item) => {
    const evaluation = evaluateOpportunity(item);
    const selected = state.selectedOpportunityId === item.id ? "Selected" : "Evaluate";
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
          <span class="tag">${escapeHtml(item.status)}</span>
        </div>
      </div>
    `;
  }).join("") || empty("No opportunities yet.");
}

function evaluateOpportunity(opportunity) {
  const stats = capacityStats(opportunity.weeklyHours);
  const overflow = Math.max(0, Number(opportunity.weeklyHours || 0) - stats.remaining);
  const alignment = Number(opportunity.alignmentScore || 0);
  const relatedGoal = goalById(opportunity.relatedGoalId);
  const focusDrift = relatedGoal
    ? relatedGoal.priority >= 8 ? "Low" : "Medium"
    : "High";
  const capacityImpact = overflow === 0 ? "Low" : overflow <= 3 ? "Medium" : "High";

  let recommendation = "Defer";
  if (alignment >= 8 && capacityImpact === "Low" && focusDrift !== "High") recommendation = "Accept";
  if (alignment <= 4 && capacityImpact === "High" && focusDrift === "High") recommendation = "Reject";
  if (alignment <= 4 && capacityImpact !== "Low") recommendation = "Reject";

  const tradeoffs = findTradeoffs(opportunity, overflow);
  return { stats, overflow, alignment, relatedGoal, focusDrift, capacityImpact, recommendation, tradeoffs };
}

function findTradeoffs(opportunity, overflow) {
  if (overflow <= 0) return [];

  const relatedGoalId = opportunity.relatedGoalId;
  return activeInitiatives()
    .map((initiative) => ({ ...initiative, goal: goalById(initiative.goalId) }))
    .filter((initiative) => initiative.goalId !== relatedGoalId)
    .sort((a, b) => Number(a.goal?.priority || 0) - Number(b.goal?.priority || 0))
    .slice(0, 3);
}

function renderEvaluation() {
  const selected = state.opportunities.find((item) => item.id === state.selectedOpportunityId) || state.opportunities[0];
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
    .map((item) => `<li>${escapeHtml(item.name)}: ${hours(item.weeklyHours)}/week, ${escapeHtml(item.type)}</li>`)
    .join("");
  const impacts = selected.expectedImpact?.length
    ? selected.expectedImpact.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No explicit benefits entered yet.</li>";
  const tradeoffs = evaluation.tradeoffs.length
    ? evaluation.tradeoffs.map((item) => `<li>${escapeHtml(item.name)} may lose up to ${hours(Math.min(item.estimatedWeeklyHours, evaluation.overflow))}/week</li>`).join("")
    : "<li>No delay predicted from current capacity.</li>";

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
    </div>
    <div class="two-col">
      <div>
        <h4>If accepted, you gain</h4>
        <ul class="tradeoff-list">${impacts}</ul>
      </div>
      <div>
        <h4>Likely delayed</h4>
        <ul class="tradeoff-list">${tradeoffs}</ul>
      </div>
    </div>
    <div class="benchmark-block">
      <h4>Current commitments benchmark</h4>
      <ul class="tradeoff-list">${commitmentLoad || "<li>No commitments entered yet.</li>"}</ul>
    </div>
  `;
}

function recommendationClass(value) {
  if (value === "Accept") return "green";
  if (value === "Reject") return "red";
  return "amber";
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
    urgency: data.urgency,
    alignmentScore: Number(data.alignmentScore),
    expectedImpact: splitList(data.expectedImpact || ""),
    relatedGoalId: data.relatedGoalId
  };
}

function fillOpportunityForm(opportunity) {
  const form = $("#opportunityForm");
  form.elements.title.value = opportunity.title || "";
  form.elements.description.value = opportunity.description || "";
  form.elements.category.value = opportunity.category || "academy";
  form.elements.urgency.value = opportunity.urgency || "medium";
  form.elements.weeklyHours.value = opportunity.weeklyHours ?? 4;
  form.elements.durationWeeks.value = opportunity.durationWeeks ?? 4;
  form.elements.currency.value = opportunity.currency || "IDR";
  form.elements.moneyCost.value = opportunity.moneyCost ?? 0;
  form.elements.alignmentScore.value = opportunity.alignmentScore ?? 6;
  form.elements.relatedGoalId.value = opportunity.relatedGoalId || "";
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
  $("#opportunitySubmit").textContent = isEditing ? "Update Opportunity" : "Add Opportunity";
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

$("#initiativeForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addFromForm(event.currentTarget, (data) => {
    state.initiatives.push({
      id: makeId(),
      name: data.name,
      goalId: data.goalId,
      estimatedWeeklyHours: Number(data.estimatedWeeklyHours),
      estimatedDurationWeeks: Number(data.estimatedDurationWeeks),
      progress: Number(data.progress),
      status: "in_progress"
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
      energyCost: data.energyCost,
      type: data.type,
      notes: data.notes
    });
  });
});

$("#opportunityForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());

  if (state.editingOpportunityId) {
    const opportunity = state.opportunities.find((item) => item.id === state.editingOpportunityId);
    if (opportunity) {
      Object.assign(opportunity, opportunityFromData(data, opportunity));
      state.selectedOpportunityId = opportunity.id;
    }
    state.editingOpportunityId = null;
  } else {
    const opportunity = opportunityFromData(data, {
      id: makeId(),
      status: "inbox"
    });
    state.opportunities.push(opportunity);
    state.selectedOpportunityId = opportunity.id;
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
