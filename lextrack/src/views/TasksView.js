/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import { CheckSquare, Plus, Search, ChevronDown, ChevronUp, Menu, Filter, X, Calendar, Clock, AlertTriangle } from "lucide-react";
import { apiCreateTask, apiUpdateTask, apiCompleteTask } from "../api.js";
import {
  fmt, daysUntil, urgencyColor, Badge, getUserById, Avatar, isDarkMode,
  hasRole, isAppAdmin, today, addDays,
  PRIORITY_RANK, RANK_PRIORITY, getEffectivePriority,
  SortTh, Toggle, CaseSearchField, EscalateBox, StaffSearchField, USERS,
  PinnedSectionHeader,
} from "../shared.js";
function TasksView({ tasks, onAddTask, allCases, currentUser, onCompleteTask, onUpdateTask, onMenuToggle, pinnedCaseIds }) {
  const [filter, setFilter] = useState("Open");
  const [showForm, setShowForm] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [caseDropOpen, setCaseDropOpen] = useState(false);
  const [sortCol, setSortCol] = useState("due");
  const [sortDir, setSortDir] = useState("asc");
  const [expandedTask, setExpandedTask] = useState(null);

  const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } };

  const sortedCases = useMemo(() => [...allCases].filter(c => c.status === "Active").sort((a, b) => (a.clientName || a.title || "").localeCompare(b.clientName || b.title || "")), [allCases]);
  const filteredCases = useMemo(() => { const q = caseSearch.toLowerCase(); return q ? sortedCases.filter(c => (c.clientName || "").toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q) || (c.caseNum || "").toLowerCase().includes(q)) : sortedCases; }, [sortedCases, caseSearch]);
  const blank = useMemo(() => ({ caseId: 0, title: "", assigned: currentUser.id, due: addDays(today, 7), priority: "Low", autoEscalate: true, status: "Not Started", notes: "", recurring: false, recurringDays: 30, escalateMediumDays: 30, escalateHighDays: 14, escalateUrgentDays: 7 }), [currentUser.id]);
  const [newTask, setNewTask] = useState({ ...blank });

  const filtered = useMemo(() => {
    let list = tasks.filter(t => t.assigned === currentUser.id).filter(t => {
      if (filter === "Open")     return t.status !== "Completed";
      if (filter === "Overdue")  return t.status !== "Completed" && daysUntil(t.due) < 0;
      if (filter === "Urgent")   return ["Urgent", "High"].includes(getEffectivePriority(t)) && t.status !== "Completed";
      if (filter === "Recurring") return t.recurring;
      return true;
    });
    list.sort((a, b) => {
      let av = "", bv = "";
      if (sortCol === "due") { av = a.due || "9999"; bv = b.due || "9999"; }
      else if (sortCol === "title") { av = a.title || ""; bv = b.title || ""; }
      else if (sortCol === "priority") { av = String(PRIORITY_RANK[getEffectivePriority(a)] ?? 0); bv = String(PRIORITY_RANK[getEffectivePriority(b)] ?? 0); }
      else if (sortCol === "case") { av = allCases.find(c => c.id === a.caseId)?.title || ""; bv = allCases.find(c => c.id === b.caseId)?.title || ""; }
      else if (sortCol === "assigned") { av = getUserById(a.assigned)?.name || ""; bv = getUserById(b.assigned)?.name || ""; }
      return (sortDir === "asc" ? 1 : -1) * av.localeCompare(bv);
    });
    return list;
  }, [tasks, filter, sortCol, sortDir, currentUser.id, allCases]);

  return (
    <>
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Tasks</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">{tasks.filter(t => t.assigned === currentUser.id && t.status !== "Completed").length} open · {tasks.filter(t => t.assigned === currentUser.id && t.recurring).length} recurring · {tasks.filter(t => t.assigned === currentUser.id && t.status !== "Completed" && daysUntil(t.due) < 0).length} overdue</p>
          </div>
        </div>
        <button className="!px-4 !py-2 !text-xs !font-medium !text-white !bg-slate-900 dark:!bg-slate-800 hover:!bg-slate-800 dark:hover:!bg-slate-700 !rounded-lg !transition-colors !border-none !cursor-pointer !shadow-sm" onClick={() => setShowForm(!showForm)}><Plus size={14} className="inline mr-1" />New Task</button>
      </div>
      <div className="content">
        <div className="tabs">
          {["All", "Open", "Urgent", "Overdue", "Recurring"].map(f => <div key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</div>)}
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header"><div className="card-title">New Task</div></div>
            <div style={{ padding: 20 }}>
              <div className="form-group"><label>Task Title</label><input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Describe the task…" /></div>
              <div className="form-group">
                <label>Case</label>
                <div style={{ position: "relative" }}>
                  {newTask.caseId && !caseDropOpen ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #cbd5e1", borderRadius: 6, padding: "7px 10px", background: "var(--c-bg)", cursor: "default" }}>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--c-text)" }}>{sortedCases.find(c => c.id === newTask.caseId)?.clientName || sortedCases.find(c => c.id === newTask.caseId)?.title || "Unknown"}{sortedCases.find(c => c.id === newTask.caseId)?.caseNum ? <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{sortedCases.find(c => c.id === newTask.caseId)?.caseNum}</span> : null}</span>
                      <button type="button" style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }} onClick={() => { setNewTask(p => ({ ...p, caseId: 0 })); setCaseSearch(""); setCaseDropOpen(true); }}>×</button>
                    </div>
                  ) : (
                    <div onBlur={e => { setTimeout(() => { if (!e.currentTarget.contains(document.activeElement)) setCaseDropOpen(false); }, 150); }} tabIndex={-1} style={{ outline: "none" }}>
                      <input
                        autoFocus={caseDropOpen}
                        placeholder="Search by style or case number…"
                        value={caseSearch}
                        onChange={e => { setCaseSearch(e.target.value); setCaseDropOpen(true); }}
                        onFocus={() => setCaseDropOpen(true)}
                        autoComplete="off"
                      />
                      {caseDropOpen && (() => {
                        const tPIds = new Set(pinnedCaseIds);
                        const tPinned = filteredCases.filter(c => tPIds.has(c.id));
                        const tOthers = filteredCases.filter(c => !tPIds.has(c.id));
                        return (
                        <div style={{ position: "absolute", zIndex: 200, left: 0, right: 0, maxHeight: 260, overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: 6, background: "var(--c-card)", boxShadow: "0 6px 20px rgba(0,0,0,0.18)", marginTop: 2 }}>
                          {filteredCases.length === 0 && <div style={{ padding: "10px 12px", fontSize: 12, color: "#64748b" }}>No matches</div>}
                          {tPinned.length > 0 && <PinnedSectionHeader />}
                          {tPinned.map(c => (
                            <div key={c.id} tabIndex={0} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setNewTask(p => ({ ...p, caseId: c.id })); setCaseSearch(""); setCaseDropOpen(false); }} onClick={e => { e.preventDefault(); e.stopPropagation(); setNewTask(p => ({ ...p, caseId: c.id })); setCaseSearch(""); setCaseDropOpen(false); }} style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <span style={{ color: "var(--c-text)", fontWeight: 500 }}>{c.clientName || c.title}</span>
                              {c.caseNum && <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", flexShrink: 0, marginLeft: 8 }}>{c.caseNum}</span>}
                            </div>
                          ))}
                          {tPinned.length > 0 && tOthers.length > 0 && <div style={{ padding: "5px 10px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--c-bg)", borderBottom: "1px solid var(--c-border2)" }}>All Cases</div>}
                          {tOthers.map(c => (
                            <div key={c.id} tabIndex={0} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setNewTask(p => ({ ...p, caseId: c.id })); setCaseSearch(""); setCaseDropOpen(false); }} onClick={e => { e.preventDefault(); e.stopPropagation(); setNewTask(p => ({ ...p, caseId: c.id })); setCaseSearch(""); setCaseDropOpen(false); }} style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <span style={{ color: "var(--c-text)", fontWeight: 500 }}>{c.clientName || c.title}</span>
                              {c.caseNum && <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", flexShrink: 0, marginLeft: 8 }}>{c.caseNum}</span>}
                            </div>
                          ))}
                        </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Assigned To</label>
                  <StaffSearchField value={newTask.assigned} onChange={val => setNewTask(p => ({ ...p, assigned: val }))} placeholder="Search staff…" />
                </div>
                <div className="form-group"><label>Due Date</label><input type="date" value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Base Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
                    {["Urgent", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Status</label>
                  <select value={newTask.status} onChange={e => setNewTask(p => ({ ...p, status: e.target.value }))}>
                    {["Not Started", "In Progress", "Waiting", "Completed"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Recurring toggle */}
              <div className="form-group">
                <div style={{ background: newTask.recurring ? "#f0fdf4" : "var(--c-bg)", border: `1px solid ${newTask.recurring ? "#44bbaa55" : "#e2e8f0"}`, borderRadius: 7, padding: "12px 14px", marginBottom: 8, transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: newTask.recurring ? 12 : 0 }}>
                    <div><div style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600 }}>🔁 Recurring Task</div><div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>A new task is auto-generated when this one is checked off</div></div>
                    <Toggle on={newTask.recurring} onChange={() => setNewTask(p => ({ ...p, recurring: !p.recurring }))} color="#44bbaa" />
                  </div>
                  {newTask.recurring && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, color: "var(--c-text2)", whiteSpace: "nowrap" }}>Repeat every</span>
                      <input type="number" min={1} max={365} value={newTask.recurringDays} onChange={e => setNewTask(p => ({ ...p, recurringDays: Number(e.target.value) }))} style={{ width: 80 }} />
                      <span style={{ fontSize: 13, color: "var(--c-text2)" }}>days</span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>→ Next: {fmt(addDays(newTask.due, newTask.recurringDays))}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-escalate */}
              <div className="form-group">
                <EscalateBox
                  on={newTask.autoEscalate}
                  onChange={() => setNewTask(p => ({ ...p, autoEscalate: !p.autoEscalate }))}
                  basePriority={newTask.priority}
                  mediumDays={newTask.escalateMediumDays}
                  highDays={newTask.escalateHighDays}
                  urgentDays={newTask.escalateUrgentDays}
                  onChangeDays={(field, val) => setNewTask(p => ({
                    ...p,
                    ...(field === "medium" ? { escalateMediumDays: val } : field === "high" ? { escalateHighDays: val } : { escalateUrgentDays: val }),
                  }))}
                />
              </div>

              <div className="form-group"><label>Notes</label><textarea rows={2} value={newTask.notes} onChange={e => setNewTask(p => ({ ...p, notes: e.target.value }))} /></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ background: "#0f172a", color: "#fff", border: "none" }} disabled={!newTask.title || !newTask.caseId} onClick={() => { onAddTask({ ...newTask }); setShowForm(false); setCaseSearch(""); setNewTask({ ...blank }); }}>Add Task</button>
                <button className="btn btn-outline" onClick={() => { setShowForm(false); setCaseSearch(""); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="table-wrap">
            <table className="mobile-cards">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <SortTh col="title" label="Task" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="case" label="Case" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="assigned" label="Assigned" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="due" label="Due" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTh col="priority" label="Priority" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <th>Status</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const days = daysUntil(t.due);
                  const cs = allCases.find(c => c.id === t.caseId);
                  const done = t.status === "Completed";
                  const ep = getEffectivePriority(t);
                  const escalated = t.autoEscalate && ep !== t.priority && !done;
                  const isExpanded = expandedTask === t.id;
                  return (
                    <Fragment key={t.id}>
                      <tr style={{ opacity: done ? 0.5 : 1 }}>
                        <td data-label=""><div className={`checkbox ${done ? "done" : ""}`} onClick={() => onCompleteTask(t.id)}>{done && "✓"}</div></td>
                        <td data-label="Task">
                          <div style={{ color: "var(--c-text)", fontWeight: 600, textDecoration: done ? "line-through" : "none" }}>
                            {t.title}{t.recurring && <span className="rec-badge">🔁 {t.recurringDays}d</span>}{t.isChained && <span className="chain-badge">⛓ auto</span>}
                          </div>
                          {t.notes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.notes}</div>}
                        </td>
                        <td data-label="Case" style={{ fontSize: 12, color: "var(--c-text2)", maxWidth: 200 }}>{cs?.title?.slice(0, 40) || `#${t.caseId}`}<div style={{ fontSize: 10, color: "#64748b" }}>{cs?.caseNum}</div></td>
                        <td data-label="Assigned"><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar userId={t.assigned} size={24} /><span style={{ fontSize: 12, color: "var(--c-text2)" }}>{getUserById(t.assigned)?.name.split(" ")[0]}</span></div></td>
                        <td data-label="Due" style={{ color: urgencyColor(days), fontSize: 13, whiteSpace: "nowrap" }}>{fmt(t.due)}{days < 0 && !done && <div style={{ fontSize: 11, color: "#e05252" }}>{Math.abs(days)}d over</div>}</td>
                        <td data-label="Priority">
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Badge label={ep} />
                            {t.autoEscalate && <span title={escalated ? `Escalated from ${t.priority}` : "Auto-escalate on"} style={{ fontSize: 11, cursor: "help" }}>🔺</span>}
                          </div>
                          {escalated && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>was {t.priority}</div>}
                        </td>
                        <td data-label="Status"><Badge label={done ? "Completed" : t.status} /></td>
                        <td data-label="">
                          <button
                            onClick={() => setExpandedTask(isExpanded ? null : t.id)}
                            style={{ background: "none", border: "none", color: isExpanded ? "#0f172a" : "#64748b", cursor: "pointer", fontSize: 13, padding: "2px 6px", borderRadius: 3, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Edit due date, priority, assignee"
                          >✎</button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${t.id}-edit`} style={{ background: "var(--c-hover)" }}>
                          <td />
                          <td colSpan={7} style={{ paddingBottom: 12, paddingTop: 4 }}>
                            <div className="task-inline-edit">
                              <label style={{ fontSize: 11, color: "#64748b" }}>Due date</label>
                              <input
                                type="date"
                                value={t.due || ""}
                                onChange={e => onUpdateTask(t.id, { due: e.target.value })}
                              />
                              <label style={{ fontSize: 11, color: "#64748b" }}>Priority</label>
                              <select
                                value={t.priority}
                                onChange={e => onUpdateTask(t.id, { priority: e.target.value })}
                              >
                                {["Urgent", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                              </select>
                              <label style={{ fontSize: 11, color: "#64748b" }}>Assigned to</label>
                              <StaffSearchField value={t.assigned || 0} onChange={val => onUpdateTask(t.id, { assigned: val })} placeholder="Search staff…" />
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: 11, marginLeft: 4 }}
                                onClick={() => setExpandedTask(null)}
                              >Done</button>
                            </div>
                            {t.autoEscalate && (
                              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, color: "#64748b" }}>Escalation thresholds:</span>
                                <label style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  Medium ≤
                                  <input type="number" min={1} value={t.escalateMediumDays ?? 30} onChange={e => onUpdateTask(t.id, { escalateMediumDays: parseInt(e.target.value) || 30 })} style={{ width: 40, fontSize: 11, padding: "2px 4px", border: "1px solid #e2e8f0", borderRadius: 3, textAlign: "center" }} />d
                                </label>
                                <label style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  High ≤
                                  <input type="number" min={1} value={t.escalateHighDays ?? 14} onChange={e => onUpdateTask(t.id, { escalateHighDays: parseInt(e.target.value) || 14 })} style={{ width: 40, fontSize: 11, padding: "2px 4px", border: "1px solid #e2e8f0", borderRadius: 3, textAlign: "center" }} />d
                                </label>
                                <label style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  Urgent ≤
                                  <input type="number" min={1} value={t.escalateUrgentDays ?? 7} onChange={e => onUpdateTask(t.id, { escalateUrgentDays: parseInt(e.target.value) || 7 })} style={{ width: 40, fontSize: 11, padding: "2px 4px", border: "1px solid #e2e8f0", borderRadius: 3, textAlign: "center" }} />d
                                </label>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty">No tasks in this view. Add one above.</div>}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Task Flows Builder ──────────────────────────────────────────────────────


export default TasksView;
