/* eslint-disable no-undef */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { USERS } from "./firmData.js";
import { apiSendToScribe, apiImportFromScribe, apiSavePreferences, apiGetPinnedCases, apiSetPinnedCases, apiRunCustomWidget, apiParseIntake, apiConflictCheck } from "./api.js";
import { Check, Loader2, Upload, Download, RefreshCw, ChevronDown, ChevronUp, Pin, Search, Sparkles, X, AlertTriangle, Trash2, Plus, ToggleLeft, ToggleRight, Eye, Briefcase } from "lucide-react";


const STAFF_ROLES = ["Managing Partner","Senior Partner","Partner","Associate Attorney","Of Counsel","Trial Attorney","Paralegal","Legal Assistant","Case Manager","Medical Records Coordinator","Intake Specialist","Office Administrator","IT Specialist","Investigator","Trial Coordinator Supervisor","Trial Coordinator","Chief Social Worker","Social Worker","Client Advocate","Administrative Assistant","App Admin"];
const hasRole = (user, role) => (user?.roles || (user?.role ? [user.role] : [])).includes(role);
const isAppAdmin = (user) => hasRole(user, "App Admin");
const AVATAR_PALETTE = ["#C9A84C","#4C7AC9","#4CAE72","#C94C4C","#9B4CC9","#4CC9C9","#C97B4C","#4C9BC9","#7BC94C","#C94C8C","#884CC9","#4CC96A","#C9C94C","#4C6AC9","#C94C6A","#4CAEC9","#6AC94C","#C9844C","#4CC9A8","#5884C9"];
const makeInitials = n => n.trim().split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 3).toUpperCase();
const pickAvatar   = n => AVATAR_PALETTE[n.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PALETTE.length];

const today = new Date().toISOString().split("T")[0];
let _idCounter = Date.now();
const newId = () => ++_idCounter;

const addDays = (dateStr, days) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const fmt = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return "";
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date(today)) / 86400000);
};

const urgencyColor = (days) => {
  if (days === null) return "#64748b";
  if (days < 0) return "#e05252";
  if (days <= 7) return "#e07a30";
  if (days <= 21) return "#4F7393";
  return "#4CAE72";
};

const recordType = () => "Case";

const PRIORITY_RANK = { Low: 0, Medium: 1, High: 2, Urgent: 3 };
const RANK_PRIORITY = ["Low", "Medium", "High", "Urgent"];
const getEffectivePriority = (task) => {
  if (!task.autoEscalate || task.status === "Completed") return task.priority;
  const days = daysUntil(task.due);
  if (days === null) return task.priority;
  const urgentDays = task.escalateUrgentDays ?? 7;
  const highDays = task.escalateHighDays ?? 14;
  const mediumDays = task.escalateMediumDays ?? 30;
  let escalated = task.priority;
  if (days <= urgentDays) escalated = "Urgent";
  else if (days <= highDays) escalated = (escalated === "Low" || escalated === "Medium") ? "High" : escalated;
  else if (days <= mediumDays) escalated = escalated === "Low" ? "Medium" : escalated;
  return RANK_PRIORITY[Math.max(PRIORITY_RANK[task.priority] || 0, PRIORITY_RANK[escalated] || 0)];
};

// Chain-spawn definitions: when a task with this title is completed, automatically
// create the next task. dueDaysFromCompletion is calculated from the completion date.
const TASK_CHAINS = {
  "Initial Client Interview": {
    title: "Send Preservation Letters",
    assignedRole: "caseManager",
    priority: "High",
    dueDaysFromCompletion: 3,
    autoEscalate: true,
    notes: "Auto-generated after Initial Client Interview was completed.",
  },
  "Send Preservation Letters": {
    title: "Order Medical Records",
    assignedRole: "caseManager",
    priority: "High",
    dueDaysFromCompletion: 7,
    autoEscalate: true,
    notes: "Auto-generated after Send Preservation Letters was completed.",
  },
  "Order Medical Records": {
    title: "Review Medical Records",
    assignedRole: "assignedAttorney",
    priority: "High",
    dueDaysFromCompletion: 14,
    autoEscalate: true,
    notes: "Auto-generated after Order Medical Records was completed.",
  },
  "Review Medical Records": {
    title: "Prepare Demand Package",
    assignedRole: "assignedAttorney",
    priority: "High",
    dueDaysFromCompletion: 21,
    autoEscalate: true,
    notes: "Auto-generated after Review Medical Records was completed.",
  },
};

const MULTI_CHAINS = {};

const DUAL_CHAINS = [];

const generateDefaultTasks = (caseObj, userId) => {
  const resolveRole = (role) => role ? (caseObj[role] || userId) : userId;
  const base = [
    { title: "Initial Client Interview",              assignedRole: "assignedAttorney", priority: "Urgent", dueDays: 1,  notes: "Meet with client to discuss accident, injuries, and treatment." },
    { title: "Send Preservation Letters",              assignedRole: "caseManager",        priority: "High",   dueDays: 3,  notes: "Send evidence preservation letters to all relevant parties." },
    { title: "Obtain Police Report",                   assignedRole: "caseManager", priority: "High",   dueDays: 3,  notes: "Request accident/police report from law enforcement." },
    { title: "Identify Insurance Policies",            assignedRole: "caseManager", priority: "High",   dueDays: 5,  notes: "Identify all applicable insurance policies (liability, UM/UIM, MedPay, PIP)." },
    { title: "Check for Conflicts of Interest",        assignedRole: "assignedAttorney", priority: "Urgent", dueDays: 1,  notes: "Run conflict check against existing cases." },
    { title: "Order Medical Records",                  assignedRole: "caseManager",      priority: "High",   dueDays: 7,  notes: "Send medical record requests to all treating providers." },
  ];
  const ids = base.map(() => newId());
  return base.map((t, i) => ({
    id: ids[i],
    caseId: caseObj.id,
    title: t.title,
    assigned: resolveRole(t.assignedRole),
    assignedRole: t.assignedRole || null,
    due: addDays(today, t.dueDays),
    priority: t.priority,
    autoEscalate: true,
    status: "Not Started",
    notes: t.notes || "",
    recurring: t.recurring || false,
    recurringDays: t.recurringDays || null,
    isGenerated: true,
  }));
};

const isDarkMode = () => document.body.classList.contains("dark-body");

const statusBadgeStyle = (status, dark) => {
  const map = {
    Case: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    Matter: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
    Active: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
    Closed: { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
    Pending: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    Disposed: { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
    Transferred: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    Intake: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    Investigation: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
    Treatment: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    "Pre-Litigation Demand": { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    Negotiation: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
    "Litigation Filed": { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
    Discovery: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    Mediation: { bg: "#fdf4ff", color: "#a21caf", border: "#f0abfc" },
    "Trial Preparation": { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    Trial: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
    "Settlement/Verdict": { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    Appeal: { bg: "#fff1f2", color: "#e11d48", border: "#fecdd3" },
    Urgent: { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
    Overdue: { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
    "In Progress": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    "Not Started": { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
    Completed: { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
    Waiting: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    High: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
    Medium: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    Low: { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
    Monitoring: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  };
  const darkMap = {
    Urgent: { bg: "#fca5a5", color: "#1a1a1a", border: "#f87171" },
    Overdue: { bg: "#fca5a5", color: "#1a1a1a", border: "#f87171" },
    High: { bg: "#fdba74", color: "#1a1a1a", border: "#fb923c" },
    Medium: { bg: "#93c5fd", color: "#1a1a1a", border: "#60a5fa" },
    Low: { bg: "#cbd5e1", color: "#1a1a1a", border: "#94a3b8" },
  };
  if (dark && darkMap[status]) return darkMap[status];
  return map[status] || { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" };
};

const Badge = ({ label }) => {
  if (!label) return null;
  const s = statusBadgeStyle(label, isDarkMode());
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap", fontFamily: "'Inter',sans-serif" }}>{label}</span>;
};

const getUserById = (id) => USERS.find(u => u.id === id);

const Avatar = ({ userId, size = 28, hasProfilePicture }) => {
  const u = getUserById(userId);
  if (!u) return null;
  const showPic = hasProfilePicture !== undefined ? hasProfilePicture : u.hasProfilePicture;
  if (showPic) {
    return <img src={`/api/users/${userId}/profile-picture?t=${Date.now()}`} alt={u.name} title={`${u.name} (${u.role})`} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={e => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "flex"); }} />;
  }
  return <div title={`${u.name} (${u.role})`} style={{ width: size, height: size, borderRadius: "50%", background: u.avatar, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>{u.initials}</div>;
};

function ScribeTranscriptButtons({ transcriptId, scribeTranscriptId, scribeStatus, onRefreshed }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(scribeStatus || null);
  const [refreshed, setRefreshed] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await apiSendToScribe(transcriptId);
      setStatus("sent");
    } catch (err) { alert("Send to Scribe failed: " + err.message); }
    setBusy(false);
  };

  const importResult = async () => {
    setBusy(true);
    try {
      await apiImportFromScribe(transcriptId);
      setStatus("completed");
    } catch (err) { alert("Import failed: " + err.message); }
    setBusy(false);
  };

  const refreshFromScribe = async () => {
    setBusy(true);
    try {
      const result = await apiImportFromScribe(transcriptId);
      if (result.status === "completed") {
        setRefreshed(true);
        setTimeout(() => setRefreshed(false), 3000);
        if (onRefreshed) onRefreshed();
      } else {
        alert(`Transcript is not ready yet (status: ${result.status || "unknown"}). Try again later.`);
      }
    } catch (err) { alert("Refresh failed: " + err.message); }
    setBusy(false);
  };

  const btnS = { fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "1px solid #a78bfa", color: "#7c3aed", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 };

  if (status === "completed" || (scribeTranscriptId && status !== "sent")) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: "#7c3aed", display: "flex", alignItems: "center", gap: 3 }}><Check size={10} /> Scribe</span>
        <button disabled={busy} onClick={refreshFromScribe} style={btnS}>
          {busy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          {refreshed ? "Updated!" : "Refresh"}
        </button>
      </div>
    );
  }
  if (status === "sent" || scribeTranscriptId) return <button disabled={busy} onClick={importResult} style={btnS}>{busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} Import from Scribe</button>;
  return <button disabled={busy} onClick={send} style={btnS}>{busy ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />} Send to Scribe</button>;
}

const SortTh = ({ col, label, sortCol, sortDir, onSort, style, className }) => (
  <th className={className} style={{ cursor: "pointer", userSelect: "none", ...style }} onClick={() => onSort(col)}>
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {label}
      <span style={{ color: sortCol === col ? "#0f172a" : "#cbd5e1", fontSize: 10 }}>
        {sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </span>
  </th>
);

const DragDropZone = ({ onFileSelect, accept, multiple, children, style: extraStyle }) => {
  const dragCounter = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const handleDragEnter = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) setDragActive(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) { dragCounter.current = 0; setDragActive(false); }
  }, []);
  const handleDragOver = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (accept) {
      const exts = accept.split(",").map(a => a.trim().toLowerCase());
      const filtered = Array.from(files).filter(f => {
        const name = f.name.toLowerCase();
        const type = f.type.toLowerCase();
        return exts.some(ext => ext.startsWith(".") ? name.endsWith(ext) : type.match(ext.replace("*", ".*")));
      });
      if (filtered.length === 0) return;
      onFileSelect(multiple ? filtered : [filtered[0]]);
    } else {
      onFileSelect(multiple ? Array.from(files) : [files[0]]);
    }
  }, [onFileSelect, accept, multiple]);
  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        border: dragActive ? "2px dashed #6366f1" : "2px dashed #e2e8f0",
        borderRadius: 10,
        padding: 16,
        background: dragActive ? "rgba(99,102,241,0.05)" : "transparent",
        transition: "all 0.2s ease",
        position: "relative",
        ...extraStyle,
      }}
    >
      {children}
      {dragActive && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 10,
          background: "rgba(99,102,241,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", background: "rgba(255,255,255,0.9)", padding: "6px 16px", borderRadius: 8 }}>
            Drop files here
          </div>
        </div>
      )}
    </div>
  );
};

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"];

const COURT_RULES = [
  { id: 1, name: "SOL — Personal Injury (2 years)", days: 730, from: "Accident Date", rule: "Varies by state" },
  { id: 2, name: "SOL — Medical Malpractice (2 years)", days: 730, from: "Date of Injury/Discovery", rule: "Varies by state" },
  { id: 3, name: "SOL — Wrongful Death (2 years)", days: 730, from: "Date of Death", rule: "Varies by state" },
  { id: 4, name: "SOL — Product Liability (2 years)", days: 730, from: "Date of Injury", rule: "Varies by state" },
  { id: 5, name: "Discovery Response", days: 30, from: "Request Served", rule: "FRCP 33/34" },
  { id: 6, name: "Summary Judgment Response", days: 21, from: "Motion Filed", rule: "FRCP 56" },
  { id: 7, name: "Expert Disclosure Deadline", days: -90, from: "Trial Date", rule: "FRCP 26(a)(2)" },
  { id: 8, name: "Rebuttal Expert Disclosure", days: -60, from: "Trial Date", rule: "FRCP 26(a)(2)" },
  { id: 9, name: "Mediation Deadline", days: -60, from: "Trial Date", rule: "Local Rules" },
  { id: 10, name: "Pretrial Disclosures", days: -30, from: "Trial Date", rule: "FRCP 26(a)(3)" },
  { id: 11, name: "Motion in Limine Deadline", days: -14, from: "Trial Date", rule: "Local Rules" },
  { id: 12, name: "Notice of Appeal", days: 30, from: "Judgment Date", rule: "FRAP 4(a)" },
  { id: 13, name: "Daubert/Expert Challenge", days: -30, from: "Trial Date", rule: "FRE 702" },
  { id: 14, name: "IME Scheduling", days: 30, from: "Request Received", rule: "FRCP 35" },
];


// ─── TimePromptModal ──────────────────────────────────────────────────────────
const ATTY_PARA_ROLES = ["Managing Partner", "Senior Partner", "Partner", "Associate Attorney", "Of Counsel", "Paralegal"];
const isAttyPara  = (u) => ATTY_PARA_ROLES.some(r => hasRole(u, r));
const isSupportStaff = (u) => u && !isAttyPara(u);

function Toggle({ on, onChange, color = "#f59e0b" }) {
  return (
    <div className="toggle" style={{ background: on ? color : "#e2e8f0" }} onClick={onChange}>
      <div className="toggle-knob" style={{ left: on ? 20 : 2 }} />
    </div>
  );
}

// ─── Reusable AI Panel Component ────────────────────────────────────────────

function AiPanel({ title, result, loading, error, onRun, onClose, actions, children }) {
  return (
    <div className="!bg-amber-50/50 dark:!bg-amber-900/10 !border !border-amber-200 dark:!border-amber-800/50 !rounded-xl !p-5 !mt-3 !text-sm" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex justify-between items-center" style={{ marginBottom: loading || result || error || children ? 12 : 0 }}>
        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Sparkles size={13} className="text-amber-600 dark:text-amber-400" /></div>
          {title}
        </div>
        <div className="flex gap-2 items-center">
          {result && onRun && <button className="border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 bg-white dark:bg-amber-900/20 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md cursor-pointer transition-colors" style={{ fontSize: 11, padding: "3px 10px", fontWeight: 500 }} onClick={onRun}>↻ Retry</button>}
          {actions}
          {onClose && <button className="bg-transparent border-none cursor-pointer text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-0 transition-colors" onClick={onClose}>✕</button>}
        </div>
      </div>
      {loading && (
        <div className="flex items-center gap-2.5 py-4 text-slate-500 dark:text-slate-400">
          <div className="w-4 h-4 border-2 border-amber-200 dark:border-amber-800 border-t-amber-500 rounded-full" style={{ animation: "spin 0.8s linear infinite" }} />
          <span className="text-xs font-medium">AI is analyzing...</span>
        </div>
      )}
      {error && <div className="text-red-600 dark:text-red-400 text-xs py-2 px-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">{error}</div>}
      {result && (
        <div className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[400px] overflow-y-auto py-2 px-1">
          {result.split("\n").map((line, i) => {
            if (line.startsWith("## ")) return <div key={i} className="font-bold text-sm mt-3 mb-1 text-slate-900 dark:text-slate-100">{line.replace(/^## /, "")}</div>;
            if (line.startsWith("### ")) return <div key={i} className="font-semibold text-sm mt-2.5 mb-0.5 text-slate-900 dark:text-slate-100">{line.replace(/^### /, "")}</div>;
            if (line.startsWith("**") && line.endsWith("**")) return <div key={i} className="font-bold mt-2 mb-0.5">{line.replace(/\*\*/g, "")}</div>;
            if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} style={{ paddingLeft: 12, position: "relative" }}><span style={{ position: "absolute", left: 0 }}>•</span>{line.replace(/^[-*] /, "").replace(/\*\*(.+?)\*\*/g, "$1")}</div>;
            if (line.match(/^\d+\.\s/)) return <div key={i} style={{ paddingLeft: 4 }}>{line.replace(/\*\*(.+?)\*\*/g, "$1")}</div>;
            if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
            return <div key={i}>{line.replace(/\*\*(.+?)\*\*/g, "$1")}</div>;
          })}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── New Case Modal ──────────────────────────────────────────────────────────

function EscalateBox({ on, onChange, basePriority, mediumDays, highDays, urgentDays, onChangeDays }) {
  const md = mediumDays ?? 30;
  const hd = highDays ?? 14;
  const ud = urgentDays ?? 7;
  return (
    <div style={{ background: on ? "#f1f5f9" : "var(--c-bg)", border: `1px solid ${on ? "#f59e0b22" : "#e2e8f0"}`, borderRadius: 7, padding: "12px 14px", transition: "all 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: on ? 10 : 0 }}>
        <div><div style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600 }}>🔺 Auto-Escalate Priority</div><div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Priority rises automatically as the due date approaches</div></div>
        <Toggle on={on} onChange={onChange} />
      </div>
      {on && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: `${md}+ days`, result: basePriority, note: "Base", field: null },
            { label: `${ud + 1}–${md} days`, result: basePriority === "Low" ? "Medium" : basePriority, note: "↑ if Low", field: "medium", days: md },
            { label: `${ud + 1}–${hd} days`, result: (basePriority === "Low" || basePriority === "Medium") ? "High" : basePriority, note: "↑ if <High", field: "high", days: hd },
            { label: `≤${ud} days`, result: "Urgent", note: "Always", field: "urgent", days: ud },
          ].map(({ label, result, note, field, days }) => {
            const s = statusBadgeStyle(result);
            return (
              <div key={label} style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: 5, padding: "7px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{field ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    ≤ <input
                      type="number"
                      min={1}
                      value={days}
                      onChange={e => onChangeDays && onChangeDays(field, parseInt(e.target.value) || 1)}
                      style={{ width: 36, fontSize: 10, padding: "1px 3px", border: "1px solid var(--c-border)", borderRadius: 3, textAlign: "center", background: "var(--c-card)", color: "var(--c-text)" }}
                    /> days
                  </span>
                ) : label}</div>
                <div style={{ background: s.bg, color: "#1e293b", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 3, display: "inline-block" }}>{result}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{note}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Widget System ─────────────────────────────────────────────────
const DASHBOARD_WIDGETS = [
  { id: "stat-active", label: "Active Records", size: "quarter", icon: "📊" },
  { id: "stat-deadlines", label: "Upcoming Deadlines Count", size: "quarter", icon: "📅" },
  { id: "stat-tasks", label: "My Open Tasks Count", size: "quarter", icon: "✅" },
  { id: "stat-trials", label: "Trials in 90 Days Count", size: "quarter", icon: "⚖️" },
  { id: "deadlines", label: "Upcoming Deadlines", size: "half", icon: "📋" },
  { id: "trials", label: "Trials Within 90 Days", size: "half", icon: "🏛️" },
  { id: "tasks", label: "My Tasks", size: "full", icon: "📝" },
  { id: "pinned", label: "Pinned Cases", size: "full", icon: "pin" },
  { id: "recent-activity", label: "Recent Activity", size: "half", icon: "🕐" },
  { id: "overdue", label: "Overdue Tasks", size: "half", icon: "⚠️" },
  { id: "my-time", label: "My Time", size: "half", icon: "⏱️" },
  { id: "ai-triage", label: "AI Case Triage", size: "full", icon: "sparkles" },
  { id: "quick-notes", label: "Quick Notes", size: "half", icon: "📝" },
  { id: "pinned-contacts", label: "Pinned Contacts", size: "half", icon: "👤" },
  { id: "client-comm", label: "Unread Client Communication", size: "half", icon: "💬" },
];
const DEFAULT_LAYOUT = ["stat-active", "stat-deadlines", "stat-tasks", "stat-trials", "deadlines", "trials", "tasks"];
const getDashboardLayout = (prefs) => { try { return prefs?.dashboardLayout || DEFAULT_LAYOUT; } catch { return DEFAULT_LAYOUT; } };
const saveDashboardLayout = (layout) => { apiSavePreferences({ dashboardLayout: layout }).catch(() => {}); };

const PinnedSectionHeader = () => (
  <div style={{ padding: "5px 10px", fontSize: 10, fontWeight: 700, color: "#B67A18", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--c-bg)", borderBottom: "1px solid var(--c-border2)", position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", gap: 4 }}>
    <Pin size={11} className="text-amber-500" /> Pinned Cases
  </div>
);

const CaseDropdownItem = ({ c, onClick, showDetails }) => (
  <div
    onClick={onClick}
    style={{ padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid var(--c-border2)", fontSize: 12 }}
    onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
  >
    <div style={{ fontWeight: 600, color: "var(--c-text)" }}>{c.clientName || c.title}</div>
    <div style={{ fontSize: 11, color: "#64748b" }}>{c.caseNum || "—"}{showDetails && c.trialDate ? ` · Trial: ${new Date(c.trialDate).toLocaleDateString()}` : ""}</div>
  </div>
);

const EMPTY_PINS = [];
function CaseSearchField({ allCases, value, onChange, placeholder, userId, pinnedCaseIds: pinnedIdsProp }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedCase = value ? allCases.find(c => c.id === parseInt(value)) : null;
  const pinnedIds = useMemo(() => pinnedIdsProp || EMPTY_PINS, [pinnedIdsProp]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { pinned, others } = useMemo(() => {
    const active = allCases.filter(c => c.status === "Active");
    const q = search.toLowerCase().trim();
    const matched = q ? active.filter(c =>
      (c.title || "").toLowerCase().includes(q) ||
      (c.caseNum || "").toLowerCase().includes(q) ||
      (c.clientName || "").toLowerCase().includes(q)
    ) : active;
    const sortFn = (a, b) => {
      const aDate = a.trialDate ? new Date(a.trialDate) : null;
      const bDate = b.trialDate ? new Date(b.trialDate) : null;
      if (aDate && bDate) return aDate - bDate;
      if (aDate) return -1;
      if (bDate) return 1;
      return (a.title || "").localeCompare(b.title || "");
    };
    const pinnedSet = new Set(pinnedIds);
    const p = matched.filter(c => pinnedSet.has(c.id)).sort(sortFn);
    const o = matched.filter(c => !pinnedSet.has(c.id)).sort(sortFn).slice(0, 20);
    return { pinned: p, others: o };
  }, [allCases, search, pinnedIds]);

  const handleSelect = (c) => { onChange(String(c.id)); setSearch(""); setOpen(false); };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {selectedCase ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", fontSize: 12 }}>
          <span style={{ flex: 1, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedCase.title || selectedCase.caseNum}</span>
          <button onClick={() => { onChange(""); setSearch(""); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      ) : (
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "Search cases…"}
          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, boxSizing: "border-box" }}
        />
      )}
      {open && !selectedCase && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, maxHeight: 260, overflowY: "auto", background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 6, marginTop: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {pinned.length === 0 && others.length === 0 && <div style={{ padding: "8px 10px", fontSize: 12, color: "#64748b" }}>No cases found</div>}
          {pinned.length > 0 && <PinnedSectionHeader />}
          {pinned.map(c => <CaseDropdownItem key={c.id} c={c} onClick={() => handleSelect(c)} showDetails />)}
          {pinned.length > 0 && others.length > 0 && (
            <div style={{ padding: "5px 10px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--c-bg)", borderBottom: "1px solid var(--c-border2)", position: "sticky", top: pinned.length > 0 ? 24 : 0, zIndex: 1 }}>All Cases</div>
          )}
          {others.map(c => <CaseDropdownItem key={c.id} c={c} onClick={() => handleSelect(c)} showDetails />)}
        </div>
      )}
    </div>
  );
}

function StaffSearchField({ value, onChange, placeholder, userList, showRole }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const allUsers = userList || USERS;
  const users = allUsers.filter(u => !u.deletedAt);
  const selectedUser = value ? allUsers.find(u => u.id === Number(value)) : null;

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const matched = q ? users.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    ) : users;
    return matched.slice(0, 30);
  }, [users, search]);

  const handleSelect = (u) => { onChange(u.id); setSearch(""); setOpen(false); };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {selectedUser ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", fontSize: 12 }}>
          <span style={{ flex: 1, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedUser.name}{showRole !== false && selectedUser.role ? ` (${selectedUser.role})` : ""}</span>
          <button onClick={() => { onChange(0); setSearch(""); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      ) : (
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "Search staff…"}
          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, boxSizing: "border-box" }}
        />
      )}
      {open && !selectedUser && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, maxHeight: 220, overflowY: "auto", background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 6, marginTop: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {filtered.length === 0 && <div style={{ padding: "8px 10px", fontSize: 12, color: "#64748b" }}>No staff found</div>}
          {filtered.map(u => {
            const q = search.toLowerCase();
            const name = u.name || "";
            let nameEl;
            if (q && name.toLowerCase().includes(q)) {
              const idx = name.toLowerCase().indexOf(q);
              nameEl = <>{name.slice(0, idx)}<strong>{name.slice(idx, idx + q.length)}</strong>{name.slice(idx + q.length)}</>;
            } else {
              nameEl = name;
            }
            return (
              <div
                key={u.id}
                onClick={() => handleSelect(u)}
                style={{ padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid var(--c-border2)", fontSize: 12 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontWeight: 500, color: "var(--c-text)" }}>{nameEl}</div>
                {u.role && <div style={{ fontSize: 11, color: "#64748b" }}>{u.role}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function StaffSearchPicker({ staffSearchRef, attyFilter, setAttyFilter, staffInput, setStaffInput, staffFocused, setStaffFocused, staffDisplayValue, staffSuggestions }) {
  const inputRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState(null);
  const darkMode = document.querySelector(".app.dark") !== null;
  useEffect(() => {
    if (!staffFocused) { setDropdownPos(null); return; }
    const el = inputRef.current;
    if (!el) return;
    let raf;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const ddWidth = Math.max(rect.width, 240);
      let left = rect.left;
      if (left + ddWidth > vw - 8) left = Math.max(8, vw - ddWidth - 8);
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow > 200 ? rect.bottom + 2 : rect.top - 262;
      setDropdownPos({ top: Math.max(4, top), left, width: ddWidth });
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [staffFocused]);
  const selectStaff = (id) => { setAttyFilter(id); setStaffInput(""); setStaffFocused(false); inputRef.current?.blur(); };
  const ddBg = darkMode ? "#1C2330" : "#fff";
  const ddBorder = darkMode ? "#27313D" : "#e2e8f0";
  const ddText = darkMode ? "#E6EDF3" : "#1F2428";
  const ddHover = darkMode ? "#27313D" : "#F0F2F4";
  return (
    <div ref={staffSearchRef} style={{ position: "relative", width: 160, flex: "0 0 160px" }}>
      <input
        ref={inputRef}
        style={{ width: "100%", height: 33, padding: "0 10px", paddingRight: attyFilter !== "All" ? 28 : 8, fontSize: 13, boxSizing: "border-box" }}
        placeholder="Search staff..."
        value={staffDisplayValue}
        onChange={e => setStaffInput(e.target.value)}
        onFocus={() => { setStaffInput(""); setStaffFocused(true); }}
        onBlur={() => setTimeout(() => { setStaffFocused(false); setStaffInput(""); }, 200)}
        autoComplete="off"
      />
      {attyFilter !== "All" && !staffFocused && (
        <button
          onMouseDown={e => { e.preventDefault(); setAttyFilter("All"); setStaffInput(""); }}
          style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--c-text2)", padding: "2px 4px", lineHeight: 1 }}
          title="Clear filter"
        >✕</button>
      )}
      {staffFocused && dropdownPos && createPortal(
        <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, maxHeight: 260, overflowY: "auto", background: ddBg, border: `1px solid ${ddBorder}`, borderRadius: 6, boxShadow: "0 6px 24px rgba(0,0,0,0.35)", zIndex: 99999, fontSize: 13 }}>
          <div
            style={{ padding: "8px 12px", cursor: "pointer", color: "#64748b", borderBottom: `1px solid ${ddBorder}` }}
            onMouseDown={e => { e.preventDefault(); selectStaff("All"); }}
          >All Staff</div>
          {staffSuggestions.length > 0 ? staffSuggestions.map(u => {
            const isSelected = String(u.id) === attyFilter;
            const q = staffInput.toLowerCase();
            const name = u.name;
            let nameEl;
            if (q && name.toLowerCase().includes(q)) {
              const idx = name.toLowerCase().indexOf(q);
              nameEl = <>{name.slice(0, idx)}<strong>{name.slice(idx, idx + q.length)}</strong>{name.slice(idx + q.length)}</>;
            } else {
              nameEl = name;
            }
            return (
              <div
                key={u.id}
                style={{ padding: "8px 12px", cursor: "pointer", color: ddText, background: isSelected ? ddHover : "transparent" }}
                onMouseDown={e => { e.preventDefault(); selectStaff(String(u.id)); }}
                onMouseEnter={e => e.currentTarget.style.background = ddHover}
                onMouseLeave={e => e.currentTarget.style.background = isSelected ? ddHover : "transparent"}
              >{nameEl}</div>
            );
          }) : (
            <div style={{ padding: "8px 12px", color: "#64748b" }}>No matches</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function BatchStaffPicker({ staffList, value, onChange, inputValue, onInputChange, focused, onFocusChange, inputRef, placeholder }) {
  const localRef = useRef(null);
  const ref = inputRef || localRef;
  const [dropdownPos, setDropdownPos] = useState(null);
  const darkMode = document.querySelector(".app.dark") !== null;
  useEffect(() => {
    if (!focused) { setDropdownPos(null); return; }
    const el = ref.current;
    if (!el) return;
    let raf;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const ddWidth = Math.max(rect.width, 280);
      let left = rect.left;
      if (left + ddWidth > vw - 8) left = Math.max(8, vw - ddWidth - 8);
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow > 220 ? rect.bottom + 2 : rect.top - 282;
      setDropdownPos({ top: Math.max(4, top), left, width: ddWidth });
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [focused, ref]);
  const selectedUser = staffList.find(u => String(u.id) === String(value));
  const displayValue = focused ? inputValue : (selectedUser ? `${selectedUser.name} — ${(selectedUser.roles || [selectedUser.role]).join(", ")}` : "");
  const q = (inputValue || "").toLowerCase();
  const filtered = q ? staffList.filter(u => u.name.toLowerCase().includes(q) || (u.roles || [u.role]).some(r => r.toLowerCase().includes(q))) : staffList;
  const ddBg = darkMode ? "#1C2330" : "#fff";
  const ddBorder = darkMode ? "#27313D" : "#e2e8f0";
  const ddText = darkMode ? "#E6EDF3" : "#1F2428";
  const ddHover = darkMode ? "#27313D" : "#F0F2F4";
  return (
    <div style={{ position: "relative" }}>
      <input
        ref={ref}
        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${ddBorder}`, background: darkMode ? "#161B22" : "#fff", color: ddText, fontSize: 13, paddingRight: value ? 28 : 10 }}
        placeholder={placeholder || "Search staff..."}
        value={displayValue}
        onChange={e => onInputChange(e.target.value)}
        onFocus={() => { onInputChange(""); onFocusChange(true); }}
        onBlur={() => setTimeout(() => { onFocusChange(false); onInputChange(""); }, 200)}
        autoComplete="off"
      />
      {value && !focused && (
        <button
          onMouseDown={e => { e.preventDefault(); onChange(""); onInputChange(""); }}
          style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--c-text2)", padding: "2px 4px", lineHeight: 1 }}
          title="Clear"
        >✕</button>
      )}
      {focused && dropdownPos && createPortal(
        <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, maxHeight: 280, overflowY: "auto", background: ddBg, border: `1px solid ${ddBorder}`, borderRadius: 6, boxShadow: "0 6px 24px rgba(0,0,0,0.35)", zIndex: 99999, fontSize: 13 }}>
          {filtered.length > 0 ? filtered.map(u => {
            const isSelected = String(u.id) === String(value);
            const name = u.name;
            const roles = (u.roles || [u.role]).join(", ");
            let nameEl;
            if (q && name.toLowerCase().includes(q)) {
              const idx = name.toLowerCase().indexOf(q);
              nameEl = <>{name.slice(0, idx)}<strong>{name.slice(idx, idx + q.length)}</strong>{name.slice(idx + q.length)}</>;
            } else {
              nameEl = name;
            }
            return (
              <div
                key={u.id}
                style={{ padding: "8px 12px", cursor: "pointer", color: ddText, background: isSelected ? ddHover : "transparent" }}
                onMouseDown={e => { e.preventDefault(); onChange(String(u.id)); }}
                onMouseEnter={e => e.currentTarget.style.background = ddHover}
                onMouseLeave={e => e.currentTarget.style.background = isSelected ? ddHover : "transparent"}
              >{nameEl} <span style={{ color: "#64748b", fontSize: 11 }}>— {roles}</span></div>
            );
          }) : (
            <div style={{ padding: "8px 12px", color: "#64748b" }}>No matches</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}


const isAttorney = (user) => hasRole(user, "Managing Partner") || hasRole(user, "Senior Partner") || hasRole(user, "Partner") || hasRole(user, "Associate Attorney") || hasRole(user, "Of Counsel");


export {
  STAFF_ROLES, hasRole, isAppAdmin, AVATAR_PALETTE, makeInitials, pickAvatar,
  today, newId, addDays, fmt, fmtFileSize, daysUntil, urgencyColor, recordType,
  PRIORITY_RANK, RANK_PRIORITY, getEffectivePriority,
  TASK_CHAINS, MULTI_CHAINS, DUAL_CHAINS, generateDefaultTasks,
  isDarkMode, statusBadgeStyle, Badge, getUserById, Avatar,
  ScribeTranscriptButtons, SortTh, DragDropZone,
  US_STATES, COURT_RULES,
  ATTY_PARA_ROLES, isAttyPara, isSupportStaff,
  Toggle, AiPanel, EscalateBox,
  DEFAULT_LAYOUT, getDashboardLayout, saveDashboardLayout,
  PinnedSectionHeader, CaseDropdownItem, CaseSearchField, StaffSearchField,
  StaffSearchPicker, BatchStaffPicker,
  isAttorney,
  USERS,
};

const PAGE_SIZE = 50;
export { PAGE_SIZE };
// ─── New Case Modal ──────────────────────────────────────────────────────────
function NewCaseModal({ onSave, onClose }) {
  const [form, setForm] = useState({ caseNum: "", courtCaseNumber: "", title: "", clientName: "", county: "", court: "", caseType: "Auto Accident", stage: "Intake", stateJurisdiction: "", accidentDate: "", injuryType: "", assignedAttorney: 0, secondAttorney: 0, caseManager: 0, investigator: 0, paralegal: 0, notes: "" });
  const [autoTasks, setAutoTasks] = useState(true);
  const [conflicts, setConflicts] = useState(null);
  const [conflictChecking, setConflictChecking] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeError, setIntakeError] = useState("");
  const [intakeSuccess, setIntakeSuccess] = useState(false);
  const intakeFileRef = useRef(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleIntakeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIntakeLoading(true);
    setIntakeError("");
    setIntakeSuccess(false);
    try {
      const parsed = await apiParseIntake(file);
      setForm(p => ({
        ...p,
        clientName: parsed.clientName || p.clientName,
        title: parsed.clientName ? `${parsed.clientName} v. TBD` : p.title,
        accidentDate: parsed.accidentDate || p.accidentDate,
        injuryType: parsed.injuryType || p.injuryType,
        stateJurisdiction: parsed.stateJurisdiction || p.stateJurisdiction,
        county: parsed.county || p.county,
        caseType: parsed.caseType || p.caseType,
        court: parsed.court || p.court,
      }));
      setIntakeSuccess(true);
      if (parsed.clientName) checkConflicts(parsed.clientName);
    } catch (err) {
      setIntakeError(err.message || "Failed to parse intake form");
    } finally {
      setIntakeLoading(false);
      if (intakeFileRef.current) intakeFileRef.current.value = "";
    }
  };
  const checkConflicts = async (name) => {
    if (!name || name.trim().length < 2) { setConflicts(null); return; }
    setConflictChecking(true);
    try {
      const result = await apiConflictCheck(name.trim());
      if (result.cases.length > 0 || result.contacts.length > 0) setConflicts(result);
      else setConflicts(null);
    } catch { setConflicts(null); }
    setConflictChecking(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Open New Case</div>
        <div className="modal-sub">
          Enter the case details below.
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <Badge label="Case" />
            <Badge label="Active" />
          </div>
          <div>
            <input type="file" accept=".pdf,application/pdf" ref={intakeFileRef} style={{ display: "none" }} onChange={handleIntakeUpload} />
            <button
              className="btn btn-gold"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
              disabled={intakeLoading}
              onClick={() => intakeFileRef.current?.click()}
            >
              {intakeLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {intakeLoading ? "Processing…" : "Upload Intake Form (PDF)"}
            </button>
          </div>
        </div>
        {intakeError && (
          <div style={{ padding: "8px 12px", background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 6, marginBottom: 10, fontSize: 12, color: "#DC2626" }}>
            {intakeError}
          </div>
        )}
        {intakeSuccess && (
          <div style={{ padding: "8px 12px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 6, marginBottom: 10, fontSize: 12, color: "#059669" }}>
            ✓ Intake form parsed successfully. Review the auto-filled fields below before submitting.
          </div>
        )}

        <div className="form-row">
          <div className="form-group"><label>File Number</label><input value={form.caseNum} onChange={e => set("caseNum", e.target.value)} placeholder="e.g. PI-2025-001234" /></div>
          <div className="form-group"><label>Case Title *</label><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Smith v. Jones" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Case Number</label><input value={form.courtCaseNumber} onChange={e => set("courtCaseNumber", e.target.value)} placeholder="e.g. 21-CV-2025-900012.00" /></div>
          <div className="form-group"><label>Client Name</label><input value={form.clientName} onChange={e => set("clientName", e.target.value)} onBlur={e => checkConflicts(e.target.value)} /></div>
          <div className="form-group"><label>Case Type</label>
            <select value={form.caseType} onChange={e => set("caseType", e.target.value)}>
              {["Auto Accident", "Truck Accident", "Motorcycle Accident", "Slip & Fall", "Medical Malpractice", "Product Liability", "Wrongful Death", "Workers Compensation", "Dog Bite", "Premises Liability", "Nursing Home Abuse", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        {conflictChecking && <div style={{ padding: "8px 12px", background: "#FFF8E1", border: "1px solid #FFD54F", borderRadius: 6, marginBottom: 10, fontSize: 12, color: "#795548" }}>Checking for conflicts...</div>}
        {conflicts && (
          <div style={{ padding: "10px 14px", background: "#FFF3E0", border: "1px solid #FF9800", borderRadius: 6, marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#E65100", marginBottom: 6 }}>Potential Conflict Detected</div>
            {conflicts.cases.length > 0 && <div style={{ fontSize: 12, color: "#BF360C", marginBottom: 4 }}>
              <strong>Matching cases:</strong> {conflicts.cases.map(cc => `${cc.title} (${cc.caseNum || "no case #"})`).join(", ")}
            </div>}
            {conflicts.contacts.length > 0 && <div style={{ fontSize: 12, color: "#BF360C" }}>
              <strong>Matching contacts:</strong> {conflicts.contacts.map(cc => `${cc.name}`).join(", ")}
            </div>}
            <div style={{ fontSize: 11, color: "#795548", marginTop: 4 }}>Review potential conflicts before proceeding.</div>
          </div>
        )}
        <div className="form-row">
          <div className="form-group"><label>State</label>
            <select value={form.stateJurisdiction} onChange={e => set("stateJurisdiction", e.target.value)}>
              <option value="">— Select —</option>
              {["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group"><label>County</label><input value={form.county} onChange={e => set("county", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Accident Date</label><input type="date" value={form.accidentDate} onChange={e => set("accidentDate", e.target.value)} /></div>
          <div className="form-group"><label>Injury Type</label><input value={form.injuryType} onChange={e => set("injuryType", e.target.value)} placeholder="e.g. Soft tissue, TBI, Fracture" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Stage</label>
            <select value={form.stage} onChange={e => set("stage", e.target.value)}>
              {["Intake", "Investigation", "Treatment", "Pre-Litigation Demand", "Negotiation", "Litigation Filed", "Discovery", "Mediation", "Trial Preparation", "Trial", "Settlement/Verdict", "Closed"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Court</label><input value={form.court} onChange={e => set("court", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Lead Attorney</label>
            <StaffSearchField value={form.assignedAttorney} onChange={val => set("assignedAttorney", val)} placeholder="Search attorneys…" />
          </div>
          <div className="form-group"><label>2nd Attorney</label>
            <StaffSearchField value={form.secondAttorney} onChange={val => set("secondAttorney", val)} placeholder="Search staff…" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Case Manager</label>
            <StaffSearchField value={form.caseManager} onChange={val => set("caseManager", val)} placeholder="Search staff…" />
          </div>
          <div className="form-group"><label>Investigator</label>
            <StaffSearchField value={form.investigator} onChange={val => set("investigator", val)} placeholder="Search staff…" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Paralegal</label>
            <StaffSearchField value={form.paralegal} onChange={val => set("paralegal", val)} placeholder="Search staff…" />
          </div>
          <div className="form-group" />
        </div>
        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} /></div>

        <div style={{ background: autoTasks ? "#f1f5f9" : "var(--c-bg)", border: `1px solid ${autoTasks ? "#f59e0b22" : "#e2e8f0"}`, borderRadius: 7, padding: "12px 14px", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600 }}>✅ Auto-generate opening tasks</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Initial client interview, request discovery, obtain arrest report, review bond, conflict check, background investigation</div>
            </div>
            <Toggle on={autoTasks} onChange={() => setAutoTasks(p => !p)} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" disabled={!form.title.trim()} onClick={() => { onSave({ ...form, autoTasks }); onClose(); }}>
            Open Case
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auto-escalate preview box ────────────────────────────────────────────────


export { NewCaseModal };
