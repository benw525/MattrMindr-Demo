import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { Plus, Trash2, X, Search, Pencil, Check, Eye, Loader2, Upload, Filter, Sparkles, Zap, ToggleLeft, ToggleRight, SlidersHorizontal, Menu, GitBranch, BarChart2, ListChecks, BarChart3, Bot, Shield, User, FileText } from "lucide-react";
import {
  apiGetPermissionKeys,
  apiGetPermissions,
  apiCreatePermissionsBulk,
  apiDeletePermissionsBulk,
  apiGetCustomReports,
  apiCreateCustomReport,
  apiUpdateCustomReport,
  apiDeleteCustomReport,
  apiRunCustomReport,
  apiCustomReportAiAssist,
  apiGetCustomAgents,
  apiCreateCustomAgent,
  apiUpdateCustomAgent,
  apiDeleteCustomAgent,
  apiRunCustomAgent,
  apiChatCustomAgent,
  apiUploadAgentInstructions,
  apiClearAgentInstructions,
  apiGetTaskFlows,
  apiGetTaskFlow,
  apiCreateTaskFlow,
  apiUpdateTaskFlow,
  apiDeleteTaskFlow,
  apiGetCustomWidgets,
  apiCreateCustomWidget,
  apiUpdateCustomWidget,
  apiDeleteCustomWidget,
  apiRunCustomWidget,
} from "../api.js";
import {
  STAFF_ROLES,
} from "../shared.js";

const CASE_TRIGGER_FIELDS = [
  { value: "status", label: "Status", type: "select", options: ["Active","Pre-Litigation","In Litigation","Settlement","Closed","On Hold"] },
  { value: "stage", label: "Stage", type: "select", options: ["Intake","Treatment","Pre-Litigation","Demand","Negotiation","Litigation","Discovery","Mediation","Trial Prep","Trial","Settlement","Closed"] },
  { value: "caseType", label: "Case Type", type: "select", options: ["Auto Accident","Truck Accident","Motorcycle","Slip and Fall","Premises Liability","Medical Malpractice","Product Liability","Dog Bite","Wrongful Death","Workers Compensation","Other"] },
  { value: "inLitigation", label: "In Litigation", type: "boolean" },
  { value: "clientBankruptcy", label: "Client Bankruptcy", type: "boolean" },
  { value: "stateJurisdiction", label: "State Jurisdiction", type: "text" },
  { value: "county", label: "County", type: "text" },
  { value: "dispositionType", label: "Disposition Type", type: "text" },
  { value: "injuryType", label: "Injury Type", type: "text" },
];

const TRIGGER_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "is_true", label: "Is True" },
  { value: "is_false", label: "Is False" },
  { value: "changed_to", label: "Changed To" },
];

const STEP_CONDITION_TYPES = [
  { value: "prior_step", label: "After Prior Step" },
  { value: "case_field", label: "Case Field Matches" },
  { value: "task_status", label: "Existing Task Status" },
  { value: "role_assigned", label: "Role Assigned on Case" },
  { value: "case_age", label: "Case Age (Days)" },
  { value: "has_document", label: "Document Exists" },
  { value: "priority_level", label: "Open Task Priority Count" },
];

const STEP_CONDITION_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "is_true", label: "Is True" },
  { value: "is_false", label: "Is False" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
];
function TaskFlowsTab({ currentUser, allUsers, confirmDelete }) {
  const [flows, setFlows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", trigger_on: "update", is_active: true, trigger_condition: { field: "status", operator: "equals", value: "" }, steps: [] });

  useEffect(() => { if (!loaded) { apiGetTaskFlows().then(r => { setFlows(r); setLoaded(true); }).catch(() => setLoaded(true)); } }, [loaded]);

  const resetForm = () => { setForm({ name: "", description: "", trigger_on: "update", is_active: true, trigger_condition: { field: "status", operator: "equals", value: "" }, steps: [] }); setEditingFlow(null); setShowEditor(false); };

  const handleEdit = async (flow) => {
    try {
      const full = await apiGetTaskFlow(flow.id);
      const loadedSteps = (full.steps || []);
      const stepIdToIndex = {};
      loadedSteps.forEach((s, i) => { if (s.id) stepIdToIndex[s.id] = i; });
      setForm({ name: full.name, description: full.description || "", trigger_on: full.triggerOn || "update", is_active: full.isActive !== false, trigger_condition: full.triggerCondition || { field: "status", operator: "equals", value: "" }, steps: loadedSteps.map((s, i) => {
        let conds = [...(s.conditions || [])];
        if (s.dependsOnStepId && !conds.some(c => c.type === "prior_step")) {
          const depIdx = stepIdToIndex[s.dependsOnStepId];
          if (depIdx !== undefined) conds.unshift({ type: "prior_step", stepIndex: depIdx });
        }
        return { _tempId: i + 1, title: s.title, assigned_role: s.assignedRole || "", assigned_user_id: s.assignedUserId || null, due_in_days: s.dueInDays, priority: s.priority || "Medium", conditions: conds, recurring: s.recurring, recurring_days: s.recurringDays, auto_escalate: s.autoEscalate, escalate_medium_days: s.escalateMediumDays, escalate_high_days: s.escalateHighDays, escalate_urgent_days: s.escalateUrgentDays, notes: s.notes || "" };
      }) });
      setEditingFlow(full);
      setShowEditor(true);
    } catch (e) { alert("Failed to load flow: " + e.message); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert("Flow name is required");
    if (form.steps.length === 0) return alert("Add at least one step");
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, triggerCondition: form.trigger_condition, triggerOn: form.trigger_on, isActive: form.is_active, steps: form.steps.map((s, i) => {
        const conds = (s.conditions || []).map(c => ({ ...c }));
        const firstPriorStep = conds.find(c => c.type === "prior_step" && c.stepIndex != null);
        return { title: s.title, assignedRole: s.assigned_role || null, assignedUserId: s.assigned_user_id ? parseInt(s.assigned_user_id) : null, dueInDays: s.due_in_days ? parseInt(s.due_in_days) : null, priority: s.priority || "Medium", conditions: conds, dependsOnStepIndex: firstPriorStep ? parseInt(firstPriorStep.stepIndex) : null, recurring: !!s.recurring, recurringDays: s.recurring_days ? parseInt(s.recurring_days) : null, autoEscalate: s.auto_escalate !== false, escalateMediumDays: s.escalate_medium_days || 30, escalateHighDays: s.escalate_high_days || 14, escalateUrgentDays: s.escalate_urgent_days || 7, notes: s.notes || "", sortOrder: i };
      }) };
      if (editingFlow) {
        const updated = await apiUpdateTaskFlow(editingFlow.id, payload);
        setFlows(prev => prev.map(f => f.id === editingFlow.id ? { ...f, ...updated } : f));
      } else {
        const created = await apiCreateTaskFlow(payload);
        setFlows(prev => [...prev, created]);
      }
      resetForm();
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  };

  const handleDelete = (flow) => {
    confirmDelete(() => {
      apiDeleteTaskFlow(flow.id).then(() => setFlows(prev => prev.filter(f => f.id !== flow.id))).catch(e => alert("Delete failed: " + e.message));
    });
  };

  const addStep = () => { setForm(f => ({ ...f, steps: [...f.steps, { _tempId: Date.now(), title: "", assigned_role: "", assigned_user_id: null, due_in_days: 7, priority: "Medium", conditions: [], recurring: false, recurring_days: null, auto_escalate: true, escalate_medium_days: 30, escalate_high_days: 14, escalate_urgent_days: 7, notes: "" }] })); };

  const updateStep = (idx, field, val) => { setForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, [field]: val } : s) })); };

  const removeStep = (idx) => { setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx).map(s => ({ ...s, conditions: (s.conditions || []).map(c => c.type === "prior_step" ? { ...c, stepIndex: c.stepIndex === idx ? null : c.stepIndex > idx ? c.stepIndex - 1 : c.stepIndex } : c).filter(c => c.type !== "prior_step" || c.stepIndex !== null) })) })); };

  const addCondition = (stepIdx) => { updateStep(stepIdx, "conditions", [...(form.steps[stepIdx].conditions || []), { type: "prior_step", stepIndex: null }]); };
  const updateCondition = (stepIdx, condIdx, updates) => { updateStep(stepIdx, "conditions", (form.steps[stepIdx].conditions || []).map((c, ci) => ci === condIdx ? { ...c, ...updates } : c)); };
  const removeCondition = (stepIdx, condIdx) => { updateStep(stepIdx, "conditions", (form.steps[stepIdx].conditions || []).filter((_, ci) => ci !== condIdx)); };

  const triggerField = CASE_TRIGGER_FIELDS.find(f => f.value === form.trigger_condition.field);

  const condSummary = (tc) => {
    const f = CASE_TRIGGER_FIELDS.find(x => x.value === tc.field);
    const label = f ? f.label : tc.field;
    if (tc.operator === "is_true") return `${label} is True`;
    if (tc.operator === "is_false") return `${label} is False`;
    return `${label} ${tc.operator.replace("_", " ")} "${tc.value}"`;
  };

  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingFlow ? "Edit Task Flow" : "New Task Flow"}</h3>
          <button onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Flow Name *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bankruptcy Filing Tasks" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Trigger On</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white" value={form.trigger_on} onChange={e => setForm(f => ({ ...f, trigger_on: e.target.value }))}>
              <option value="update">Case Update</option>
              <option value="create">Case Create</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what this flow does..." />
        </div>

        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-800 dark:text-amber-300">Trigger Condition</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Field</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.trigger_condition.field} onChange={e => { const newField = e.target.value; const fieldDef = CASE_TRIGGER_FIELDS.find(x => x.value === newField); const newOp = fieldDef?.type === "boolean" ? "is_true" : "equals"; setForm(f => ({ ...f, trigger_condition: { ...f.trigger_condition, field: newField, value: "", operator: newOp } })); }}>
                {CASE_TRIGGER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Operator</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.trigger_condition.operator} onChange={e => setForm(f => ({ ...f, trigger_condition: { ...f.trigger_condition, operator: e.target.value } }))}>
                {TRIGGER_OPERATORS.filter(op => { if (triggerField?.type === "boolean") return ["is_true", "is_false"].includes(op.value); return !["is_true", "is_false"].includes(op.value) || triggerField?.type === "boolean"; }).map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>
            </div>
            {!["is_true", "is_false"].includes(form.trigger_condition.operator) && (
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Value</label>
                {triggerField?.type === "select" ? (
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.trigger_condition.value} onChange={e => setForm(f => ({ ...f, trigger_condition: { ...f.trigger_condition, value: e.target.value } }))}>
                    <option value="">Select...</option>
                    {triggerField.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.trigger_condition.value} onChange={e => setForm(f => ({ ...f, trigger_condition: { ...f.trigger_condition, value: e.target.value } }))} placeholder="Value..." />
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-slate-800 dark:text-white">Task Steps ({form.steps.length})</span>
            </div>
            <button onClick={addStep} className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Add Step</button>
          </div>

          {form.steps.length === 0 && <div className="text-sm text-slate-400 italic py-4 text-center">No steps yet. Add steps that will become tasks when the trigger fires.</div>}

          <div className="space-y-3">
            {form.steps.map((step, idx) => (
              <div key={step._tempId || idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                    <span className="text-xs font-semibold text-slate-500">Step {idx + 1}</span>
                    {(step.conditions || []).length > 0 && (
                      <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full flex items-center gap-1"><Filter size={10} /> {step.conditions.length} condition{step.conditions.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <button onClick={() => removeStep(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Task Title *</label>
                    <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={step.title} onChange={e => updateStep(idx, "title", e.target.value)} placeholder="e.g. Notify Bankruptcy Team" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Assigned Role</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={step.assigned_role || ""} onChange={e => updateStep(idx, "assigned_role", e.target.value)}>
                      <option value="">Select role...</option>
                      {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Due In (days)</label>
                    <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={step.due_in_days || ""} onChange={e => updateStep(idx, "due_in_days", e.target.value ? parseInt(e.target.value) : null)} min="0" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Priority</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={step.priority || "Medium"} onChange={e => updateStep(idx, "priority", e.target.value)}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Specific User</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={step.assigned_user_id || ""} onChange={e => updateStep(idx, "assigned_user_id", e.target.value ? parseInt(e.target.value) : null)}>
                      <option value="">Use role assignment</option>
                      {(allUsers || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>

                {(step.conditions || []).length > 0 && (
                  <div className="mb-3 p-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter size={13} className="text-violet-600 dark:text-violet-400" />
                      <span className="text-xs font-bold text-violet-800 dark:text-violet-300">Conditions (ALL must be met)</span>
                    </div>
                    <div className="space-y-2">
                      {step.conditions.map((cond, ci) => {
                        const condField = cond.type === "case_field" ? CASE_TRIGGER_FIELDS.find(f => f.value === cond.field) : null;
                        return (
                          <div key={ci} className="flex items-start gap-2 bg-white dark:bg-slate-700 rounded-lg p-2 border border-violet-100 dark:border-violet-700">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.type} onChange={e => {
                                const newType = e.target.value;
                                const base = { type: newType };
                                if (newType === "prior_step") base.stepIndex = null;
                                else if (newType === "case_field") { base.field = "status"; base.operator = "equals"; base.value = ""; }
                                else if (newType === "task_status") { base.taskTitle = ""; base.status = "Completed"; }
                                else if (newType === "role_assigned") { base.role = ""; }
                                else if (newType === "case_age") { base.minDays = 30; }
                                else if (newType === "has_document") { base.documentName = ""; }
                                else if (newType === "priority_level") { base.priority = "Urgent"; base.countOperator = "greater_than"; base.countValue = 0; }
                                updateCondition(idx, ci, base);
                              }}>
                                {STEP_CONDITION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>

                              {cond.type === "prior_step" && (
                                <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.stepIndex != null ? cond.stepIndex : ""} onChange={e => updateCondition(idx, ci, { stepIndex: e.target.value !== "" ? parseInt(e.target.value) : null })}>
                                  <option value="">Select step...</option>
                                  {form.steps.map((s, si) => si < idx ? <option key={si} value={si}>Step {si + 1}: {s.title || "(untitled)"}</option> : null)}
                                </select>
                              )}

                              {cond.type === "case_field" && (
                                <>
                                  <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.field || "status"} onChange={e => { const nf = e.target.value; const fd = CASE_TRIGGER_FIELDS.find(x => x.value === nf); updateCondition(idx, ci, { field: nf, value: "", operator: fd?.type === "boolean" ? "is_true" : "equals" }); }}>
                                    {CASE_TRIGGER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                  </select>
                                  <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.operator || "equals"} onChange={e => updateCondition(idx, ci, { operator: e.target.value })}>
                                    {STEP_CONDITION_OPERATORS.filter(op => { if (condField?.type === "boolean") return ["is_true", "is_false"].includes(op.value); return !["is_true", "is_false"].includes(op.value) || condField?.type === "boolean"; }).map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                                  </select>
                                  {!["is_true", "is_false"].includes(cond.operator) && (
                                    condField?.type === "select" ? (
                                      <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.value || ""} onChange={e => updateCondition(idx, ci, { value: e.target.value })}>
                                        <option value="">Select...</option>
                                        {condField.options.map(o => <option key={o} value={o}>{o}</option>)}
                                      </select>
                                    ) : (
                                      <input className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.value || ""} onChange={e => updateCondition(idx, ci, { value: e.target.value })} placeholder="Value..." />
                                    )
                                  )}
                                </>
                              )}

                              {cond.type === "task_status" && (
                                <>
                                  <input className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.taskTitle || ""} onChange={e => updateCondition(idx, ci, { taskTitle: e.target.value })} placeholder="Task title contains..." />
                                  <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.status || "Completed"} onChange={e => updateCondition(idx, ci, { status: e.target.value })}>
                                    <option value="Completed">Completed</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Not Started">Not Started</option>
                                  </select>
                                </>
                              )}

                              {cond.type === "role_assigned" && (
                                <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.role || ""} onChange={e => updateCondition(idx, ci, { role: e.target.value })}>
                                  <option value="">Select role...</option>
                                  {["Attorney", "Second Attorney", "Case Manager", "Investigator", "Paralegal"].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              )}

                              {cond.type === "case_age" && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-500">at least</span>
                                  <input type="number" className="w-16 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.minDays || ""} onChange={e => updateCondition(idx, ci, { minDays: e.target.value ? parseInt(e.target.value) : null })} min="1" />
                                  <span className="text-xs text-slate-500">days old</span>
                                </div>
                              )}

                              {cond.type === "has_document" && (
                                <input className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.documentName || ""} onChange={e => updateCondition(idx, ci, { documentName: e.target.value })} placeholder="Filename contains..." />
                              )}

                              {cond.type === "priority_level" && (
                                <>
                                  <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.priority || "Urgent"} onChange={e => updateCondition(idx, ci, { priority: e.target.value })}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                  </select>
                                  <select className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.countOperator || "greater_than"} onChange={e => updateCondition(idx, ci, { countOperator: e.target.value })}>
                                    <option value="greater_than">More than</option>
                                    <option value="equals">Exactly</option>
                                    <option value="less_than">Less than</option>
                                  </select>
                                  <input type="number" className="w-16 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs" value={cond.countValue ?? 0} onChange={e => updateCondition(idx, ci, { countValue: e.target.value ? parseInt(e.target.value) : 0 })} min="0" />
                                </>
                              )}
                            </div>
                            <button onClick={() => removeCondition(idx, ci)} className="text-red-400 hover:text-red-600 p-0.5 mt-0.5 flex-shrink-0"><X size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button onClick={() => addCondition(idx)} className="mb-3 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 flex items-center gap-1 font-medium"><Plus size={12} /> Add Condition</button>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!step.recurring} onChange={e => updateStep(idx, "recurring", e.target.checked)} className="accent-amber-500" />
                    <span className="text-slate-600 dark:text-slate-300">Recurring</span>
                  </label>
                  {step.recurring && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">every</span>
                      <input type="number" className="w-16 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={step.recurring_days || ""} onChange={e => updateStep(idx, "recurring_days", e.target.value ? parseInt(e.target.value) : null)} min="1" />
                      <span className="text-slate-500">days</span>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={step.auto_escalate !== false} onChange={e => updateStep(idx, "auto_escalate", e.target.checked)} className="accent-amber-500" />
                    <span className="text-slate-600 dark:text-slate-300">Auto-escalate</span>
                  </label>
                </div>

                {step.notes !== undefined && (
                  <div className="mt-2">
                    <input className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300" value={step.notes || ""} onChange={e => updateStep(idx, "notes", e.target.value)} placeholder="Optional notes..." />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            {form.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-slate-400" />}
            <span className={form.is_active ? "text-green-700 dark:text-green-400 font-semibold" : "text-slate-500"}>{form.is_active ? "Active" : "Inactive"}</span>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="hidden" />
          </label>
          <div className="flex gap-2">
            <button onClick={resetForm} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-semibold">{saving ? "Saving..." : editingFlow ? "Update Flow" : "Create Flow"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Task Flows</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Automate task creation based on case field changes</p>
        </div>
        <button onClick={() => { resetForm(); setShowEditor(true); }} className="px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"><Plus size={16} /> New Flow</button>
      </div>

      {!loaded && <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-amber-500" /></div>}

      {loaded && flows.length === 0 && (
        <div className="text-center py-16">
          <GitBranch size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No task flows yet. Create one to automate task creation.</p>
        </div>
      )}

      <div className="space-y-3">
        {flows.map(flow => (
          <div key={flow.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-slate-800 dark:text-white">{flow.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${flow.isActive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>{flow.isActive ? "Active" : "Inactive"}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">{flow.triggerOn === "both" ? "Create & Update" : flow.triggerOn === "create" ? "On Create" : "On Update"}</span>
                </div>
                {flow.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{flow.description}</p>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Zap size={12} className="text-amber-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{condSummary(flow.triggerCondition)}</span>
                  {flow.steps && flow.steps.length > 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">| {flow.steps.length} step{flow.steps.length !== 1 ? "s" : ""}{flow.steps.some(s => (s.conditions || []).length > 0) ? ` (${flow.steps.filter(s => (s.conditions || []).length > 0).length} with conditions)` : ""}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => handleEdit(flow)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Pencil size={15} /></button>
                <button onClick={() => handleDelete(flow)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Custom Dashboard Widget Builder ─────────────────────────────────────────

const WIDGET_DATA_SOURCES = [
  { value: "cases", label: "Cases" },
  { value: "tasks", label: "Tasks" },
  { value: "deadlines", label: "Deadlines" },
  { value: "contacts", label: "Contacts" },
  { value: "correspondence", label: "Correspondence" },
  { value: "expenses", label: "Expenses" },
  { value: "staff_assigned", label: "Staff Assigned (Cases by Role)" },
];

const WIDGET_TYPES = [
  { value: "metric", label: "Metric", desc: "Single number (count, sum, avg)", icon: BarChart2 },
  { value: "list", label: "List", desc: "Filtered records table", icon: ListChecks },
  { value: "chart", label: "Chart", desc: "Bar or pie chart", icon: BarChart3 },
];

function CustomDashboardWidgetsTab({ currentUser, confirmDelete }) {
  const [widgets, setWidgets] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [form, setForm] = useState({ name: "", widget_type: "metric", data_source: "cases", size: "half", visibility: "private", config: { aggregation: "count", target_field: "", filters: [], columns: "", sort_by: "", sort_dir: "ASC", row_limit: 10, chart_type: "bar", chart_field: "" } });

  useEffect(() => { if (!loaded) { apiGetCustomWidgets().then(r => { setWidgets(r); setLoaded(true); }).catch(() => setLoaded(true)); } }, [loaded]);

  const resetForm = () => { setForm({ name: "", widget_type: "metric", data_source: "cases", size: "half", visibility: "private", config: { aggregation: "count", target_field: "", filters: [], columns: "", sort_by: "", sort_dir: "ASC", row_limit: 10, chart_type: "bar", chart_field: "" } }); setEditingWidget(null); setShowEditor(false); setPreview(null); };

  const handleEdit = (w) => {
    setForm({ name: w.name, widget_type: w.widgetType || w.widget_type, data_source: w.dataSource || w.data_source, size: w.size || "half", visibility: w.visibility || "private", config: w.config || {} });
    setEditingWidget(w);
    setShowEditor(true);
    setPreview(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert("Widget name is required");
    setSaving(true);
    try {
      const payload = { name: form.name, widgetType: form.widget_type, dataSource: form.data_source, size: form.size, visibility: form.visibility, config: form.config };
      if (editingWidget) {
        const updated = await apiUpdateCustomWidget(editingWidget.id, payload);
        setWidgets(prev => prev.map(w => w.id === editingWidget.id ? updated : w));
      } else {
        const created = await apiCreateCustomWidget(payload);
        setWidgets(prev => [...prev, created]);
      }
      resetForm();
    } catch (e) { alert("Save failed: " + e.message); }
    setSaving(false);
  };

  const handleDelete = (w) => { confirmDelete(() => { apiDeleteCustomWidget(w.id).then(() => setWidgets(prev => prev.filter(x => x.id !== w.id))).catch(e => alert("Delete failed: " + e.message)); }); };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const result = await apiRunCustomWidget({ widgetType: form.widget_type, dataSource: form.data_source, config: form.config });
      setPreview(result);
    } catch (e) { alert("Preview failed: " + e.message); }
    setPreviewing(false);
  };

  const addFilter = () => { setForm(f => ({ ...f, config: { ...f.config, filters: [...(f.config.filters || []), { field: "", operator: "equals", value: "" }] } })); };
  const updateFilter = (idx, key, val) => { setForm(f => ({ ...f, config: { ...f.config, filters: f.config.filters.map((fl, i) => i === idx ? { ...fl, [key]: val } : fl) } })); };
  const removeFilter = (idx) => { setForm(f => ({ ...f, config: { ...f.config, filters: f.config.filters.filter((_, i) => i !== idx) } })); };

  const typeIcon = (t) => { const W = WIDGET_TYPES.find(x => x.value === (t?.widgetType || t?.widget_type || t)); return W ? W.icon : BarChart2; };

  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingWidget ? "Edit Widget" : "New Dashboard Widget"}</h3>
          <button onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Widget Name *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Active Cases Count" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Data Source</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.data_source} onChange={e => { const ds = e.target.value; setForm(f => ({ ...f, data_source: ds, widget_type: ds === "staff_assigned" ? "chart" : f.widget_type, config: ds === "staff_assigned" ? { ...f.config, chart_type: "pie", staff_role: "Lead Attorney", case_status_filter: "Active" } : f.config })); }}>
              {WIDGET_DATA_SOURCES.map(ds => <option key={ds.value} value={ds.value}>{ds.label}</option>)}
            </select>
          </div>
        </div>

        {form.data_source === "staff_assigned" ? (
          <div className="p-3 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-center">
            <BarChart3 size={20} className="mx-auto mb-1 text-amber-600" />
            <div className="text-sm font-semibold">Chart</div>
            <div className="text-xs text-slate-400">Cases per staff member by role</div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Widget Type</label>
            <div className="grid grid-cols-3 gap-3">
              {WIDGET_TYPES.map(t => {
                const TIcon = t.icon;
                return (
                  <div key={t.value} onClick={() => setForm(f => ({ ...f, widget_type: t.value }))} className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${form.widget_type === t.value ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : "border-slate-200 dark:border-slate-600 hover:border-slate-300"}`}>
                    <TIcon size={20} className={`mx-auto mb-1 ${form.widget_type === t.value ? "text-amber-600" : "text-slate-400"}`} />
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-xs text-slate-400">{t.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {form.widget_type === "metric" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Aggregation</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.aggregation || "count"} onChange={e => setForm(f => ({ ...f, config: { ...f.config, aggregation: e.target.value } }))}>
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="average">Average</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Field (for sum/avg)</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.target_field || ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, target_field: e.target.value } }))} placeholder="e.g. settlement_amount" />
            </div>
          </div>
        )}

        {form.widget_type === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Columns (comma-separated)</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.columns || ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, columns: e.target.value } }))} placeholder="e.g. title, status, client_name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sort By</label>
              <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.sort_by || ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, sort_by: e.target.value } }))} placeholder="e.g. created_at" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Row Limit</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.row_limit || 10} onChange={e => setForm(f => ({ ...f, config: { ...f.config, row_limit: parseInt(e.target.value) || 10 } }))} min="1" max="100" />
            </div>
          </div>
        )}

        {form.widget_type === "chart" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Chart Type</label>
              <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.chart_type || "bar"} onChange={e => setForm(f => ({ ...f, config: { ...f.config, chart_type: e.target.value } }))}>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>
            {form.data_source === "staff_assigned" ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Staff Role</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.staff_role || "Lead Attorney"} onChange={e => setForm(f => ({ ...f, config: { ...f.config, staff_role: e.target.value } }))}>
                    <option value="Lead Attorney">Lead Attorney</option>
                    <option value="Second Attorney">Second Attorney</option>
                    <option value="Case Manager">Case Manager</option>
                    <option value="Investigator">Investigator</option>
                    <option value="Paralegal">Paralegal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Case Status Filter</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.case_status_filter || "Active"} onChange={e => setForm(f => ({ ...f, config: { ...f.config, case_status_filter: e.target.value } }))}>
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pre-Litigation">Pre-Litigation</option>
                    <option value="In Litigation">In Litigation</option>
                    <option value="Settlement">Settlement</option>
                    <option value="Closed">Closed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Group By Field</label>
                <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.config.chart_field || ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, chart_field: e.target.value } }))} placeholder="e.g. status, case_type" />
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filters</label>
            <button onClick={addFilter} className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"><Plus size={12} /> Add Filter</button>
          </div>
          {(form.config.filters || []).map((fl, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={fl.field} onChange={e => updateFilter(idx, "field", e.target.value)} placeholder="Field..." />
              <select className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={fl.operator} onChange={e => updateFilter(idx, "operator", e.target.value)}>
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="is_true">Is True</option>
                <option value="is_false">Is False</option>
              </select>
              {!["is_true","is_false"].includes(fl.operator) && <input className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={fl.value} onChange={e => updateFilter(idx, "value", e.target.value)} placeholder="Value..." />}
              <button onClick={() => removeFilter(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Size</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
              <option value="quarter">Quarter</option>
              <option value="half">Half</option>
              <option value="full">Full</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Visibility</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}>
              <option value="private">Private (only me)</option>
              <option value="public">Public (all users)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={handlePreview} disabled={previewing} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">{previewing ? <><Loader2 size={14} className="animate-spin" /> Running...</> : <><Eye size={14} /> Preview</>}</button>
          <div className="flex gap-2">
            <button onClick={resetForm} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-semibold">{saving ? "Saving..." : editingWidget ? "Update Widget" : "Create Widget"}</button>
          </div>
        </div>

        {preview && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 mt-4">
            <div className="text-xs font-semibold text-slate-500 mb-2">Preview Result</div>
            {form.widget_type === "metric" && <div className="text-3xl font-bold text-slate-800 dark:text-white">{preview.value != null ? preview.value : "—"}</div>}
            {form.widget_type === "list" && preview.rows && (
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead><tr>{(preview.columns || []).map(c => <th key={c} className="text-left py-1 px-2 text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-600">{c}</th>)}</tr></thead>
                  <tbody>{(preview.rows || []).slice(0, 20).map((row, ri) => <tr key={ri}>{(preview.columns || []).map(c => <td key={c} className="py-1 px-2 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">{String(row[c] ?? "")}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
            {form.widget_type === "chart" && preview.data && (
              <div className="space-y-1">{(preview.data || []).slice(0, 15).map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-24 text-right text-slate-500 truncate">{d.label}</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (d.value / Math.max(...preview.data.map(x => x.value), 1)) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-10 text-right">{d.value}</span>
                </div>
              ))}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dashboard Widgets</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create custom widgets for your dashboard</p>
        </div>
        <button onClick={() => { resetForm(); setShowEditor(true); }} className="px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"><Plus size={16} /> New Widget</button>
      </div>

      {!loaded && <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-amber-500" /></div>}

      {loaded && widgets.length === 0 && (
        <div className="text-center py-16">
          <BarChart2 size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No custom widgets yet. Create one to add to your dashboard.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {widgets.map(w => {
          const TIcon = typeIcon(w);
          return (
            <div key={w.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><TIcon size={18} className="text-amber-600" /></div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-white">{w.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{w.widgetType || w.widget_type} / {w.dataSource || w.data_source}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">{w.size}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">{w.visibility}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(w)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(w)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Customization View ──────────────────────────────────────────────────────

function CustomizationView({ currentUser, allCases, allUsers, pinnedCaseIds, onMenuToggle, confirmDelete }) {
  const [tab, setTab] = useState("agents");

  const tabs = [
    { id: "agents", label: "Custom Agents", icon: Bot },
    { id: "reports", label: "Custom Reports", icon: BarChart3 },
    { id: "widgets", label: "Dashboard Widgets", icon: BarChart2 },
    { id: "flows", label: "Task Flows", icon: GitBranch },
    { id: "permissions", label: "Permissions", icon: Shield },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="header flex-shrink-0">
        <button className="md:hidden p-1" onClick={onMenuToggle}><Menu size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><SlidersHorizontal size={22} className="text-amber-500" /> Customization</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Custom agents, reports, widgets, and automation flows</p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6 flex gap-0 overflow-x-auto overflow-y-hidden sticky top-0 bg-white dark:bg-slate-900 z-10">
          {tabs.map(t => {
            const TIcon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors bg-transparent border-0 cursor-pointer -mb-[2px] flex items-center gap-1.5 whitespace-nowrap ${tab === t.id ? "border-b-amber-500 text-amber-700 dark:text-amber-400" : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                <TIcon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "agents" && <CustomAgentsTab currentUser={currentUser} allCases={allCases} pinnedCaseIds={pinnedCaseIds} />}
        {tab === "reports" && <CustomReportBuilder currentUser={currentUser} />}
        {tab === "widgets" && <CustomDashboardWidgetsTab currentUser={currentUser} confirmDelete={confirmDelete} />}
        {tab === "flows" && <TaskFlowsTab currentUser={currentUser} allUsers={allUsers} confirmDelete={confirmDelete} />}
        {tab === "permissions" && <PermissionsTab currentUser={currentUser} allUsers={allUsers} />}
      </div>
    </div>
  );
}

// ─── Permissions Tab ──────────────────────────────────────────────────────────
function PermissionsTab({ currentUser, allUsers }) {
  const [permKeys, setPermKeys] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("role");
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [expiryMap, setExpiryMap] = useState({});
  const [showExpiry, setShowExpiry] = useState({});

  const toggleTarget = (target) => {
    setSelectedTargets(prev => {
      if (prev.includes(target)) return prev.filter(t => t !== target);
      return [...prev, target];
    });
    setPendingChanges({});
    setExpiryMap({});
  };
  const selectedTarget = selectedTargets.length === 1 ? selectedTargets[0] : "";

  useEffect(() => {
    if (!loaded) {
      Promise.all([apiGetPermissionKeys(), apiGetPermissions()])
        .then(([keys, perms]) => {
          setPermKeys(keys);
          setPermissions(perms);
          setLoaded(true);
        })
        .catch(() => { setPermKeys([]); setPermissions([]); setLoaded(true); });
    }
  }, [loaded]);

  const categories = useMemo(() => {
    const cats = [...new Set(permKeys.map(pk => pk.category))];
    return ["All", ...cats];
  }, [permKeys]);

  const filteredKeys = useMemo(() => {
    let filtered = permKeys;
    if (categoryFilter !== "All") filtered = filtered.filter(pk => pk.category === categoryFilter);
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(pk => pk.label.toLowerCase().includes(q) || pk.key.toLowerCase().includes(q) || pk.category.toLowerCase().includes(q));
    }
    return filtered;
  }, [permKeys, categoryFilter, searchFilter]);

  const groupedKeys = useMemo(() => {
    const groups = {};
    for (const pk of filteredKeys) {
      if (!groups[pk.category]) groups[pk.category] = [];
      groups[pk.category].push(pk);
    }
    return groups;
  }, [filteredKeys]);

  const activeUsers = useMemo(() => (allUsers || []).filter(u => !u.deleted), [allUsers]);

  const getCurrentValue = (permKey) => {
    const primary = selectedTargets[0] || "";
    const changeKey = `${mode}:${primary}:${permKey}`;
    if (changeKey in pendingChanges) return pendingChanges[changeKey];
    const existing = permissions.find(p =>
      p.permission_key === permKey && p.target_type === mode && p.target_value === primary
    );
    if (existing) {
      if (existing.expires_at && new Date(existing.expires_at) < new Date()) return null;
      return existing.granted;
    }
    return null;
  };

  const getCurrentExpiry = (permKey) => {
    const primary = selectedTargets[0] || "";
    const changeKey = `${mode}:${primary}:${permKey}`;
    if (changeKey in expiryMap) return expiryMap[changeKey];
    const existing = permissions.find(p =>
      p.permission_key === permKey && p.target_type === mode && p.target_value === primary
    );
    if (!existing?.expires_at) return "";
    const d = new Date(existing.expires_at);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const togglePermission = (permKey) => {
    const current = getCurrentValue(permKey);
    let next;
    if (current === null) next = true;
    else if (current === true) next = false;
    else next = null;
    const updates = {};
    for (const t of selectedTargets) {
      updates[`${mode}:${t}:${permKey}`] = next;
    }
    setPendingChanges(p => ({ ...p, ...updates }));
  };

  const setExpiry = (permKey, val) => {
    const updates = {};
    for (const t of selectedTargets) {
      updates[`${mode}:${t}:${permKey}`] = val;
    }
    setExpiryMap(p => ({ ...p, ...updates }));
  };

  const hasChanges = Object.keys(pendingChanges).length > 0 || Object.keys(expiryMap).length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const toCreate = [];
      const toDelete = [];

      for (const [changeKey, value] of Object.entries(pendingChanges)) {
        const [targetType, targetValue, permKey] = changeKey.split(":");
        if (value === null) {
          toDelete.push({ targetType, targetValue, permKey });
        } else {
          const expiry = expiryMap[changeKey] || getCurrentExpiry(permKey);
          toCreate.push({
            permission_key: permKey,
            target_type: targetType,
            target_value: targetValue,
            granted: value,
            expires_at: expiry || null,
          });
        }
      }

      for (const [changeKey, val] of Object.entries(expiryMap)) {
        if (changeKey in pendingChanges) continue;
        const [targetType, targetValue, permKey] = changeKey.split(":");
        const currentVal = getCurrentValue(permKey);
        if (currentVal !== null) {
          toCreate.push({
            permission_key: permKey,
            target_type: targetType,
            target_value: targetValue,
            granted: currentVal,
            expires_at: val || null,
          });
        }
      }

      if (toCreate.length > 0) {
        await apiCreatePermissionsBulk(toCreate);
      }
      for (const del of toDelete) {
        await apiDeletePermissionsBulk(del.targetType, del.targetValue, [del.permKey]);
      }

      const perms = await apiGetPermissions();
      setPermissions(perms);
      setPendingChanges({});
      setExpiryMap({});
    } catch (err) {
      alert("Failed to save permissions: " + (err.message || "Server error"));
    }
    setSaving(false);
  };

  const handleClearAll = async () => {
    if (selectedTargets.length === 0) return;
    const label = selectedTargets.length === 1
      ? `this ${mode === "role" ? "role" : "user"}`
      : `these ${selectedTargets.length} ${mode === "role" ? "roles" : "users"}`;
    if (!window.confirm(`Remove all permissions for ${label}? This will reset to default behavior.`)) return;
    setSaving(true);
    try {
      for (const target of selectedTargets) {
        await apiDeletePermissionsBulk(mode, target);
      }
      const perms = await apiGetPermissions();
      setPermissions(perms);
      setPendingChanges({});
      setExpiryMap({});
    } catch (err) {
      alert("Failed to clear: " + (err.message || "Server error"));
    }
    setSaving(false);
  };

  const targetPermCount = useMemo(() => {
    if (selectedTargets.length === 0) return 0;
    const now = new Date();
    return permissions.filter(p => p.target_type === mode && selectedTargets.includes(p.target_value) && (!p.expires_at || new Date(p.expires_at) >= now)).length;
  }, [permissions, mode, selectedTargets]);

  if (!loaded) return <div className="text-center py-10 text-slate-500"><Loader2 size={24} className="animate-spin mx-auto mb-2" />Loading permissions...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Shield size={20} className="text-amber-500" /> Permissions</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Control what roles and individual users can access. User-level permissions override role-level permissions.</p>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="flex gap-0 mb-3 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button onClick={() => { setMode("role"); setSelectedTargets([]); setPendingChanges({}); setExpiryMap({}); }}
              className={`flex-1 py-2 text-xs font-semibold border-0 cursor-pointer transition-colors ${mode === "role" ? "bg-amber-500 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
              By Role
            </button>
            <button onClick={() => { setMode("user"); setSelectedTargets([]); setPendingChanges({}); setExpiryMap({}); }}
              className={`flex-1 py-2 text-xs font-semibold border-0 cursor-pointer transition-colors ${mode === "user" ? "bg-amber-500 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
              By User
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
            {mode === "role" && STAFF_ROLES.filter(r => r !== "App Admin").map(role => {
              const now = new Date();
              const count = permissions.filter(p => p.target_type === "role" && p.target_value === role && (!p.expires_at || new Date(p.expires_at) >= now)).length;
              const isSelected = selectedTargets.includes(role);
              return (
                <div key={role} onClick={() => toggleTarget(role)}
                  className={`px-3 py-2.5 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700 transition-colors flex justify-between items-center ${isSelected ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <span>{role}</span>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-amber-500 text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"}`}>{count}</span>}
                    {isSelected && <Check size={12} className="text-amber-500" />}
                  </div>
                </div>
              );
            })}
            {mode === "user" && activeUsers.map(u => {
              const now = new Date();
              const count = permissions.filter(p => p.target_type === "user" && p.target_value === u.id.toString() && (!p.expires_at || new Date(p.expires_at) >= now)).length;
              const isAdmin = (u.roles || [u.role]).includes("App Admin");
              const isSelected = selectedTargets.includes(u.id.toString());
              return (
                <div key={u.id} onClick={() => { if (!isAdmin) toggleTarget(u.id.toString()); }}
                  className={`px-3 py-2.5 text-sm border-b border-slate-100 dark:border-slate-700 transition-colors flex justify-between items-center ${isAdmin ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${isSelected ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{(u.roles || [u.role]).join(", ")}{isAdmin ? " (Admin)" : ""}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-amber-500 text-white" : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"}`}>{count}</span>}
                    {isSelected && <Check size={12} className="text-amber-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {selectedTargets.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Shield size={48} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm font-medium">Select a {mode === "role" ? "role" : "user"} to manage permissions</div>
              <div className="text-xs mt-1">Click to select. Click multiple to batch-set permissions across all selected.</div>
            </div>
          )}

          {selectedTargets.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">
                    {selectedTargets.length === 1
                      ? (mode === "role" ? selectedTargets[0] : activeUsers.find(u => u.id.toString() === selectedTargets[0])?.name || "User")
                      : `${selectedTargets.length} ${mode === "role" ? "roles" : "users"} selected`}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedTargets.length === 1
                      ? <>{targetPermCount} permission{targetPermCount !== 1 ? "s" : ""} configured</>
                      : <>Changes will apply to all selected {mode === "role" ? "roles" : "users"}</>}
                    {mode === "user" && <span className="ml-2">· User-level overrides role-level</span>}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {targetPermCount > 0 && (
                    <button onClick={handleClearAll} disabled={saving}
                      className="text-xs px-3 py-1.5 rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer disabled:opacity-50 transition-colors">
                      Clear All
                    </button>
                  )}
                  {hasChanges && (
                    <button onClick={handleSave} disabled={saving}
                      className="text-xs px-4 py-1.5 rounded-md bg-amber-500 text-white font-semibold cursor-pointer disabled:opacity-50 hover:bg-amber-600 transition-colors border-0 flex items-center gap-1.5">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Save Changes
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="flex-1 min-w-[180px] flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 px-3 gap-2 focus-within:ring-1 focus-within:ring-amber-500">
                  <Search size={14} className="text-slate-400 flex-shrink-0" />
                  <input
                    value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Search permissions..."
                    className="w-full py-2 text-xs bg-transparent text-slate-800 dark:text-white focus:outline-none border-0"
                  />
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                  className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_90px_90px_160px] gap-0 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Permission</span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Action</span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Expires</span>
                </div>

                <div className="max-h-[480px] overflow-y-auto">
                  {Object.entries(groupedKeys).map(([cat, keys]) => (
                    <Fragment key={cat}>
                      <div className="px-4 py-2 bg-slate-25 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{cat}</span>
                      </div>
                      {keys.map(pk => {
                        const val = getCurrentValue(pk.key);
                        const expiry = getCurrentExpiry(pk.key);
                        const isExpired = expiry && new Date(expiry) < new Date();
                        const expiryVisible = showExpiry[`${mode}:${selectedTarget}:${pk.key}`] || expiry;
                        return (
                          <div key={pk.key} className="grid grid-cols-[1fr_90px_90px_160px] gap-0 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/50 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <span className="text-xs text-slate-700 dark:text-slate-300">{pk.label}</span>
                            <div className="flex justify-center">
                              {val === true && !isExpired && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Allowed</span>}
                              {val === false && !isExpired && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Denied</span>}
                              {(val === null || isExpired) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">Default</span>}
                            </div>
                            <div className="flex justify-center">
                              <button onClick={() => togglePermission(pk.key)}
                                className="text-[10px] px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                {val === null || isExpired ? "Allow" : val === true ? "Deny" : "Clear"}
                              </button>
                            </div>
                            <div className="flex justify-center items-center gap-1">
                              {expiryVisible ? (
                                <input type="datetime-local" value={expiryMap[`${mode}:${selectedTarget}:${pk.key}`] || expiry || ""}
                                  onChange={e => setExpiry(pk.key, e.target.value)}
                                  className="text-[10px] px-1.5 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-[140px]"
                                />
                              ) : (
                                <button onClick={() => setShowExpiry(p => ({ ...p, [`${mode}:${selectedTarget}:${pk.key}`]: true }))}
                                  className="text-[10px] px-2 py-1 rounded border border-dashed border-slate-300 dark:border-slate-600 bg-transparent text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-400 transition-colors">
                                  + Expiry
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>

              {hasChanges && (
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => { setPendingChanges({}); setExpiryMap({}); }}
                    className="text-xs px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Discard
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="text-xs px-5 py-2 rounded-md bg-amber-500 text-white font-semibold cursor-pointer disabled:opacity-50 hover:bg-amber-600 transition-colors border-0 flex items-center gap-1.5">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Save All Changes
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Custom Report Builder ────────────────────────────────────────────────────
const REPORT_SOURCES = ["cases", "tasks", "deadlines", "contacts", "correspondence", "filings", "documents", "transcripts", "time_entries", "medical_treatments", "expenses", "negotiations"];
const FILTER_OPS = ["equals", "not_equals", "contains", "starts_with", "greater_than", "less_than", "is_empty", "is_not_empty", "date_before", "date_after", "date_between"];

function CustomReportBuilder({ currentUser }) {
  const [reports, setReports] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", source: "cases", columns: "", filters: [], sort_by: "", sort_dir: "ASC", is_public: true });
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!loaded) {
      apiGetCustomReports().then(r => { setReports(r); setLoaded(true); }).catch(() => setLoaded(true));
    }
  }, [loaded]);

  const resetForm = () => { setForm({ name: "", source: "cases", columns: "", filters: [], sort_by: "", sort_dir: "ASC", is_public: true }); setEditingId(null); setShowForm(false); setResult(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = { source: form.source, columns: form.columns.split(",").map(c => c.trim()).filter(Boolean), filters: form.filters, sort_by: form.sort_by, sort_dir: form.sort_dir };
      if (editingId) {
        const updated = await apiUpdateCustomReport(editingId, { name: form.name, config, is_public: form.is_public });
        setReports(prev => prev.map(r => r.id === editingId ? updated : r));
      } else {
        const created = await apiCreateCustomReport({ name: form.name, config, is_public: form.is_public });
        setReports(prev => [...prev, created]);
      }
      resetForm();
    } catch (err) { alert("Save failed: " + err.message); }
    setSaving(false);
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const config = { source: form.source, columns: form.columns.split(",").map(c => c.trim()).filter(Boolean), filters: form.filters, sort_by: form.sort_by, sort_dir: form.sort_dir };
      const r = await apiRunCustomReport(config);
      setResult(r);
    } catch (err) { alert("Run failed: " + err.message); }
    setRunning(false);
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const r = await apiCustomReportAiAssist(aiPrompt);
      if (r.config) {
        setForm(prev => ({
          ...prev,
          name: r.config.name || prev.name,
          source: r.config.source || prev.source,
          columns: (r.config.columns || []).join(", "),
          filters: r.config.filters || [],
          sort_by: r.config.sort_by || "",
          sort_dir: r.config.sort_dir || "ASC",
        }));
        setShowForm(true);
      }
      setAiPrompt("");
    } catch (err) { alert("AI assist failed: " + err.message); }
    setAiLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try { await apiDeleteCustomReport(id); setReports(prev => prev.filter(r => r.id !== id)); } catch (err) { alert("Delete failed: " + err.message); }
  };

  const addFilter = () => setForm(prev => ({ ...prev, filters: [...prev.filters, { field: "", operator: "equals", value: "" }] }));
  const updateFilter = (idx, key, val) => setForm(prev => ({ ...prev, filters: prev.filters.map((f, i) => i === idx ? { ...f, [key]: val } : f) }));
  const removeFilter = (idx) => setForm(prev => ({ ...prev, filters: prev.filters.filter((_, i) => i !== idx) }));

  const exportCsv = () => {
    if (!result) return;
    const cols = result.columns || [];
    const rows = result.rows || [];
    const lines = [cols.join(","), ...rows.map(r => cols.map(c => `"${(String(r[c] || "")).replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${form.name || "report"}.csv`; a.click();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>AI Report Builder</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe the report you want, e.g. 'Show all open cases with their deadlines sorted by SOL date'" style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 8, background: "var(--c-bg)", color: "var(--c-text)" }} onKeyDown={e => e.key === "Enter" && handleAiAssist()} />
            <button onClick={handleAiAssist} disabled={aiLoading} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: aiLoading ? 0.6 : 1 }}>{aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Build with AI</button>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>+ New Report</button>
      </div>

      {showForm && (
        <div style={{ background: "var(--c-bg-s)", border: "1px solid var(--c-border)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Report Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Data Source</label>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }}>
                {REPORT_SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Columns (comma-separated, leave blank for all)</label>
            <input value={form.columns} onChange={e => setForm(p => ({ ...p, columns: e.target.value }))} placeholder="e.g. title, status, client_name, created_at" style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)" }}>Filters</label>
              <button onClick={addFilter} style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>+ Add Filter</button>
            </div>
            {form.filters.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                <input value={f.field} onChange={e => updateFilter(i, "field", e.target.value)} placeholder="Field name" style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)" }} />
                <select value={f.operator} onChange={e => updateFilter(i, "operator", e.target.value)} style={{ padding: "6px 8px", fontSize: 12, border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)" }}>
                  {FILTER_OPS.map(op => <option key={op} value={op}>{op.replace(/_/g, " ")}</option>)}
                </select>
                <input value={f.value} onChange={e => updateFilter(i, "value", e.target.value)} placeholder="Value" style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: "1px solid var(--c-border)", borderRadius: 4, background: "var(--c-bg)", color: "var(--c-text)" }} />
                <button onClick={() => removeFilter(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, padding: "0 4px" }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Sort By</label>
              <input value={form.sort_by} onChange={e => setForm(p => ({ ...p, sort_by: e.target.value }))} placeholder="Column name" style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Direction</label>
              <select value={form.sort_dir} onChange={e => setForm(p => ({ ...p, sort_dir: e.target.value }))} style={{ padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }}>
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <label style={{ fontSize: 12, color: "var(--c-text2)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_public} onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))} /> Public
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleRun} disabled={running} style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", opacity: running ? 0.6 : 1 }}>{running ? "Running..." : "Run Report"}</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", opacity: saving || !form.name.trim() ? 0.6 : 1 }}>{editingId ? "Update" : "Save"} Report</button>
            <button onClick={resetForm} style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, background: "transparent", color: "var(--c-text2)", border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)" }}>{result.count || 0} results</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={exportCsv} style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, background: "#f59e0b", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Export CSV</button>
              <button onClick={() => window.print()} style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, background: "transparent", color: "var(--c-text2)", border: "1px solid var(--c-border)", borderRadius: 4, cursor: "pointer" }}>Print</button>
            </div>
          </div>
          <div style={{ overflow: "auto", maxHeight: 500 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>{(result.columns || []).map(c => <th key={c} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--c-text-h)", borderBottom: "2px solid var(--c-border)", background: "var(--c-bg-s)", whiteSpace: "nowrap" }}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {(result.rows || []).map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--c-bg)" : "var(--c-bg-s)" }}>
                    {(result.columns || []).map(c => <td key={c} style={{ padding: "6px 10px", borderBottom: "1px solid var(--c-border)", color: "var(--c-text)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row[c] != null ? String(row[c]) : ""}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reports.length > 0 && !showForm && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 12 }}>Saved Reports</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {reports.map(r => (
              <div key={r.id} style={{ background: "var(--c-bg-s)", border: "1px solid var(--c-border)", borderRadius: 10, padding: 16, cursor: "pointer" }} onClick={() => { setForm({ name: r.name, source: r.config?.source || "cases", columns: (r.config?.columns || []).join(", "), filters: r.config?.filters || [], sort_by: r.config?.sort_by || "", sort_dir: r.config?.sort_dir || "ASC", is_public: r.isPublic }); setEditingId(r.id); setShowForm(true); setResult(null); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)", marginBottom: 4 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--c-text2)" }}>Source: {(r.config?.source || "").replace(/_/g, " ")} &middot; {r.isPublic ? "Public" : "Private"}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px 6px" }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom AI Agents Builder ─────────────────────────────────────────────────
const MODEL_OPTIONS = [
  { group: "OpenAI", models: [{ id: "gpt-4o", name: "GPT-4o" }, { id: "gpt-4o-mini", name: "GPT-4o Mini" }] },
  { group: "Anthropic", models: [{ id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet" }] },
  { group: "Google", models: [{ id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" }] },
];
const CONTEXT_SOURCES = ["notes", "filings", "documents", "medical_records"];

function CustomAgentsTab({ currentUser, allCases, pinnedCaseIds }) {
  const [agents, setAgents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", system_prompt: "", model: "gpt-4o", context_sources: [], temperature: 0.7, max_tokens: 4000, is_public: true });
  const [saving, setSaving] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [runCaseId, setRunCaseId] = useState("");
  const [runPrompt, setRunPrompt] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [mode, setMode] = useState("run");

  useEffect(() => {
    if (!loaded) {
      apiGetCustomAgents().then(r => { setAgents(r); setLoaded(true); }).catch(() => setLoaded(true));
    }
  }, [loaded]);

  const resetForm = () => { setForm({ name: "", description: "", system_prompt: "", model: "gpt-4o", context_sources: [], temperature: 0.7, max_tokens: 4000, is_public: true }); setEditingId(null); setShowForm(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const updated = await apiUpdateCustomAgent(editingId, form);
        setAgents(prev => prev.map(a => a.id === editingId ? updated : a));
      } else {
        const created = await apiCreateCustomAgent(form);
        setAgents(prev => [...prev, created]);
      }
      resetForm();
    } catch (err) { alert("Save failed: " + err.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this agent?")) return;
    try { await apiDeleteCustomAgent(id); setAgents(prev => prev.filter(a => a.id !== id)); if (activeAgent?.id === id) setActiveAgent(null); } catch (err) { alert("Delete failed: " + err.message); }
  };

  const handleRun = async () => {
    if (!runPrompt.trim()) return;
    setRunLoading(true); setRunResult(null);
    try {
      const r = await apiRunCustomAgent(activeAgent.id, { prompt: runPrompt, caseId: runCaseId ? Number(runCaseId) : undefined });
      setRunResult(r.result || r.response);
    } catch (err) { alert("Run failed: " + err.message); }
    setRunLoading(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput(""); setChatLoading(true);
    try {
      const r = await apiChatCustomAgent(activeAgent.id, { messages: [...chatMessages, userMsg], caseId: runCaseId ? Number(runCaseId) : undefined });
      setChatMessages(prev => [...prev, { role: "assistant", content: r.result || r.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Error: " + err.message }]);
    }
    setChatLoading(false);
  };

  const handleUploadInstructions = async (agentId, file) => {
    try {
      const r = await apiUploadAgentInstructions(agentId, file);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, instructionFile: r.filename } : a));
    } catch (err) { alert("Upload failed: " + err.message); }
  };

  const activeCases = allCases.filter(c => c.status !== "Closed");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--c-text2)" }}>Build custom AI agents with specific instructions, models, and case context.</div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}>+ New Agent</button>
      </div>

      {showForm && (
        <div style={{ background: "var(--c-bg-s)", border: "1px solid var(--c-border)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Agent Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Model</label>
              <select value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }}>
                {MODEL_OPTIONS.map(g => <optgroup key={g.group} label={g.group}>{g.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>System Prompt</label>
            <textarea value={form.system_prompt} onChange={e => setForm(p => ({ ...p, system_prompt: e.target.value }))} rows={4} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)", resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Context Sources</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CONTEXT_SOURCES.map(s => (
                  <label key={s} style={{ fontSize: 11, color: "var(--c-text)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.context_sources.includes(s)} onChange={e => setForm(p => ({ ...p, context_sources: e.target.checked ? [...p.context_sources, s] : p.context_sources.filter(x => x !== s) }))} /> {s.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Temperature ({form.temperature})</label>
              <input type="range" min="0" max="1" step="0.1" value={form.temperature} onChange={e => setForm(p => ({ ...p, temperature: parseFloat(e.target.value) }))} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Max Tokens</label>
              <input type="number" value={form.max_tokens} onChange={e => setForm(p => ({ ...p, max_tokens: parseInt(e.target.value) || 4000 }))} style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", opacity: saving || !form.name.trim() ? 0.6 : 1 }}>{editingId ? "Update" : "Create"} Agent</button>
            <button onClick={resetForm} style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, background: "transparent", color: "var(--c-text2)", border: "1px solid var(--c-border)", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            <label style={{ fontSize: 12, color: "var(--c-text2)", display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_public} onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))} /> Public
            </label>
          </div>
        </div>
      )}

      {!activeAgent && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {agents.map(a => (
            <div key={a.id} style={{ background: "var(--c-bg-s)", border: "1px solid var(--c-border)", borderRadius: 10, padding: 16, cursor: "pointer", transition: "border-color 0.15s" }} onClick={() => { setActiveAgent(a); setMode("run"); setRunResult(null); setChatMessages([]); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={18} style={{ color: "#6366f1" }} /></div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text-h)" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "#6366f1" }}>{a.model}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); setForm({ name: a.name, description: a.description || "", system_prompt: a.systemPrompt || "", model: a.model, context_sources: a.contextSources || [], temperature: a.temperature || 0.7, max_tokens: a.maxTokens || 4000, is_public: a.isPublic }); setEditingId(a.id); setShowForm(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-text2)", padding: "2px 4px" }}><Pencil size={13} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "2px 4px" }}><Trash2 size={13} /></button>
                </div>
              </div>
              {a.description && <div style={{ fontSize: 12, color: "var(--c-text2)", lineHeight: 1.5 }}>{a.description}</div>}
            </div>
          ))}
          {agents.length === 0 && loaded && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "var(--c-text2)" }}>
              <Bot size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>No custom agents yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Create your first custom AI agent to get started.</div>
            </div>
          )}
        </div>
      )}

      {activeAgent && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => { setActiveAgent(null); setRunResult(null); setChatMessages([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-text2)", fontSize: 18, padding: "2px 6px" }}>&larr;</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={18} style={{ color: "#6366f1" }} /></div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--c-text-h)" }}>{activeAgent.name}</div>
                <div style={{ fontSize: 11, color: "#6366f1" }}>{activeAgent.model}</div>
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <button onClick={() => setMode("run")} style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, background: mode === "run" ? "#6366f1" : "transparent", color: mode === "run" ? "#fff" : "var(--c-text2)", border: "1px solid var(--c-border)", borderRadius: 4, cursor: "pointer" }}>Run</button>
              <button onClick={() => setMode("chat")} style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, background: mode === "chat" ? "#6366f1" : "transparent", color: mode === "chat" ? "#fff" : "var(--c-text2)", border: "1px solid var(--c-border)", borderRadius: 4, cursor: "pointer" }}>Chat</button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Case Context (optional)</label>
            <select value={runCaseId} onChange={e => setRunCaseId(e.target.value)} style={{ width: "100%", maxWidth: 400, padding: "7px 10px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 6, background: "var(--c-bg)", color: "var(--c-text)" }}>
              <option value="">No case selected</option>
              {activeCases.map(c => <option key={c.id} value={c.id}>{c.title} — {c.clientName}</option>)}
            </select>
          </div>

          {mode === "run" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={runPrompt} onChange={e => setRunPrompt(e.target.value)} placeholder="Enter your prompt..." style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 8, background: "var(--c-bg)", color: "var(--c-text)" }} onKeyDown={e => e.key === "Enter" && handleRun()} />
                <button onClick={handleRun} disabled={runLoading} style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", opacity: runLoading ? 0.6 : 1 }}>{runLoading ? "Running..." : "Run"}</button>
              </div>
              {runResult && (
                <div style={{ background: "var(--c-bg-s)", border: "1px solid var(--c-border)", borderRadius: 10, padding: 20 }}>
                  <pre style={{ fontSize: 13, color: "var(--c-text)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7, margin: 0, fontFamily: "inherit" }}>{runResult}</pre>
                </div>
              )}
            </div>
          )}

          {mode === "chat" && (
            <div>
              <div style={{ background: "var(--c-bg-s)", border: "1px solid var(--c-border)", borderRadius: 10, padding: 16, minHeight: 300, maxHeight: 500, overflow: "auto", marginBottom: 12 }}>
                {chatMessages.length === 0 && <div style={{ color: "var(--c-text2)", fontSize: 13, textAlign: "center", padding: 40 }}>Start a conversation with {activeAgent.name}</div>}
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 10, background: m.role === "user" ? "#6366f1" : "var(--c-bg)", color: m.role === "user" ? "#fff" : "var(--c-text)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</div>
                  </div>
                ))}
                {chatLoading && <div style={{ display: "flex", gap: 4, padding: 8 }}><Loader2 size={16} className="animate-spin" style={{ color: "#6366f1" }} /> <span style={{ fontSize: 12, color: "var(--c-text2)" }}>Thinking...</span></div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: "1px solid var(--c-border)", borderRadius: 8, background: "var(--c-bg)", color: "var(--c-text)" }} onKeyDown={e => e.key === "Enter" && !chatLoading && handleChat()} />
                <button onClick={handleChat} disabled={chatLoading} style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Send</button>
              </div>
            </div>
          )}

          {activeAgent.instructionFile && (
            <div style={{ marginTop: 16, fontSize: 12, color: "var(--c-text2)", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={14} /> Instruction file: {activeAgent.instructionFile}
              <button onClick={async () => { try { await apiClearAgentInstructions(activeAgent.id); setAgents(prev => prev.map(a => a.id === activeAgent.id ? { ...a, instructionFile: null } : a)); setActiveAgent(prev => ({ ...prev, instructionFile: null })); } catch {} }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 11 }}>Remove</button>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text2)", display: "block", marginBottom: 4 }}>Upload Instructions File</label>
            <input type="file" accept=".txt,.md,.pdf,.docx" onChange={e => { if (e.target.files[0]) handleUploadInstructions(activeAgent.id, e.target.files[0]); }} style={{ fontSize: 12 }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports View ─────────────────────────────────────────────────────────────


export default CustomizationView;
export { CustomReportBuilder, CustomAgentsTab };
