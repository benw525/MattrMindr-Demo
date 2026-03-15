import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Calendar, Search, Menu, Check } from "lucide-react";
import {
  apiSavePreferences,
  apiGetCalendarFeeds,
  apiCreateCalendarFeed,
  apiUpdateCalendarFeed,
  apiDeleteCalendarFeed,
  apiGetOutlookEvents,
  apiSyncAllDeadlinesToOutlook,
  apiGetMsCalendarSettings,
  apiUpdateMsCalendarSettings,
} from "../api.js";
import {
  fmt,
  daysUntil,
  urgencyColor,
  Badge,
  Avatar,
  today,
  newId,
  SortTh,
  StaffSearchField,
  PinnedSectionHeader,
  PAGE_SIZE,
  COURT_RULES,
} from "../shared.js";
function parseICalText(text, calName, allCases) {
  const events = [];
  const lines = text.replace(/\r\n /g, "").replace(/\r\n\t/g, "").split(/\r?\n/);
  let inEvent = false, cur = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") { inEvent = true; cur = {}; }
    else if (line === "END:VEVENT") {
      if (cur.date && cur.title) {
        let matchedCaseId = null;
        if (allCases && allCases.length) {
          const titleLower = cur.title.toLowerCase();
          const descLower = (cur.notes || "").toLowerCase();
          const combined = titleLower + " " + descLower;
          for (const c of allCases) {
            if (c.caseNum && combined.includes(c.caseNum.toLowerCase())) { matchedCaseId = c.id; break; }
            if (c.shortCaseNum && combined.includes(c.shortCaseNum.toLowerCase())) { matchedCaseId = c.id; break; }
          }
          if (!matchedCaseId) {
            for (const c of allCases) {
              if (c.clientName && c.clientName.length > 3 && combined.includes(c.clientName.toLowerCase())) { matchedCaseId = c.id; break; }
            }
          }
        }
        events.push({ ...cur, id: newId(), source: calName, isExternal: true, caseId: matchedCaseId });
      }
      inEvent = false; cur = {};
    } else if (inEvent) {
      if (line.startsWith("SUMMARY:")) cur.title = line.slice(8).trim();
      else if (line.startsWith("DTSTART")) {
        const val = line.includes(":") ? line.split(":").slice(1).join(":") : "";
        const d = val.replace(/T.*/,"");
        if (d.length === 8) cur.date = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
      }
      else if (line.startsWith("DESCRIPTION:")) cur.notes = line.slice(12).trim().slice(0,120);
      else if (line.startsWith("LOCATION:")) cur.location = line.slice(9).trim();
      else if (line.startsWith("UID:")) cur.uid = line.slice(4).trim();
    }
  }
  return events;
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────
function CalendarGrid({ deadlines, tasks, allCases, externalEvents, outlookEvents, onSelectCase, currentUser }) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);

  const calPrefs = currentUser?.preferences?.calendarToggles || {};
  const [showDeadlines, setShowDeadlines] = useState(() => calPrefs.deadlines !== undefined ? calPrefs.deadlines : true);
  const [showTasks, setShowTasks] = useState(() => calPrefs.tasks !== undefined ? calPrefs.tasks : true);
  const [showCourtDates, setShowCourtDates] = useState(() => calPrefs.courtDates !== undefined ? calPrefs.courtDates : true);
  const [showExternal, setShowExternal] = useState(() => calPrefs.external !== undefined ? calPrefs.external : true);
  const [showOutlook, setShowOutlook] = useState(() => calPrefs.outlook !== undefined ? calPrefs.outlook : true);
  const calMounted = useRef(false);
  const saveCalToggle = useCallback((key, val) => {
    const cur = currentUser?.preferences?.calendarToggles || {};
    apiSavePreferences({ calendarToggles: { ...cur, [key]: val } }).catch(() => {});
  }, [currentUser?.preferences?.calendarToggles]);
  useEffect(() => { if (!calMounted.current) return; saveCalToggle("deadlines", showDeadlines); }, [showDeadlines]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!calMounted.current) return; saveCalToggle("tasks", showTasks); }, [showTasks]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!calMounted.current) return; saveCalToggle("courtDates", showCourtDates); }, [showCourtDates]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!calMounted.current) return; saveCalToggle("external", showExternal); }, [showExternal]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!calMounted.current) return; saveCalToggle("outlook", showOutlook); }, [showOutlook]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { calMounted.current = true; }, []);

  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDow + 1;
    if (dayNum < 1 || dayNum > daysInMonth) { cells.push(null); continue; }
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
    cells.push(dateStr);
  }

  const KIND_COLORS = { deadline: null, task: "#8b5cf6", "court-date": "#d97706", trial: "#dc2626", mediation: "#0891b2", deposition: "#7c3aed", external: "#5588cc", outlook: "#0078d4" };
  const KIND_ICONS = { deadline: "📋", task: "✅", "court-date": "⚖", trial: "⚖", mediation: "🤝", deposition: "📝", external: "📅", outlook: "📨" };
  const KIND_LABELS = { deadline: "Deadline", task: "Task", "court-date": "Court Date", trial: "Trial", mediation: "Mediation", deposition: "Deposition", external: "External", outlook: "Outlook" };

  const eventsByDate = useMemo(() => {
    const map = {};
    const addTo = (dateStr, item) => { if (!dateStr) return; if (!map[dateStr]) map[dateStr] = []; map[dateStr].push(item); };
    if (showDeadlines) deadlines.forEach(d => { if (d.date) addTo(d.date, { ...d, kind: "deadline" }); });
    if (showTasks) (tasks || []).forEach(t => { if (t.due && t.status !== "Completed") addTo(t.due, { id: t.id, title: t.title, date: t.due, kind: "task", priority: t.priority, status: t.status, caseId: t.caseId, assigned: t.assigned }); });
    if (showCourtDates) (allCases || []).forEach(c => {
      if (c.status !== "Active") return;
      if (c.nextCourtDate) addTo(c.nextCourtDate, { id: `court-${c.id}`, title: `${c.clientName || c.title} — Court Date`, date: c.nextCourtDate, kind: "court-date", caseId: c.id });
      if (c.trialDate) addTo(c.trialDate, { id: `trial-${c.id}`, title: `${c.clientName || c.title} — Trial`, date: c.trialDate, kind: "trial", caseId: c.id });
      if (c.statuteOfLimitationsDate) addTo(c.statuteOfLimitationsDate, { id: `sol-${c.id}`, title: `${c.clientName || c.title} — SOL Deadline`, date: c.statuteOfLimitationsDate, kind: "sol-deadline", caseId: c.id });
    });
    if (showExternal) externalEvents.forEach(e => { if (e.date) addTo(e.date, { ...e, kind: "external" }); });
    if (showOutlook) (outlookEvents || []).forEach(e => { if (e.date) addTo(e.date, { ...e, kind: "outlook" }); });
    return map;
  }, [deadlines, tasks, allCases, externalEvents, outlookEvents, showDeadlines, showTasks, showCourtDates, showExternal, showOutlook]);

  const selectedEvents = selected ? (eventsByDate[selected] || []) : [];

  const todayStr = today;
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); setSelected(null); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); setSelected(null); };

  const chipColor = (item) => {
    if (KIND_COLORS[item.kind]) return KIND_COLORS[item.kind];
    return urgencyColor(daysUntil(item.date));
  };

  const chipPrefix = (item) => KIND_ICONS[item.kind] || "";

  const toggleStyle = (active) => ({ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", opacity: active ? 1 : 0.4, transition: "opacity 0.15s", userSelect: "none" });

  return (
    <div className="mobile-grid-1" style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div className="card cal-card" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={prevMonth}>← Prev</button>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, color: "var(--c-text-h)", fontWeight: 600 }}>{monthName}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-outline btn-sm" onClick={() => { setCalMonth(now.getMonth()); setCalYear(now.getFullYear()); setSelected(todayStr); }}>Today</button>
            <button className="btn btn-outline btn-sm" onClick={nextMonth}>Next →</button>
          </div>
        </div>

        <div style={{ padding: "8px 18px", borderBottom: "1px solid var(--c-border)", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 2 }}>Show:</span>
          <div style={toggleStyle(showDeadlines)} onClick={() => setShowDeadlines(v => !v)}>
            <input type="checkbox" checked={showDeadlines} readOnly style={{ accentColor: "#e07a30", width: 13, height: 13, cursor: "pointer" }} />
            <span style={{ fontSize: 11, color: "var(--c-text2)" }}>📋 Deadlines</span>
          </div>
          <div style={toggleStyle(showTasks)} onClick={() => setShowTasks(v => !v)}>
            <input type="checkbox" checked={showTasks} readOnly style={{ accentColor: "#8b5cf6", width: 13, height: 13, cursor: "pointer" }} />
            <span style={{ fontSize: 11, color: "var(--c-text2)" }}>✅ Tasks</span>
          </div>
          <div style={toggleStyle(showCourtDates)} onClick={() => setShowCourtDates(v => !v)}>
            <input type="checkbox" checked={showCourtDates} readOnly style={{ accentColor: "#d97706", width: 13, height: 13, cursor: "pointer" }} />
            <span style={{ fontSize: 11, color: "var(--c-text2)" }}>⚖ Court Dates</span>
          </div>
          <div style={toggleStyle(showExternal)} onClick={() => setShowExternal(v => !v)}>
            <input type="checkbox" checked={showExternal} readOnly style={{ accentColor: "#5588cc", width: 13, height: 13, cursor: "pointer" }} />
            <span style={{ fontSize: 11, color: "var(--c-text2)" }}>📅 External</span>
          </div>
          {(outlookEvents || []).length > 0 && (
            <div style={toggleStyle(showOutlook)} onClick={() => setShowOutlook(v => !v)}>
              <input type="checkbox" checked={showOutlook} readOnly style={{ accentColor: "#0078d4", width: 13, height: 13, cursor: "pointer" }} />
              <span style={{ fontSize: 11, color: "var(--c-text2)" }}>📨 Outlook</span>
            </div>
          )}
        </div>

        <div className="cal-grid-wrap">
        <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--c-border)" }}>
          {DOW.map(d => <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{d}</div>)}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {cells.map((dateStr, i) => {
            if (!dateStr) return <div key={i} style={{ minHeight: 80, borderRight: "1px solid var(--c-border2)", borderBottom: "1px solid var(--c-border2)", background: "var(--c-card)" }} />;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selected;
            const events = eventsByDate[dateStr] || [];
            const dayNum = Number(dateStr.split("-")[2]);
            const borderR = (i + 1) % 7 !== 0 ? "1px solid var(--c-border2)" : "none";
            return (
              <div key={dateStr} onClick={() => setSelected(isSelected ? null : dateStr)}
                style={{ minHeight: 80, borderRight: borderR, borderBottom: "1px solid var(--c-border2)", padding: "6px 7px", cursor: "pointer", background: isSelected ? "#f1f5f9" : isToday ? "#f1f5f9" : "transparent", transition: "background 0.1s", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#f59e0b" : "#64748b", width: 22, height: 22, borderRadius: "50%", background: isToday ? "rgba(245,158,11,0.08)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{dayNum}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {events.slice(0, 3).map((ev, ei) => {
                    const col = chipColor(ev);
                    return (
                      <div key={ei} style={{ background: col + "22", border: `1px solid ${col}55`, borderRadius: 3, padding: "1px 4px", fontSize: 10, color: col, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {chipPrefix(ev)} {ev.title?.slice(0, 22)}
                      </div>
                    );
                  })}
                  {events.length > 3 && <div style={{ fontSize: 10, color: "#64748b", paddingLeft: 2 }}>+{events.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
        </div>
        </div>
      </div>

      <div className="card mobile-full" style={{ width: 320, flexShrink: 0 }}>
        <div className="card-header">
          <div className="card-title">{selected ? fmt(selected) : "Select a date"}</div>
          {selected && <span style={{ fontSize: 12, color: "#64748b" }}>{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}</span>}
        </div>
        {!selected && <div className="empty" style={{ padding: "30px 20px" }}>Click any date to see events.</div>}
        {selected && selectedEvents.length === 0 && <div className="empty" style={{ padding: "30px 20px" }}>No events on this date.</div>}
        {selected && (() => {
          const grouped = {};
          selectedEvents.forEach(ev => { const k = ev.kind; if (!grouped[k]) grouped[k] = []; grouped[k].push(ev); });
          const order = ["deadline","task","court-date","trial","mediation","deposition","external","outlook"];
          return order.filter(k => grouped[k]).map(kind => (
            <div key={kind}>
              <div style={{ padding: "6px 16px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", background: "var(--c-bg)", borderBottom: "1px solid var(--c-border2)" }}>
                {KIND_ICONS[kind]} {KIND_LABELS[kind]}s ({grouped[kind].length})
              </div>
              {grouped[kind].map((ev, i) => {
                const col = chipColor(ev);
                const cs = ev.caseId ? allCases.find(c => c.id === ev.caseId) : null;
                return (
                  <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid var(--c-border2)", borderLeft: `3px solid ${col}` }}>
                    <div style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600, marginBottom: 3 }}>{ev.title}</div>
                    {kind === "deadline" && ev.type && <Badge label={ev.type} />}
                    {kind === "deadline" && ev.rule && <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>{ev.rule}</div>}
                    {kind === "task" && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
                        {ev.priority && <Badge label={ev.priority} />}
                        <span style={{ fontSize: 11, color: "#64748b" }}>{ev.status || "Open"}</span>
                      </div>
                    )}
                    {kind === "external" && <div style={{ fontSize: 11, color: "#5588cc", marginTop: 2 }}>📅 {ev.source}</div>}
                    {kind === "outlook" && <div style={{ fontSize: 11, color: "#0078d4", marginTop: 2 }}>📨 Outlook Calendar</div>}
                    {ev.location && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>📍 {ev.location}</div>}
                    {ev.notes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontStyle: "italic" }}>{(ev.notes || "").slice(0, 80)}</div>}
                    {cs && (
                      <div style={{ marginTop: 4 }}>
                        <span onClick={() => onSelectCase && onSelectCase(cs)} style={{ fontSize: 11, color: "#4F7393", cursor: "pointer", fontWeight: 500, textDecoration: "underline" }}>
                          {cs.clientName || cs.title}{cs.caseNum ? ` (${cs.caseNum})` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

// ─── iCal Feeds Manager ───────────────────────────────────────────────────────
function ICalManager({ externalEvents, setExternalEvents, allCases }) {
  const [feeds, setFeeds] = useState([]);
  const [newFeed, setNewFeed] = useState({ name: "", url: "" });
  const [importing, setImporting] = useState(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    apiGetCalendarFeeds().then(saved => {
      const mapped = saved.map(f => ({ id: f.id, name: f.name, url: f.url, active: f.active, status: "pending", count: 0, dbId: f.id }));
      setFeeds(mapped);
      setLoaded(true);
      mapped.filter(f => f.active).forEach(f => syncFeed(f));
    }).catch(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncFeed = async (feed) => {
    setImporting(feed.id);
    setError("");
    try {
      let url = feed.url.trim();
      const proxyUrl = `/api/calendar-feeds/proxy?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { credentials: "include" });
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { const j = await res.json(); errMsg = j.error || errMsg; } catch {}
        throw new Error(errMsg);
      }
      const text = await res.text();
      const events = parseICalText(text, feed.name, allCases);
      setExternalEvents(prev => [...prev.filter(e => e.source !== feed.name), ...events]);
      setFeeds(f => f.map(x => x.id === feed.id ? { ...x, status: "ok", count: events.length, lastSync: new Date().toLocaleTimeString() } : x));
    } catch (e) {
      setFeeds(f => f.map(x => x.id === feed.id ? { ...x, status: "error", error: e.message } : x));
      setError(`Could not import "${feed.name}": ${e.message}. Try the public sharing URL from your calendar app's settings.`);
    } finally {
      setImporting(null);
    }
  };

  const addFeed = async () => {
    if (!newFeed.name.trim() || !newFeed.url.trim()) return;
    try {
      const saved = await apiCreateCalendarFeed({ name: newFeed.name.trim(), url: newFeed.url.trim() });
      const feed = { id: saved.id, name: saved.name, url: saved.url, active: true, status: "pending", count: 0, dbId: saved.id };
      setFeeds(f => [...f, feed]);
      setNewFeed({ name: "", url: "" });
      syncFeed(feed);
    } catch (e) {
      setError("Failed to save feed: " + e.message);
    }
  };

  const removeFeed = async (id, name) => {
    try {
      await apiDeleteCalendarFeed(id);
    } catch (e) { /* ignore */ }
    setFeeds(f => f.filter(x => x.id !== id));
    setExternalEvents(prev => prev.filter(e => e.source !== name));
  };

  const toggleActive = async (feed) => {
    const newActive = !feed.active;
    try {
      await apiUpdateCalendarFeed(feed.id, { active: newActive });
    } catch (e) { /* ignore */ }
    setFeeds(f => f.map(x => x.id === feed.id ? { ...x, active: newActive } : x));
    if (!newActive) {
      setExternalEvents(prev => prev.filter(e => e.source !== feed.name));
    } else {
      syncFeed({ ...feed, active: true });
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">📅 Internet Calendar Feeds</div>
          <span style={{ fontSize: 12, color: "#64748b" }}>{feeds.length} feed{feeds.length !== 1 ? "s" : ""} · {externalEvents.length} events imported</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--c-text2)", marginBottom: 16, lineHeight: 1.6 }}>
            Add any iCal/webcal feed URL to overlay external events on the calendar — court dockets, Google Calendar, Outlook, bar association deadlines, etc. Feeds are saved and auto-imported on each session.
            <br /><span style={{ fontSize: 11, color: "#64748b" }}>Tip: In Google Calendar, go to the calendar's settings → "Integrate calendar" → copy the public iCal address. In Outlook, use File → Account Settings → Internet Calendars.</span>
          </div>

          <div style={{ background: "var(--c-bg)", border: "1px solid var(--c-border3)", borderRadius: 7, padding: 16, marginBottom: feeds.length ? 16 : 0 }}>
            <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Add New Calendar Feed</div>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Calendar Name</label>
                <input value={newFeed.name} onChange={e => setNewFeed(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Court Docket, Google Calendar" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>iCal / webcal URL</label>
                <input value={newFeed.url} onChange={e => setNewFeed(p => ({ ...p, url: e.target.value }))} placeholder="https://… or webcal://…" />
              </div>
            </div>
            <button className="btn btn-gold" onClick={addFeed} disabled={!newFeed.name.trim() || !newFeed.url.trim()}>
              Import Feed
            </button>
          </div>

          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", marginTop: 12, fontSize: 12, color: "#cc8888", lineHeight: 1.5 }}>
              ⚠ {error}
            </div>
          )}

          {feeds.map(feed => (
            <div key={feed.id} style={{ background: "var(--c-bg)", border: "1px solid var(--c-border3)", borderRadius: 7, padding: "12px 14px", marginTop: 10, display: "flex", alignItems: "center", gap: 12, opacity: feed.active ? 1 : 0.5, transition: "opacity 0.15s" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <div style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600 }}>{feed.name}</div>
                  {feed.status === "ok" && <span style={{ fontSize: 10, background: "#dcfce7", color: "#1e293b", padding: "1px 6px", borderRadius: 3, fontWeight: 600 }}>✓ {feed.count} events</span>}
                  {feed.status === "error" && <span style={{ fontSize: 10, background: "#fee2e2", color: "#1e293b", padding: "1px 6px", borderRadius: 3, fontWeight: 600 }}>✗ Error</span>}
                  {feed.status === "pending" && <span style={{ fontSize: 10, color: "#64748b" }}>Importing…</span>}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{feed.url}</div>
                {feed.lastSync && <div style={{ fontSize: 10, color: "#059669", marginTop: 2 }}>Last synced: {feed.lastSync}</div>}
                {feed.status === "error" && feed.error && <div style={{ fontSize: 11, color: "#994444", marginTop: 3 }}>{feed.error}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button className="btn btn-outline btn-sm" onClick={() => toggleActive(feed)} title={feed.active ? "Disable feed" : "Enable feed"}>
                  {feed.active ? "On" : "Off"}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => syncFeed(feed)} disabled={importing === feed.id || !feed.active}>
                  {importing === feed.id ? "…" : "↻ Sync"}
                </button>
                <button className="btn btn-outline btn-sm" style={{ color: "#e05252", borderColor: "#fca5a5" }} onClick={() => removeFeed(feed.id, feed.name)}>✕</button>
              </div>
            </div>
          ))}

          {feeds.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0 4px", color: "#64748b", fontSize: 13 }}>
              No calendar feeds added yet. Paste a webcal or iCal URL above to get started.
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Where to find iCal URLs</div></div>
        <div style={{ padding: 20 }}>
          {[
            ["Google Calendar", "Calendar Settings → Integrate calendar → Public address in iCal format"],
            ["Outlook / Microsoft 365", "Calendar → Share → Publish to web → Copy ICS link"],
            ["Apple Calendar (iCloud)", "iCloud.com → Calendar → Share → Copy Public Calendar URL"],
            ["Court Dockets (PACER/Odyssey)", "Check your court's website for a published calendar feed, or use a third-party court-alert service that provides iCal export"],
            ["Bar Association Calendars", "Most state bar websites publish a CLE/events calendar — look for an iCal or .ics download link"],
          ].map(([src, tip]) => (
            <div key={src} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--c-border2)" }}>
              <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600, width: 180, flexShrink: 0 }}>{src}</div>
              <div style={{ fontSize: 12, color: "var(--c-text2)", lineHeight: 1.5 }}>{tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
const PI_DEADLINE_TYPES = [
  "Filing", "Discovery", "Motion", "Expert", "Pleading", "Hearing", "Trial", "Deposition", "Mediation",
  "Statute of Limitations", "Demand Letter", "Complaint", "Answer", "Service of Process",
  "Initial Disclosures", "Interrogatories", "Requests for Production", "Requests for Admission",
  "Independent Medical Exam", "Case Management Conference", "Pretrial Conference",
  "Settlement Conference", "Arbitration", "Court Appearance", "Status Conference",
  "Scheduling Order", "Motion to Compel", "Summary Judgment", "Motions in Limine",
  "Jury Selection", "Client Meeting", "Medical Records Request", "Medical Records Follow-Up",
  "Insurance Claim", "PIP/MedPay Deadline", "UM/UIM Claim", "Lien Resolution",
  "Demand Package", "Policy Limits Demand", "Offer Response", "Treatment Completion",
  "Maximum Medical Improvement", "Letter of Protection", "Subpoena",
  "Appeal Deadline", "Post-Trial Motion", "Case Review", "Follow-Up", "Other"
];

function DeadlinesView({ deadlines, tasks, onAddDeadline, onUpdateDeadline, onDeleteDeadline, allCases, calcInputs, setCalcInputs, calcResult, runCalc, currentUser, onMenuToggle, pinnedCaseIds, onSelectCase, confirmDelete, msStatus }) {
  const canDeleteDeadline = ["Case Manager", "Paralegal", "Attorney", "App Admin"].some(r => (currentUser.roles || [currentUser.role]).includes(r));
  const [tab, setTab] = useState("calendar");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("asc");
  const [externalEvents, setExternalEvents] = useState([]);
  const [outlookEvents, setOutlookEvents] = useState([]);
  const [outlookCalSync, setOutlookCalSync] = useState(false);
  const [outlookSyncTypes, setOutlookSyncTypes] = useState([]);
  const [outlookSyncing, setOutlookSyncing] = useState(false);
  const [editingDlId, setEditingDlId] = useState(null);
  const [editingDlTitle, setEditingDlTitle] = useState("");
  const [newDl, setNewDl] = useState({ caseId: allCases.find(c => c.status === "Active")?.id || 1, title: "", date: today, type: "Filing", rule: "", assigned: currentUser.id });
  const [dlCaseSearch, setDlCaseSearch] = useState("");
  const [dlCaseDropOpen, setDlCaseDropOpen] = useState(false);

  useEffect(() => {
    if (!msStatus?.connected) return;
    apiGetMsCalendarSettings().then(r => { setOutlookCalSync(r.calendarSync); setOutlookSyncTypes(r.syncDeadlineTypes || []); }).catch(() => {});
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
    apiGetOutlookEvents(start, end).then(evts => {
      setOutlookEvents(evts.filter(e => !e.isMattrMindr).map(e => ({ ...e, kind: "outlook", source: "Outlook" })));
    }).catch(() => {});
  }, [msStatus?.connected]);

  const handleToggleOutlookSync = async () => {
    const newVal = !outlookCalSync;
    setOutlookCalSync(newVal);
    try {
      await apiUpdateMsCalendarSettings({ calendarSync: newVal });
      if (newVal) {
        setOutlookSyncing(true);
        try { await apiSyncAllDeadlinesToOutlook(); } catch {}
        setOutlookSyncing(false);
      }
    } catch { setOutlookCalSync(!newVal); }
  };

  const handleToggleSyncType = async (type) => {
    let newTypes;
    if (outlookSyncTypes.includes(type)) {
      newTypes = outlookSyncTypes.filter(t => t !== type);
      if (newTypes.length === 0) newTypes = [];
    } else {
      newTypes = [...outlookSyncTypes, type];
    }
    const prev = outlookSyncTypes;
    setOutlookSyncTypes(newTypes);
    try { await apiUpdateMsCalendarSettings({ syncDeadlineTypes: newTypes }); } catch { setOutlookSyncTypes(prev); }
  };

  const handleSort = (col) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } };

  const existingTypes = Array.from(new Set(deadlines.map(d => d.type).filter(Boolean)));
  const allTypes = Array.from(new Set([...PI_DEADLINE_TYPES, ...existingTypes]));
  const types = ["All", ...allTypes.sort()];
  const sorted = useMemo(() => {
    let list = deadlines.filter(d => {
      if (typeFilter !== "All" && d.type !== typeFilter) return false;
      if (search) { const q = search.toLowerCase(); const cs = allCases.find(c => c.id === d.caseId); return d.title.toLowerCase().includes(q) || (cs?.title || "").toLowerCase().includes(q) || (cs?.caseNum || "").toLowerCase().includes(q); }
      return true;
    });
    list.sort((a, b) => {
      let av = "", bv = "";
      if (sortCol === "date") { av = a.date || "9999"; bv = b.date || "9999"; }
      else if (sortCol === "title") { av = a.title || ""; bv = b.title || ""; }
      else if (sortCol === "type") { av = a.type || ""; bv = b.type || ""; }
      else if (sortCol === "case") { av = allCases.find(c => c.id === a.caseId)?.title || ""; bv = allCases.find(c => c.id === b.caseId)?.title || ""; }
      return (sortDir === "asc" ? 1 : -1) * av.localeCompare(bv);
    });
    return list;
  }, [deadlines, typeFilter, search, sortCol, sortDir, allCases]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [typeFilter, search, sortCol]);

  return (
    <>
      <div className="topbar !bg-white dark:!bg-slate-900 !border-b-slate-200 dark:!border-b-slate-700">
        <div className="flex items-center gap-3">
          <button className="hamburger-btn" onClick={onMenuToggle}><Menu size={20} /></button>
          <div>
            <h1 className="!text-xl !font-semibold !text-slate-900 dark:!text-slate-100 !font-['Inter']">Calendar</h1>
            <p className="!text-xs !text-slate-500 dark:!text-slate-400 !mt-0.5">{deadlines.filter(d => daysUntil(d.date) < 0).length} overdue · {deadlines.filter(d => { const n = daysUntil(d.date); return n >= 0 && n <= 7; }).length} this week · {deadlines.length} deadlines{externalEvents.length ? ` · ${externalEvents.length} external` : ""}</p>
          </div>
        </div>
      </div>
      <div className="content">
        <div className="tabs">
          {[["calendar","📅 Calendar"], ["list","List View"], ["add","Add Deadline"], ["ical","Internet Calendars"], ...(msStatus?.connected ? [["outlook-sync","📨 Outlook Sync"]] : []), ["calc","Rules Calculator"]].map(([t, l]) => (
            <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{l}</div>
          ))}
        </div>

        {tab === "calendar" && (
          <CalendarGrid deadlines={deadlines} tasks={tasks} allCases={allCases} externalEvents={externalEvents} outlookEvents={outlookEvents} onSelectCase={onSelectCase} currentUser={currentUser} />
        )}

        {tab === "list" && (
          <div className="card">
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--c-border)", display: "flex", gap: 10 }}>
              <select style={{ width: 160 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>{types.map(t => <option key={t}>{t}</option>)}</select>
              <input placeholder="Search deadlines or cases…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="table-wrap">
              <table className="mobile-cards">
                <thead>
                  <tr>
                    <th style={{ width: 14 }}></th>
                    <SortTh col="title" label="Deadline" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh col="case" label="Case" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh col="type" label="Type" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <SortTh col="date" label="Due Date" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                    <th>Days</th><th>Assigned</th>{canDeleteDeadline && <th style={{ width: 40 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(d => {
                    const days = daysUntil(d.date); const col = urgencyColor(days);
                    const cs = allCases.find(c => c.id === d.caseId);
                    const isEditing = editingDlId === d.id;
                    return (
                      <tr key={d.id}>
                        <td className="mobile-hide"><div style={{ width: 10, height: 10, borderRadius: "50%", background: col }} /></td>
                        <td data-label="Deadline">
                          {isEditing ? (
                            <input autoFocus value={editingDlTitle} onChange={e => setEditingDlTitle(e.target.value)}
                              onBlur={() => { if (editingDlTitle.trim() && editingDlTitle !== d.title) onUpdateDeadline(d.id, { title: editingDlTitle.trim() }); setEditingDlId(null); }}
                              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { setEditingDlId(null); } }}
                              style={{ fontSize: 13, fontWeight: 600, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", width: "100%", boxSizing: "border-box" }} />
                          ) : (
                            <div style={{ color: "var(--c-text)", fontWeight: 600, cursor: "pointer" }} onClick={() => { setEditingDlId(d.id); setEditingDlTitle(d.title); }} title="Click to edit title">{d.title}</div>
                          )}
                          {d.rule && <div style={{ fontSize: 11, color: "#0f172a", fontFamily: "monospace" }}>{d.rule}</div>}
                        </td>
                        <td data-label="Case" style={{ fontSize: 12, color: "var(--c-text2)" }}>{cs?.title?.slice(0, 40) || `#${d.caseId}`}<div style={{ fontSize: 10, color: "#64748b" }}>{cs?.caseNum}</div></td>
                        <td data-label="Type">
                          <select value={d.type || "Filing"} onChange={e => onUpdateDeadline(d.id, { type: e.target.value })}
                            style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: "1px solid var(--c-border)", background: "var(--c-bg)", color: "var(--c-text)", cursor: "pointer", maxWidth: 160 }}>
                            {[...new Set([...PI_DEADLINE_TYPES, d.type].filter(Boolean))].sort().map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td data-label="Due" style={{ color: col, fontSize: 13, whiteSpace: "nowrap" }}>{fmt(d.date)}</td>
                        <td data-label="Days" style={{ color: col, fontWeight: 700 }}>{days < 0 ? <span style={{ color: "#e05252" }}>{Math.abs(days)}d over</span> : days === 0 ? "Today" : `${days}d`}</td>
                        <td data-label="Assigned"><Avatar userId={d.assigned} size={26} /></td>
                        {canDeleteDeadline && <td><button onClick={async () => { if (!confirmDelete || !(await confirmDelete())) return; onDeleteDeadline(d.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#e05252", fontSize: 13, padding: "2px 6px", borderRadius: 4 }} title="Remove deadline">✕</button></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {paged.length === 0 && <div className="empty">No deadlines match.</div>}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <span>{sorted.length} results · Page {page} of {totalPages}</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>
                  {[...Array(Math.min(totalPages, 7))].map((_, i) => { const p = page <= 4 ? i + 1 : page + i - 3; if (p < 1 || p > totalPages) return null; return <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>; })}
                  <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "add" && (
          <div className="card" style={{ maxWidth: 600 }}>
            <div className="card-header"><div className="card-title">Add New Deadline</div></div>
            <div style={{ padding: 20 }}>
              <div className="form-group"><label>Case</label>
                <div style={{ position: "relative" }}>
                  {newDl.caseId && !dlCaseDropOpen ? (() => {
                    const sc = allCases.find(c => c.id === newDl.caseId);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #cbd5e1", borderRadius: 6, padding: "7px 10px", background: "var(--c-bg)", cursor: "default" }}>
                        <span style={{ flex: 1, fontSize: 13, color: "var(--c-text)" }}>{sc?.clientName || sc?.title || "Unknown"}{sc?.caseNum ? <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{sc.caseNum}</span> : null}</span>
                        <button type="button" style={{ border: "none", background: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }} onClick={() => { setNewDl(p => ({ ...p, caseId: 0 })); setDlCaseSearch(""); setDlCaseDropOpen(true); }}>×</button>
                      </div>
                    );
                  })() : (
                    <div onBlur={e => { setTimeout(() => { if (!e.currentTarget.contains(document.activeElement)) setDlCaseDropOpen(false); }, 150); }} tabIndex={-1} style={{ outline: "none" }}>
                      <input
                        autoFocus={dlCaseDropOpen}
                        placeholder="Search by defendant name..."
                        value={dlCaseSearch}
                        onChange={e => { setDlCaseSearch(e.target.value); setDlCaseDropOpen(true); }}
                        onFocus={() => setDlCaseDropOpen(true)}
                        autoComplete="off"
                      />
                      {dlCaseDropOpen && (() => {
                        const q = dlCaseSearch.toLowerCase().trim();
                        const dlFiltered = [...allCases].filter(c => c.status === "Active").filter(c => !q || (c.clientName || "").toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q) || (c.caseNum || "").toLowerCase().includes(q)).sort((a, b) => (a.clientName || a.title || "").localeCompare(b.clientName || b.title || ""));
                        const pIds = new Set(pinnedCaseIds);
                        const dlPinned = dlFiltered.filter(c => pIds.has(c.id));
                        const dlOthers = dlFiltered.filter(c => !pIds.has(c.id));
                        return (
                          <div style={{ position: "absolute", zIndex: 200, left: 0, right: 0, maxHeight: 260, overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: 6, background: "var(--c-card)", boxShadow: "0 6px 20px rgba(0,0,0,0.18)", marginTop: 2 }}>
                            {dlFiltered.length === 0 && <div style={{ padding: "10px 12px", fontSize: 12, color: "#64748b" }}>No matches</div>}
                            {dlPinned.length > 0 && <PinnedSectionHeader />}
                            {dlPinned.map(c => (
                              <div key={c.id} onMouseDown={e => { e.preventDefault(); setNewDl(p => ({ ...p, caseId: c.id })); setDlCaseSearch(""); setDlCaseDropOpen(false); }} style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <span style={{ color: "var(--c-text)", fontWeight: 500 }}>{c.clientName || c.title}</span>
                                {c.caseNum && <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", flexShrink: 0, marginLeft: 8 }}>{c.caseNum}</span>}
                              </div>
                            ))}
                            {dlPinned.length > 0 && dlOthers.length > 0 && <div style={{ padding: "5px 10px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--c-bg)", borderBottom: "1px solid var(--c-border2)" }}>All Cases</div>}
                            {dlOthers.slice(0, 20).map(c => (
                              <div key={c.id} onMouseDown={e => { e.preventDefault(); setNewDl(p => ({ ...p, caseId: c.id })); setDlCaseSearch(""); setDlCaseDropOpen(false); }} style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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
              <div className="form-group"><label>Deadline Title</label><input value={newDl.title} onChange={e => setNewDl(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summary Judgment Motion" /></div>
              <div className="form-row">
                <div className="form-group"><label>Due Date</label><input type="date" value={newDl.date} onChange={e => setNewDl(p => ({ ...p, date: e.target.value }))} /></div>
                <div className="form-group"><label>Type</label>
                  <select value={newDl.type} onChange={e => setNewDl(p => ({ ...p, type: e.target.value }))}>
                    {PI_DEADLINE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Rule / Authority</label><input value={newDl.rule} onChange={e => setNewDl(p => ({ ...p, rule: e.target.value }))} placeholder="e.g. ARCP 56" /></div>
                <div className="form-group"><label>Assigned To</label>
                  <StaffSearchField value={newDl.assigned} onChange={val => setNewDl(p => ({ ...p, assigned: val }))} placeholder="Search staff…" />
                </div>
              </div>
              <button className="btn btn-gold" onClick={() => { if (!newDl.title || !newDl.date) return; onAddDeadline({ ...newDl }); setNewDl(prev => ({ ...prev, title: "", date: today, rule: "" })); setTab("calendar"); }}>Add Deadline</button>
            </div>
          </div>
        )}

        {tab === "ical" && (
          <ICalManager externalEvents={externalEvents} setExternalEvents={setExternalEvents} allCases={allCases} />
        )}

        {tab === "outlook-sync" && msStatus?.connected && (
          <div style={{ maxWidth: 680 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">📨 Outlook Calendar Sync</div>
                <span style={{ fontSize: 12, color: "#64748b" }}>{outlookEvents.length} Outlook event{outlookEvents.length !== 1 ? "s" : ""} loaded</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 13, color: "var(--c-text2)", marginBottom: 16, lineHeight: 1.6 }}>
                  Sync your MattrMindr deadlines to your Outlook calendar. When enabled, new and updated deadlines are automatically pushed to Outlook. Outlook events (non-MattrMindr) are pulled into the calendar overlay.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, border: "1px solid var(--c-border)", background: outlookCalSync ? "#eff6ff" : "var(--c-bg)", marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #0078d4, #00bcf2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "white", fontSize: 18 }}>📨</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>Auto-sync deadlines to Outlook</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{outlookCalSync ? "Deadlines are pushed to Outlook on create/update" : "Enable to push deadlines to your Outlook calendar"}</div>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer" }}>
                    <input type="checkbox" checked={outlookCalSync} onChange={handleToggleOutlookSync} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: "absolute", inset: 0, borderRadius: 12, background: outlookCalSync ? "#0078d4" : "#cbd5e1", transition: "background 0.2s" }}>
                      <span style={{ position: "absolute", left: outlookCalSync ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                    </span>
                  </label>
                </div>
                {outlookCalSync && (
                  <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Deadline types to sync:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
                        <input type="checkbox" checked={outlookSyncTypes.length === 0} onChange={async () => {
                          if (outlookSyncTypes.length === 0) {
                            const allTypes = [...PI_DEADLINE_TYPES];
                            setOutlookSyncTypes(allTypes);
                            try { await apiUpdateMsCalendarSettings({ syncDeadlineTypes: allTypes }); } catch { setOutlookSyncTypes([]); }
                          } else {
                            setOutlookSyncTypes([]);
                            try { await apiUpdateMsCalendarSettings({ syncDeadlineTypes: [] }); } catch {}
                          }
                        }} style={{ accentColor: "#0078d4", width: 13, height: 13 }} />
                        All types
                      </label>
                      {PI_DEADLINE_TYPES.map(t => (
                        <label key={t} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 12, color: outlookSyncTypes.length === 0 ? "#94a3b8" : "var(--c-text2)" }}>
                          <input type="checkbox" checked={outlookSyncTypes.length === 0 || outlookSyncTypes.includes(t)} disabled={outlookSyncTypes.length === 0} onChange={() => handleToggleSyncType(t)} style={{ accentColor: "#0078d4", width: 13, height: 13 }} />
                          {t}
                        </label>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{outlookSyncTypes.length === 0 ? "All deadline types will be synced to Outlook. Uncheck \"All types\" to choose specific types." : `Only ${outlookSyncTypes.length} selected type${outlookSyncTypes.length !== 1 ? "s" : ""} will sync.`}</div>
                  </div>
                )}
                {outlookSyncing && <div style={{ fontSize: 12, color: "#0078d4", marginBottom: 12 }}>Syncing all deadlines to Outlook...</div>}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-primary btn-sm" disabled={outlookSyncing} onClick={async () => {
                    setOutlookSyncing(true);
                    try {
                      const r = await apiSyncAllDeadlinesToOutlook();
                      alert(`Synced ${r.pushed} deadline${r.pushed !== 1 ? "s" : ""} to Outlook${r.errors ? ` (${r.errors} error${r.errors !== 1 ? "s" : ""})` : ""}.`);
                    } catch (err) { alert("Sync failed: " + err.message); }
                    setOutlookSyncing(false);
                  }}>
                    {outlookSyncing ? "Syncing..." : "Sync All Deadlines Now"}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={async () => {
                    try {
                      const now = new Date();
                      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
                      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
                      const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
                      const evts = await apiGetOutlookEvents(start, end);
                      setOutlookEvents(evts.filter(e => !e.isMattrMindr).map(e => ({ ...e, kind: "outlook", source: "Outlook" })));
                    } catch (err) { alert("Failed to refresh: " + err.message); }
                  }}>Refresh Outlook Events</button>
                </div>
                {outlookEvents.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Recent Outlook Events</div>
                    <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--c-border)", borderRadius: 8 }}>
                      {outlookEvents.slice(0, 20).map((ev, i) => (
                        <div key={ev.id || i} style={{ padding: "8px 12px", borderBottom: "1px solid var(--c-border2)", fontSize: 12 }}>
                          <div style={{ fontWeight: 600, color: "var(--c-text)" }}>{ev.title}</div>
                          <div style={{ color: "#64748b", fontSize: 11 }}>{ev.date}{ev.location ? ` · 📍 ${ev.location}` : ""}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "calc" && (
          <div style={{ maxWidth: 600 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Court Rules Calculator</div></div>
              <div style={{ padding: 20 }}>
                <div className="form-group"><label>Select Rule</label>
                  <select value={calcInputs.ruleId} onChange={e => setCalcInputs(p => ({ ...p, ruleId: Number(e.target.value) }))}>
                    {COURT_RULES.map(r => <option key={r.id} value={r.id}>{r.name} ({r.days < 0 ? `${Math.abs(r.days)}d before` : r.days === 0 ? "same day" : `${r.days}d`}) — {r.rule}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Trigger Date ({COURT_RULES.find(r => r.id === Number(calcInputs.ruleId))?.from})</label>
                  <input type="date" value={calcInputs.fromDate} onChange={e => setCalcInputs(p => ({ ...p, fromDate: e.target.value }))} />
                </div>
                <button className="btn btn-gold" onClick={runCalc}>Calculate</button>
                {calcResult && (
                  <div className="calc-result">
                    <div style={{ fontSize: 11, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Result</div>
                    <div style={{ fontSize: 24, fontFamily: "'Inter',sans-serif", color: "var(--c-text-h)", marginBottom: 8 }}>{fmt(calcResult.result)}</div>
                    <div style={{ fontSize: 13, color: "var(--c-text2)" }}><strong style={{ color: "#0f172a" }}>{calcResult.rule.name}</strong><br />{calcResult.rule.days < 0 ? `${Math.abs(calcResult.rule.days)} days before` : calcResult.rule.days === 0 ? "Same day as" : `${calcResult.rule.days} days from`} {fmt(calcResult.from)} · <span style={{ fontFamily: "monospace", fontSize: 12 }}>{calcResult.rule.rule}</span></div>
                    <div style={{ marginTop: 10, fontSize: 12, color: "#ea580c", fontStyle: "italic" }}>⚠ Always verify against current court orders and applicable state/federal rules of civil procedure.</div>
                  </div>
                )}
              </div>
            </div>
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header"><div className="card-title">Common Deadlines Reference</div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Action</th><th>Days</th><th>From</th><th>Rule</th></tr></thead>
                  <tbody>{COURT_RULES.map(r => <tr key={r.id}><td style={{ color: "var(--c-text)" }}>{r.name}</td><td style={{ color: "#0f172a", fontWeight: 700 }}>{r.days < 0 ? `${Math.abs(r.days)} before` : r.days === 0 ? "—" : r.days}</td><td style={{ fontSize: 12, color: "var(--c-text2)" }}>{r.from}</td><td style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{r.rule}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Tasks View ───────────────────────────────────────────────────────────────

export default DeadlinesView;
