import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Download, Menu } from "lucide-react";
import {
  apiGetTimeEntries, apiCreateTimeEntry, apiUpdateTimeEntry, apiDeleteTimeEntry,
  apiGetCasesAll, apiUpdateTask, apiUpdateNote,
} from "../api.js";
import {
  today,
  PinnedSectionHeader,
} from "../shared.js";
function TimeLogView({ currentUser, allCases, tasks, caseNotes, correspondence = [], allUsers = [], onMenuToggle, pinnedCaseIds }) {
  const thisMonth = today.slice(0, 7);
  const [fromDate, setFromDate] = useState(thisMonth + "-01");
  const [toDate,   setToDate]   = useState(today);
  const [manualEntries, setManualEntries] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef(null);
  const [allCasesForLog, setAllCasesForLog] = useState([]);

  useEffect(() => {
    apiGetCasesAll().then(setAllCasesForLog).catch(() => setAllCasesForLog(allCases));
  }, [allCases]);

  useEffect(() => {
    apiGetTimeEntries(currentUser.id, fromDate, toDate)
      .then(setManualEntries)
      .catch(() => {});
  }, [currentUser.id, fromDate, toDate]);

  const setRange = (label) => {
    const now = new Date(today + "T00:00:00");
    if (label === "This Week") {
      const day = now.getDay();
      const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
      setFromDate(mon.toISOString().split("T")[0]);
      setToDate(today);
    } else if (label === "This Month") {
      setFromDate(today.slice(0, 7) + "-01");
      setToDate(today);
    } else if (label === "Last Month") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last  = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(first.toISOString().split("T")[0]);
      setToDate(last.toISOString().split("T")[0]);
    } else if (label === "Last 30 Days") {
      const d = new Date(now); d.setDate(d.getDate() - 29);
      setFromDate(d.toISOString().split("T")[0]);
      setToDate(today);
    } else if (label === "Last 90 Days") {
      const d = new Date(now); d.setDate(d.getDate() - 89);
      setFromDate(d.toISOString().split("T")[0]);
      setToDate(today);
    } else if (label === "This Year") {
      setFromDate(today.slice(0, 4) + "-01-01");
      setToDate(today);
    }
  };

  const rows = useMemo(() => {
    const result = [];
    const from = new Date(fromDate + "T00:00:00");
    const to   = new Date(toDate   + "T23:59:59");
    const inRange = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= from && d <= to;
    };

    const findCase = (id) => allCasesForLog.find(c => c.id === id);

    tasks.forEach(t => {
      const creditId = t.timeLogUser || t.completedBy || t.assigned;
      if (creditId !== currentUser.id) return;
      if (t.status !== "Completed" || !t.completedAt) return;
      if (!inRange(t.completedAt)) return;
      const cs = findCase(t.caseId);
      result.push({
        _source: "task", _id: t.id,
        date: t.completedAt,
        caseTitle: cs?.title || `Case #${t.caseId}`,
        caseType: cs?.caseType || "",
        detail: t.title,
        time: t.timeLogged || "",
      });
    });

    Object.entries(caseNotes).forEach(([caseId, notes]) => {
      (notes || []).forEach(note => {
        const creditId = note.timeLogUser || note.authorId;
        if (creditId !== currentUser.id) return;
        if (!inRange(note.createdAt)) return;
        const cs = findCase(Number(caseId));
        const summary = (note.body || "").slice(0, 100).replace(/\n/g, " ") + (note.body?.length > 100 ? "…" : "");
        result.push({
          _source: "note", _id: note.id,
          date: note.createdAt,
          caseTitle: cs?.title || `Case #${caseId}`,
          caseType: cs?.caseType || "",
          detail: summary,
          time: note.timeLogged || "",
        });
      });
    });

    const myCaseIds = new Set(allCasesForLog.filter(c =>
      [c.assignedAttorney, c.secondAttorney, c.caseManager, c.investigator, c.paralegal].includes(currentUser.id)
    ).map(c => c.id));
    correspondence.forEach(email => {
      if (!myCaseIds.has(email.caseId)) return;
      if (!inRange(email.receivedAt)) return;
      const cs = findCase(email.caseId);
      result.push({
        _source: "email", _id: email.id,
        date: email.receivedAt,
        caseTitle: cs?.title || `Case #${email.caseId}`,
        caseType: cs?.caseType || "",
        detail: email.subject || "(no subject)",
        time: "",
      });
    });

    manualEntries.forEach(me => {
      result.push({
        _source: "manual", _id: me.id,
        date: me.date,
        caseTitle: me.caseTitle || `Case #${me.caseId || "?"}`,
        caseType: me.caseType || "",
        detail: me.detail,
        time: me.time || "",
      });
    });

    result.sort((a, b) => new Date(b.date) - new Date(a.date));
    return result;
  }, [tasks, caseNotes, currentUser.id, allCasesForLog, fromDate, toDate, correspondence, manualEntries]);

  const fmtDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const exportCSV = () => {
    const headers = ["Date", "Case", "Case Type", "Description", "Time"];
    const escapeCell = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
    const csvRows = [
      headers.join(","),
      ...rows.map(r => [
        fmtDateTime(r.date), r.caseTitle, r.caseType, r.detail, r.time || "",
      ].map(escapeCell).join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `time-log-${currentUser.name.replace(/\s+/g, "-").toLowerCase()}-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (source, id, field, currentVal) => {
    setEditingCell({ key: `${source}-${id}`, field });
    setEditValue(currentVal || "");
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    const row = rows.find(r => `${r._source}-${r._id}` === editingCell.key);
    const field = editingCell.field;
    setEditingCell(null);
    if (!row || (row[field] || "") === editValue) return;

    if (row._source === "manual") {
      try {
        await apiUpdateTimeEntry(row._id, { [field]: editValue });
        setManualEntries(prev => prev.map(e => e.id === row._id ? { ...e, [field]: editValue } : e));
      } catch (err) { console.error(err); }
    } else if (row._source === "task") {
      try {
        const updates = field === "time" ? { timeLogged: editValue } : { title: editValue };
        await apiUpdateTask(row._id, updates);
      } catch (err) { console.error(err); }
    } else if (row._source === "note") {
      try {
        await apiUpdateNote(row._id, field === "time" ? { timeLogged: editValue } : { body: editValue });
      } catch (err) { console.error(err); }
    }
  };

  const handleDeleteManual = async (id) => {
    try {
      await apiDeleteTimeEntry(id);
      setManualEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleAddEntry = async (entry) => {
    try {
      const saved = await apiCreateTimeEntry(entry);
      setManualEntries(prev => [...prev, saved]);
      setShowAddForm(false);
    } catch (err) { alert("Failed to add entry: " + err.message); }
  };

  return (
    <>
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Time Log</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">{currentUser.name} · {rows.length} entr{rows.length !== 1 ? "ies" : "y"} · {fmtDateTime(fromDate)} – {fmtDateTime(toDate)}</p>
          </div>
        </div>
        <div className="topbar-actions flex gap-2">
          <button className="!px-3 !py-2 !text-xs !font-medium !text-white !bg-slate-700 dark:!bg-slate-600 hover:!bg-slate-600 dark:hover:!bg-slate-500 !rounded-lg !transition-colors !border-none !cursor-pointer !shadow-sm" onClick={() => setShowAddForm(true)}><Plus size={14} className="inline mr-1" />Add Entry</button>
          <button className="!px-4 !py-2 !text-xs !font-medium !text-white !bg-slate-800 dark:!bg-slate-700 hover:!bg-slate-700 dark:hover:!bg-slate-600 !rounded-lg !transition-colors !border-none !cursor-pointer !shadow-sm" disabled={rows.length === 0} onClick={exportCSV} title={rows.length === 0 ? "No activity in this range" : "Download CSV"}><Download size={14} className="inline mr-1" />Export CSV</button>
        </div>
      </div>

      <div className="content">
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: 150 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: 150 }} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["This Week", "This Month", "Last Month", "Last 30 Days", "Last 90 Days", "This Year"].map(label => (
                <button key={label} className="btn btn-outline btn-sm" style={{ fontSize: 11 }} onClick={() => setRange(label)}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Time Entries</div>
            <span style={{ fontSize: 12, color: "#64748b" }}>{rows.length} entries</span>
          </div>
          {rows.length === 0 ? (
            <div className="empty">No activity recorded for this date range.</div>
          ) : (
            <div className="table-wrap">
              <table className="mobile-cards">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>Date</th>
                    <th>Case</th>
                    <th>Description</th>
                    <th style={{ whiteSpace: "nowrap", width: 90 }}>Time</th>
                    <th style={{ width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r._source}-${r._id}-${i}`}>
                      <td data-label="Date" style={{ whiteSpace: "nowrap", fontSize: 12, color: "var(--c-text2)" }}>{fmtDateTime(r.date)}</td>
                      <td data-label="Case">
                        <div style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 500 }}>{r.caseTitle}</div>
                        {r.caseType && <div style={{ fontSize: 10, color: "#64748b" }}>{r.caseType}</div>}
                      </td>
                      <td data-label="Detail" style={{ fontSize: 12, color: "#1e293b", maxWidth: 420 }}>
                        {editingCell?.key === `${r._source}-${r._id}` && editingCell.field === "detail" ? (
                          <input ref={editRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit} onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingCell(null); }}
                            style={{ width: "100%", fontSize: 12, padding: "4px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)", boxSizing: "border-box" }} />
                        ) : (
                          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", cursor: "pointer", minHeight: 18 }}
                            onClick={() => startEdit(r._source, r._id, "detail", r.detail)}
                            title="Click to edit"
                          >{r.detail || <span style={{ color: "#64748b", fontStyle: "italic" }}>Click to add description</span>}</div>
                        )}
                      </td>
                      <td data-label="Time" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {editingCell?.key === `${r._source}-${r._id}` && editingCell.field === "time" ? (
                          <input ref={editRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEdit} onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingCell(null); }}
                            style={{ width: 70, fontSize: 12, padding: "4px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg2)", color: "var(--c-text)" }} />
                        ) : (
                          <span style={{ cursor: "pointer", color: r.time ? "var(--c-text2)" : "#64748b" }}
                            onClick={() => startEdit(r._source, r._id, "time", r.time)}
                            title="Click to edit"
                          >{r.time || "—"}</span>
                        )}
                      </td>
                      <td data-label="">
                        {r._source === "manual" && (
                          <button onClick={() => handleDeleteManual(r._id)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#64748b", padding: 2, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Delete entry">✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddTimeEntryModal
          allCases={allCases}
          currentUser={currentUser}
          tasks={tasks}
          caseNotes={caseNotes}
          correspondence={correspondence}
          allUsers={allUsers}
          onSave={handleAddEntry}
          onClose={() => setShowAddForm(false)}
          pinnedCaseIds={pinnedCaseIds}
        />
      )}
    </>
  );
}

function AddTimeEntryModal({ allCases, currentUser, tasks, caseNotes, correspondence, allUsers, onSave, onClose, pinnedCaseIds }) {
  const [caseId, setCaseId] = useState(null);
  const [date, setDate] = useState(today);
  const [detail, setDetail] = useState("");
  const [time, setTime] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState("all");

  const todayCaseIds = useMemo(() => {
    const ids = new Set();
    const todayStart = new Date(today + "T00:00:00");
    const todayEnd = new Date(today + "T23:59:59");
    const isToday = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= todayStart && d <= todayEnd;
    };
    tasks.forEach(t => {
      const creditId = t.timeLogUser || t.completedBy || t.assigned;
      if (creditId === currentUser.id && t.status === "Completed" && isToday(t.completedAt)) ids.add(t.caseId);
    });
    Object.entries(caseNotes).forEach(([cid, notes]) => {
      (notes || []).forEach(note => {
        const creditId = note.timeLogUser || note.authorId;
        if (creditId === currentUser.id && isToday(note.createdAt)) ids.add(Number(cid));
      });
    });
    const userEmail = (allUsers.find(u => u.id === currentUser.id) || {}).email || "";
    (correspondence || []).forEach(email => {
      if (userEmail && email.fromEmail?.toLowerCase() === userEmail.toLowerCase() && isToday(email.receivedAt)) ids.add(email.caseId);
    });
    return ids;
  }, [tasks, caseNotes, correspondence, currentUser.id, allUsers]);

  const filteredCases = useMemo(() => {
    let cases = allCases.filter(c => c.status !== "Closed" || todayCaseIds.has(c.id));
    if (caseFilter === "myMatters") {
      cases = cases.filter(c => [c.assignedAttorney, c.secondAttorney, c.caseManager, c.investigator, c.paralegal].includes(currentUser.id));
    }
    if (caseSearch) {
      const q = caseSearch.toLowerCase();
      cases = cases.filter(c => (c.title || "").toLowerCase().includes(q) || (c.clientName || "").toLowerCase().includes(q) || (c.caseNum || "").toLowerCase().includes(q));
    }
    const todayGroup = cases.filter(c => todayCaseIds.has(c.id));
    const otherGroup = cases.filter(c => !todayCaseIds.has(c.id));
    todayGroup.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    otherGroup.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return { todayGroup, otherGroup };
  }, [allCases, caseFilter, caseSearch, todayCaseIds, currentUser.id]);

  const selectedCase = allCases.find(c => c.id === caseId);

  return (
    <div className="case-overlay" style={{ left: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
      <div className="login-box" style={{ maxWidth: 440, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "transparent", border: "none", fontSize: 18, color: "#64748b", cursor: "pointer", lineHeight: 1 }}>✕</button>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, color: "var(--c-text-h)", marginBottom: 16 }}>Add Time Entry</div>

        <div className="form-group">
          <label>Case</label>
          {selectedCase ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{selectedCase.title}</div>
                {selectedCase.caseType && <div style={{ fontSize: 10, color: "#64748b" }}>{selectedCase.caseType}</div>}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setCaseId(null)}>Change</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[
                  { key: "all", label: "All Cases" },
                  { key: "myMatters", label: "My Cases" },
                ].map(f => (
                  <button key={f.key}
                    className={`btn btn-sm ${caseFilter === f.key ? "btn-primary" : "btn-outline"}`}
                    style={{ fontSize: 11 }}
                    onClick={() => setCaseFilter(f.key)}
                  >{f.label}</button>
                ))}
              </div>
              <input
                placeholder="Search cases..."
                value={caseSearch}
                onChange={e => setCaseSearch(e.target.value)}
                style={{ width: "100%", marginBottom: 8 }}
              />
              {(() => {
                const tlPIds = new Set(pinnedCaseIds);
                const allTlCases = [...filteredCases.todayGroup, ...filteredCases.otherGroup];
                const tlPinned = allTlCases.filter(c => tlPIds.has(c.id));
                const tlToday = filteredCases.todayGroup.filter(c => !tlPIds.has(c.id));
                const tlOther = filteredCases.otherGroup.filter(c => !tlPIds.has(c.id));
                const tlItem = (c) => (
                  <div key={c.id} onClick={() => setCaseId(c.id)}
                    style={{ padding: "8px 10px", cursor: "pointer", borderBottom: "1px solid #e2e8f0", fontSize: 13 }}
                    onMouseOver={e => e.currentTarget.style.background = "#F7F8FA"} onMouseOut={e => e.currentTarget.style.background = ""}>
                    <div style={{ fontWeight: 500, color: "#1e293b" }}>{c.title}</div>
                    {c.clientName && <span style={{ fontSize: 10, color: "#64748b" }}>{c.clientName}</span>}
                  </div>
                );
                return (
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                {tlPinned.length > 0 && (
                  <>
                    <PinnedSectionHeader />
                    {tlPinned.map(tlItem)}
                  </>
                )}
                {tlToday.length > 0 && (
                  <>
                    <div style={{ padding: "6px 10px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 1 }}>Touched Today</div>
                    {tlToday.map(tlItem)}
                  </>
                )}
                {tlOther.length > 0 && (
                  <>
                    {(tlPinned.length > 0 || tlToday.length > 0) && (
                      <div style={{ padding: "6px 10px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, background: "#f8fafc", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 1 }}>All Cases</div>
                    )}
                    {tlOther.map(tlItem)}
                  </>
                )}
                {allTlCases.length === 0 && (
                  <div style={{ padding: 16, fontSize: 12, color: "#64748b", textAlign: "center" }}>No cases match your filters.</div>
                )}
              </div>
                );
              })()}
            </>
          )}
        </div>

        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input placeholder="e.g. 1.5, 0:30" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3}
            placeholder="Description of work performed..."
            style={{ resize: "vertical", fontFamily: "inherit" }} />
        </div>

        <button className="btn btn-gold" style={{ width: "100%", padding: 10 }} disabled={!caseId} onClick={() => onSave({ caseId, date, detail, time })}>
          Add Entry
        </button>
        <button className="btn btn-outline" style={{ width: "100%", marginTop: 10 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}


export default TimeLogView;
