import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Briefcase, Calendar, CheckSquare, Settings, Menu, Search, Plus, Scale, Pin, Sparkles } from "lucide-react";
import {
  apiGetQuickNotes,
  apiCreateNote,
  apiDeleteNote,
  apiGetRecentActivity,
  apiGetUnreadClientComm,
  apiRunCustomWidget,
  apiGetCustomWidgets,
  apiGetTimeEntries,
  apiUpdateNote,
  apiCaseTriage,
} from "../api.js";
import {
  fmt,
  daysUntil,
  urgencyColor,
  Badge,
  getEffectivePriority,
  CaseSearchField,
  DEFAULT_LAYOUT,
  getDashboardLayout,
  saveDashboardLayout,
  NewCaseModal,
} from "../shared.js";

const CONTACT_CAT_STYLE = {
  Client: { bg: "#f1f5f9", color: "#2563eb", border: "#e2e8f0" },
  Prosecutor: { bg: "#fef9c3", color: "#92400e", border: "#fef9c3" },
  Judge: { bg: "#f3e8ff", color: "#7c3aed", border: "#f3e8ff" },
  Court: { bg: "#f3e8ff", color: "#7c3aed", border: "#f3e8ff" },
  Witness: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
  Expert: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  "Family Member": { bg: "#ffe4e6", color: "#dc2626", border: "#fecdd3" },
  "Social Worker": { bg: "#f1f5f9", color: "#2563eb", border: "#e2e8f0" },
  "Treatment Provider": { bg: "#ccfbf1", color: "#0d9488", border: "#ccfbf1" },
  Miscellaneous: { bg: "#f1f5f9", color: "#6B7280", border: "#e2e8f0" },
};

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
function CustomizeDashboardModal({ layout, setLayout, userId, onClose }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [customWidgets, setCustomWidgets] = useState([]);
  useEffect(() => { apiGetCustomWidgets().then(r => setCustomWidgets(r || [])).catch(() => {}); }, []);
  const allWidgets = [...DASHBOARD_WIDGETS, ...customWidgets.map(cw => ({ id: `custom-${cw.id}`, label: cw.name, size: cw.size || "half", icon: "sparkles", _custom: true }))];
  const available = allWidgets.filter(w => !layout.includes(w.id));
  const remove = (id) => { const n = layout.filter(x => x !== id); setLayout(n); saveDashboardLayout(n); };
  const add = (id) => { const n = [...layout, id]; setLayout(n); saveDashboardLayout(n); };
  const reset = () => { setLayout([...DEFAULT_LAYOUT]); saveDashboardLayout(DEFAULT_LAYOUT); };
  const sizeLabel = (s) => s === "quarter" ? "\u00BC" : s === "half" ? "\u00BD" : "Full";
  const sizeColor = (s) => s === "quarter" ? "#4F7393" : s === "half" ? "#2F7A5F" : "#B67A18";
  const handleDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); };
  const handleDragOver = (e, i) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverIdx(i); };
  const handleDrop = (e, dropI) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropI) { setDragIdx(null); setOverIdx(null); return; }
    const n = [...layout];
    const [moved] = n.splice(dragIdx, 1);
    n.splice(dropI, 0, moved);
    setLayout(n);
    saveDashboardLayout(n);
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };
  return (
    <div className="login-bg" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="login-box" style={{ width: 480, maxWidth: "calc(100vw - 24px)", maxHeight: "80vh", overflow: "auto" }}>
        <div className="login-title" style={{ fontSize: 20, marginBottom: 4 }}>Customize Dashboard</div>
        <div className="login-sub" style={{ marginBottom: 20 }}>Drag to reorder, add or remove widgets</div>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--c-text2)", marginBottom: 8 }}>Your Dashboard</div>
        {layout.length === 0 && <div style={{ fontSize: 13, color: "#64748b", padding: "8px 0" }}>No widgets added yet</div>}
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragIdx !== null) { setDragIdx(null); setOverIdx(null); } }}>
        {layout.map((id, i) => {
          const w = allWidgets.find(x => x.id === id);
          if (!w) return null;
          const isDragging = dragIdx === i;
          const isOver = overIdx === i && dragIdx !== i;
          return (
            <div
              key={id}
              draggable="true"
              onDragStart={e => handleDragStart(e, i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={e => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 4px",
                borderBottom: "1px solid var(--c-border)",
                opacity: isDragging ? 0.4 : 1,
                borderTop: isOver ? "2px solid #d97706" : "2px solid transparent",
                background: isDragging ? "var(--c-hover, #f5f5f5)" : "transparent",
                borderRadius: 4,
                transition: "border-top 0.15s ease, opacity 0.15s ease",
                cursor: "grab",
                userSelect: "none"
              }}
            >
              <span style={{ fontSize: 16, color: "var(--c-text2)", cursor: "grab", userSelect: "none", width: 20, textAlign: "center", letterSpacing: 1 }} title="Drag to reorder">⠿</span>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{w.icon === "pin" ? <Pin size={16} className="text-amber-500 inline" /> : w.icon === "sparkles" ? <Sparkles size={16} className="text-amber-500 inline" /> : w.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--c-text)" }}>{w.label}</span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: sizeColor(w.size), color: "#fff", fontWeight: 600 }}>{sizeLabel(w.size)}</span>
              <button onClick={() => remove(id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#B24A4A", padding: "2px 4px" }} title="Remove">✕</button>
            </div>
          );
        })}
        </div>
        {available.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--c-text2)", marginTop: 20, marginBottom: 8 }}>Available Widgets</div>
            {available.map(w => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--c-border)" }}>
                <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{w.icon === "pin" ? <Pin size={16} className="text-amber-500 inline" /> : w.icon === "sparkles" ? <Sparkles size={16} className="text-amber-500 inline" /> : w.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--c-text)" }}>{w.label}</span>
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: sizeColor(w.size), color: "#fff", fontWeight: 600 }}>{sizeLabel(w.size)}</span>
                <button onClick={() => add(w.id)} className="btn" style={{ fontSize: 11, padding: "3px 10px" }}>+ Add</button>
              </div>
            ))}
          </>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <button onClick={reset} className="btn" style={{ fontSize: 12 }}>Reset to Default</button>
          <button onClick={onClose} className="btn btn-gold" style={{ fontSize: 12 }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function CustomDashboardWidgetRenderer({ widgetId }) {
  const [data, setData] = useState(null);
  const [widget, setWidget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customId = parseInt(widgetId.replace("custom-", ""));
    if (!customId) { setLoading(false); return; }
    apiGetCustomWidgets().then(widgets => {
      const w = widgets.find(x => x.id === customId);
      if (!w) { setLoading(false); return; }
      setWidget(w);
      return apiRunCustomWidget({ widgetType: w.widgetType, dataSource: w.dataSource, config: w.config });
    }).then(result => { if (result) setData(result); }).catch(() => {}).finally(() => setLoading(false));
  }, [widgetId]);

  if (loading) return <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#64748b" }}>Loading widget...</div></div>;
  if (!widget) return null;

  const wType = widget.widgetType || widget.widget_type;
  return (
    <div className="!bg-white dark:!bg-slate-800 !rounded-xl !border !border-slate-200 dark:!border-slate-700 !shadow-sm !p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-amber-500" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{widget.name}</span>
        {(widget.dataSource || widget.data_source) === "staff_assigned" && widget.config?.staff_role && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">({widget.config.staff_role})</span>
        )}
      </div>
      {wType === "metric" && data && (
        <div className="text-3xl font-bold text-slate-900 dark:text-white">{data.value != null ? (typeof data.value === "number" ? data.value.toLocaleString() : data.value) : "—"}</div>
      )}
      {wType === "list" && data && data.rows && (
        <div className="overflow-x-auto max-h-48 text-xs">
          <table className="w-full">
            <thead><tr>{(data.columns || []).map(c => <th key={c} className="text-left py-1 px-2 font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-600">{c}</th>)}</tr></thead>
            <tbody>{data.rows.slice(0, 10).map((row, ri) => <tr key={ri}>{(data.columns || []).map(c => <td key={c} className="py-1 px-2 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">{String(row[c] ?? "")}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      {wType === "chart" && data && data.data && (
        <div className="space-y-1">
          {data.data.slice(0, 8).map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-right text-slate-500 truncate">{d.label}</span>
              <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-4 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (d.value / Math.max(...data.data.map(x => x.value), 1)) * 100)}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-8 text-right">{d.value}</span>
            </div>
          ))}
        </div>
      )}
      {!data && <div className="text-sm text-slate-400">No data</div>}
    </div>
  );
}

function UnreadClientCommWidget({ allCases, onSelectCase }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGetUnreadClientComm().then(d => setData(d || [])).catch(() => setData([])).finally(() => setLoading(false));
  }, []);
  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--c-text-h)" }}>Unread Client Communication</span>
        <button onClick={() => { setLoading(true); apiGetUnreadClientComm().then(d => setData(d || [])).catch(() => setData([])).finally(() => setLoading(false)); }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", cursor: "pointer" }}>Refresh</button>
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        {loading && <div style={{ fontSize: 12, color: "#64748b", padding: "12px 0" }}>Loading...</div>}
        {!loading && data.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", padding: "12px 0", textAlign: "center" }}>No unread client communication</div>}
        {!loading && data.map(item => {
          const c = allCases.find(cs => cs.id === item.caseId);
          return (
            <div key={item.caseId} onClick={() => c && onSelectCase(c, "correspondence")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--c-border2)", cursor: c ? "pointer" : "default" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {(item.clientName || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.clientName || item.caseTitle}</div>
                <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.caseTitle}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {item.messageCount > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, padding: "2px 6px", borderRadius: 10, background: "#dbeafe", color: "#1d4ed8", fontWeight: 600 }}>💬 {item.messageCount}</span>}
                {item.documentCount > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, padding: "2px 6px", borderRadius: 10, background: "#fef3c7", color: "#92400e", fontWeight: 600 }}>📄 {item.documentCount}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyTimeWidget({ currentUser }) {
  const [period, setPeriod] = useState("Week");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const getRange = useCallback((p) => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    const toStr = (dt) => dt.toISOString().split("T")[0];
    const endDate = toStr(now);
    let startDate;
    if (p === "Day") startDate = endDate;
    else if (p === "Week") { const s = new Date(y, m, d - now.getDay()); startDate = toStr(s); }
    else if (p === "Month") startDate = toStr(new Date(y, m, 1));
    else if (p === "Quarter") { const qm = m - (m % 3); startDate = toStr(new Date(y, qm, 1)); }
    else startDate = toStr(new Date(y, 0, 1));
    return { from: startDate, to: endDate };
  }, []);
  useEffect(() => {
    setLoading(true);
    const { from, to } = getRange(period);
    apiGetTimeEntries(currentUser.id, from, to)
      .then(data => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [period, currentUser.id, getRange]);
  const totalHours = useMemo(() => entries.reduce((s, e) => s + (parseFloat(e.time) || 0), 0), [entries]);
  const byCase = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      const key = e.caseTitle || "Unknown";
      map[key] = (map[key] || 0) + (parseFloat(e.time) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [entries]);
  const periods = ["Day", "Week", "Month", "Quarter", "Year"];
  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="card-title">My Time</div>
        <div style={{ display: "flex", gap: 2 }}>
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--c-border)", background: period === p ? "#f59e0b" : "transparent", color: period === p ? "#fff" : "var(--c-text2)", cursor: "pointer", fontWeight: period === p ? 600 : 400 }}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {loading ? <div style={{ fontSize: 13, color: "#64748b" }}>Loading...</div> : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 36, fontWeight: 700, color: "var(--c-text-h)" }}>{totalHours.toFixed(1)}</span>
              <span style={{ fontSize: 13, color: "#64748b" }}>hours this {period.toLowerCase()}</span>
            </div>
            {byCase.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Top Cases</div>
                {byCase.map(([name, hrs]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 12 }}>
                    <span style={{ color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>{name}</span>
                    <span style={{ fontWeight: 600, color: "var(--c-text-h)", flexShrink: 0 }}>{hrs.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            )}
            {byCase.length === 0 && <div style={{ fontSize: 12, color: "#64748b" }}>No time entries this {period.toLowerCase()}</div>}
          </>
        )}
      </div>
    </div>
  );
}

function RecentActivityWidget({ currentUser, allCases, onSelectCase }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiGetRecentActivity(currentUser.id, 10)
      .then(data => setActivities(data))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, [currentUser.id]);
  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
  const tabForAction = (action) => {
    const a = (action || "").toLowerCase();
    if (a.includes("document") || a.includes("evidence")) return "files";
    if (a.includes("filing") || a.includes("motion")) return "filings";
    if (a.includes("correspondence")) return "correspondence";
    if (a.includes("note")) return "activity";
    return "overview";
  };
  const handleClick = (a) => {
    if (!onSelectCase || !allCases) return;
    const caseObj = allCases.find(c => c.id === a.caseId);
    if (caseObj) onSelectCase(caseObj, tabForAction(a.action));
  };
  return (
    <div className="card">
      <div className="card-header"><div className="card-title">My Recent Activity</div></div>
      {loading && <div className="empty">Loading...</div>}
      {!loading && activities.length === 0 && <div className="empty">No recent activity</div>}
      {!loading && activities.map(a => (
        <div key={a.id} className="deadline-item" style={{ padding: "8px 16px", cursor: "pointer" }} onClick={() => handleClick(a)}>
          <div className="dl-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="dl-title" style={{ fontSize: 12 }}>{a.action}</div>
            <div className="dl-case">{a.caseTitle || `Case #${a.caseId}`}{a.detail ? ` — ${a.detail}` : ""}</div>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>{timeAgo(a.ts)}</div>
        </div>
      ))}
    </div>
  );
}

function QuickNotesWidget({ currentUser, allCases, onSelectCase, pinnedCaseIds, confirmDelete }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState("");
  const [formCaseId, setFormCaseId] = useState("");
  const [formTime, setFormTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [editCaseId, setEditCaseId] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const recRef = useRef(null);
  const speechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    apiGetQuickNotes().then(setNotes).catch(() => setNotes([])).finally(() => setLoading(false));
  }, []);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const toggleSpeech = () => {
    if (isListening && recRef.current) {
      recRef.current.stop();
      recRef.current = null;
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript;
      }
      if (transcript) {
        setBody(p => p + (p && !p.endsWith(" ") ? " " : "") + transcript);
      }
    };
    rec.onerror = () => { setIsListening(false); recRef.current = null; };
    rec.onend = () => { setIsListening(false); recRef.current = null; };
    rec.start();
    recRef.current = rec;
    setIsListening(true);
  };

  const handleAdd = async () => {
    if (!body.trim()) return;
    if (recRef.current) { recRef.current.stop(); recRef.current = null; setIsListening(false); }
    setSaving(true);
    try {
      const noteData = {
        body: body.trim(),
        type: formCaseId ? "General" : "Quick Note",
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
      };
      if (formCaseId) noteData.caseId = parseInt(formCaseId);
      if (formTime) noteData.timeLogged = formTime;
      const saved = await apiCreateNote(noteData);
      if (!formCaseId) {
        setNotes(prev => [saved, ...prev]);
      } else {
        const cs = allCases.find(c => c.id === parseInt(formCaseId));
        showSuccess(`Note saved to ${cs?.title || "case"}`);
      }
      setBody("");
      setFormCaseId("");
      setFormTime("");
      setShowForm(false);
    } catch (err) {
      alert("Failed to save note: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiDeleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (err) {
      alert("Failed to delete note: " + err.message);
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditBody(note.body);
    setEditCaseId(note.caseId || "");
    setEditTime(note.timeLogged || "");
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      const updates = { body: editBody };
      if (editCaseId) { updates.caseId = parseInt(editCaseId); updates.type = "General"; }
      if (editTime) updates.timeLogged = editTime;
      const updated = await apiUpdateNote(editingId, updates);
      if (editCaseId) {
        setNotes(prev => prev.filter(n => n.id !== editingId));
        const cs = allCases.find(c => c.id === parseInt(editCaseId));
        showSuccess(`Note moved to ${cs?.title || "case"}`);
      } else {
        setNotes(prev => prev.map(n => n.id === editingId ? updated : n));
      }
      setEditingId(null);
    } catch (err) {
      alert("Failed to update note: " + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const caseFields = (caseIdVal, setCaseIdVal, timeVal, setTimeVal) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <div>
        <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Assign to Case (optional)</label>
        <CaseSearchField allCases={allCases} value={caseIdVal} onChange={setCaseIdVal} placeholder="Search cases…" pinnedCaseIds={pinnedCaseIds} />
      </div>
      <div>
        <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 2 }}>Time Spent (hours)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={timeVal}
          onChange={e => setTimeVal(e.target.value)}
          placeholder="0.0"
          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 12, boxSizing: "border-box" }}
        />
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="card-title">Quick Notes</div>
        <button className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => { setShowForm(!showForm); setEditingId(null); setFormCaseId(""); setFormTime(""); }}>
          {showForm ? "Cancel" : "+ Add Note"}
        </button>
      </div>
      {successMsg && (
        <div style={{ padding: "8px 20px", background: "rgba(47,122,95,0.1)", color: "#2F7A5F", fontSize: 12, fontWeight: 600, borderBottom: "1px solid var(--c-border2)" }}>
          {successMsg}
        </div>
      )}
      {showForm && (
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--c-border2)" }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={isListening ? "Speak now — your words will appear here…" : "Type your note…"}
            style={{ width: "100%", minHeight: 70, resize: "vertical", padding: 10, borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ marginTop: 8 }}>
            {caseFields(formCaseId, setFormCaseId, formTime, setFormTime)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            {speechSupported && (
              <button
                onClick={toggleSpeech}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: isListening ? "1px solid #e05252" : "1px solid var(--c-border)", background: isListening ? "rgba(224,82,82,0.08)" : "transparent", color: isListening ? "#e05252" : "var(--c-text2)", cursor: "pointer", fontSize: 12, animation: isListening ? "pulse-mic 1.5s ease-in-out infinite" : "none" }}
              >
                <span style={{ fontSize: 14 }}>{isListening ? "🔴" : "🎙️"}</span>
                {isListening ? "Listening…" : "Dictate"}
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving || !body.trim()} style={{ fontSize: 12 }}>
              {saving ? "Saving…" : formCaseId ? "Save to Case" : "Save Note"}
            </button>
          </div>
        </div>
      )}
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {loading && <div style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>Loading…</div>}
        {!loading && notes.length === 0 && !showForm && (
          <div style={{ padding: "24px 20px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
            No quick notes yet. Click "+ Add Note" to jot something down.
          </div>
        )}
        {notes.map(note => (
          <div key={note.id} style={{ padding: "10px 20px", borderBottom: "1px solid var(--c-border2)" }}>
            {editingId === note.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  style={{ width: "100%", minHeight: 60, resize: "vertical", padding: 8, borderRadius: 6, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                />
                {caseFields(editCaseId, setEditCaseId, editTime, setEditTime)}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)} style={{ fontSize: 11 }}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={editSaving} style={{ fontSize: 11 }}>
                    {editSaving ? "Saving…" : editCaseId ? "Save & Move to Case" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: "var(--c-text)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}>
                  {note.body.length > 200 ? note.body.slice(0, 200) + "…" : note.body}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{fmtDate(note.createdAt)}</span>
                  {note.timeLogged && <span style={{ fontSize: 11, color: "var(--c-brand)", fontWeight: 600 }}>{note.timeLogged}h</span>}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => startEdit(note)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, padding: "2px 6px" }} title="Edit note">✎</button>
                  <button onClick={async () => { if (!await confirmDelete()) return; handleDelete(note.id); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, padding: "2px 6px" }} title="Delete note">✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ currentUser, allCases, deadlines, tasks, onSelectCase, onAddRecord, onCompleteTask, onUpdateTask, onMenuToggle, pinnedCaseIds, onNavigate, pinnedContacts, onSelectContact, confirmDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [triageResults, setTriageResults] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState(null);
  const [layout, setLayout] = useState(() => getDashboardLayout(currentUser.preferences));
  const pinnedIds = pinnedCaseIds;
  useEffect(() => { setLayout(getDashboardLayout(currentUser.preferences)); }, [currentUser.id, currentUser.preferences?.dashboardLayout]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeCases = allCases.filter(c => c.status === "Active");
  const upcomingDl = deadlines.filter(d => { const n = daysUntil(d.date); return n !== null && n >= 0 && n <= 30; }).sort((a, b) => new Date(a.date) - new Date(b.date));
  const trialSoon = allCases.filter(c => c.trialDate && daysUntil(c.trialDate) >= 0 && daysUntil(c.trialDate) <= 90).sort((a, b) => new Date(a.trialDate) - new Date(b.trialDate));
  const myTasks = tasks.filter(t => t.assigned === currentUser.id && t.status !== "Completed");
  const myCompleted = tasks.filter(t => t.assigned === currentUser.id && t.status === "Completed").sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
  const overdueTasks = myTasks.filter(t => daysUntil(t.due) !== null && daysUntil(t.due) < 0);
  const pinnedCases = useMemo(() => pinnedIds.map(id => allCases.find(c => c.id === id)).filter(Boolean), [pinnedIds, allCases]);

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case "stat-active":
        return (
          <div className="!bg-white dark:!bg-slate-800 !rounded-xl !border !border-slate-200 dark:!border-slate-700 !shadow-sm !p-5" key={widgetId}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center"><Briefcase size={18} className="text-amber-500" /></div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Cases</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{activeCases.length}</div>
            <div className="text-xs text-slate-400 mt-1">{activeCases.length} active case{activeCases.length !== 1 ? "s" : ""}</div>
          </div>
        );
      case "stat-deadlines":
        return (
          <div className="!bg-white dark:!bg-slate-800 !rounded-xl !border !border-slate-200 dark:!border-slate-700 !shadow-sm !p-5 cursor-pointer" key={widgetId} onClick={() => onNavigate && onNavigate("deadlines")}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><Calendar size={18} className="text-blue-500" /></div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Deadlines</span>
            </div>
            <div className={`text-3xl font-bold ${upcomingDl.length > 5 ? "text-amber-500" : "text-slate-900 dark:text-white"}`}>{upcomingDl.length}</div>
            <div className="text-xs text-slate-400 mt-1">Next 30 days</div>
          </div>
        );
      case "stat-tasks":
        return (
          <div className="!bg-white dark:!bg-slate-800 !rounded-xl !border !border-slate-200 dark:!border-slate-700 !shadow-sm !p-5 cursor-pointer" key={widgetId} onClick={() => onNavigate && onNavigate("tasks")}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center"><CheckSquare size={18} className="text-emerald-500" /></div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Open Tasks</span>
            </div>
            <div className={`text-3xl font-bold ${myTasks.filter(t => daysUntil(t.due) < 0).length > 0 ? "text-red-500" : "text-slate-900 dark:text-white"}`}>{myTasks.length}</div>
            <div className="text-xs text-slate-400 mt-1">{myTasks.filter(t => daysUntil(t.due) < 0).length} overdue</div>
          </div>
        );
      case "stat-trials":
        return (
          <div className="!bg-white dark:!bg-slate-800 !rounded-xl !border !border-slate-200 dark:!border-slate-700 !shadow-sm !p-5" key={widgetId}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center"><Scale size={18} className="text-violet-500" /></div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trials in 90 Days</span>
            </div>
            <div className={`text-3xl font-bold ${trialSoon.length > 0 ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{trialSoon.length}</div>
            <div className="text-xs text-slate-400 mt-1">{allCases.filter(c => c.trialDate).length} with trial dates</div>
          </div>
        );
      case "deadlines":
        return (
          <div className="card" key={widgetId}>
            <div className="card-header" onClick={() => onNavigate && onNavigate("deadlines")} style={{ cursor: "pointer" }}><div className="card-title">Upcoming Deadlines</div><span style={{ fontSize: 12, color: "#64748b" }}>30 days</span></div>
            {upcomingDl.length === 0 && <div className="empty">No upcoming deadlines</div>}
            {upcomingDl.slice(0, 7).map(d => {
              const days = daysUntil(d.date); const col = urgencyColor(days);
              const cs = allCases.find(c => c.id === d.caseId);
              return (
                <div key={d.id} className="deadline-item">
                  <div className="dl-dot" style={{ background: col }} />
                  <div className="dl-info"><div className="dl-title">{d.title}</div><div className="dl-case">{cs?.title?.slice(0, 40) || `#${d.caseId}`}</div></div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: col, fontSize: 12, fontWeight: 700 }}>{days === 0 ? "Today" : `${days}d`}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{fmt(d.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case "trials":
        return (
          <div className="card" key={widgetId}>
            <div className="card-header"><div className="card-title">Trials Within 90 Days</div></div>
            {trialSoon.length === 0 && <div className="empty">No trials in the next 90 days</div>}
            {trialSoon.slice(0, 6).map(c => {
              const days = daysUntil(c.trialDate); const col = urgencyColor(days);
              return (
                <div key={c.id} className="deadline-item" style={{ cursor: "pointer" }} onClick={() => onSelectCase(c)}>
                  <div className="dl-dot" style={{ background: col }} />
                  <div className="dl-info"><div className="dl-title" style={{ fontSize: 13 }}>{c.title}</div><div className="dl-case">{c.caseNum}{c.judge ? ` · ${c.judge}` : ""}</div></div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: col, fontSize: 12, fontWeight: 700 }}>{days}d</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{fmt(c.trialDate)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case "tasks":
        return (myTasks.length > 0 || myCompleted.length > 0) ? (
          <div className="card" key={widgetId}>
            <div className="card-header"><div className="card-title">My Tasks</div><Badge label={`${myTasks.length} open`} /></div>
            {myTasks.length === 0 && <div className="empty" style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>No open tasks</div>}
            {myTasks.slice(0, 10).map(t => {
              const days = daysUntil(t.due);
              const cs = allCases.find(c => c.id === t.caseId);
              const ep = getEffectivePriority(t);
              const isExpanded = expandedTask === t.id;
              return (
                <div key={t.id} className="deadline-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 0, padding: "10px 16px", cursor: "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="checkbox" onClick={() => onCompleteTask(t.id)} title="Mark complete" />
                    <div className="dl-dot" style={{ background: urgencyColor(days), flexShrink: 0 }} />
                    <div className="dl-info" style={{ flex: 1, minWidth: 0 }}>
                      <div className="dl-title">{t.title}{t.recurring && <span className="rec-badge">🔁</span>}{t.isChained && <span className="chain-badge">⛓</span>}</div>
                      <div className="dl-case">{cs?.title?.slice(0, 45) || `#${t.caseId}`}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <Badge label={ep} />
                      <div style={{ fontSize: 11, color: days < 0 ? "#e05252" : "#64748b" }}>{fmt(t.due)}</div>
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : t.id)}
                        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: "2px 4px" }}
                        title="Edit task"
                      >{isExpanded ? "▲" : "✎"}</button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="task-inline-edit" style={{ paddingLeft: 44, marginTop: 8 }}>
                      <label style={{ fontSize: 11, color: "#64748b" }}>Due</label>
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
                    </div>
                  )}
                </div>
              );
            })}
            {myCompleted.length > 0 && (
              <>
                <div
                  onClick={() => setShowCompleted(!showCompleted)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", cursor: "pointer", borderTop: "1px solid var(--c-border)", background: showCompleted ? "var(--c-bg2)" : "transparent" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{showCompleted ? "▼" : "▶"}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text2)" }}>Completed</span>
                    <Badge label={`${myCompleted.length}`} />
                  </div>
                </div>
                {showCompleted && myCompleted.slice(0, 20).map(t => {
                  const cs = allCases.find(c => c.id === t.caseId);
                  return (
                    <div key={t.id} className="deadline-item" style={{ padding: "8px 16px", opacity: 0.7 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: "#2F7A5F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>
                        </div>
                        <div className="dl-info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="dl-title" style={{ textDecoration: "line-through", color: "var(--c-text2)" }}>{t.title}</div>
                          <div className="dl-case">{cs?.title?.slice(0, 45) || `#${t.caseId}`}</div>
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>{t.completedAt ? fmt(t.completedAt) : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ) : null;
      case "pinned":
        return pinnedCases.length > 0 ? (
          <div className="card" key={widgetId}>
            <div className="card-header"><div className="card-title">Pinned Cases</div><Badge label={`${pinnedCases.length}`} /></div>
            {pinnedCases.map(c => (
              <div key={c.id} className="deadline-item" style={{ cursor: "pointer", padding: "10px 16px" }} onClick={() => onSelectCase(c)}>
                <Pin size={14} className="text-amber-500 mr-1.5 flex-shrink-0" />
                <div className="dl-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="dl-title" style={{ fontSize: 13 }}>{c.title}</div>
                  <div className="dl-case">{c.caseNum || "—"}{c.clientName ? ` · ${c.clientName}` : ""}</div>
                </div>
                <div style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>{c.status}</div>
              </div>
            ))}
          </div>
        ) : null;
      case "pinned-contacts":
        return (pinnedContacts && pinnedContacts.length > 0) ? (
          <div className="card" key={widgetId}>
            <div className="card-header" onClick={() => onNavigate && onNavigate("contacts")} style={{ cursor: "pointer" }}><div className="card-title">Pinned Contacts</div><Badge label={`${pinnedContacts.length}`} /></div>
            {pinnedContacts.map(c => {
              const cs = CONTACT_CAT_STYLE[c.category] || CONTACT_CAT_STYLE.Miscellaneous;
              return (
                <div key={c.id} className="deadline-item" style={{ cursor: "pointer", padding: "10px 16px" }} onClick={() => onSelectContact && onSelectContact(c)}>
                  <div className="dl-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="dl-title" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                      {c.name}
                      <span style={{ padding: "1px 7px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: cs.bg, color: "#1e293b", letterSpacing: "0.04em" }}>{c.category}</span>
                    </div>
                    <div className="dl-case" style={{ fontSize: 11 }}>
                      {c.phone && <span>{c.phone}</span>}
                      {c.phone && c.email && <span> · </span>}
                      {c.email && <span>{c.email}</span>}
                      {!c.phone && !c.email && <span style={{ color: "#64748b" }}>No contact info</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" key={widgetId}>
            <div className="card-header" onClick={() => onNavigate && onNavigate("contacts")} style={{ cursor: "pointer" }}><div className="card-title">Pinned Contacts</div></div>
            <div className="empty">No pinned contacts. Pin contacts from the Contacts page.</div>
          </div>
        );
      case "recent-activity":
        return <RecentActivityWidget key={widgetId} currentUser={currentUser} allCases={allCases} onSelectCase={onSelectCase} />;
      case "overdue":
        return (
          <div className="card" key={widgetId}>
            <div className="card-header" onClick={() => onNavigate && onNavigate("tasks")} style={{ cursor: "pointer" }}><div className="card-title">Overdue Tasks</div><Badge label={`${overdueTasks.length}`} /></div>
            {overdueTasks.length === 0 && <div className="empty">No overdue tasks</div>}
            {overdueTasks.sort((a, b) => daysUntil(a.due) - daysUntil(b.due)).slice(0, 8).map(t => {
              const days = daysUntil(t.due);
              const cs = allCases.find(c => c.id === t.caseId);
              return (
                <div key={t.id} className="deadline-item" style={{ padding: "8px 16px" }}>
                  <div className="checkbox" onClick={() => onCompleteTask(t.id)} title="Mark complete" />
                  <div className="dl-dot" style={{ background: "#e05252", flexShrink: 0 }} />
                  <div className="dl-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="dl-title">{t.title}</div>
                    <div className="dl-case">{cs?.title?.slice(0, 40) || `#${t.caseId}`}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#e05252", fontWeight: 700, flexShrink: 0 }}>{Math.abs(days)}d overdue</div>
                </div>
              );
            })}
          </div>
        );
      case "my-time":
        return <MyTimeWidget key={widgetId} currentUser={currentUser} />;
      case "ai-triage":
        return (
          <div className="card" key={widgetId}>
            <div className="card-header">
              <div className="card-title flex items-center gap-1.5"><Sparkles size={14} className="text-amber-500" /> AI Case Triage</div>
              <button className="!px-3 !py-1.5 !text-xs !font-medium !border !border-amber-200 dark:!border-amber-800/50 !text-amber-700 dark:!text-amber-400 !bg-amber-50 dark:!bg-amber-900/30 hover:!bg-amber-100 dark:hover:!bg-amber-900/50 !rounded-md !transition-colors !cursor-pointer !flex !items-center !gap-1.5" onClick={() => {
                setTriageLoading(true); setTriageError(null);
                apiCaseTriage().then(r => { setTriageResults(r.cases || []); setTriageLoading(false); }).catch(e => { setTriageError(e.message); setTriageLoading(false); });
              }}>{triageResults ? <><span>↻</span> Refresh</> : <><Sparkles size={12} /> Run Triage</>}</button>
            </div>
            {triageLoading && (
              <div className="flex items-center gap-2.5 py-5 text-slate-500 dark:text-slate-400 text-xs">
                <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-amber-500 rounded-full" style={{ animation: "spin 0.8s linear infinite" }} />
                AI is analyzing your caseload...
              </div>
            )}
            {triageError && <div style={{ color: "#dc2626", fontSize: 12, padding: "8px 0" }}>{triageError}</div>}
            {!triageLoading && !triageResults && !triageError && (
              <div style={{ fontSize: 12, color: "#64748b", padding: "16px 0", textAlign: "center" }}>Click "Run Triage" to get AI-powered case prioritization</div>
            )}
            <div style={{ padding: "0 20px" }}>
            {triageResults && triageResults.map((t, i) => {
              const caseObj = allCases.find(cc => cc.id === t.id);
              return (
                <div key={t.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < triageResults.length - 1 ? "1px solid var(--c-border2)" : "none", cursor: caseObj ? "pointer" : "default" }} onClick={() => caseObj && onSelectCase(caseObj)}>
                  <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: t.urgency >= 8 ? "#dc2626" : t.urgency >= 5 ? "#e07a30" : "#d97706", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{t.urgency}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--c-text)" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.reason}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 font-medium">→ {t.action}</div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        );
      case "quick-notes":
        return <QuickNotesWidget key={widgetId} currentUser={currentUser} allCases={allCases} onSelectCase={onSelectCase} pinnedCaseIds={pinnedCaseIds} confirmDelete={confirmDelete} />;
      case "client-comm":
        return <UnreadClientCommWidget key={widgetId} allCases={allCases} onSelectCase={onSelectCase} />;
      default:
        if (widgetId.startsWith("custom-")) {
          return <CustomDashboardWidgetRenderer key={widgetId} widgetId={widgetId} />;
        }
        return null;
    }
  };

  const renderedGroups = useMemo(() => {
    const sized = layout.map(id => { const w = DASHBOARD_WIDGETS.find(x => x.id === id); if (w) return { id, size: w.size }; if (id.startsWith("custom-")) return { id, size: "half" }; return null; }).filter(Boolean);
    const groups = [];
    sized.forEach(item => {
      const last = groups[groups.length - 1];
      if (last && last.size === item.size && item.size !== "full") {
        last.ids.push(item.id);
      } else {
        groups.push({ size: item.size, ids: [item.id] });
      }
    });
    return groups;
  }, [layout]);

  return (
    <>
      {showModal && <NewCaseModal onSave={onAddRecord} onClose={() => setShowModal(false)} />}
      {showCustomize && <CustomizeDashboardModal layout={layout} setLayout={setLayout} userId={currentUser.id} onClose={() => setShowCustomize(false)} />}
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Good morning, {currentUser.name.split(" ")[0]}</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="!px-3 !py-2 !text-xs !font-medium !text-slate-600 dark:!text-slate-300 !bg-white dark:!bg-slate-800 !border !border-slate-200 dark:!border-slate-700 !rounded-lg hover:!bg-slate-50 dark:hover:!bg-slate-700 !transition-colors !cursor-pointer" onClick={() => setShowCustomize(true)}><Settings size={14} className="inline mr-1" />Customize</button>
          <button className="!px-4 !py-2 !text-xs !font-medium !text-white !bg-amber-500 hover:!bg-amber-600 !rounded-lg !transition-colors !border-none !cursor-pointer !shadow-sm" onClick={() => setShowModal(true)}><Plus size={14} className="inline mr-1" />New Case</button>
        </div>
      </div>
      <div className="content">
        {renderedGroups.map((group, gi) => {
          if (group.size === "quarter") {
            return (
              <div className="grid4" style={{ marginBottom: 20 }} key={`g${gi}`}>
                {group.ids.map(id => renderWidget(id))}
              </div>
            );
          }
          if (group.size === "half") {
            return (
              <div className="grid2" style={{ marginBottom: 20 }} key={`g${gi}`}>
                {group.ids.map(id => renderWidget(id))}
              </div>
            );
          }
          return (
            <div style={{ marginBottom: 20 }} key={`g${gi}`}>
              {group.ids.map(id => renderWidget(id))}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Cases View ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;


export default Dashboard;
