import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { BarChart3, Download, Search, Filter, ChevronDown, ChevronUp, Menu, X, Plus, Trash2, Pencil, Check, Eye, Briefcase, Calendar, Clock, AlertTriangle, CheckSquare, Sparkles, Scale, User, CalendarDays, ClipboardList, AlertCircle, BarChart2, CalendarClock, FileText, Lock } from "lucide-react";
import {
  apiGetCaseTasks, apiCreateTask, apiUpdateTask, apiCompleteTask,
  apiGetNotes, apiCreateNote, apiUpdateNote, apiDeleteNote,
  apiGetLinks, apiCreateLink, apiDeleteLink,
  apiGetActivity, apiCreateActivity,
  apiGetDeadlines, apiCreateDeadline, apiUpdateDeadline, apiDeleteDeadline,
  apiDeleteCase, apiUpdateCase,
} from "../api.js";
import {
  fmt, fmtFileSize, daysUntil, urgencyColor, Badge, getUserById, Avatar, isDarkMode, statusBadgeStyle,
  hasRole, isAppAdmin, today, addDays,
  PRIORITY_RANK, RANK_PRIORITY, getEffectivePriority,
  SortTh, CaseSearchField, StaffSearchField, USERS, US_STATES,
} from "../shared.js";
import { CaseDetailOverlay } from "./CasesView.js";
import { CustomReportBuilder } from "./CustomizationView.js";
const REPORT_DEFS = [
  {
    id: "trial_date",
    Icon: Scale, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20",
    title: "Cases by Trial Date",
    desc: "All active cases with a trial date set, sorted soonest first. Includes judge, lead attorney, and stage.",
    params: ["stateJurisdiction"],
  },
  {
    id: "attorney",
    Icon: User, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Cases by Attorney",
    desc: "All cases assigned to a selected attorney as lead or second chair, grouped by status.",
    params: ["attorney"],
  },
  {
    id: "nextCourt",
    Icon: CalendarDays, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20",
    title: "Next Court Date Report",
    desc: "Active cases with a next court date, sorted soonest first. Includes judge and days remaining.",
    params: ["stateJurisdiction"],
  },
  {
    id: "discovery",
    Icon: Search, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20",
    title: "Cases by Upcoming Dates",
    desc: "Cases with SOL or next court date deadlines within the specified window.",
    params: ["window", "stateJurisdiction"],
  },
  {
    id: "task_filter",
    Icon: CheckSquare, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20",
    title: "Cases with Specific Open Task",
    desc: "Select an incomplete task type from the list and see all cases that have that task open.",
    params: ["task", "stateJurisdiction"],
  },
  {
    id: "no_trial",
    Icon: ClipboardList, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20",
    title: "Active Cases Without Trial Date",
    desc: "Cases currently active but with no trial date set — useful for tracking docket gaps.",
    params: ["office"],
  },
  {
    id: "overdue_tasks",
    Icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20",
    title: "Overdue Tasks by Case",
    desc: "All cases that have at least one overdue task, with a breakdown of each overdue item.",
    params: ["stateJurisdiction"],
  },
  {
    id: "workload",
    Icon: BarChart2, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20",
    title: "Attorney Workload Summary",
    desc: "Case counts per attorney broken down by active/closed and stage. Useful for load balancing.",
    params: [],
  },
  {
    id: "upcoming_deadlines",
    Icon: CalendarClock, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-900/20",
    title: "Upcoming Deadlines by Window",
    desc: "All deadlines falling within a chosen time window — 7, 14, 30, 60, or 90 days.",
    params: ["window", "stateJurisdiction"],
  },
  {
    id: "sol_tracker",
    Icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20",
    title: "SOL Tracker",
    desc: "Active cases sorted by statute of limitations date — identify cases approaching SOL deadlines.",
    params: ["stateJurisdiction"],
  },
  {
    id: "case_value_pipeline",
    Icon: FileText, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Case Value Pipeline",
    desc: "Active cases sorted by estimated case value. Shows demand amounts, settlement amounts, and case stage.",
    params: ["stateJurisdiction"],
  },
  {
    id: "settlement_report",
    Icon: Lock, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-700/50",
    title: "Settlement Report",
    desc: "Settled cases with settlement amounts, contingency fees, and time-to-settlement metrics.",
    params: ["stateJurisdiction"],
  },
];
function buildReport(id, allCases, tasks, deadlines, params) {
  const stateFilter = params.stateJurisdiction || null;
  const filteredCases = stateFilter ? allCases.filter(c => c.stateJurisdiction === stateFilter) : allCases;
  const filteredDeadlines = stateFilter ? deadlines.filter(d => {
    const c = allCases.find(x => x.id === d.caseId);
    return c && c.stateJurisdiction === stateFilter;
  }) : deadlines;
  const activeCases = filteredCases.filter(c => c.status === "Active");
  allCases = filteredCases;
  deadlines = filteredDeadlines;
  switch (id) {
    case "trial_date": {
      const rows = activeCases.filter(c => c.trialDate).sort((a, b) => a.trialDate.localeCompare(b.trialDate));
      return {
        columns: ["File Number", "Style", "Trial Date", "Days", "Judge", "Assigned Attorney", "Stage"],
        rows: rows.map(c => [
          c.caseNum || "—",
          c.title,
          fmt(c.trialDate),
          daysUntil(c.trialDate) !== null ? `${daysUntil(c.trialDate)}d` : "—",
          c.judge || "—",
          getUserById(c.assignedAttorney)?.name || "—",
          c.stage || "—",
        ]),
        caseIds: rows.map(c => c.id),
        colorCol: 3,
        colorFn: (val) => urgencyColor(parseInt(val)),
        count: rows.length,
      };
    }
    case "attorney": {
      const uid = params.attorney;
      const rows = allCases.filter(c => c.assignedAttorney === uid || c.secondAttorney === uid).sort((a, b) => (a.status + a.title).localeCompare(b.status + b.title));
      return {
        columns: ["File Number", "Style", "Status", "Stage", "Trial Date", "Role"],
        rows: rows.map(c => [
          c.caseNum || "—",
          c.title,
          c.status,
          c.stage || "—",
          fmt(c.trialDate),
          c.assignedAttorney === uid ? "Lead" : "2nd Chair",
        ]),
        caseIds: rows.map(c => c.id),
        count: rows.length,
      };
    }
    case "nextCourt": {
      const rows = activeCases.filter(c => c.nextCourtDate).sort((a, b) => a.nextCourtDate.localeCompare(b.nextCourtDate));
      return {
        columns: ["File Number", "Style", "Next Court Date", "Days", "Judge", "Assigned Attorney"],
        rows: rows.map(c => [
          c.caseNum || "—",
          c.title,
          fmt(c.nextCourtDate),
          daysUntil(c.nextCourtDate) !== null ? `${daysUntil(c.nextCourtDate)}d` : "—",
          c.judge || "—",
          getUserById(c.assignedAttorney)?.name || "—",
        ]),
        caseIds: rows.map(c => c.id),
        colorCol: 3,
        colorFn: (val) => urgencyColor(parseInt(val)),
        count: rows.length,
      };
    }
    case "discovery": {
      const win = params.window || 90;
      const rows = [];
      activeCases.forEach(c => {
        const fields = [["SOL Deadline", c.statuteOfLimitationsDate], ["Next Court Date", c.nextCourtDate]];
        fields.forEach(([label, date]) => {
          if (!date) return;
          const d = daysUntil(date);
          if (d !== null && d >= 0 && d <= win) {
            rows.push({ c, label, date, d });
          }
        });
      });
      rows.sort((a, b) => a.date.localeCompare(b.date));
      return {
        columns: ["File Number", "Style", "Deadline Type", "Date", "Days", "Assigned Attorney"],
        rows: rows.map(({ c, label, date, d }) => [
          c.caseNum || "—",
          c.title,
          label,
          fmt(date),
          `${d}d`,
          getUserById(c.assignedAttorney)?.name || "—",
        ]),
        caseIds: rows.map(({ c }) => c.id),
        colorCol: 4,
        colorFn: (val) => urgencyColor(parseInt(val)),
        count: rows.length,
      };
    }
    case "task_filter": {
      const taskTitle = params.task;
      if (!taskTitle) return { columns: [], rows: [], count: 0, caseIds: [] };
      const matchingTasks = tasks.filter(t => t.title === taskTitle && t.status !== "Completed");
      const tfCaseIds = [...new Set(matchingTasks.map(t => t.caseId))];
      const tfEntries = tfCaseIds.map(cid => {
        const c = allCases.find(x => x.id === cid);
        const t = matchingTasks.find(x => x.caseId === cid);
        if (!c) return null;
        return { row: [c.caseNum || "—", c.title, c.status, fmt(t?.due), `${daysUntil(t?.due) ?? "—"}d`, getUserById(t?.assigned)?.name || "—", getEffectivePriority(t)], caseId: c.id };
      }).filter(Boolean).sort((a, b) => (a.row[3] || "").localeCompare(b.row[3] || ""));
      return {
        columns: ["File Number", "Style", "Status", "Task Due", "Days", "Assigned To", "Priority"],
        rows: tfEntries.map(e => e.row),
        caseIds: tfEntries.map(e => e.caseId),
        colorCol: 4,
        colorFn: (val) => urgencyColor(parseInt(val)),
        count: tfEntries.length,
      };
    }
    case "no_trial": {
      const rows = activeCases.filter(c => !c.trialDate).sort((a, b) => a.title.localeCompare(b.title));
      return {
        columns: ["File Number", "Style", "Stage", "Arrest Date", "Assigned Attorney", "Case Type"],
        rows: rows.map(c => [
          c.caseNum || "—",
          c.title,
          c.stage || "—",
          fmt(c.accidentDate),
          getUserById(c.assignedAttorney)?.name || "—",
          c.caseType || "—",
        ]),
        caseIds: rows.map(c => c.id),
        count: rows.length,
      };
    }
    case "overdue_tasks": {
      const overdue = tasks.filter(t => t.status !== "Completed" && daysUntil(t.due) < 0);
      const byCaseId = {};
      overdue.forEach(t => { if (!byCaseId[t.caseId]) byCaseId[t.caseId] = []; byCaseId[t.caseId].push(t); });
      const otRows = [];
      const otCaseIds = [];
      Object.entries(byCaseId).sort((a, b) => b[1].length - a[1].length).forEach(([cid, ts]) => {
        const c = allCases.find(x => x.id === Number(cid));
        if (!c) return;
        ts.sort((a, b) => (a.due || "").localeCompare(b.due || "")).forEach(t => {
          otRows.push([c.caseNum || "—", c.title, t.title, fmt(t.due), `${Math.abs(daysUntil(t.due))}d over`, getUserById(t.assigned)?.name || "—", getEffectivePriority(t)]);
          otCaseIds.push(c.id);
        });
      });
      return {
        columns: ["File Number", "Style", "Task", "Was Due", "Overdue By", "Assigned To", "Priority"],
        rows: otRows,
        caseIds: otCaseIds,
        colorCol: 4,
        colorFn: () => "#e05252",
        count: otRows.length,
      };
    }
    case "workload": {
      const rows = USERS.map(u => {
        const lead = allCases.filter(c => c.assignedAttorney === u.id);
        const second = allCases.filter(c => c.secondAttorney === u.id);
        const activeLead = lead.filter(c => c.status === "Active").length;
        const activeSecond = second.filter(c => c.status === "Active").length;
        const trials = lead.filter(c => c.trialDate && daysUntil(c.trialDate) >= 0 && daysUntil(c.trialDate) <= 90).length;
        const openTasks = tasks.filter(t => t.assigned === u.id && t.status !== "Completed").length;
        return [u.name, u.role, String(activeLead), String(activeSecond), String(activeLead + activeSecond), String(trials), String(openTasks)];
      });
      return {
        columns: ["Attorney / Staff", "Role", "Active Lead", "Active 2nd Chair", "Total Active", "Trials (90d)", "Open Tasks"],
        rows,
        count: USERS.length,
      };
    }
    case "upcoming_deadlines": {
      const win = params.window || 30;
      const udEntries = deadlines.filter(d => { const n = daysUntil(d.date); return n !== null && n >= 0 && n <= win; })
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => {
          const c = allCases.find(x => x.id === d.caseId);
          const days = daysUntil(d.date);
          return { row: [c?.caseNum || "—", c?.title?.slice(0, 50) || `#${d.caseId}`, d.title, d.type || "—", fmt(d.date), `${days}d`, getUserById(d.assigned)?.name || "—"], caseId: d.caseId };
        });
      return {
        columns: ["File Number", "Style", "Deadline", "Type", "Date", "Days", "Assigned"],
        rows: udEntries.map(e => e.row),
        caseIds: udEntries.map(e => e.caseId),
        colorCol: 5,
        colorFn: (val) => urgencyColor(parseInt(val)),
        count: udEntries.length,
      };
    }
    case "sol_tracker": {
      const rows = activeCases.filter(c => c.statuteOfLimitationsDate).sort((a, b) => a.statuteOfLimitationsDate.localeCompare(b.statuteOfLimitationsDate));
      return {
        columns: ["File Number", "Style", "SOL Date", "Days Left", "State", "Case Type", "Assigned Attorney"],
        rows: rows.map(c => [c.caseNum || "—", c.title, fmt(c.statuteOfLimitationsDate), daysUntil(c.statuteOfLimitationsDate) !== null ? `${daysUntil(c.statuteOfLimitationsDate)}d` : "—", c.stateJurisdiction || "—", c.caseType || "—", getUserById(c.assignedAttorney)?.name || "—"]),
        caseIds: rows.map(c => c.id),
        colorCol: 3,
        colorFn: (val) => urgencyColor(parseInt(val)),
        count: rows.length,
      };
    }
    case "case_value_pipeline": {
      const rows = activeCases.filter(c => c.caseValueEstimate).sort((a, b) => (Number(b.caseValueEstimate) || 0) - (Number(a.caseValueEstimate) || 0));
      return {
        columns: ["File Number", "Style", "Case Value", "Demand", "Settlement", "Stage", "Assigned Attorney"],
        rows: rows.map(c => [c.caseNum || "—", c.title, c.caseValueEstimate ? `$${Number(c.caseValueEstimate).toLocaleString()}` : "—", c.demandAmount ? `$${Number(c.demandAmount).toLocaleString()}` : "—", c.settlementAmount ? `$${Number(c.settlementAmount).toLocaleString()}` : "—", c.stage || "—", getUserById(c.assignedAttorney)?.name || "—"]),
        caseIds: rows.map(c => c.id),
        count: rows.length,
      };
    }
    case "settlement_report": {
      const rows = allCases.filter(c => c.settlementAmount).sort((a, b) => (b.settlementDate || "").localeCompare(a.settlementDate || ""));
      return {
        columns: ["File Number", "Style", "Settlement Amount", "Contingency %", "Fee Amount", "Settlement Date", "State"],
        rows: rows.map(c => { const fee = c.contingencyFeePct && c.settlementAmount ? `$${(Number(c.settlementAmount) * Number(c.contingencyFeePct) / 100).toLocaleString()}` : "—"; return [c.caseNum || "—", c.title, `$${Number(c.settlementAmount).toLocaleString()}`, c.contingencyFeePct ? `${c.contingencyFeePct}%` : "—", fee, fmt(c.settlementDate), c.stateJurisdiction || "—"]; }),
        caseIds: rows.map(c => c.id),
        count: rows.length,
      };
    }
    default:
      return { columns: [], rows: [], count: 0 };
  }
}

function ReportsView({ allCases, tasks, deadlines, currentUser, onUpdateCase, onCompleteTask, onAddTask, onDeleteCase, caseNotes, setCaseNotes, caseLinks, setCaseLinks, caseActivity, setCaseActivity, onAddDeadline, onUpdateDeadline, onMenuToggle, onOpenAdvocate, onOpenTrialCenter, confirmDelete, openAppDocViewer, openAppFilingViewer, openBlobInViewer, openTranscriptViewer }) {
  const [activeReport, setActiveReport] = useState(null);
  const [params, setParams] = useState({});
  const [generated, setGenerated] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [reportsTab, setReportsTab] = useState("standard");

  const activeTasks = tasks.filter(t => t.status !== "Completed");
  const uniqueTaskTitles = [...new Set(activeTasks.map(t => t.title))].sort();

  const def = REPORT_DEFS.find(r => r.id === activeReport);

  const generate = () => {
    if (!activeReport) return;
    const result = buildReport(activeReport, allCases, tasks, deadlines, params);
    setGenerated({ ...result, reportId: activeReport, params: { ...params }, generatedAt: new Date().toLocaleString(), title: def?.title });
  };

  const handlePrint = () => window.print();

  const handleCSV = () => {
    if (!generated) return;
    const lines = [generated.columns.join(","), ...generated.rows.map(r => r.map(v => `"${(v||"").replace(/"/g,'""')}"`).join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${generated.title?.replace(/\s+/g, "_") || "report"}_${today}.csv`;
    a.click();
  };

  return (
    <>
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Reports</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">Generate and export case reports</p>
          </div>
        </div>
        {generated && reportsTab === "standard" && (
          <div className="topbar-actions flex gap-2">
            <button className="!px-3 !py-2 !text-xs !font-medium !text-slate-600 dark:!text-slate-300 !bg-white dark:!bg-slate-800 !border !border-slate-200 dark:!border-slate-700 !rounded-lg hover:!bg-slate-50 !transition-colors !cursor-pointer" onClick={handleCSV}><Download size={14} className="inline mr-1" />Export CSV</button>
            <button className="!px-3 !py-2 !text-xs !font-medium !text-slate-600 dark:!text-slate-300 !bg-white dark:!bg-slate-800 !border !border-slate-200 dark:!border-slate-700 !rounded-lg hover:!bg-slate-50 !transition-colors !cursor-pointer" onClick={handlePrint}>Print</button>
          </div>
        )}
      </div>
      <div className="content">
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid var(--c-border)" }}>
          <button onClick={() => setReportsTab("standard")} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors bg-transparent border-0 cursor-pointer -mb-[2px] flex items-center gap-1.5 ${reportsTab === "standard" ? "border-b-amber-500 text-amber-700 dark:text-amber-400" : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}><BarChart3 size={15} /> Standard Reports</button>
          <button onClick={() => setReportsTab("custom")} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors bg-transparent border-0 cursor-pointer -mb-[2px] flex items-center gap-1.5 ${reportsTab === "custom" ? "border-b-amber-500 text-amber-700 dark:text-amber-400" : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}><Sparkles size={15} /> Custom Report Builder</button>
        </div>

        {reportsTab === "custom" && <CustomReportBuilder currentUser={currentUser} />}

        {reportsTab === "standard" && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px,100%), 1fr))", gap: 12, marginBottom: 24 }}>
          {REPORT_DEFS.map(r => (
            <div key={r.id} className={`report-card ${activeReport === r.id ? "active" : ""}`}
              onClick={() => { setActiveReport(r.id); setGenerated(null); setParams({}); }}>
              <div className={`w-9 h-9 rounded-lg ${r.bg} flex items-center justify-center mb-3`}><r.Icon className={`w-5 h-5 ${r.color}`} /></div>
              <div className="report-card-title">{r.title}</div>
              <div className="report-card-desc">{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Parameters + Generate */}
        {activeReport && (
          <div className="card" style={{ marginBottom: 20, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, color: "var(--c-text-h)", marginBottom: 4 }} className="flex items-center gap-2">{def && <div className={`w-6 h-6 rounded-md ${def.bg} flex items-center justify-center`}><def.Icon className={`w-3.5 h-3.5 ${def.color}`} /></div>} {def?.title}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{def?.desc}</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginLeft: "auto" }}>
                {def?.params.includes("attorney") && (
                  <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
                    <label>Attorney</label>
                    <StaffSearchField value={params.attorney || 0} onChange={val => setParams(p => ({ ...p, attorney: val }))} placeholder="Search attorneys…" />
                  </div>
                )}
                {def?.params.includes("window") && (
                  <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
                    <label>Time Window</label>
                    <select value={params.window || 30} onChange={e => setParams(p => ({ ...p, window: Number(e.target.value) }))}>
                      {[7, 14, 30, 60, 90, 180].map(n => <option key={n} value={n}>Next {n} days</option>)}
                    </select>
                  </div>
                )}
                {def?.params.includes("task") && (
                  <div className="form-group" style={{ marginBottom: 0, minWidth: 260 }}>
                    <label>Select Open Task</label>
                    <select value={params.task || ""} onChange={e => setParams(p => ({ ...p, task: e.target.value }))}>
                      <option value="">— Choose a task type —</option>
                      {uniqueTaskTitles.map(t => {
                        const count = activeTasks.filter(x => x.title === t).length;
                        return <option key={t} value={t}>{t} ({count} open)</option>;
                      })}
                    </select>
                  </div>
                )}
                {def?.params.includes("stateJurisdiction") && (
                  <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
                    <label>State</label>
                    <select value={params.stateJurisdiction || ""} onChange={e => setParams(p => ({ ...p, stateJurisdiction: e.target.value || null }))}>
                      <option value="">All States</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <button className="btn btn-gold" onClick={generate}
                  disabled={
                    (def?.params.includes("attorney") && !params.attorney) ||
                    (def?.params.includes("task") && !params.task)
                  }>
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report output */}
        {generated && (
          <div className="report-output">
            <div className="report-output-header">
              <div>
                <div className="report-output-title">{generated.title}</div>
                <div className="report-meta">
                  {generated.count} record{generated.count !== 1 ? "s" : ""}
                  {generated.params.attorney ? ` · ${getUserById(generated.params.attorney)?.name}` : ""}
                  {generated.params.window ? ` · Next ${generated.params.window} days` : ""}
                  {generated.params.task ? ` · Task: "${generated.params.task}"` : ""}
                  {generated.params.stateJurisdiction ? ` · State: ${generated.params.stateJurisdiction}` : ""}
                  {" · "}Generated {generated.generatedAt}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={handleCSV}>⬇ CSV</button>
                <button className="btn btn-outline btn-sm" onClick={handlePrint}>🖨 Print</button>
              </div>
            </div>

            {generated.count === 0 ? (
              <div className="empty">No records match this report's criteria.</div>
            ) : (
              <div className="table-wrap">
                <table className="mobile-cards">
                  <thead>
                    <tr>{generated.columns.map((col, i) => <th key={i}>{col}</th>)}</tr>
                  </thead>
                  <tbody>
                    {generated.rows.map((row, ri) => {
                      const caseId = generated.caseIds?.[ri];
                      const clickable = !!caseId;
                      const handleRowClick = clickable ? () => {
                        const c = allCases.find(x => x.id === caseId);
                        if (c) setSelectedCase(c);
                      } : undefined;
                      return (
                      <tr key={ri} onClick={handleRowClick} className={clickable ? "clickable-row" : ""} style={clickable ? { cursor: "pointer" } : undefined}>
                        {row.map((cell, ci) => {
                          const isColored = generated.colorCol === ci && generated.colorFn;
                          const color = isColored ? generated.colorFn(cell) : undefined;
                          const isStatus = generated.columns[ci] === "Status" || generated.columns[ci] === "Role" || generated.columns[ci] === "Stage" || generated.columns[ci] === "Priority" || generated.columns[ci] === "Type";
                          return (
                            <td key={ci} data-label={generated.columns[ci] || ""} style={{ color: color || undefined }}>
                              {isStatus && cell && cell !== "—" ? <Badge label={cell} /> : (
                                <span style={{ fontWeight: ci === 1 ? 600 : 400, color: color || (ci === 1 ? "var(--c-text)" : undefined), fontFamily: ci === 0 ? "monospace" : undefined, fontSize: ci === 0 ? 11 : undefined }}>{cell || "—"}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--c-border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                <strong style={{ color: "#0f172a" }}>{generated.count}</strong> total records
              </div>
              {generated.reportId === "workload" && (() => {
                const totalActive = allCases.filter(c => c.status === "Active").length;
                return <div style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#0f172a" }}>{totalActive}</strong> total active cases across firm</div>;
              })()}
              {generated.reportId === "overdue_tasks" && (() => {
                const caseCount = new Set(generated.rows.map(r => r[0])).size;
                return <div style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#e05252" }}>{caseCount}</strong> cases affected</div>;
              })()}
              {(generated.reportId === "trial_date" || generated.reportId === "discovery" || generated.reportId === "upcoming_deadlines") && (() => {
                const urgent = generated.rows.filter(r => { const v = parseInt(r[generated.colorCol]); return !isNaN(v) && v <= 14; }).length;
                if (urgent === 0) return null;
                return <div style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#e07a30" }}>{urgent}</strong> within 14 days</div>;
              })()}
              <div style={{ marginLeft: "auto", fontSize: 11, color: "#e2e8f0" }}>MattrMindr · {generated.generatedAt} · {currentUser.name}</div>
            </div>
          </div>
        )}
        </>}

      {selectedCase && (() => {
        const caseTasks = tasks.filter(t => t.caseId === selectedCase.id);
        const caseDeadlines = deadlines.filter(d => d.caseId === selectedCase.id);
        const notes = caseNotes[selectedCase.id] || [];
        return (
          <CaseDetailOverlay
            c={selectedCase}
            currentUser={currentUser}
            tasks={caseTasks}
            deadlines={caseDeadlines}
            notes={notes}
            links={caseLinks[selectedCase.id] || []}
            activity={caseActivity[selectedCase.id] || []}
            onClose={() => setSelectedCase(null)}
            onUpdate={onUpdateCase}
            onDeleteCase={(id) => { onDeleteCase(id); setSelectedCase(null); }}
            onCompleteTask={onCompleteTask}
            onAddTask={onAddTask}
            onAddNote={async (note) => { try { const saved = await apiCreateNote(note); setCaseNotes(prev => ({ ...prev, [selectedCase.id]: [saved, ...(prev[selectedCase.id] || [])] })); } catch (err) { alert("Failed to save note: " + err.message); } }}
            onDeleteNote={async (noteId) => { try { await apiDeleteNote(noteId); setCaseNotes(prev => ({ ...prev, [selectedCase.id]: (prev[selectedCase.id] || []).filter(n => n.id !== noteId) })); } catch (err) { alert("Failed to delete note: " + err.message); } }}
            onUpdateNote={async (noteId, data) => { try { const updated = await apiUpdateNote(noteId, data); setCaseNotes(prev => ({ ...prev, [selectedCase.id]: (prev[selectedCase.id] || []).map(n => n.id === noteId ? updated : n) })); } catch (err) { alert("Failed to update note: " + err.message); throw err; } }}
            onAddLink={async (link) => { try { const saved = await apiCreateLink(link); setCaseLinks(prev => ({ ...prev, [selectedCase.id]: [...(prev[selectedCase.id] || []), saved] })); } catch (err) { alert("Failed to save link: " + err.message); } }}
            onDeleteLink={async (linkId) => { try { await apiDeleteLink(linkId); setCaseLinks(prev => ({ ...prev, [selectedCase.id]: (prev[selectedCase.id] || []).filter(l => l.id !== linkId) })); } catch (err) { alert("Failed to delete link: " + err.message); } }}
            onLogActivity={async (entry) => { try { const saved = await apiCreateActivity(entry); setCaseActivity(prev => ({ ...prev, [selectedCase.id]: [saved, ...(prev[selectedCase.id] || [])] })); } catch (err) { console.error("Failed to log activity:", err); } }}
            onRefreshActivity={(caseId, fresh) => setCaseActivity(prev => ({ ...prev, [caseId]: fresh }))}
            onAddDeadline={onAddDeadline}
            onUpdateDeadline={onUpdateDeadline}
            allCases={allCases}
            onSelectCase={(target) => { setSelectedCase(target); }}
            onOpenAdvocate={onOpenAdvocate}
            onOpenTrialCenter={onOpenTrialCenter}
            confirmDelete={confirmDelete}
            openAppDocViewer={openAppDocViewer}
            openAppFilingViewer={openAppFilingViewer}
            openBlobInViewer={openBlobInViewer}
            openTranscriptViewer={openTranscriptViewer}
          />
        );
      })()}
      </div>
    </>
  );
}

// ─── AI Center View ───────────────────────────────────────────────────────────
const TRAINING_CATEGORIES = ["General", "Local Rules", "Office Policy", "Settlement Strategy", "Medical Terminology", "Insurance Practices", "Procedures"];
const OFFICE_ROLES = ["Managing Partner","Senior Partner","Partner","Associate Attorney","App Admin"];


export default ReportsView;
